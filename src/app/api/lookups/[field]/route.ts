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
        // Get all job templates (JobTemplate doesn't have description, just name)
        const templates = await prisma.jobTemplate.findMany({
          select: {
            id: true,
            name: true,
            type: {
              select: { name: true },
            },
          },
          where: { isActive: true },
          orderBy: { name: "asc" },
        });
        values = templates.map((t) => ({
          id: t.name,
          label: t.name,
          description: t.type?.name || undefined,
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

      // Customer-specific lookups
      case "billingType": {
        // Billing type options for customers
        values = [
          { id: "Consolidated", label: "Consolidated" },
          { id: "Detailed", label: "Detailed" },
          { id: "Detailed Group", label: "Detailed Group" },
          { id: "Detailed Sub", label: "Detailed Sub" },
        ];
        break;
      }

      case "state": {
        // US State codes
        values = [
          { id: "AL", label: "AL", description: "Alabama" },
          { id: "AK", label: "AK", description: "Alaska" },
          { id: "AZ", label: "AZ", description: "Arizona" },
          { id: "AR", label: "AR", description: "Arkansas" },
          { id: "CA", label: "CA", description: "California" },
          { id: "CO", label: "CO", description: "Colorado" },
          { id: "CT", label: "CT", description: "Connecticut" },
          { id: "DE", label: "DE", description: "Delaware" },
          { id: "FL", label: "FL", description: "Florida" },
          { id: "GA", label: "GA", description: "Georgia" },
          { id: "HI", label: "HI", description: "Hawaii" },
          { id: "ID", label: "ID", description: "Idaho" },
          { id: "IL", label: "IL", description: "Illinois" },
          { id: "IN", label: "IN", description: "Indiana" },
          { id: "IA", label: "IA", description: "Iowa" },
          { id: "KS", label: "KS", description: "Kansas" },
          { id: "KY", label: "KY", description: "Kentucky" },
          { id: "LA", label: "LA", description: "Louisiana" },
          { id: "ME", label: "ME", description: "Maine" },
          { id: "MD", label: "MD", description: "Maryland" },
          { id: "MA", label: "MA", description: "Massachusetts" },
          { id: "MI", label: "MI", description: "Michigan" },
          { id: "MN", label: "MN", description: "Minnesota" },
          { id: "MS", label: "MS", description: "Mississippi" },
          { id: "MO", label: "MO", description: "Missouri" },
          { id: "MT", label: "MT", description: "Montana" },
          { id: "NE", label: "NE", description: "Nebraska" },
          { id: "NV", label: "NV", description: "Nevada" },
          { id: "NH", label: "NH", description: "New Hampshire" },
          { id: "NJ", label: "NJ", description: "New Jersey" },
          { id: "NM", label: "NM", description: "New Mexico" },
          { id: "NY", label: "NY", description: "New York" },
          { id: "NC", label: "NC", description: "North Carolina" },
          { id: "ND", label: "ND", description: "North Dakota" },
          { id: "OH", label: "OH", description: "Ohio" },
          { id: "OK", label: "OK", description: "Oklahoma" },
          { id: "OR", label: "OR", description: "Oregon" },
          { id: "PA", label: "PA", description: "Pennsylvania" },
          { id: "RI", label: "RI", description: "Rhode Island" },
          { id: "SC", label: "SC", description: "South Carolina" },
          { id: "SD", label: "SD", description: "South Dakota" },
          { id: "TN", label: "TN", description: "Tennessee" },
          { id: "TX", label: "TX", description: "Texas" },
          { id: "UT", label: "UT", description: "Utah" },
          { id: "VT", label: "VT", description: "Vermont" },
          { id: "VA", label: "VA", description: "Virginia" },
          { id: "WA", label: "WA", description: "Washington" },
          { id: "WV", label: "WV", description: "West Virginia" },
          { id: "WI", label: "WI", description: "Wisconsin" },
          { id: "WY", label: "WY", description: "Wyoming" },
          { id: "DC", label: "DC", description: "District of Columbia" },
        ];
        break;
      }

      case "customerStatus": {
        // Customer status options
        values = [
          { id: "Active", label: "Active" },
          { id: "Inactive", label: "Inactive" },
        ];
        break;
      }

      case "portalUser": {
        // Portal access is a boolean flag - Yes/No options
        values = [
          { id: "Yes", label: "Yes", description: "Has portal access" },
          { id: "No", label: "No", description: "No portal access" },
        ];
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
