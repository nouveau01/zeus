import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAccounts } from "@/lib/data/accounts";
import { fetchCustomers } from "@/lib/data/customers";
import { fetchUnits } from "@/lib/data/units";
import { fetchJobs } from "@/lib/data/jobs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // accounts, customers, units, jobs
  const q = searchParams.get("q") || "";
  const premisesId = searchParams.get("premisesId") || undefined;
  const limit = 20; // Keep autocomplete results small and fast

  if (!type) {
    return NextResponse.json({ error: "type parameter required" }, { status: 400 });
  }

  try {
    switch (type) {
      case "accounts": {
        const results = await fetchAccounts({ search: q, limit });
        const mapped = results.map((a: any) => ({
          id: a.id,
          label: a.premisesId || a.name || a.id,
          description: [a.name, a.address, a.city, a.state].filter(Boolean).join(", "),
          data: a,
        }));
        return NextResponse.json(mapped);
      }

      case "customers": {
        const results = await fetchCustomers({ search: q, limit });
        const mapped = results.map((c: any) => ({
          id: c.id,
          label: c.name,
          description: [c.address, c.city, c.state].filter(Boolean).join(", "),
          data: c,
        }));
        return NextResponse.json(mapped);
      }

      case "units": {
        const results = await fetchUnits({ search: q, premisesId, limit });
        const mapped = results.map((u: any) => ({
          id: u.id,
          label: u.unitNumber || u.id,
          description: [u.unitType, u.manufacturer, u.premises?.address].filter(Boolean).join(" - "),
          data: u,
        }));
        return NextResponse.json(mapped);
      }

      case "jobs": {
        const results = await fetchJobs({ search: q, premisesId, limit });
        const mapped = results.map((j: any) => ({
          id: j.id,
          label: j.jobNumber || j.id,
          description: [j.description, j.type, j.status].filter(Boolean).join(" - "),
          data: j,
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
