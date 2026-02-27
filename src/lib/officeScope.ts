import prisma from "@/lib/db";

export interface OfficeScope {
  allOffices: boolean;
  officeIds: string[];
}

/**
 * Get the office scope for a user session.
 * GodAdmin sees everything (allOffices: true) unless filteredIds are provided.
 * Others only see data from their assigned offices, optionally narrowed by filteredIds.
 *
 * @param filteredIds - Optional subset of office IDs from the TopNav dropdown filter.
 *   When provided, the scope is intersected with the user's allowed offices.
 *   GodAdmin with filteredIds gets scoped to those specific offices.
 */
export async function getOfficeScope(
  userId: string,
  userRole: string,
  filteredIds?: string[]
): Promise<OfficeScope> {
  if (userRole === "GodAdmin") {
    // GodAdmin with no filter → see everything
    if (!filteredIds || filteredIds.length === 0) {
      return { allOffices: true, officeIds: [] };
    }
    // GodAdmin with filter → scoped to selected offices
    return { allOffices: false, officeIds: filteredIds };
  }

  const userOffices = await prisma.userOffice.findMany({
    where: { userId },
    select: { officeId: true },
  });

  const allowedIds = userOffices.map((uo) => uo.officeId);

  // If filter provided, intersect with allowed offices
  if (filteredIds && filteredIds.length > 0) {
    const allowedSet = new Set(allowedIds);
    const intersected = filteredIds.filter((id) => allowedSet.has(id));
    return { allOffices: false, officeIds: intersected };
  }

  return {
    allOffices: false,
    officeIds: allowedIds,
  };
}

/**
 * Parse the officeIds query parameter from a request URL.
 * Returns undefined if not present (means "all offices").
 */
export function parseOfficeFilter(req: { nextUrl: URL }): string[] | undefined {
  const param = req.nextUrl.searchParams.get("officeIds");
  if (!param) return undefined;
  return param.split(",").filter(Boolean);
}

/**
 * Prisma `where` fragment for filtering Premises directly by office.
 * Returns {} for GodAdmin (no filter).
 * Returns { officeId: { in: [...] } } for scoped users.
 * Returns impossible match for users with no offices assigned.
 */
export function premisesOfficeWhere(scope: OfficeScope): Record<string, any> {
  if (scope.allOffices) return {};
  if (scope.officeIds.length === 0) return { officeId: "___no_access___" };
  // Include untagged premises (officeId: null) so data shows until assigned
  return { OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] };
}

/**
 * Prisma `where` fragment for filtering child entities THROUGH their premises relation.
 * Use for models that have a direct `premises` relation (Unit, Job, Ticket, Invoice, etc.)
 *
 * Usage: prisma.unit.findMany({ where: { ...otherFilters, ...childOfficeWhere(scope) } })
 */
export function childOfficeWhere(scope: OfficeScope): Record<string, any> {
  if (scope.allOffices) return {};
  if (scope.officeIds.length === 0) {
    return { premises: { officeId: "___no_access___" } };
  }
  // Include children whose premises have null officeId (untagged)
  return { premises: { OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] } };
}

/**
 * Prisma `where` fragment for filtering Customers to those who have
 * at least one Premises in the user's offices.
 */
export function customerOfficeWhere(scope: OfficeScope): Record<string, any> {
  if (scope.allOffices) return {};
  if (scope.officeIds.length === 0) {
    return { premises: { some: { officeId: "___no_access___" } } };
  }
  // Include customers with untagged premises (officeId: null)
  return { premises: { some: { OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] } } };
}
