import { NextRequest } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";
import { findSimilarCustomers, findCustomersByLocation } from "@/lib/similarCustomers";

// ============================================================
// Presentation Chat — Agentic tool-use loop with SSE streaming
// Claude orchestrates: search → gather data → generate slides
// ============================================================

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US");
}

function formatCurrency(val: number | { toNumber?: () => number } | null | undefined): string {
  if (val == null) return "$0.00";
  const num = typeof val === "object" && val && "toNumber" in val ? (val as { toNumber: () => number }).toNumber() : Number(val);
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TOOL_DEFINITIONS = [
  {
    name: "search_customers",
    description: "Search for customers by name, keyword, or partial match. Use when the user mentions a company name, building name, or contact name. Returns top 10 matches with basic info.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string" as const, description: "Search term — customer name, building name, or keyword" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_by_location",
    description: "Find what Nouveau services in a specific city or state. Use when the user mentions a location like 'Stamford CT' or 'New Jersey'. Returns anonymized customer descriptions and aggregate stats.",
    input_schema: {
      type: "object" as const,
      properties: {
        city: { type: "string" as const, description: "City name (optional)" },
        state: { type: "string" as const, description: "State name or abbreviation (optional)" },
      },
    },
  },
  {
    name: "find_similar_customers",
    description: "Find similar customers for social proof. Use after you have a specific customer ID. Returns anonymized descriptions of similar clients we serve.",
    input_schema: {
      type: "object" as const,
      properties: {
        customerId: { type: "string" as const, description: "The customer ID to find similar customers for" },
      },
      required: ["customerId"],
    },
  },
  {
    name: "get_customer_data",
    description: "Get full customer data for slide generation — accounts, units, tickets, jobs, invoices, contacts. Use when you have identified the customer and are ready to gather data for the presentation.",
    input_schema: {
      type: "object" as const,
      properties: {
        customerId: { type: "string" as const, description: "The customer ID to get full data for" },
        premisesId: { type: "string" as const, description: "Optional — specific account/premises ID to focus on" },
      },
      required: ["customerId"],
    },
  },
  {
    name: "generate_presentation",
    description: "Generate the final presentation. Call this ONLY when you have enough context — either from get_customer_data results or from conversation details about a prospect. Returns a slide deck the user can preview, edit, and export.",
    input_schema: {
      type: "object" as const,
      properties: {
        presentationType: {
          type: "string" as const,
          enum: ["qbr", "proposal", "onboarding", "safety", "general"],
          description: "Type of presentation. Default to 'general' if not specified by user.",
        },
        customerName: { type: "string" as const, description: "Customer/prospect name for the title slide" },
        dataContext: { type: "string" as const, description: "All gathered data context to feed into slide generation" },
        customInstructions: { type: "string" as const, description: "Any special instructions from the conversation" },
      },
      required: ["presentationType", "customerName", "dataContext"],
    },
  },
];

const SYSTEM_PROMPT = `You are the Presentation Builder assistant for Nouveau Elevator, a full-service elevator maintenance and modernization company serving New York, New Jersey, and the tri-state area.

Your job is to help users create professional presentations through conversation. You have tools to search the customer database, look up locations, find similar customers for referrals, and generate slide decks.

BEHAVIOR:
- When the user gives a VAGUE request (like "build a proposal for a building manager" with no specifics), ask for key details: Who is it for? What building/location? Who are we presenting to? What type of presentation?
- When the user gives SPECIFIC info (a customer name, building name, or location), immediately search for it — don't ask permission, just call the tool.
- If the user says a name, search_customers first. If they mention a city/state, search_by_location first.
- If you find exactly one match, proceed to get_customer_data. If multiple matches, briefly list them and ask which one.
- ALWAYS use find_similar_customers or search_by_location to gather referrals and social proof to include in the slides.
- Default to "general" presentation type unless the user specifies QBR, proposal, onboarding, or safety.

CRITICAL RULE — NEVER generate and ask a question at the same time:
- Either ask a question OR generate — NEVER both in the same response.
- If the user provides enough info to build a presentation (building name, contact name, what they need), generate IMMEDIATELY. Do NOT ask follow-up questions.
- "Enough info" means: you know who it's for and what building/location. That's it. Generate.
- Only ask questions if the request is truly vague (no building name, no contact, no context at all).
- One round of clarification max. After that, generate with what you have.

- Keep responses short — 1-3 sentences. Let the tools do the heavy lifting.
- Do NOT narrate what you are about to do (don't say "I'll search for..." or "Let me look up..."). Just call the tools directly.
- AFTER generating, give a brief summary of what the presentation includes (slide count, key topics covered). Keep it to 1-2 sentences.

PROSPECT SCENARIOS:
When there's no existing customer, you can still build great presentations. Use search_by_location to find what we service nearby (for social proof and referrals), then build context from conversation details and generate.`;

// ---- Tool execution ----

async function executeSearchCustomers(input: { query: string }): Promise<string> {
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: input.query, mode: "insensitive" } },
        { city: { contains: input.query, mode: "insensitive" } },
      ],
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      type: true,
      category: true,
      city: true,
      state: true,
      elevs: true,
      locs: true,
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  if (customers.length === 0) {
    return `No customers found matching "${input.query}".`;
  }

  const lines = customers.map((c) =>
    `- ${c.name} (ID: ${c.id}) — ${c.type || "N/A"} in ${c.city || "?"}, ${c.state || "?"} | ${c.elevs || 0} elevators, ${c.locs || 0} locations`
  );
  return `Found ${customers.length} customer(s):\n${lines.join("\n")}`;
}

async function executeSearchByLocation(input: { city?: string; state?: string }): Promise<string> {
  const result = await findCustomersByLocation(input.city, input.state, 10);

  if (result.customers.length === 0) {
    return `No customers found in ${input.city ? input.city + ", " : ""}${input.state || "the specified area"}.`;
  }

  const lines = result.customers.map((c) => `- ${c.anonymizedDescription}`);
  return `Found ${result.customers.length} customer(s) in ${input.city ? input.city + ", " : ""}${input.state || "area"} (${result.accountCount} accounts, ${result.totalElevators} total elevators):\n${lines.join("\n")}`;
}

async function executeFindSimilar(input: { customerId: string }): Promise<string> {
  const similar = await findSimilarCustomers(input.customerId, 5);

  if (similar.length === 0) {
    return "No similar customers found.";
  }

  const lines = similar.map((s) => `- ${s.anonymizedDescription} (match: ${s.score}/100)`);
  return `Similar customers we serve:\n${lines.join("\n")}`;
}

async function executeGetCustomerData(input: { customerId: string; premisesId?: string }): Promise<string> {
  const [customer, accounts, similar] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: input.customerId },
      include: { contacts: { take: 5 } },
    }),
    prisma.premises.findMany({
      where: input.premisesId
        ? { id: input.premisesId }
        : { customerId: input.customerId },
      include: {
        units: true,
        tickets: { take: 50, orderBy: { date: "desc" } },
        jobs: { take: 20, orderBy: { createdAt: "desc" } },
        invoices: { take: 25, orderBy: { date: "desc" } },
      },
    }),
    findSimilarCustomers(input.customerId, 5),
  ]);

  if (!customer) return "Customer not found.";

  const parts: string[] = [];

  parts.push(`CUSTOMER: ${customer.name}`);
  parts.push(`Type: ${customer.type || "N/A"} | Category: ${customer.category || "N/A"}`);
  parts.push(`Location: ${customer.city || ""}, ${customer.state || ""} ${customer.zipCode || ""}`);
  parts.push(`Elevators: ${customer.elevs || 0} | Locations: ${customer.locs || 0}`);
  if (customer.balance) parts.push(`Balance: ${formatCurrency(customer.balance)}`);
  if (customer.remarks) parts.push(`Remarks: ${customer.remarks}`);
  if (customer.salesRemarks) parts.push(`Sales Remarks: ${customer.salesRemarks}`);

  if (customer.contacts?.length) {
    parts.push(`\nKEY CONTACTS:`);
    for (const c of customer.contacts) {
      parts.push(`- ${c.name}: ${c.title || ""} | ${c.phone || ""} | ${c.email || ""}`);
    }
  }

  let totalUnits = 0, totalTickets = 0, totalJobs = 0, totalInvoiceAmount = 0;

  for (const acct of accounts) {
    parts.push(`\nACCOUNT: ${acct.premisesId || acct.name || acct.address}`);
    parts.push(`Address: ${acct.address}, ${acct.city || ""} ${acct.state || ""}`);
    if (acct.balance) parts.push(`Account Balance: ${formatCurrency(acct.balance)}`);

    totalUnits += acct.units.length;
    if (acct.units.length > 0) {
      parts.push(`Units (${acct.units.length}):`);
      for (const u of acct.units) {
        parts.push(`  - Unit ${u.unitNumber}: ${u.unitType || "Unknown"} | ${u.manufacturer || "Unknown"} | Status: ${u.status || "Unknown"}`);
      }
    }

    totalTickets += acct.tickets.length;
    if (acct.tickets.length > 0) {
      parts.push(`Recent Tickets (${acct.tickets.length}):`);
      for (const t of acct.tickets.slice(0, 10)) {
        parts.push(`  - #${t.ticketNumber} [${formatDate(t.date)}] ${t.type} — ${t.status} | ${(t.scopeOfWork || t.description || "").substring(0, 80)}`);
      }
    }

    totalJobs += acct.jobs.length;
    if (acct.jobs.length > 0) {
      parts.push(`Jobs (${acct.jobs.length}):`);
      for (const j of acct.jobs.slice(0, 5)) {
        parts.push(`  - ${j.jobName}: ${j.type || "N/A"} | Status: ${j.status || "N/A"} | Rev: ${formatCurrency(j.rev)} | Cost: ${formatCurrency(j.cost)}`);
      }
    }

    if (acct.invoices.length > 0) {
      let acctInvTotal = 0;
      for (const inv of acct.invoices) {
        const invTotal = typeof inv.total === "object" && inv.total && "toNumber" in inv.total
          ? (inv.total as any).toNumber()
          : Number(inv.total || 0);
        acctInvTotal += invTotal;
      }
      totalInvoiceAmount += acctInvTotal;
      parts.push(`Invoices (${acct.invoices.length}): Total billed: ${formatCurrency(acctInvTotal)}`);
    }
  }

  parts.push(`\nSUMMARY STATS:`);
  parts.push(`Total Accounts: ${accounts.length} | Total Units: ${totalUnits} | Total Tickets: ${totalTickets} | Total Jobs: ${totalJobs}`);
  parts.push(`Total Invoiced: ${formatCurrency(totalInvoiceAmount)}`);

  if (similar.length > 0) {
    parts.push(`\nSIMILAR CUSTOMERS (anonymized):`);
    for (const sc of similar) {
      parts.push(`- ${sc.anonymizedDescription} (match: ${sc.score}/100)`);
    }
  }

  return parts.join("\n");
}

const ZEUS_SLIDE_SYSTEM_PROMPT = `You are a presentation generator for Nouveau Elevator, a full-service elevator maintenance and modernization company serving New York, New Jersey, and the tri-state area. Generate professional slide decks using real customer data.

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
- Professional but approachable tone.`;

const PRESENTATION_TYPE_HINTS: Record<string, string> = {
  qbr: "Focus on: service performance, ticket volume trends, PM compliance, cost analysis, recommendations.",
  proposal: "Focus on: equipment assessment, identified issues, proposed scope, investment/ROI, why Nouveau.",
  onboarding: "Focus on: welcome, team intros, service levels, emergency procedures, portal access, maintenance schedule.",
  safety: "Focus on: safety test history, compliance status, violations, upcoming inspections, improvement recommendations.",
  general: "Focus on: account overview, service history, equipment portfolio, key metrics, recommendations.",
};

async function executeGeneratePresentation(input: {
  presentationType: string;
  customerName: string;
  dataContext: string;
  customInstructions?: string;
}): Promise<{ generationId?: string; downloadUrl?: string; slides?: any[] }> {
  // Check provider setting — respect admin config
  const integrationSettings = await prisma.integrationSettings.findUnique({
    where: { id: "singleton" },
  });
  const provider = integrationSettings?.presentationProvider || "zeus";
  const gammaApiKey = integrationSettings?.presentationApiKey;

  // =============================================
  // GAMMA PROVIDER — external API with polling
  // =============================================
  if (provider === "gamma" && gammaApiKey) {
    // Fetch company name for branding (logo is injected during PPTX download)
    let companySettings: any = null;
    try {
      companySettings = await prisma.companySettings.findUnique({
        where: { id: "singleton" },
      });
    } catch (e) {
      // Non-fatal — continue with defaults
    }

    const companyName = companySettings?.companyName || "Nouveau Elevator Industries, Inc.";
    const companySubtitle = companySettings?.companySubtitle || "Elevator Division";

    const typeLabel = input.presentationType === "qbr" ? "Quarterly Business Review"
      : input.presentationType === "proposal" ? "Service Proposal"
      : input.presentationType === "onboarding" ? "New Customer Onboarding"
      : input.presentationType === "safety" ? "Safety Compliance Report"
      : "Partnership Overview";

    const gammaInput = `${typeLabel} for ${input.customerName} — ${companyName}\n\n${input.dataContext}${input.customInstructions ? `\n\nAdditional instructions: ${input.customInstructions}` : ""}`;

    // Minimal branding — let Gamma's AI handle design freely
    // Logo is post-processed into the PPTX during download (see gamma-export route)
    const gammaRequestBody: any = {
      inputText: gammaInput,
      textMode: "generate",
      format: "presentation",
      numCards: 10,
      exportAs: "pptx",
      themeId: "default-light",
      additionalInstructions: `Premium presentation by ${companyName}${companySubtitle ? ` — ${companySubtitle}` : ""}, a premier elevator maintenance and modernization company. Create visually stunning, executive-quality slides with bold imagery and polished modern design. Every slide should look like it belongs in a Fortune 500 boardroom.`,
      textOptions: {
        amount: "medium",
        tone: "Professional yet approachable",
        audience: "Building managers and property owners",
      },
    };

    const gammaRes = await fetch("https://public-api.gamma.app/v1.0/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": gammaApiKey,
      },
      body: JSON.stringify(gammaRequestBody),
    });

    if (!gammaRes.ok) {
      const errText = await gammaRes.text();
      console.error("Gamma API error:", gammaRes.status, errText);
      throw new Error("GENERATION_FAILED: Gamma API returned an error. DO NOT RETRY this tool call.");
    }

    const gammaData = await gammaRes.json();
    console.log("Gamma initial response:", JSON.stringify(gammaData));
    const generationId = gammaData.generationId;
    if (!generationId) throw new Error("GENERATION_FAILED: Gamma did not return a generation ID. DO NOT RETRY.");

    // Poll for completion (max ~180 seconds — Gamma can take 60-90s for 10-slide PPTX)
    let downloadUrl: string | undefined;
    let completed = false;

    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`https://public-api.gamma.app/v1.0/generations/${generationId}`, {
        headers: { "X-API-KEY": gammaApiKey },
      });
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        if (i < 3 || i % 10 === 0) console.log(`Gamma poll ${i}: status=${pollData.status}`, JSON.stringify(pollData));
        if (pollData.status === "completed") {
          completed = true;
          // exportUrl = PPTX download, gammaUrl = web view
          downloadUrl = pollData.exportUrl || pollData.gammaUrl || pollData.downloadLink || pollData.pptxUrl || pollData.url;
          console.log("Gamma completed:", JSON.stringify(pollData));
          if (!downloadUrl) {
            // Scan all string values for a pptx export URL
            for (const [key, val] of Object.entries(pollData)) {
              if (typeof val === "string" && (val.includes("gamma.app") || val.includes(".pptx"))) {
                console.log(`Gamma field ${key}: ${val}`);
                if (val.includes("export") || val.includes("pptx")) {
                  downloadUrl = val;
                  break;
                }
              }
            }
          }
          break;
        } else if (pollData.status === "generating" || pollData.status === "pending") {
          // Still working — continue polling
        } else {
          throw new Error(`GENERATION_FAILED: Gamma returned status "${pollData.status}". DO NOT RETRY.`);
        }
      }
    }

    if (!completed) {
      throw new Error("GENERATION_FAILED: Gamma timed out after 180 seconds. DO NOT RETRY this tool call — tell the user to try again.");
    }

    return { generationId, downloadUrl };
  }

  // =============================================
  // ZEUS PROVIDER — fast Claude-based generation
  // =============================================
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("GENERATION_FAILED: ANTHROPIC_API_KEY is not configured. DO NOT RETRY.");
  }

  const typeHint = PRESENTATION_TYPE_HINTS[input.presentationType] || PRESENTATION_TYPE_HINTS.general;

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
      system: `${ZEUS_SLIDE_SYSTEM_PROMPT}\n\n${typeHint}${input.customInstructions ? `\n\nAdditional user instructions: ${input.customInstructions}` : ""}`,
      messages: [
        {
          role: "user",
          content: `Generate a ${input.presentationType.toUpperCase()} presentation for ${input.customerName}:\n\n${input.dataContext}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Claude slide generation error:", response.status, errorBody);
    throw new Error("GENERATION_FAILED: Slide generation API error. DO NOT RETRY.");
  }

  const result = await response.json();
  const text = result?.content?.[0]?.text || "";

  let slides: any[] = [];
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      slides = JSON.parse(jsonMatch[0]);
    }
  } catch (parseErr) {
    console.error("Failed to parse AI slides:", parseErr);
    throw new Error("GENERATION_FAILED: AI returned invalid slide format. DO NOT RETRY.");
  }

  if (slides.length === 0) {
    throw new Error("GENERATION_FAILED: No slides generated. DO NOT RETRY.");
  }

  // Normalize slides
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

  return { slides: normalizedSlides };
}

async function executeTool(name: string, input: any): Promise<{ result: string; generationId?: string; downloadUrl?: string; presentationName?: string; slides?: any[] }> {
  switch (name) {
    case "search_customers":
      return { result: await executeSearchCustomers(input) };
    case "search_by_location":
      return { result: await executeSearchByLocation(input) };
    case "find_similar_customers":
      return { result: await executeFindSimilar(input) };
    case "get_customer_data":
      return { result: await executeGetCustomerData(input) };
    case "generate_presentation": {
      const { generationId, downloadUrl, slides } = await executeGeneratePresentation(input);
      const typeLabel = input.presentationType === "qbr" ? "QBR"
        : input.presentationType === "proposal" ? "Proposal"
        : input.presentationType === "onboarding" ? "Onboarding"
        : input.presentationType === "safety" ? "Safety Review"
        : "Presentation";
      const autoName = `${typeLabel} for ${input.customerName}`;

      if (slides && slides.length > 0) {
        // Zeus provider — slides generated directly
        return {
          result: `Presentation generated successfully with ${slides.length} slides. The user can now preview and edit them in the editor.`,
          slides,
          presentationName: autoName,
        };
      }

      // Gamma provider — external generation
      return {
        result: "Presentation generated successfully." + (downloadUrl ? " PPTX export is ready for download." : " PPTX export is being prepared."),
        generationId,
        downloadUrl,
        presentationName: autoName,
      };
    }
    default:
      return { result: `Unknown tool: ${name}` };
  }
}

function toolSummary(name: string, input: any): string {
  switch (name) {
    case "search_customers": return `Searching customers for "${input.query}"`;
    case "search_by_location": return `Looking up ${input.city ? input.city + ", " : ""}${input.state || "area"}`;
    case "find_similar_customers": return "Finding similar customers";
    case "get_customer_data": return "Loading customer data";
    case "generate_presentation": return "Generating presentation slides";
    default: return name;
  }
}

// ---- Main route ----

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function send(event: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }

        try {
          // Build Claude messages from conversation history
          const claudeMessages: { role: string; content: any }[] = messages.map((m: any) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          }));

          let iterations = 0;
          const MAX_ITERATIONS = 8;

          while (iterations < MAX_ITERATIONS) {
            iterations++;

            // Call Claude with tools
            const response = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
              },
              body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2048,
                system: SYSTEM_PROMPT,
                tools: TOOL_DEFINITIONS,
                messages: claudeMessages,
              }),
            });

            if (!response.ok) {
              const errorBody = await response.text();
              console.error("Claude API error:", response.status, errorBody);
              send({ type: "text", content: "Sorry, I encountered an error. Please try again." });
              break;
            }

            const result = await response.json();
            const contentBlocks = result.content || [];
            const stopReason = result.stop_reason;

            // Process content blocks
            let textContent = "";
            const toolUseBlocks: { id: string; name: string; input: any }[] = [];

            for (const block of contentBlocks) {
              if (block.type === "text") {
                textContent += block.text;
              } else if (block.type === "tool_use") {
                toolUseBlocks.push({ id: block.id, name: block.name, input: block.input });
              }
            }

            // Send text if any
            if (textContent) {
              send({ type: "text", content: textContent });
            }

            // If no tool calls, we're done
            if (stopReason !== "tool_use" || toolUseBlocks.length === 0) {
              break;
            }

            // Execute tool calls
            // Add assistant message with all content blocks to conversation
            claudeMessages.push({ role: "assistant", content: contentBlocks });

            const toolResults: { type: string; tool_use_id: string; content: string }[] = [];

            for (const toolCall of toolUseBlocks) {
              const summary = toolSummary(toolCall.name, toolCall.input);
              send({ type: "tool_start", tool: toolCall.name, input: toolCall.input, summary });

              try {
                const { result: toolResult, generationId, downloadUrl, presentationName, slides: genSlides } = await executeTool(toolCall.name, toolCall.input);

                // Send slides directly for zeus provider
                if (genSlides && genSlides.length > 0) {
                  send({ type: "slides", slides: genSlides, presentationName: presentationName || null });
                }

                // Send Gamma presentation data for download
                if (generationId) {
                  send({ type: "presentation", generationId, downloadUrl: downloadUrl || null, presentationName: presentationName || null });
                }

                const resultSummary = toolCall.name === "search_customers"
                  ? `Found ${(toolResult.match(/^Found (\d+)/)?.[0]) || "results"}`
                  : toolCall.name === "search_by_location"
                  ? `Found ${(toolResult.match(/^Found (\d+)/)?.[0]) || "results"}`
                  : toolCall.name === "generate_presentation"
                  ? (generationId || genSlides?.length) ? "Presentation ready" : "Generation failed"
                  : "Done";

                send({ type: "tool_result", tool: toolCall.name, summary: resultSummary });

                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolCall.id,
                  content: toolResult,
                });
              } catch (err: any) {
                console.error(`Tool ${toolCall.name} failed:`, err);
                send({ type: "tool_result", tool: toolCall.name, summary: "Error" });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolCall.id,
                  content: `Error: ${err.message || "Tool execution failed"}`,
                });
              }
            }

            // Add tool results to conversation
            claudeMessages.push({ role: "user", content: toolResults });
          }

          send({ type: "done" });
        } catch (err) {
          console.error("Presentation chat error:", err);
          send({ type: "text", content: "An unexpected error occurred. Please try again." });
          send({ type: "done" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Presentation chat error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
