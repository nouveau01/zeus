"use client";

import { useMemo } from "react";
import { usePermissions } from "@/context/PermissionsContext";

interface Column {
  field: string;
  label: string;
  width: number;
}

/**
 * Filters a column array based on profile permissions.
 * Use this for module pages that don't use usePageConfig.
 *
 * Returns only the columns the user's profile is allowed to see,
 * along with matching widths array.
 */
export function useFilteredColumns<T extends Column>(
  pageId: string,
  columns: T[]
): { filteredColumns: T[]; filteredWidths: number[] } {
  const { isFieldAllowed, isLoading } = usePermissions();

  return useMemo(() => {
    // While loading, show all columns to prevent flash
    if (isLoading) {
      return {
        filteredColumns: columns,
        filteredWidths: columns.map((c) => c.width),
      };
    }

    const filtered = columns.filter((col) => isFieldAllowed(pageId, col.field));
    return {
      filteredColumns: filtered,
      filteredWidths: filtered.map((c) => c.width),
    };
  }, [columns, pageId, isFieldAllowed, isLoading]);
}
