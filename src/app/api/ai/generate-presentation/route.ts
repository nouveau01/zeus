import { NextRequest } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";
import { findSimilarCustomers } from "@/lib/similarCustomers";

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US");
}

function formatCurrency(val: number | { toNumber?: () => number } | null | undefined): string {
  if (val == null) return "$0.00";
  const num = typeof val === "object" && val && "toNumber" in val ? (val as { toNumber: () => number }).toNumber() : Number(val);
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PRESENTATION_TYPE_INSTRUCTIONS: Record<string, string> = {
  qbr: `This is a Quarterly Business Review. Focus on:
- Service performance metrics (response times, first-fix rates)
- Ticket volume trends and resolution patterns
- Preventive maintenance compliance
- Cost analysis vs previous quarter
- Upcoming recommendations and action items`,
  proposal: `This is a Service/Modernization Proposal. Focus on:
- Current equipment assessment and age
- Identified issues and risk areas
- Proposed scope of work with timeline
- Investment breakdown and ROI
- Why Nouveau Elevator is the right partner`,
  onboarding: `This is a New Customer Onboarding deck. Focus on:
- Welcome and team introductions
- Service level overview and what to expect
- Emergency procedures and contact info
- Portal access and communication channels
- Equipment inventory review
- Maintenance schedule overview`,
  safety: `This is a Safety Compliance presentation. Focus on:
- Safety test history and compliance status
- Violation history and resolution timeline
- Code compliance overview
- Upcoming inspection dates
- Safety improvement recommendations`,
  general: `This is a general presentation. Create a professional overview covering:
- Account overview and relationship summary
- Service history highlights
- Equipment portfolio
- Key metrics and performance
- Forward-looking recommendations`,
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { customerId, premisesId, presentationType = "general", customInstructions } =
      await request.json();

    // Check which provider is configured
    const integrationSettings = await prisma.integrationSettings.findUnique({
      where: { id: "singleton" },
    });
    const provider = integrationSettings?.presentationProvider || "zeus";

    if (!customerId) {
      return new Response(JSON.stringify({ error: "customerId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all relevant data in parallel
    const [customer, accounts, similarCustomers] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        include: { contacts: { take: 5 } },
      }),
      prisma.premises.findMany({
        where: premisesId
          ? { id: premisesId }
          : { customerId },
        include: {
          units: true,
          tickets: { take: 50, orderBy: { date: "desc" } },
          jobs: { take: 20, orderBy: { createdAt: "desc" } },
          invoices: { take: 25, orderBy: { date: "desc" } },
        },
      }),
      findSimilarCustomers(customerId, 5),
    ]);

    if (!customer) {
      return new Response(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build context string
    const contextParts: string[] = [];

    // Customer info
    contextParts.push(`CUSTOMER: ${customer.name}`);
    contextParts.push(`Type: ${customer.type || "N/A"} | Category: ${customer.category || "N/A"}`);
    contextParts.push(`Location: ${customer.city || ""}, ${customer.state || ""} ${customer.zipCode || ""}`);
    contextParts.push(`Elevators: ${customer.elevs || 0} | Locations: ${customer.locs || 0}`);
    if (customer.balance) contextParts.push(`Balance: ${formatCurrency(customer.balance)}`);
    if (customer.remarks) contextParts.push(`Remarks: ${customer.remarks}`);
    if (customer.salesRemarks) contextParts.push(`Sales Remarks: ${customer.salesRemarks}`);

    // Contacts
    if (customer.contacts?.length) {
      contextParts.push(`\nKEY CONTACTS:`);
      for (const c of customer.contacts) {
        contextParts.push(`- ${c.name}: ${c.title || ""} | ${c.phone || ""} | ${c.email || ""}`);
      }
    }

    // Account/location details
    let totalUnits = 0;
    let totalTickets = 0;
    let totalJobs = 0;
    let totalInvoiceAmount = 0;

    for (const acct of accounts) {
      contextParts.push(`\nACCOUNT: ${acct.premisesId || acct.name || acct.address}`);
      contextParts.push(`Address: ${acct.address}, ${acct.city || ""} ${acct.state || ""}`);
      if (acct.balance) contextParts.push(`Account Balance: ${formatCurrency(acct.balance)}`);

      // Units
      totalUnits += acct.units.length;
      if (acct.units.length > 0) {
        contextParts.push(`Units (${acct.units.length}):`);
        for (const u of acct.units) {
          contextParts.push(`  - Unit ${u.unitNumber}: ${u.unitType || "Unknown"} | ${u.manufacturer || "Unknown"} | Status: ${u.status || "Unknown"}`);
        }
      }

      // Recent tickets
      totalTickets += acct.tickets.length;
      if (acct.tickets.length > 0) {
        contextParts.push(`Recent Tickets (${acct.tickets.length}):`);
        for (const t of acct.tickets.slice(0, 10)) {
          contextParts.push(`  - #${t.ticketNumber} [${formatDate(t.date)}] ${t.type} — ${t.status} | ${(t.scopeOfWork || t.description || "").substring(0, 80)}`);
        }
      }

      // Jobs
      totalJobs += acct.jobs.length;
      if (acct.jobs.length > 0) {
        contextParts.push(`Jobs (${acct.jobs.length}):`);
        for (const j of acct.jobs.slice(0, 5)) {
          contextParts.push(`  - ${j.jobName}: ${j.type || "N/A"} | Status: ${j.status || "N/A"} | Rev: ${formatCurrency(j.rev)} | Cost: ${formatCurrency(j.cost)}`);
        }
      }

      // Invoices
      if (acct.invoices.length > 0) {
        let acctInvTotal = 0;
        for (const inv of acct.invoices) {
          const invTotal = typeof inv.total === "object" && inv.total && "toNumber" in inv.total
            ? (inv.total as any).toNumber()
            : Number(inv.total || 0);
          acctInvTotal += invTotal;
        }
        totalInvoiceAmount += acctInvTotal;
        contextParts.push(`Invoices (${acct.invoices.length}): Total billed: ${formatCurrency(acctInvTotal)}`);
      }
    }

    // Summary stats
    contextParts.push(`\nSUMMARY STATS:`);
    contextParts.push(`Total Accounts: ${accounts.length} | Total Units: ${totalUnits} | Total Tickets: ${totalTickets} | Total Jobs: ${totalJobs}`);
    contextParts.push(`Total Invoiced: ${formatCurrency(totalInvoiceAmount)}`);

    // Similar customers (anonymized)
    if (similarCustomers.length > 0) {
      contextParts.push(`\nSIMILAR CUSTOMERS WE SERVE (anonymized for social proof):`);
      for (const sc of similarCustomers) {
        contextParts.push(`- ${sc.anonymizedDescription} (match score: ${sc.score}/100)`);
      }
    }

    const dataContext = contextParts.join("\n");
    const typeInstructions = PRESENTATION_TYPE_INSTRUCTIONS[presentationType] || PRESENTATION_TYPE_INSTRUCTIONS.general;

    // =============================================
    // GAMMA PROVIDER — generate via Gamma.app API
    // =============================================
    if (provider === "gamma" && integrationSettings?.presentationApiKey) {
      const gammaApiKey = integrationSettings.presentationApiKey;
      const typeLabel = presentationType === "qbr" ? "Quarterly Business Review"
        : presentationType === "proposal" ? "Service Proposal"
        : presentationType === "onboarding" ? "New Customer Onboarding"
        : presentationType === "safety" ? "Safety Compliance Report"
        : "Partnership Overview";

      const gammaInput = `${typeLabel} for ${customer.name} — Nouveau Elevator\n\n${dataContext}${customInstructions ? `\n\nAdditional instructions: ${customInstructions}` : ""}`;

      // Create generation
      const gammaRes = await fetch("https://public-api.gamma.app/v1.0/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": gammaApiKey,
        },
        body: JSON.stringify({
          inputText: gammaInput,
          textMode: "generate",
          format: "presentation",
          numCards: 10,
          exportAs: "pptx",
          textOptions: {
            amount: "medium",
            tone: "Professional yet approachable elevator service company",
            audience: "Building managers and property owners",
          },
          imageOptions: {
            source: "pexels",
          },
          cardOptions: {
            dimensions: "16x9",
          },
        }),
      });

      if (!gammaRes.ok) {
        const errText = await gammaRes.text();
        console.error("Gamma API error:", gammaRes.status, errText);
        return new Response(
          JSON.stringify({ error: `Gamma generation failed (${gammaRes.status}). Check your API key.` }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      const gammaData = await gammaRes.json();
      const generationId = gammaData.generationId;

      if (!generationId) {
        return new Response(
          JSON.stringify({ error: "Gamma did not return a generation ID." }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      // Poll for completion (max 60 seconds)
      let gammaResult: any = null;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(`https://public-api.gamma.app/v1.0/generations/${generationId}`, {
          headers: { "X-API-KEY": gammaApiKey },
        });
        if (pollRes.ok) {
          const pollData = await pollRes.json();
          if (pollData.status === "completed") {
            gammaResult = pollData;
            break;
          } else if (pollData.status !== "pending") {
            return new Response(
              JSON.stringify({ error: `Gamma generation failed with status: ${pollData.status}` }),
              { status: 502, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }

      if (!gammaResult) {
        return new Response(
          JSON.stringify({ error: "Gamma generation timed out. Try again." }),
          { status: 504, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          provider: "gamma",
          gammaUrl: gammaResult.gammaUrl,
          generationId: gammaResult.generationId,
          customerName: customer.name,
          presentationType,
          slides: [],
          similarCustomers: similarCustomers.map((sc) => ({
            description: sc.anonymizedDescription,
            score: sc.score,
          })),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // =============================================
    // ZEUS BUILT-IN PROVIDER — generate via Claude
    // =============================================
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call Claude API (non-streaming for structured JSON output)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: `You are a presentation generator for Nouveau Elevator, a full-service elevator maintenance and modernization company in New York/New Jersey. Generate professional slide decks using real customer data.

RULES:
- Return ONLY a valid JSON array of slide objects. No markdown, no explanation, no code fences.
- Generate 8-12 slides.
- Each slide object has these fields:
  - "layout": one of "title", "content", "bullets", "two-column"
  - "title": slide title (string)
  - "subtitle": optional subtitle (string, mainly for title slide)
  - "body": optional body text (string)
  - "bullets": optional array of bullet point strings (only for "bullets" layout)
  - "leftContent": optional left column text (only for "two-column" layout)
  - "rightContent": optional right column text (only for "two-column" layout)
  - "notes": optional speaker notes (string)
- First slide MUST be layout "title" with the presentation title and customer name.
- Last slide should be a "Thank You" or "Next Steps" slide.
- Use real data from the context — actual numbers, dates, equipment details.
- When referencing similar customers, use the anonymized descriptions provided.
- Keep bullet points concise (1 line each).
- Body text should be 2-4 sentences max per slide.
- Professional but approachable tone.

${typeInstructions}

${customInstructions ? `\nADDITIONAL USER INSTRUCTIONS: ${customInstructions}` : ""}`,
        messages: [
          {
            role: "user",
            content: `Generate a ${presentationType.toUpperCase()} presentation for this customer:\n\n${dataContext}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Claude API error:", response.status, errorBody);
      return new Response(
        JSON.stringify({ error: `AI generation failed: ${response.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const text = result?.content?.[0]?.text || "";

    // Parse JSON from the response
    let slides: any[] = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        slides = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error("Failed to parse AI slides:", parseErr);
      return new Response(
        JSON.stringify({ error: "AI returned invalid slide format. Please try again." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    if (slides.length === 0) {
      return new Response(
        JSON.stringify({ error: "AI did not generate any slides. Please try again." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Normalize slides — add IDs and ensure required fields
    const normalizedSlides = slides.map((s: any, i: number) => ({
      id: `slide-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      layout: ["title", "content", "bullets", "two-column", "chart-placeholder", "image-placeholder", "blank"].includes(s.layout) ? s.layout : "content",
      title: s.title || `Slide ${i + 1}`,
      subtitle: s.subtitle || undefined,
      body: s.body || undefined,
      bullets: Array.isArray(s.bullets) ? s.bullets : undefined,
      leftContent: s.leftContent || undefined,
      rightContent: s.rightContent || undefined,
      notes: s.notes || undefined,
    }));

    return new Response(
      JSON.stringify({
        slides: normalizedSlides,
        customerName: customer.name,
        presentationType,
        similarCustomers: similarCustomers.map((sc) => ({
          description: sc.anonymizedDescription,
          score: sc.score,
        })),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate presentation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
