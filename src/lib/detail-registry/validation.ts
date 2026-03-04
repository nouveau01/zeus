import { DetailLayoutConfig, FieldDefinition } from "./types";

/**
 * Validates that all required fields have values.
 * Returns an array of labels for fields that are empty.
 *
 * A field is required if:
 *   - placement.required is true, OR
 *   - placement.required is undefined AND the field def has required: true
 *
 * A field is considered empty if its value is null, undefined, or an empty string (after trim).
 */
export function validateRequiredFields(
  layout: DetailLayoutConfig,
  fieldDefs: FieldDefinition[],
  formData: Record<string, any>
): string[] {
  const defMap = new Map(fieldDefs.map((f) => [f.fieldName, f]));
  const missing: string[] = [];

  for (const tab of layout.tabs) {
    if (!tab.visible) continue;
    for (const section of tab.sections) {
      if (!section.visible) continue;
      for (const placement of section.fields) {
        if (!placement.visible) continue;

        const isRequired =
          placement.required ?? defMap.get(placement.fieldName)?.required ?? false;
        if (!isRequired) continue;

        const def = defMap.get(placement.fieldName);
        const value = def?.valueGetter
          ? def.valueGetter(formData)
          : formData[placement.fieldName];

        if (value === null || value === undefined || String(value).trim() === "") {
          missing.push(placement.label || def?.defaultLabel || placement.fieldName);
        }
      }
    }
  }

  return missing;
}
