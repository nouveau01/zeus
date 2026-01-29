import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/job-types - Get job types from SQL Server (READ ONLY)
export async function GET(request: NextRequest) {
  try {
    // Use raw SQL for SQL Server 2008 compatibility
    const jobTypes: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT * FROM JobType ORDER BY ID`
    );

    // Map to response format
    const response = jobTypes.map(jt => ({
      id: jt.ID.toString(),
      name: jt.Type || "",
      type: jt.Type || "",
      count: jt.Count || 0,
      color: jt.Color,
      remarks: jt.Remarks || "",
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching job types:", error);
    return NextResponse.json(
      { error: "Failed to fetch job types", details: String(error) },
      { status: 500 }
    );
  }
}
