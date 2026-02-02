/**
 * Lookups Data Access Layer
 *
 * Fetches lookup values from SQL Server (Total Service) base tables
 * Avoids views to ensure compatibility across different state databases
 */

import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";

/**
 * Cache for lookup values (refreshed on server restart)
 */
let levelCache: Map<number, string> | null = null;
let wageCache: Map<number, string> | null = null;
let categoryCache: Map<string, string> | null = null;

/**
 * Fetch Level lookup values from Labels table
 * Returns a map of ID -> Label (e.g., 10 -> "10-Maintenance")
 */
export async function fetchLevelLookup(): Promise<Map<number, string>> {
  if (levelCache) return levelCache;

  if (!isSqlServerAvailable()) {
    return new Map();
  }

  try {
    // Labels table stores lookup values, Screen='Level' for ticket levels
    const results: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT Name, Label FROM Labels WHERE Screen = 'Level' ORDER BY CAST(Name AS INT)`
    );

    const map = new Map<number, string>();
    for (const row of results) {
      const id = parseInt(row.Name);
      if (!isNaN(id)) {
        // Format as "ID-Label" like Total Service shows (e.g., "10-Maintenance")
        map.set(id, `${id}-${row.Label}`);
      }
    }

    levelCache = map;
    return map;
  } catch (error) {
    console.error("Error fetching Level lookup:", error);
    return new Map();
  }
}

/**
 * Fetch Wage lookup values from PRWage table
 * Returns a map of ID -> Label (e.g., 461 -> "461-APPRENTICE (90)")
 */
export async function fetchWageLookup(): Promise<Map<number, string>> {
  if (wageCache) return wageCache;

  if (!isSqlServerAvailable()) {
    return new Map();
  }

  try {
    const results: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT ID, fDesc FROM PRWage ORDER BY ID`
    );

    const map = new Map<number, string>();
    for (const row of results) {
      map.set(row.ID, row.fDesc || `Wage ${row.ID}`);
    }

    wageCache = map;
    return map;
  } catch (error) {
    console.error("Error fetching Wage lookup:", error);
    return new Map();
  }
}

/**
 * Fetch Category lookup values from Labels table (Screen='Category')
 */
export async function fetchCategoryLookup(): Promise<Map<string, string>> {
  if (categoryCache) return categoryCache;

  if (!isSqlServerAvailable()) {
    return new Map();
  }

  try {
    // Labels table with Screen='Category' stores category values
    const results: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT Name, Label FROM Labels WHERE Screen = 'Category' ORDER BY Name`
    );

    const map = new Map<string, string>();
    for (const row of results) {
      // Name is the code (like "S", "SH"), Label is the description
      map.set(row.Name, row.Label || row.Name);
    }

    categoryCache = map;
    return map;
  } catch (error) {
    console.error("Error fetching Category lookup:", error);
    return new Map();
  }
}

/**
 * Get a single Level label by ID
 */
export async function getLevelLabel(levelId: number | null | undefined): Promise<string | null> {
  if (levelId === null || levelId === undefined) return null;
  const lookup = await fetchLevelLookup();
  return lookup.get(levelId) || `Level ${levelId}`;
}

/**
 * Get a single Wage label by ID
 */
export async function getWageLabel(wageId: number | null | undefined): Promise<string | null> {
  if (wageId === null || wageId === undefined) return null;
  const lookup = await fetchWageLookup();
  return lookup.get(wageId) || null;
}

/**
 * Get all Level options for dropdowns
 */
export async function getAllLevelOptions(): Promise<{ value: number; label: string }[]> {
  const lookup = await fetchLevelLookup();
  return Array.from(lookup.entries()).map(([value, label]) => ({ value, label }));
}

/**
 * Get all Wage options for dropdowns
 */
export async function getAllWageOptions(): Promise<{ value: number; label: string }[]> {
  const lookup = await fetchWageLookup();
  return Array.from(lookup.entries()).map(([value, label]) => ({ value, label }));
}

/**
 * Get all Category options for dropdowns
 */
export async function getAllCategoryOptions(): Promise<{ value: string; label: string }[]> {
  const lookup = await fetchCategoryLookup();
  return Array.from(lookup.entries()).map(([value, label]) => ({ value, label }));
}

/**
 * Format a time-only value from DateTime or string
 * Handles SQL Server DateTime fields that should display as time only
 */
export function formatTimeOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;

  // If it's a string that looks like a time (e.g., "07:00 AM")
  if (typeof value === 'string') {
    // Check if it's already a formatted time
    if (/^\d{1,2}:\d{2}\s*(AM|PM)?$/i.test(value.trim())) {
      return value.trim();
    }
    // Try to parse as date
    value = new Date(value);
  }

  if (value instanceof Date) {
    // Use UTC to avoid timezone conversion issues
    const hours = value.getUTCHours();
    const minutes = value.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  return null;
}

/**
 * Clear all lookup caches (useful if data changes)
 */
export function clearLookupCaches(): void {
  levelCache = null;
  wageCache = null;
  categoryCache = null;
}
