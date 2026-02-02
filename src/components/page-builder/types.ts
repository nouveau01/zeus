/**
 * Page Builder Types
 *
 * Salesforce-style declarative page layout system
 */

// Field types that can be rendered
export type FieldType =
  | "text"
  | "number"
  | "date"
  | "time"
  | "select"
  | "checkbox"
  | "textarea"
  | "readonly"
  | "currency"
  | "link";

// Section types
export type SectionType =
  | "fieldset"      // Bordered group with legend
  | "card"          // Card-style container
  | "inline"        // Inline fields (horizontal)
  | "checkboxGroup" // Group of checkboxes
  | "table";        // Data table

// A single field definition
export interface FieldDefinition {
  id: string;
  type: FieldType;
  label: string;
  field: string;              // Data field to bind to
  width?: string;             // CSS width
  readOnly?: boolean;
  options?: { value: string; label: string }[];  // For selects
  placeholder?: string;
  linkTo?: string;            // For link type - URL pattern
  format?: "currency" | "percent" | "time" | "date";
}

// A section containing fields
export interface SectionDefinition {
  id: string;
  type: SectionType;
  title?: string;
  fields: FieldDefinition[];
  // Grid layout position (for react-grid-layout)
  layout: {
    x: number;      // Grid column (0-11)
    y: number;      // Grid row
    w: number;      // Width in grid units
    h: number;      // Height in grid units
    minW?: number;
    minH?: number;
  };
}

// A complete page layout
export interface PageLayout {
  id: string;
  name: string;
  objectType: string;         // e.g., "ticket", "customer", "invoice"
  sections: SectionDefinition[];
  gridCols?: number;          // Default 12
  rowHeight?: number;         // Default 30px
}

// Layout stored in database
export interface StoredLayout {
  id: string;
  pageId: string;
  userId?: string;            // null = default for all users
  layoutJson: string;         // Serialized PageLayout
  createdAt: Date;
  updatedAt: Date;
}
