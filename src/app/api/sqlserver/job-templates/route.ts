import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/job-templates - Get job templates from SQL Server (READ ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    // Use raw SQL for SQL Server 2008 compatibility
    const templates: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT TOP ${limit} * FROM JobT ORDER BY ID`
    );

    // Get JobType for type names
    const typeIds = [...new Set(templates.map(t => t.Type).filter(Boolean))];
    const jobTypes: any[] = typeIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM JobType WHERE ID IN (${typeIds.join(",")})`)
      : [];
    const typeMap = new Map(jobTypes.map(t => [t.ID, t]));

    // Map to response format
    const response = templates.map(template => {
      const jobType = template.Type ? typeMap.get(template.Type) : null;
      return {
        id: template.ID.toString(),
        name: template.fDesc || "",
        description: template.fDesc || "",
        type: jobType?.Type || "",
        typeId: template.Type,
        contractType: template.CType || "",
        remarks: template.Remarks || "",
        status: template.Status === 1 ? "Active" : "Inactive",
        chargeable: template.Charge === 1,
        count: template.Count || 0,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching job templates from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch job templates from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
