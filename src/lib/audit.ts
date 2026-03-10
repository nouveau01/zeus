// ============================================
// Field History Audit Utility
// ============================================
// Tracks field-level changes across all entity types.
// Uses fire-and-forget writes — never blocks API responses.

import prisma from "@/lib/db";
import { DETAIL_REGISTRY } from "@/lib/detail-registry";

// Fields to always skip when comparing records
const SKIP_FIELDS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "created_at",
  "updated_at",
]);

// Build a lookup: entityName → { fieldName → defaultLabel }
const labelCache: Record<string, Record<string, string>> = {};

function getFieldLabels(entityType: string): Record<string, string> {
  if (labelCache[entityType]) return labelCache[entityType];

  const labels: Record<string, string> = {};
  for (const def of Object.values(DETAIL_REGISTRY)) {
    if (def.entityName === entityType) {
      for (const field of def.fields) {
        labels[field.fieldName] = field.defaultLabel;
      }
      break;
    }
  }
  labelCache[entityType] = labels;
  return labels;
}

// camelCase → Title Case fallback
function camelToTitle(s: string): string {
  return s
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function resolveLabel(entityType: string, fieldName: string): string {
  const labels = getFieldLabels(entityType);
  return labels[fieldName] || camelToTitle(fieldName);
}

// Normalize a value to a comparable string (or null)
function normalize(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;

  // Prisma Decimal
  if (typeof val === "object" && val !== null && "toFixed" in val) {
    return String(val);
  }

  // Date
  if (val instanceof Date) {
    return val.toISOString();
  }

  // Boolean → Yes/No
  if (typeof val === "boolean") {
    return val ? "Yes" : "No";
  }

  // Skip nested objects/arrays (relations)
  if (typeof val === "object") return null;

  return String(val);
}

interface AuditUser {
  id?: string | null;
  name?: string | null;
}

/**
 * Compare old vs new record and log field changes to FieldHistory.
 * Fire-and-forget — does not block the caller.
 */
export function trackChanges(
  entityType: string,
  entityId: string,
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>,
  user?: AuditUser | null
): void {
  // Run async but don't await — fire and forget
  _trackChanges(entityType, entityId, oldRecord, newRecord, user).catch(
    (err) => console.error("[audit] trackChanges error:", err)
  );
}

async function _trackChanges(
  entityType: string,
  entityId: string,
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>,
  user?: AuditUser | null
): Promise<void> {
  const batchId = crypto.randomUUID();
  const entries: Array<{
    entityType: string;
    entityId: string;
    batchId: string;
    field: string;
    fieldLabel: string;
    oldValue: string | null;
    newValue: string | null;
    userId: string | null;
    userName: string | null;
  }> = [];

  // Compare all keys from both old and new
  const allKeys = new Set([
    ...Object.keys(oldRecord),
    ...Object.keys(newRecord),
  ]);

  for (const key of allKeys) {
    if (SKIP_FIELDS.has(key)) continue;

    const oldVal = normalize(oldRecord[key]);
    const newVal = normalize(newRecord[key]);

    // Skip if both null or identical
    if (oldVal === newVal) continue;

    entries.push({
      entityType,
      entityId,
      batchId,
      field: key,
      fieldLabel: resolveLabel(entityType, key),
      oldValue: oldVal,
      newValue: newVal,
      userId: user?.id && user.id !== "system" ? user.id : null,
      userName: user?.name || "System",
    });
  }

  if (entries.length > 0) {
    await prisma.fieldHistory.createMany({ data: entries });
  }
}

/**
 * Log a "Record Created" entry. Fire-and-forget.
 */
export function trackCreation(
  entityType: string,
  entityId: string,
  user?: AuditUser | null,
  displayIdentifier?: string
): void {
  const label = displayIdentifier
    ? `Record created — ${entityType} ${displayIdentifier}`
    : `Record created`;

  prisma.fieldHistory
    .create({
      data: {
        entityType,
        entityId,
        batchId: crypto.randomUUID(),
        field: "_created",
        fieldLabel: label,
        oldValue: null,
        newValue: null,
        userId: user?.id && user.id !== "system" ? user.id : null,
        userName: user?.name || "System",
      },
    })
    .catch((err) => console.error("[audit] trackCreation error:", err));
}
