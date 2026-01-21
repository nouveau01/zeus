"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

export interface Field {
  label: string;
  value: string | number | boolean | null | undefined;
  fieldKey: string; // The actual database field name
  type?: "text" | "link" | "checkbox" | "date" | "number";
  href?: string;
  editable?: boolean;
}

interface FieldGridProps {
  fields: Field[];
  onFieldUpdate?: (fieldKey: string, value: any) => Promise<void>;
}

interface EditingState {
  fieldKey: string;
  value: string;
}

export function FieldGrid({ fields, onFieldUpdate }: FieldGridProps) {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);

  // Split fields into left and right columns
  const midpoint = Math.ceil(fields.length / 2);
  const leftFields = fields.slice(0, midpoint);
  const rightFields = fields.slice(midpoint);

  const handleEditClick = (field: Field) => {
    if (field.type === "checkbox") {
      // For checkboxes, toggle immediately
      handleSave(field.fieldKey, !field.value);
    } else {
      setEditing({
        fieldKey: field.fieldKey,
        value: field.value?.toString() || "",
      });
    }
  };

  const handleSave = async (fieldKey: string, value: any) => {
    if (!onFieldUpdate) return;

    setSaving(true);
    try {
      await onFieldUpdate(fieldKey, value);
      setEditing(null);
    } catch (error) {
      console.error("Failed to save field:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, fieldKey: string) => {
    if (e.key === "Enter") {
      handleSave(fieldKey, editing?.value);
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const renderField = (field: Field, index: number) => {
    const isEditing = editing?.fieldKey === field.fieldKey;
    const canEdit = field.editable !== false && onFieldUpdate;

    const displayValue = () => {
      if (field.value === null || field.value === undefined || field.value === "") {
        return <span className="text-[#939393]">—</span>;
      }

      if (field.type === "checkbox") {
        return (
          <input
            type="checkbox"
            checked={!!field.value}
            readOnly
            className="w-4 h-4 rounded border-gray-300 text-[#0176d3] cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              if (canEdit) handleEditClick(field);
            }}
          />
        );
      }

      if (field.type === "link" && field.href) {
        return (
          <a href={field.href} className="text-[#0176d3] hover:underline">
            {String(field.value)}
          </a>
        );
      }

      if (field.type === "date" && field.value) {
        return new Date(String(field.value)).toLocaleDateString();
      }

      return String(field.value);
    };

    return (
      <div key={field.fieldKey + index} className="flex items-start justify-between py-2 border-b border-[#f3f3f3] group">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#706e6b] mb-1">{field.label}</p>

          {isEditing ? (
            <div className="flex items-center gap-2">
              {field.type === "date" ? (
                <input
                  type="date"
                  value={editing.value}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, field.fieldKey)}
                  className="sf-input text-sm py-1 px-2 flex-1"
                  autoFocus
                  disabled={saving}
                />
              ) : field.type === "number" ? (
                <input
                  type="number"
                  value={editing.value}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, field.fieldKey)}
                  className="sf-input text-sm py-1 px-2 flex-1"
                  autoFocus
                  disabled={saving}
                />
              ) : (
                <input
                  type="text"
                  value={editing.value}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, field.fieldKey)}
                  className="sf-input text-sm py-1 px-2 flex-1"
                  autoFocus
                  disabled={saving}
                />
              )}
              <button
                onClick={() => handleSave(field.fieldKey, editing.value)}
                disabled={saving}
                className="p-1 text-[#2e844a] hover:bg-green-50 rounded"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="p-1 text-[#ea001e] hover:bg-red-50 rounded"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#3e3e3c]">{displayValue()}</p>
          )}
        </div>

        {canEdit && !isEditing && field.type !== "checkbox" && (
          <button
            onClick={() => handleEditClick(field)}
            className="p-1 hover:bg-gray-100 rounded text-[#706e6b] opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-x-8">
      <div>{leftFields.map((field, i) => renderField(field, i))}</div>
      <div>{rightFields.map((field, i) => renderField(field, i + midpoint))}</div>
    </div>
  );
}
