import { NextRequest, NextResponse } from "next/server";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";
import prisma from "@/lib/prisma";

// GET /api/sqlserver/job-types - Get job types from SQL Server (READ ONLY)
// Falls back to PostgreSQL if SQL Server is not available
export async function GET(request: NextRequest) {
  try {
    // Check if SQL Server is available
    if (!isSqlServerAvailable()) {
      // Fall back to PostgreSQL
      const jobTypes = await prisma.jobType.findMany({
        orderBy: { sortOrder: "asc" },
      });

      const response = jobTypes.map(jt => ({
        id: jt.id,
        name: jt.name,
        type: jt.name,
        count: jt.count,
        color: jt.color,
        remarks: jt.remarks || "",
      }));

      return NextResponse.json(response);
    }

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
