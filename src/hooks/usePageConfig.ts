"use client";

import { useState, useEffect, useCallback } from "react";
import { usePermissions } from "@/context/PermissionsContext";

export interface FieldConfig {
  fieldName: string;
  displayLabel: string;
  sortOrder: number;
  visible: boolean;
  width?: number;
  section?: string;
  format?: string;
}

interface DefaultField {
  fieldName: string;
  defaultLabel: string;
  defaultWidth?: number;
  section?: string;
  format?: string;
}

interface UsePageConfigResult {
  fields: FieldConfig[];
  getLabel: (fieldName: string) => string;
  isVisible: (fieldName: string) => boolean;
  getWidth: (fieldName: string) => number | undefined;
  getVisibleFields: () => FieldConfig[];
  canAccess: boolean;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
  updateFields: (newFields: FieldConfig[]) => void;
  updateFieldLabel: (fieldName: string, newLabel: string) => void;
}

export function usePageConfig(
  pageId: string,
  defaultFields: DefaultField[]
): UsePageConfigResult {
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { canAccessPage, isFieldAllowed, isLoading: permissionsLoading } = usePermissions();

  // Initialize with defaults
  const initializeFields = useCallback(() => {
    return defaultFields.map((df, index) => ({
      fieldName: df.fieldName,
      displayLabel: df.defaultLabel,
      sortOrder: index,
      visible: true,
      width: df.defaultWidth,
      section: df.section,
      format: df.format,
    }));
  }, [defaultFields]);

  // Fetch saved config from API
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/page-config/${pageId}`);

      if (response.ok) {
        const savedFields = await response.json();

        if (savedFields.length > 0) {
          // Merge saved config with defaults (in case new fields were added)
          const mergedFields = defaultFields.map((df, index) => {
            const saved = savedFields.find(
              (sf: FieldConfig) => sf.fieldName === df.fieldName
            );
            if (saved) {
              return {
                fieldName: df.fieldName,
                displayLabel: saved.displayLabel || df.defaultLabel,
                sortOrder: saved.sortOrder ?? index,
                visible: saved.visible ?? true,
                width: saved.width ?? df.defaultWidth,
                section: saved.section ?? df.section,
                format: saved.format ?? df.format,
              };
            }
            return {
              fieldName: df.fieldName,
              displayLabel: df.defaultLabel,
              sortOrder: index + 1000, // Put new fields at end
              visible: true,
              width: df.defaultWidth,
              section: df.section,
              format: df.format,
            };
          });

          // Sort by sortOrder
          mergedFields.sort((a, b) => a.sortOrder - b.sortOrder);
          setFields(mergedFields);
        } else {
          // No saved config, use defaults
          setFields(initializeFields());
        }
      } else {
        // API error, use defaults
        setFields(initializeFields());
      }
    } catch (error) {
      console.error("Error fetching page config:", error);
      setFields(initializeFields());
    } finally {
      setIsLoading(false);
    }
  }, [pageId, defaultFields, initializeFields]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Get label for a field
  const getLabel = useCallback(
    (fieldName: string): string => {
      const field = fields.find((f) => f.fieldName === fieldName);
      if (field) {
        return field.displayLabel;
      }
      // Fall back to default
      const defaultField = defaultFields.find((df) => df.fieldName === fieldName);
      return defaultField?.defaultLabel || fieldName;
    },
    [fields, defaultFields]
  );

  // Check if a field is visible (respects both page config AND role permissions)
  const isVisible = useCallback(
    (fieldName: string): boolean => {
      const field = fields.find((f) => f.fieldName === fieldName);
      const visibleByConfig = field?.visible ?? true;
      // Also check role permissions — if role says hidden, it's hidden
      const allowedByRole = isFieldAllowed(pageId, fieldName);
      return visibleByConfig && allowedByRole;
    },
    [fields, isFieldAllowed, pageId]
  );

  // Get width for a field
  const getWidth = useCallback(
    (fieldName: string): number | undefined => {
      const field = fields.find((f) => f.fieldName === fieldName);
      return field?.width;
    },
    [fields]
  );

  // Get all visible fields sorted by order (respects role permissions)
  const getVisibleFields = useCallback((): FieldConfig[] => {
    return fields
      .filter((f) => f.visible && isFieldAllowed(pageId, f.fieldName))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [fields, isFieldAllowed, pageId]);

  // Update fields locally (used during edit mode)
  const updateFields = useCallback((newFields: FieldConfig[]) => {
    setFields(newFields);
  }, []);

  // Update a single field's label
  const updateFieldLabel = useCallback((fieldName: string, newLabel: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.fieldName === fieldName ? { ...f, displayLabel: newLabel } : f
      )
    );
  }, []);

  return {
    fields,
    getLabel,
    isVisible,
    getWidth,
    getVisibleFields,
    canAccess: canAccessPage(pageId),
    isLoading: isLoading || permissionsLoading,
    refreshConfig: fetchConfig,
    updateFields,
    updateFieldLabel,
  };
}

// Helper to create default field definitions
export function createDefaultFields(
  fieldsMap: Record<string, { label: string; width?: number; section?: string; format?: string }>
): DefaultField[] {
  return Object.entries(fieldsMap).map(([fieldName, config]) => ({
    fieldName,
    defaultLabel: config.label,
    defaultWidth: config.width,
    section: config.section,
    format: config.format,
  }));
}
