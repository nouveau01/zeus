"use client";

import { useState, useEffect, useCallback } from "react";

export interface PicklistOption {
  id: string;
  value: string;
  label: string;
  isDefault: boolean;
  color?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

interface UsePicklistValuesResult {
  options: PicklistOption[];
  isLoading: boolean;
  getLabel: (value: string) => string;
  getColor: (value: string) => string | undefined;
  getDefault: () => PicklistOption | undefined;
  refresh: () => Promise<void>;
}

export function usePicklistValues(
  pageId: string,
  fieldName: string
): UsePicklistValuesResult {
  const [options, setOptions] = useState<PicklistOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOptions = useCallback(async () => {
    if (!pageId || !fieldName) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/picklist-values?pageId=${encodeURIComponent(pageId)}&fieldName=${encodeURIComponent(fieldName)}`
      );

      if (response.ok) {
        const data: PicklistOption[] = await response.json();
        setOptions(data);
      } else {
        console.error(
          `Failed to fetch picklist values for ${pageId}/${fieldName}:`,
          response.status
        );
        setOptions([]);
      }
    } catch (error) {
      console.error(
        `Error fetching picklist values for ${pageId}/${fieldName}:`,
        error
      );
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [pageId, fieldName]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Return the label for a given value, or the value itself as a graceful fallback
  const getLabel = useCallback(
    (value: string): string => {
      const option = options.find((o) => o.value === value);
      return option?.label ?? value;
    },
    [options]
  );

  // Return the optional color string for a given value
  const getColor = useCallback(
    (value: string): string | undefined => {
      const option = options.find((o) => o.value === value);
      return option?.color;
    },
    [options]
  );

  // Return the first option where isDefault is true
  const getDefault = useCallback((): PicklistOption | undefined => {
    return options.find((o) => o.isDefault);
  }, [options]);

  return {
    options,
    isLoading,
    getLabel,
    getColor,
    getDefault,
    refresh: fetchOptions,
  };
}
