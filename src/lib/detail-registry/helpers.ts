import { DETAIL_REGISTRY } from "./index";
import { FieldDefinition, FieldType } from "./types";

/**
 * Maps a module pageId (e.g. "customers") to its detail registry key (e.g. "customers-detail").
 * Returns null for modules without detail pages (collections, routes, bid-results, etc.).
 */
export function getDetailRegistryByParentPageId(parentPageId: string) {
  for (const [key, def] of Object.entries(DETAIL_REGISTRY)) {
    if (def.parentPageId === parentPageId) {
      return { key, definition: def };
    }
  }
  return null;
}

/**
 * Generates placeholder form data for preview rendering in Object Manager.
 * Each field type gets a sensible placeholder value.
 */
export function generatePlaceholderData(fields: FieldDefinition[]): Record<string, any> {
  const data: Record<string, any> = {};

  for (const field of fields) {
    data[field.fieldName] = getPlaceholderForType(field);
  }

  return data;
}

function getPlaceholderForType(field: FieldDefinition): any {
  // If field has a valueGetter, skip — it won't work without real data
  if (field.valueGetter) {
    return getDefaultForType(field.type, field.fieldName);
  }

  // If it has static options, use the first one
  if (field.staticOptions && field.staticOptions.length > 0) {
    return field.staticOptions[0].value;
  }

  // If it has fallback options, use the first one
  if (field.fallbackOptions && field.fallbackOptions.length > 0) {
    return field.fallbackOptions[0];
  }

  return getDefaultForType(field.type, field.fieldName);
}

function getDefaultForType(type: FieldType, fieldName: string): any {
  switch (type) {
    case "text":
      return getSampleText(fieldName);
    case "phone":
      return "(555) 123-4567";
    case "email":
      return "sample@example.com";
    case "url":
      return "https://example.com";
    case "number":
      return 42;
    case "currency":
      return 1250.00;
    case "date":
      return "01/15/2025";
    case "textarea":
      return "Sample notes text for preview.";
    case "checkbox":
      return true;
    case "readonly":
      return getSampleText(fieldName);
    case "select":
    case "dynamic-select":
      return "Sample";
    default:
      return "Sample";
  }
}

function getSampleText(fieldName: string): string {
  const lower = fieldName.toLowerCase();
  if (lower.includes("name")) return "Sample Name";
  if (lower.includes("address")) return "123 Main Street";
  if (lower.includes("city")) return "New York";
  if (lower.includes("state")) return "NY";
  if (lower.includes("zip")) return "10001";
  if (lower.includes("country")) return "United States";
  if (lower.includes("contact")) return "John Smith";
  if (lower.includes("fax")) return "(555) 987-6543";
  if (lower === "type") return "General";
  if (lower === "status") return "Active";
  if (lower.includes("remark")) return "Sample remarks for preview.";
  if (lower.includes("description") || lower === "desc") return "Sample description text";
  if (lower.includes("number") || lower.includes("id")) return "10001";
  return "Sample Value";
}
