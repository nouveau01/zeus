import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/lookups/[field] - Get lookup values for filter fields
export async function GET(
  request: NextRequest,
  { params }: { params: { field: string } }
) {
  try {
    const { field } = params;
    let values: { id: string; label: string; description?: string }[] = [];

    switch (field) {
      case "accountId":
      case "account": {
        // Get all premises with their IDs
        const premises = await prisma.premises.findMany({
          select: {
            id: true,
            premisesId: true,
            name: true,
            address: true,
          },
          orderBy: { premisesId: "asc" },
          take: 500,
        });
        values = premises.map((p) => ({
          id: p.premisesId || p.id,
          label: p.premisesId || p.id,
          description: p.name || p.address,
        }));
        break;
      }

      case "accountTag": {
        // Get all premises with their names/tags
        const premisesTags = await prisma.premises.findMany({
          select: {
            id: true,
            premisesId: true,
            name: true,
            address: true,
          },
          orderBy: { name: "asc" },
          take: 500,
        });
        values = premisesTags.map((p) => ({
          id: p.name || p.address || p.id,
          label: p.name || p.address || "Unknown",
          description: p.premisesId || undefined,
        }));
        break;
      }

      case "customer": {
        // Get all customers
        const customers = await prisma.customer.findMany({
          select: {
            id: true,
            name: true,
            accountNumber: true,
          },
          orderBy: { name: "asc" },
          take: 500,
        });
        values = customers.map((c) => ({
          id: c.name,
          label: c.name,
          description: c.accountNumber || undefined,
        }));
        break;
      }

      case "status": {
        // Get distinct status values from jobs
        const statuses = await prisma.job.findMany({
          select: { status: true },
          distinct: ["status"],
          where: { status: { not: null } },
          orderBy: { status: "asc" },
        });
        values = statuses
          .filter((s) => s.status)
          .map((s) => ({
            id: s.status!,
            label: s.status!,
          }));
        break;
      }

      case "template": {
        // Get all job templates
        const templates = await prisma.jobTemplate.findMany({
          select: {
            id: true,
            name: true,
            description: true,
          },
          where: { isActive: true },
          orderBy: { name: "asc" },
        });
        values = templates.map((t) => ({
          id: t.name,
          label: t.name,
          description: t.description || undefined,
        }));
        break;
      }

      case "type": {
        // Get all job types
        const types = await prisma.jobType.findMany({
          select: {
            id: true,
            name: true,
            description: true,
          },
          where: { isActive: true },
          orderBy: { name: "asc" },
        });
        values = types.map((t) => ({
          id: t.name,
          label: t.name,
          description: t.description || undefined,
        }));
        break;
      }

      case "contractType": {
        // Get distinct contract types from jobs (cType field)
        const cTypes = await prisma.job.findMany({
          select: { cType: true },
          distinct: ["cType"],
          where: { cType: { not: null } },
          orderBy: { cType: "asc" },
        });
        values = cTypes
          .filter((c) => c.cType)
          .map((c) => ({
            id: c.cType!,
            label: c.cType!,
          }));
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown lookup field: ${field}` },
          { status: 400 }
        );
    }

    return NextResponse.json(values);
  } catch (error) {
    console.error("Error fetching lookup values:", error);
    return NextResponse.json(
      { error: "Failed to fetch lookup values" },
      { status: 500 }
    );
  }
}
