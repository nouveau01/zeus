"use client";

import React, { useMemo } from "react";
import { useDetailLayout } from "@/hooks/useDetailLayout";

/**
 * Hook for pages with manual form labels (not using DetailLayout component).
 * Loads the saved layout from DB and provides:
 *   - isFieldRequired(fieldName) — boolean check
 *   - reqMark(fieldName) — renders red asterisk if required
 *   - layout + fieldDefs — for use with validateRequiredFields()
 */
export function useRequiredFields(pageId: string) {
  const { layout, fieldDefs } = useDetailLayout(pageId);

  const isFieldRequired = useMemo(() => {
    if (!layout) return (_fieldName: string) => false;
    const defMap = new Map(fieldDefs.map((f) => [f.fieldName, f]));
    const reqSet = new Set<string>();
    for (const tab of layout.tabs) {
      if (!tab.visible) continue;
      for (const section of tab.sections) {
        if (!section.visible) continue;
        for (const placement of section.fields) {
          if (!placement.visible) continue;
          const isReq = placement.required ?? defMap.get(placement.fieldName)?.required ?? false;
          if (isReq) reqSet.add(placement.fieldName);
        }
      }
    }
    return (fieldName: string) => reqSet.has(fieldName);
  }, [layout, fieldDefs]);

  const reqMark = (fieldName: string) =>
    isFieldRequired(fieldName) ? <span className="text-[#c45c5c] ml-0.5">*</span> : null;

  return { layout, fieldDefs, isFieldRequired, reqMark };
}
