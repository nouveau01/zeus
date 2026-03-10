import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";
import { getOfficeScope, parseOfficeFilter } from "@/lib/officeScope";

export async function GET(request: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const filteredIds = parseOfficeFilter(request);
  const scope = await getOfficeScope(user.id, user.role, filteredIds);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // accounts, customers, units, jobs
  const q = searchParams.get("q") || "";
  const premisesId = searchParams.get("premisesId") || undefined;
  const customerId = searchParams.get("customerId") || undefined;
  const limit = 20; // Keep autocomplete results small and fast

  if (!type) {
    return NextResponse.json({ error: "type parameter required" }, { status: 400 });
  }

  try {
    switch (type) {
      case "accounts": {
        const accountWhere: any = {};
        if (customerId) {
          accountWhere.customerId = customerId;
        }
        if (q) {
          accountWhere.OR = [
            { premisesId: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
          ];
        }
        if (!scope.allOffices) {
          accountWhere.AND = [...(accountWhere.AND || []), { OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] }];
        }
        const results = await prisma.premises.findMany({
          where: accountWhere,
          take: limit,
          orderBy: { premisesId: "asc" },
          include: { customer: { select: { id: true, name: true } } },
        });
        const mapped = results.map((a: any) => ({
          id: a.id,
          label: a.premisesId || a.name || a.id,
          description: [a.name, a.address, a.city, a.state].filter(Boolean).join(", "),
          data: a,
        }));
        return NextResponse.json(mapped);
      }

      case "customers": {
        const custWhere: any = {};
        if (q) {
          custWhere.OR = [
            { name: { contains: q, mode: "insensitive" } },
            { accountNumber: { contains: q, mode: "insensitive" } },
          ];
        }
        if (!scope.allOffices) {
          custWhere.premises = { some: { OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] } };
        }
        const results = await prisma.customer.findMany({
          where: custWhere,
          take: limit,
          orderBy: { name: "asc" },
        });
        const mapped = results.map((c: any) => ({
          id: c.id,
          label: c.name,
          description: [c.address, c.city, c.state].filter(Boolean).join(", "),
          data: c,
        }));
        return NextResponse.json(mapped);
      }

      case "units": {
        const unitWhere: any = {};
        if (q) {
          unitWhere.OR = [
            { unitNumber: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ];
        }
        if (premisesId) {
          unitWhere.premisesId = premisesId;
        }
        if (!scope.allOffices) {
          unitWhere.premises = { ...(unitWhere.premises || {}), OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] };
        }
        const results = await prisma.unit.findMany({
          where: unitWhere,
          take: limit,
          orderBy: { unitNumber: "asc" },
          include: { premises: { select: { id: true, premisesId: true, address: true } } },
        });
        const mapped = results.map((u: any) => ({
          id: u.id,
          label: u.unitNumber || u.id,
          description: [u.unitType, u.manufacturer, u.premises?.address].filter(Boolean).join(" - "),
          data: u,
        }));
        return NextResponse.json(mapped);
      }

      case "jobs": {
        const jobWhere: any = {};
        if (q) {
          jobWhere.OR = [
            { jobName: { contains: q, mode: "insensitive" } },
            { externalId: { contains: q, mode: "insensitive" } },
          ];
        }
        if (premisesId) {
          jobWhere.premisesId = premisesId;
        }
        if (!scope.allOffices) {
          jobWhere.premises = { ...(jobWhere.premises || {}), OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] };
        }
        const results = await prisma.job.findMany({
          where: jobWhere,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { premises: { select: { id: true, premisesId: true, address: true } } },
        });
        const mapped = results.map((j: any) => ({
          id: j.id,
          label: j.externalId || j.jobName || j.id,
          description: [j.jobName, j.type, j.status].filter(Boolean).join(" - "),
          data: j,
        }));
        return NextResponse.json(mapped);
      }

      case "contacts": {
        const contactWhere: any = q ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        } : {};

        // Office scoping — only show contacts whose customer has premises in user's offices
        if (!scope.allOffices) {
          contactWhere.customer = { premises: { some: { OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] } } };
        }

        const contacts = await prisma.contact.findMany({
          where: contactWhere,
          include: { customer: { select: { id: true, name: true } } },
          take: limit,
          orderBy: { name: "asc" },
        });
        const mapped = contacts.map((c: any) => ({
          id: c.id,
          label: c.name,
          description: [c.email, c.customer?.name].filter(Boolean).join(" - "),
          data: { ...c, customerName: c.customer?.name },
        }));
        return NextResponse.json(mapped);
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
