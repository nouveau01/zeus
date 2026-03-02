import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US");
}

function formatCurrency(val: number | { toNumber?: () => number } | null | undefined): string {
  if (val == null) return "$0.00";
  const num = typeof val === "object" && val && "toNumber" in val ? (val as { toNumber: () => number }).toNumber() : Number(val);
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const { premisesId } = await request.json();
    if (!premisesId || typeof premisesId !== "string") {
      return new Response(JSON.stringify({ error: "premisesId is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Fetch all relevant data from PostgreSQL in parallel
    const [account, tickets, units, jobs, invoices] = await Promise.all([
      prisma.premises.findUnique({
        where: { id: premisesId },
        include: { customer: true },
      }),
      prisma.ticket.findMany({
        where: { premisesId },
        take: 25,
        orderBy: { date: "desc" },
      }),
      prisma.unit.findMany({
        where: { premisesId },
      }),
      prisma.job.findMany({
        where: { premisesId },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.findMany({
        where: { premisesId },
        take: 15,
        orderBy: { date: "desc" },
      }),
    ]);

    if (!account) {
      return new Response(JSON.stringify({ error: "Account not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    // Build readable context string
    const contextParts: string[] = [];

    // Account info
    contextParts.push(`ACCOUNT: ${account.premisesId || ""} — ${account.name || account.address}`);
    contextParts.push(`Address: ${account.address}, ${account.city || ""} ${account.state || ""} ${account.zipCode || ""}`);
    contextParts.push(`Type: ${account.type || "N/A"} | Status: ${account.status === 1 ? "Active" : "Inactive"} | Balance: ${formatCurrency(account.balance)}`);
    if (account.terms) contextParts.push(`Terms: ${account.terms} | Credit: ${account.credit ?? "N/A"}`);
    if (account.remarks) contextParts.push(`Account Remarks: ${account.remarks}`);
    if (account.colRemarks) contextParts.push(`Collection Remarks: ${account.colRemarks}`);
    if (account.salesRemarks) contextParts.push(`Sales Remarks: ${account.salesRemarks}`);
    if (account.contact) contextParts.push(`Contact: ${account.contact} | Phone: ${account.phone || "N/A"}`);
    if (account.dispAlert) contextParts.push(`⚠ DISPATCH ALERT: ${account.dispAlertType || "Yes"}`);

    // Customer info
    if (account.customer) {
      const c = account.customer;
      contextParts.push(`\nCUSTOMER: ${c.name}`);
      if (c.balance) contextParts.push(`Customer Balance: ${formatCurrency(c.balance)}`);
      if (c.remarks) contextParts.push(`Customer Remarks: ${c.remarks}`);
      if (c.salesRemarks) contextParts.push(`Customer Sales Remarks: ${c.salesRemarks}`);
    }

    // Units
    contextParts.push(`\nUNITS (${units.length} total):`);
    if (units.length === 0) {
      contextParts.push("No units on file.");
    } else {
      for (const u of units) {
        contextParts.push(`- Unit ${u.unitNumber}: ${u.unitType || "Unknown type"} | ${u.manufacturer || "Unknown mfr"} | Status: ${u.status || "Unknown"}`);
      }
    }

    // Recent tickets
    contextParts.push(`\nRECENT TICKETS (${tickets.length} shown):`);
    if (tickets.length === 0) {
      contextParts.push("No ticket history.");
    } else {
      for (const t of tickets) {
        contextParts.push(`- #${t.ticketNumber} [${formatDate(t.date)}] ${t.type} — ${t.status} | ${t.category || ""} | ${(t.scopeOfWork || t.description || "").substring(0, 100)} | Worker: ${t.mechCrew || "Unassigned"}`);
        if (t.resolution) contextParts.push(`  Resolution: ${t.resolution.substring(0, 100)}`);
      }
    }

    // Jobs
    contextParts.push(`\nJOBS (${jobs.length} shown):`);
    if (jobs.length === 0) {
      contextParts.push("No jobs on file.");
    } else {
      for (const j of jobs) {
        contextParts.push(`- ${j.jobName}: ${j.type || "N/A"} | Status: ${j.status || "N/A"} | Rev: ${formatCurrency(j.rev)} | Cost: ${formatCurrency(j.cost)}`);
      }
    }

    // Invoices
    contextParts.push(`\nRECENT INVOICES (${invoices.length} shown):`);
    if (invoices.length === 0) {
      contextParts.push("No invoice history.");
    } else {
      for (const inv of invoices) {
        contextParts.push(`- #${inv.invoiceNumber} [${formatDate(inv.date)}] ${formatCurrency(inv.total)} — ${inv.status || inv.statusDisplay || "Open"} | ${(inv.description || inv.fDesc || "").substring(0, 80)}`);
      }
    }

    const dataContext = contextParts.join("\n");

    // Call Claude API with streaming
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        stream: true,
        system: `You are a quick-reference assistant for elevator service dispatchers. Write a casual, easy-to-read summary a dispatcher can glance at before picking up the phone or sending a tech.

Rules:
- NO markdown headers, NO bullet points, NO numbered lists. Just plain sentences in 2-3 short paragraphs.
- Wrap the most important phrases in **double asterisks** so they stand out — things like equipment counts, owe money, recurring problems, dispatch alerts, key warnings. Only bold the stuff a dispatcher NEEDS to see at a glance (maybe 4-6 phrases total).
- Keep it under 150 words. Short and simple.

What to cover:
- What's at this location (building name, how many elevators, what kind)
- Recent work — what was done recently, any recurring issues or patterns
- Are they good on payments or do they owe money? Just say "good standing" or "they owe money" — no exact dollar amounts
- Anything a dispatcher should know before sending someone out (alerts, special notes, problem history)

Talk like a dispatcher would — skip the corporate language.`,
        messages: [
          { role: "user", content: `Generate an account briefing from this data:\n\n${dataContext}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Claude API error:", response.status, errorBody);
      return new Response(JSON.stringify({ error: `Claude API error: ${response.status}` }), { status: 502, headers: { "Content-Type": "application/json" } });
    }

    // Stream the response back to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    // Send each text chunk as an SSE event
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                  } else if (parsed.type === "message_stop") {
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  }
                } catch {
                  // Skip unparseable lines
                }
              }
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`));
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
    console.error("AI Account Summary error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
