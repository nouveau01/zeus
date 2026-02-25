import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/db";

// Read the report context/memory file
function getReportContext(): string {
  try {
    const contextPath = path.join(process.cwd(), "src/lib/report-context.md");
    return fs.readFileSync(contextPath, "utf-8");
  } catch {
    return "No context file found.";
  }
}

// Safety check - only allow SELECT statements
function isSafeQuery(sql: string): boolean {
  const normalized = sql.trim().toUpperCase();
  if (!normalized.startsWith("SELECT") && !normalized.startsWith("WITH")) {
    return false;
  }
  const blocked = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "EXEC", "EXECUTE", "TRUNCATE", "MERGE", "GRANT", "REVOKE"];
  for (const keyword of blocked) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    const withoutStrings = normalized.replace(/'[^']*'/g, "");
    if (regex.test(withoutStrings)) {
      return false;
    }
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, feedback } = await request.json();

    // Handle feedback/preference saving
    if (feedback) {
      return saveFeedback(feedback);
    }

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Add it to your .env file." },
        { status: 500 }
      );
    }

    const context = getReportContext();

    // Step 1: Ask Claude to generate a PostgreSQL query
    const sqlResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: `You are a PostgreSQL query generator for the ZEUS business management system.

Here is the full context about the business and database schema:

${context}

---

Your job: Given a user's report request, generate a PostgreSQL query to fetch the data they need.

You MUST respond with ONLY valid JSON (no markdown, no code fences) in this exact format:

{
  "title": "Report Title",
  "summary": "Brief description of what this report shows",
  "sql": "SELECT ... FROM ... (valid PostgreSQL query)",
  "columns": [
    { "key": "column_alias", "label": "Display Label", "align": "left", "format": "text" }
  ]
}

Column "format" values: "text" (default), "currency" (for any monetary/dollar values like balance, amount, total, cost, revenue, profit, price), "number" (plain numeric).
Do NOT format currency in SQL (no TO_CHAR on money columns) - return raw numbers and set format to "currency".

Rules:
- The "key" in columns MUST exactly match the column aliases in your SELECT statement (use lowercase aliases always)
- Use table aliases and alias ALL selected columns with readable lowercase names using AS
- Use LIMIT 500 unless the user specifies otherwise
- Column "align" can be "left", "right", or "center". Use "right" for monetary/numeric values.
- Use COALESCE(field, 0) for nullable numerics
- Use TO_CHAR(date, 'MM/DD/YYYY') for date formatting
- Table names: customers, premises, units, tickets, jobs, invoices, employees, job_types, chart_accounts
- Column names are snake_case: customer_id, zip_code, f_desc, etc.
- For "accounts": SELECT p.*, c.name as customer_name FROM premises p LEFT JOIN customers c ON p.customer_id = c.id
- Boolean fields use true/false, case-insensitive search uses ILIKE
- Remember: "accounts" means premises/locations, NOT GL accounts
- If the request is ambiguous, make reasonable assumptions for an elevator service company
- Always use LEFT JOINs when combining tables`,
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!sqlResponse.ok) {
      const errorBody = await sqlResponse.text();
      console.error("Claude API error:", sqlResponse.status, errorBody);
      return NextResponse.json(
        { error: `Claude API error: ${sqlResponse.status}` },
        { status: 502 }
      );
    }

    const sqlData = await sqlResponse.json();
    const sqlContent = sqlData.content?.[0]?.text;

    if (!sqlContent) {
      return NextResponse.json(
        { error: "No response from Claude" },
        { status: 502 }
      );
    }

    // Parse Claude's response
    let queryPlan;
    try {
      const cleaned = sqlContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      queryPlan = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Claude SQL response:", sqlContent);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 502 }
      );
    }

    if (!queryPlan.columns || !Array.isArray(queryPlan.columns)) {
      return NextResponse.json(
        { error: "Invalid report structure from AI" },
        { status: 502 }
      );
    }

    if (!queryPlan.sql) {
      return NextResponse.json(
        { error: "AI did not generate a query. Try rephrasing your request." },
        { status: 502 }
      );
    }

    // Safety check
    if (!isSafeQuery(queryPlan.sql)) {
      console.error("Unsafe query blocked:", queryPlan.sql);
      return NextResponse.json(
        { error: "The generated query was blocked for safety. Only SELECT queries are allowed." },
        { status: 400 }
      );
    }

    // Step 2: Execute against PostgreSQL
    let rows: Record<string, unknown>[] = [];

    try {
      console.log("Executing report query:", queryPlan.sql);
      const results = await prisma.$queryRawUnsafe(queryPlan.sql);
      rows = (results as Record<string, unknown>[]).map((row) => {
        const cleaned: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(row)) {
          if (typeof val === "bigint") {
            cleaned[key] = val.toString();
          } else if (val instanceof Date) {
            cleaned[key] = val.toLocaleDateString("en-US");
          } else if (val !== null && typeof val === "object" && "toNumber" in (val as Record<string, unknown>)) {
            cleaned[key] = (val as { toNumber: () => number }).toNumber();
          } else {
            cleaned[key] = val;
          }
        }
        return cleaned;
      });
    } catch (dbError: unknown) {
      const errMsg = dbError instanceof Error ? dbError.message : String(dbError);
      console.error("SQL execution error:", errMsg);
      return NextResponse.json(
        { error: `Database query failed: ${errMsg.substring(0, 300)}. Try rephrasing your request.` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      title: queryPlan.title || "Report",
      summary: queryPlan.summary || "",
      columns: queryPlan.columns,
      rows,
      dataSource: "live",
      sql: queryPlan.sql || null,
    });
  } catch (error) {
    console.error("AI Reports API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Save user feedback/preferences to the context file
function saveFeedback(feedback: { type: string; message: string }) {
  try {
    const contextPath = path.join(process.cwd(), "src/lib/report-context.md");
    const content = fs.readFileSync(contextPath, "utf-8");
    const date = new Date().toLocaleDateString("en-US");

    let updatedContent = content;

    if (feedback.type === "preference") {
      updatedContent = content.replace(
        "<!-- Preferences learned from user interactions will be added below -->",
        `<!-- Preferences learned from user interactions will be added below -->\n- [${date}] ${feedback.message}`
      );
    } else if (feedback.type === "correction") {
      updatedContent = content.replace(
        "<!-- When users report incorrect data or terminology, add corrections here -->",
        `<!-- When users report incorrect data or terminology, add corrections here -->\n- [${date}] ${feedback.message}`
      );
    }

    fs.writeFileSync(contextPath, updatedContent, "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save feedback:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
