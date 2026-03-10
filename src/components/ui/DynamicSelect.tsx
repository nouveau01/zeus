"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePicklistValues } from "@/hooks/usePicklistValues";
import { usePermissions } from "@/context/PermissionsContext";
import { PicklistInlineEditor } from "./PicklistInlineEditor";

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
  const { options, isLoading, getLabel, refresh } = usePicklistValues(pageId, fieldName);
  const { data: session } = useSession();
  const { isUnrestricted } = usePermissions();
  const [editorOpen, setEditorOpen] = useState(false);

  // Admin check: unrestricted (auth off or GodAdmin) or Admin role
  const userRole = (session?.user as any)?.role;
  const isAdmin = isUnrestricted || userRole === "Admin" || userRole === "GodAdmin";

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
    <>
      <div className="relative inline-flex items-center group">
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

        {/* Admin gear icon — visible on hover */}
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditorOpen(true);
            }}
            className="ml-0.5 w-[14px] h-[14px] flex items-center justify-center opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity text-[#666] cursor-pointer flex-shrink-0"
            title="Edit picklist values"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.421 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.421-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
            </svg>
          </button>
        )}
      </div>

      {/* Inline editor modal */}
      {isAdmin && (
        <PicklistInlineEditor
          pageId={pageId}
          fieldName={fieldName}
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSaved={() => refresh()}
        />
      )}
    </>
  );
}
