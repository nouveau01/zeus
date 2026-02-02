"use client";

import { FieldDefinition } from "./types";

interface FieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  disabled?: boolean;
}

const inputClass = "px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px]";
const selectClass = "px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px]";
const labelClass = "text-[11px] text-[#333]";

export default function FieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
}: FieldRendererProps) {
  const handleChange = (newValue: any) => {
    onChange(field.field, newValue);
  };

  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled || field.readOnly}
            placeholder={field.placeholder}
            className={`${inputClass} ${field.width || "flex-1"} ${
              field.readOnly ? "bg-[#f0f0f0]" : ""
            }`}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            disabled={disabled || field.readOnly}
            className={`${inputClass} ${field.width || "w-[60px]"} text-right ${
              field.readOnly ? "bg-[#f0f0f0]" : ""
            }`}
          />
        );

      case "currency":
        return (
          <input
            type="text"
            value={`$${Number(value || 0).toFixed(2)}`}
            disabled={true}
            className={`${inputClass} ${field.width || "w-[70px]"} text-right bg-[#f0f0f0]`}
          />
        );

      case "date":
        const dateValue = value ? new Date(value).toISOString().split("T")[0] : "";
        return (
          <input
            type="date"
            value={dateValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled || field.readOnly}
            className={`${inputClass} ${field.width || "flex-1"}`}
          />
        );

      case "time":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled || field.readOnly}
            placeholder={field.placeholder || "00:00 AM"}
            className={`${inputClass} ${field.width || "w-[80px]"}`}
          />
        );

      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled || field.readOnly}
            className={`${selectClass} ${field.width || "flex-1"}`}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={disabled || field.readOnly}
            className="w-3 h-3"
          />
        );

      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled || field.readOnly}
            placeholder={field.placeholder}
            className={`w-full h-full min-h-[40px] border border-[#a0a0a0] bg-white text-[11px] p-1 resize-none ${
              field.readOnly ? "bg-[#f0f0f0]" : ""
            }`}
          />
        );

      case "readonly":
        return (
          <input
            type="text"
            value={value || ""}
            disabled={true}
            className={`${inputClass} ${field.width || "flex-1"} bg-[#c0e0ff]`}
          />
        );

      case "link":
        return (
          <span
            className={`${labelClass} text-blue-600 cursor-pointer hover:underline`}
            onClick={() => {
              // Handle link click - could open in new tab or trigger action
            }}
          >
            {value || field.label}
          </span>
        );

      default:
        return <span className={labelClass}>{value}</span>;
    }
  };

  return (
    <div className="flex items-center gap-1">
      {field.label && field.type !== "checkbox" && (
        <label className={`${labelClass} ${field.type === "link" ? "" : "min-w-[50px]"}`}>
          {field.label}
        </label>
      )}
      {renderField()}
      {field.type === "checkbox" && field.label && (
        <label className={labelClass}>{field.label}</label>
      )}
    </div>
  );
}
