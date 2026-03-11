"use client";

import { Pencil } from "lucide-react";
import { FieldType } from "@/lib/detail-registry/types";
import { DynamicSelect } from "@/components/ui/DynamicSelect";
import { AddressAutocomplete, AddressSelection } from "@/components/ui/AddressAutocomplete";

interface DetailFieldProps {
  fieldName: string;
  label: string;
  value: any;
  onChange: (value: any) => void;
  type: FieldType;
  isEditing: boolean;
  readOnly?: boolean;
  required?: boolean;
  colSpan?: 1 | 2;
  labelWidth?: number;
  placeholder?: string;
  maxLength?: number;
  staticOptions?: Array<{ value: string; label: string }>;
  picklistPageId?: string;
  picklistFieldName?: string;
  fallbackOptions?: string[];
  format?: string;
  onAddressSelect?: (addr: AddressSelection) => void;
  // Inline edit support — double-click a field in view mode to edit just that field
  editingField?: string | null;
  onFieldDoubleClick?: (fieldName: string) => void;
  onFieldBlur?: (fieldName: string) => void;
  onFieldKeyDown?: (fieldName: string, e: React.KeyboardEvent) => void;
}

export function DetailField({
  fieldName,
  label,
  value,
  onChange,
  type,
  isEditing,
  readOnly = false,
  required = false,
  colSpan = 1,
  labelWidth = 80,
  placeholder,
  maxLength,
  staticOptions,
  picklistPageId,
  picklistFieldName,
  fallbackOptions,
  format,
  onAddressSelect,
  editingField,
  onFieldDoubleClick,
  onFieldBlur,
  onFieldKeyDown,
}: DetailFieldProps) {
  const isInlineEditing = editingField === fieldName;
  const isReadOnly = isInlineEditing ? false : (readOnly || type === "readonly" || !isEditing);
  const hasInlineEdit = !!onFieldDoubleClick;

  const inputClass = isReadOnly
    ? hasInlineEdit
      ? "flex-1 border border-[#7f9db9] bg-white px-2 py-1 text-[12px] text-[#000] cursor-pointer"
      : "flex-1 border border-[#d0d0d0] bg-[#f5f5f5] px-2 py-1 text-[12px] text-[#666]"
    : "flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white";

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (format === "currency") {
      const num = typeof val === "number" ? val : parseFloat(val);
      if (isNaN(num)) return "";
      return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
    }
    if (format === "date" && val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US");
      }
    }
    return String(val);
  };

  // Inline edit event handlers
  const handleBlur = isInlineEditing ? () => onFieldBlur?.(fieldName) : undefined;
  const handleKeyDown = isInlineEditing
    ? (e: React.KeyboardEvent) => onFieldKeyDown?.(fieldName, e)
    : undefined;

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            readOnly={isReadOnly}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={4}
            autoFocus={isInlineEditing}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${inputClass} resize-y`}
          />
        );

      case "checkbox":
        return (
          <div className="flex-1 flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={isReadOnly && !hasInlineEdit}
              className="cursor-pointer"
            />
          </div>
        );

      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={isReadOnly}
            autoFocus={isInlineEditing}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={inputClass}
          >
            <option value=""></option>
            {(staticOptions || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "dynamic-select":
        return (
          <DynamicSelect
            pageId={picklistPageId || ""}
            fieldName={picklistFieldName || fieldName}
            value={value || ""}
            onChange={onChange}
            disabled={isReadOnly}
            fallbackOptions={fallbackOptions}
            className={inputClass}
          />
        );

      case "readonly":
        return (
          <div className="flex-1 border border-[#d0d0d0] bg-[#f5f5f5] px-2 py-1 text-[12px] text-[#666]">
            {formatValue(value)}
          </div>
        );

      case "number":
      case "currency":
        if (isReadOnly) {
          return (
            <div className={hasInlineEdit
              ? "flex-1 border border-[#7f9db9] bg-white px-2 py-1 text-[12px] text-[#000] cursor-pointer"
              : "flex-1 border border-[#d0d0d0] bg-[#f5f5f5] px-2 py-1 text-[12px] text-[#666]"
            }>
              {format === "currency" || type === "currency" ? formatValue(value) : (value ?? "")}
            </div>
          );
        }
        return (
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            readOnly={isReadOnly}
            placeholder={placeholder}
            autoFocus={isInlineEditing}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={inputClass}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value ? (typeof value === "string" ? value.slice(0, 10) : "") : ""}
            onChange={(e) => onChange(e.target.value)}
            readOnly={isReadOnly}
            autoFocus={isInlineEditing}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={inputClass}
          />
        );

      // text, phone, email, url — all render as text inputs
      default:
        if (onAddressSelect && !isReadOnly) {
          return (
            <AddressAutocomplete
              value={value || ""}
              onChange={onChange}
              onAddressSelect={onAddressSelect}
              className={inputClass}
              placeholder={placeholder}
              disabled={isReadOnly}
            />
          );
        }
        return (
          <input
            type={type === "email" ? "email" : type === "url" ? "url" : "text"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            readOnly={isReadOnly}
            placeholder={placeholder}
            maxLength={maxLength}
            autoFocus={isInlineEditing}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={inputClass}
          />
        );
    }
  };

  const baseAlign = type === "textarea" ? "flex items-start" : "flex items-center";
  const showInlineHint = hasInlineEdit && isReadOnly && type !== "readonly";
  const canDoubleClick = showInlineHint && type !== "checkbox";

  // Salesforce-style gridline layout when inline edit is available
  if (hasInlineEdit) {
    return (
      <div
        className={`${baseAlign} group/field ${canDoubleClick ? "cursor-pointer" : ""}`}
        data-field={fieldName}
        onDoubleClick={canDoubleClick ? () => onFieldDoubleClick?.(fieldName) : undefined}
      >
        <label
          className="text-[12px] text-right pr-3 flex-shrink-0 select-none"
          style={{ width: labelWidth }}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {renderInput()}
        {showInlineHint && (
          <Pencil className="w-3.5 h-3.5 text-[#c8c8c8] opacity-0 group-hover/field:opacity-100 ml-2 flex-shrink-0 pointer-events-none" />
        )}
      </div>
    );
  }

  // Standard layout (no inline edit — used by other detail pages)
  return (
    <div
      className={`${baseAlign}`}
      data-field={fieldName}
    >
      <label
        className="text-[12px] text-right pr-2 flex-shrink-0 select-none"
        style={{ width: labelWidth }}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {renderInput()}
    </div>
  );
}
