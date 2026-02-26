"use client";

import { usePicklistValues } from "@/hooks/usePicklistValues";

interface FallbackOption {
  value: string;
  label?: string;
}

interface DynamicSelectProps {
  pageId: string;
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  includeAll?: boolean;
  includeEmpty?: boolean;
  className?: string;
  disabled?: boolean;
  /**
   * Optional fallback options displayed when the DB has no picklist values
   * for this pageId/fieldName. Once an admin adds values through the
   * Picklist Editor, DB values take over and these are ignored.
   */
  fallbackOptions?: (string | FallbackOption)[];
}

export function DynamicSelect({
  pageId,
  fieldName,
  value,
  onChange,
  includeAll = false,
  includeEmpty = true,
  className,
  disabled = false,
  fallbackOptions,
}: DynamicSelectProps) {
  const { options, isLoading, getLabel } = usePicklistValues(pageId, fieldName);

  const defaultClasses = "px-1 py-0.5 border border-[#808080] text-[11px] bg-white";
  const mergedClasses = className
    ? `${defaultClasses} ${className}`
    : defaultClasses;

  // Use DB options if they exist, otherwise fall back
  const useDbOptions = options.length > 0;
  const displayOptions = useDbOptions
    ? options.map((opt) => ({ value: opt.value, label: opt.label, key: opt.id }))
    : (fallbackOptions || []).map((opt, i) => {
        if (typeof opt === "string") {
          return { value: opt, label: opt, key: `fb_${i}` };
        }
        return { value: opt.value, label: opt.label || opt.value, key: `fb_${i}` };
      });

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={mergedClasses}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <option value={value}>{value ? getLabel(value) : ""}</option>
      ) : (
        <>
          {includeEmpty && <option value=""></option>}
          {includeAll && <option value="All">All</option>}
          {displayOptions.map((opt) => (
            <option key={opt.key} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </>
      )}
    </select>
  );
}
