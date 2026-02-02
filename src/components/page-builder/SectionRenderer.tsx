"use client";

import { SectionDefinition } from "./types";
import FieldRenderer from "./FieldRenderer";

interface SectionRendererProps {
  section: SectionDefinition;
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
}

const fieldsetClass = "border border-[#808080] p-2 bg-white h-full";
const legendClass = "text-[11px] px-1 bg-white";

export default function SectionRenderer({
  section,
  data,
  onChange,
  disabled = false,
}: SectionRendererProps) {
  const renderContent = () => {
    switch (section.type) {
      case "fieldset":
        return (
          <fieldset className={fieldsetClass}>
            {section.title && (
              <legend className={legendClass}>{section.title}</legend>
            )}
            <div className="flex flex-col gap-1 h-full">
              {section.fields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={data[field.field]}
                  onChange={onChange}
                  disabled={disabled}
                />
              ))}
            </div>
          </fieldset>
        );

      case "card":
        return (
          <div className="border border-[#d0d0d0] rounded bg-white p-2 shadow-sm h-full">
            {section.title && (
              <div className="text-[12px] font-semibold mb-2 border-b border-[#e0e0e0] pb-1">
                {section.title}
              </div>
            )}
            <div className="flex flex-col gap-1">
              {section.fields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={data[field.field]}
                  onChange={onChange}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        );

      case "inline":
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={data[field.field]}
                onChange={onChange}
                disabled={disabled}
              />
            ))}
          </div>
        );

      case "checkboxGroup":
        return (
          <div className="flex flex-col gap-0.5">
            {section.title && (
              <div className="text-[11px] font-medium mb-1">{section.title}</div>
            )}
            {section.fields.map((field) => (
              <label key={field.id} className="flex items-center gap-1 text-[11px]">
                <input
                  type="checkbox"
                  checked={!!data[field.field]}
                  onChange={(e) => onChange(field.field, e.target.checked)}
                  disabled={disabled || field.readOnly}
                  className="w-3 h-3"
                />
                {field.label}
              </label>
            ))}
          </div>
        );

      case "table":
        // For displaying tabular data - could be expanded later
        return (
          <div className="border border-[#a0a0a0] bg-white h-full overflow-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0 bg-[#f0f0f0]">
                <tr>
                  {section.fields.map((field) => (
                    <th
                      key={field.id}
                      className="px-2 py-1 text-left font-normal border border-[#a0a0a0]"
                    >
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Table data would come from a different source */}
                <tr>
                  {section.fields.map((field) => (
                    <td
                      key={field.id}
                      className="px-2 py-1 border border-[#d0d0d0]"
                    >
                      &nbsp;
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div className="flex flex-col gap-1">
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={data[field.field]}
                onChange={onChange}
                disabled={disabled}
              />
            ))}
          </div>
        );
    }
  };

  return <div className="h-full">{renderContent()}</div>;
}
