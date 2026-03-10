import prisma from "@/lib/db";

interface SimilarCustomerResult {
  id: string;
  score: number;
  anonymizedDescription: string;
  type: string | null;
  category: string | null;
  elevatorCount: number;
  locationCount: number;
  city: string | null;
  state: string | null;
}

/**
 * Find top 5 similar customers using weighted scoring.
 * Names are anonymized for social proof in presentations.
 */
export async function findSimilarCustomers(
  customerId: string,
  limit = 5
): Promise<SimilarCustomerResult[]> {
  // Get the target customer
  const target = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      type: true,
      category: true,
      elevs: true,
      locs: true,
      city: true,
      state: true,
    },
  });

  if (!target) return [];

  // Pre-filter: customers sharing type OR category OR state (cap at 50)
  const candidates = await prisma.customer.findMany({
    where: {
      id: { not: customerId },
      isActive: true,
      OR: [
        ...(target.type ? [{ type: target.type }] : []),
        ...(target.category ? [{ category: target.category }] : []),
        ...(target.state ? [{ state: target.state }] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      type: true,
      category: true,
      elevs: true,
      locs: true,
      city: true,
      state: true,
    },
    take: 50,
  });

  // Score each candidate
  const scored = candidates.map((c) => {
    let score = 0;

    // Same type (25 pts)
    if (target.type && c.type && target.type === c.type) score += 25;

    // Same category (20 pts)
    if (target.category && c.category && target.category === c.category) score += 20;

    // Similar elevator count (20 pts) — ratio-based proximity
    const targetElevs = target.elevs || 0;
    const cElevs = c.elevs || 0;
    if (targetElevs > 0 && cElevs > 0) {
      const ratio = Math.min(targetElevs, cElevs) / Math.max(targetElevs, cElevs);
      score += Math.round(ratio * 20);
    }

    // Similar location count (10 pts) — ratio-based proximity
    const targetLocs = target.locs || 0;
    const cLocs = c.locs || 0;
    if (targetLocs > 0 && cLocs > 0) {
      const ratio = Math.min(targetLocs, cLocs) / Math.max(targetLocs, cLocs);
      score += Math.round(ratio * 10);
    }

    // Same state (15 pts)
    if (target.state && c.state && target.state === c.state) score += 15;

    // Same city (10 pts)
    if (target.city && c.city && target.city.toLowerCase() === c.city.toLowerCase()) score += 10;

    return {
      id: c.id,
      score,
      type: c.type,
      category: c.category,
      elevatorCount: c.elevs || 0,
      locationCount: c.locs || 0,
      city: c.city,
      state: c.state,
      anonymizedDescription: anonymize(c),
    };
  });

  // Sort by score descending, return top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Find customers/accounts by city and/or state.
 * Used for prospect scenarios — "what do we service in Stamford CT?"
 */
export async function findCustomersByLocation(
  city?: string,
  state?: string,
  limit = 10
): Promise<{
  customers: { id: string; anonymizedDescription: string; type: string | null; category: string | null; elevatorCount: number; locationCount: number; city: string | null; state: string | null }[];
  accountCount: number;
  totalElevators: number;
}> {
  // Build where clause — case-insensitive matching
  const where: any = { isActive: true };
  if (city) {
    where.city = { equals: city, mode: "insensitive" };
  }
  if (state) {
    where.state = { equals: state, mode: "insensitive" };
  }

  // Also search Premises (accounts) by city/state for broader results
  const premisesWhere: any = {};
  if (city) {
    premisesWhere.city = { equals: city, mode: "insensitive" };
  }
  if (state) {
    premisesWhere.state = { equals: state, mode: "insensitive" };
  }

  const [customers, premises] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        elevs: true,
        locs: true,
        city: true,
        state: true,
      },
      take: limit,
      orderBy: { elevs: "desc" },
    }),
    prisma.premises.findMany({
      where: premisesWhere,
      select: {
        id: true,
        customerId: true,
        units: { select: { id: true } },
      },
    }),
  ]);

  const accountCount = premises.length;
  const totalElevators = premises.reduce((sum, p) => sum + p.units.length, 0);

  const anonymized = customers.map((c) => ({
    id: c.id,
    anonymizedDescription: anonymize(c),
    type: c.type,
    category: c.category,
    elevatorCount: c.elevs || 0,
    locationCount: c.locs || 0,
    city: c.city,
    state: c.state,
  }));

  return { customers: anonymized, accountCount, totalElevators };
}

/**
 * Anonymize customer into a description like:
 * "A property management firm in Manhattan with 12 elevators"
 */
function anonymize(c: {
  type: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  elevs: number | null;
  locs: number | null;
}): string {
  const typeLabel = c.type
    ? `A ${c.type.toLowerCase()} client`
    : "A client";

  const locationPart = c.city && c.state
    ? ` in ${c.city}, ${c.state}`
    : c.state
    ? ` in ${c.state}`
    : "";

  const elevPart = c.elevs && c.elevs > 0
    ? ` with ${c.elevs} elevator${c.elevs !== 1 ? "s" : ""}`
    : "";

  const locPart = c.locs && c.locs > 1
    ? ` across ${c.locs} locations`
    : "";

  return `${typeLabel}${locationPart}${elevPart}${locPart}`;
}
