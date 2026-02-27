// ============================================
// Detail Layout System — Type Definitions
// ============================================
// These types define the Salesforce-like page layout system for ZEUS.
// The REGISTRY (code) defines what fields exist and how they render.
// The LAYOUT (database JSON) defines where fields appear and in what order.

// ============================================
// LAYOUT CONFIG (stored in DB as JSON)
// ============================================

export interface DetailLayoutConfig {
  version: 1;
  tabs: DetailTabConfig[];
  grids?: Record<string, GridColumnPlacement[]>;
}

export interface DetailTabConfig {
  id: string;
  label: string;
  visible: boolean;
  sections: DetailSectionConfig[];
}

export interface DetailSectionConfig {
  id: string;
  label: string;             // Empty string = no header
  columns: 1 | 2;
  visible: boolean;
  fields: DetailFieldPlacement[];
}

export interface DetailFieldPlacement {
  fieldName: string;          // Maps to FieldDefinition.fieldName
  label: string;              // Display label (overrides registry default)
  column: 0 | 1;             // 0=left, 1=right (ignored for 1-column sections)
  visible: boolean;
  colSpan?: 1 | 2;           // Span both columns
  readOnly?: boolean;         // Force read-only
  required?: boolean;
  placeholder?: string;
  labelWidth?: number;        // px
}

// ============================================
// FIELD REGISTRY (defined in code)
// ============================================

export type FieldType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "dynamic-select"
  | "textarea"
  | "checkbox"
  | "readonly"
  | "phone"
  | "email"
  | "url";

export interface FieldDefinition {
  fieldName: string;
  defaultLabel: string;
  type: FieldType;
  required?: boolean;
  maxLength?: number;
  defaultLabelWidth?: number;
  defaultColSpan?: 1 | 2;

  // For type: "select"
  staticOptions?: Array<{ value: string; label: string }>;

  // For type: "dynamic-select"
  picklistPageId?: string;
  picklistFieldName?: string;
  fallbackOptions?: string[];

  // Value transforms
  valueGetter?: (data: any) => any;
  format?: string;
}

// ============================================
// GRID COLUMN TYPES (for embedded data grids)
// ============================================

export interface GridColumnDefinition {
  fieldName: string;
  defaultLabel: string;
  defaultWidth: string; // percentage like "10%" or "15%"
  defaultVisible: boolean;
  format?: string; // "currency", "date", "boolean", etc.
  align?: "left" | "center" | "right";
}

export interface GridColumnPlacement {
  fieldName: string;
  label: string;
  visible: boolean;
  width?: string;
}

export interface DetailPageDefinition {
  pageId: string;                       // "customers-detail"
  parentPageId: string;                 // "customers" (for permissions)
  entityName: string;                   // "Customer"
  fields: FieldDefinition[];
  defaultLayout: DetailLayoutConfig;
  grids?: Record<string, GridColumnDefinition[]>;
}
