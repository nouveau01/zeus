"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Edit3, Eye, EyeOff, Save, X, GripVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface FieldConfig {
  fieldName: string;
  displayLabel: string;
  sortOrder: number;
  visible: boolean;
  width?: number;
  section?: string;
}

interface AdminToolsProps {
  pageId: string;
  fields: FieldConfig[];
  onFieldsChange?: (fields: FieldConfig[]) => void;
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export function AdminTools({
  pageId,
  fields,
  onFieldsChange,
  isEditMode = false,
  onEditModeChange,
}: AdminToolsProps) {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingFields, setEditingFields] = useState<FieldConfig[]>(fields);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync editing fields when props change
  useEffect(() => {
    setEditingFields(fields);
  }, [fields]);

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  const handleEnterEditMode = () => {
    setEditingFields([...fields]);
    onEditModeChange?.(true);
    setIsOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/page-config/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: editingFields }),
      });

      if (response.ok) {
        onFieldsChange?.(editingFields);
        onEditModeChange?.(false);
      } else {
        alert("Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingFields(fields);
    onEditModeChange?.(false);
  };

  const handleLabelChange = (fieldName: string, newLabel: string) => {
    setEditingFields((prev) =>
      prev.map((f) =>
        f.fieldName === fieldName ? { ...f, displayLabel: newLabel } : f
      )
    );
  };

  const handleVisibilityToggle = (fieldName: string) => {
    setEditingFields((prev) =>
      prev.map((f) =>
        f.fieldName === fieldName ? { ...f, visible: !f.visible } : f
      )
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...editingFields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    // Update sort orders
    newFields.forEach((f, i) => (f.sortOrder = i));
    setEditingFields(newFields);
  };

  const handleMoveDown = (index: number) => {
    if (index === editingFields.length - 1) return;
    const newFields = [...editingFields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    // Update sort orders
    newFields.forEach((f, i) => (f.sortOrder = i));
    setEditingFields(newFields);
  };

  // Edit mode toolbar
  if (isEditMode) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[11px] text-white">
          <Edit3 className="w-3 h-3" />
          Edit Mode
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 border border-blue-700 rounded text-[11px] text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-3 h-3" />
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 px-2 py-1 bg-slate-500 border border-slate-600 rounded text-[11px] text-white hover:bg-slate-600"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Admin Tools Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 bg-[#f0f0f0] border border-[#808080] rounded text-[11px] text-gray-700 hover:bg-[#e0e0e0]"
        title="Admin Tools"
      >
        <Settings className="w-3 h-3" />
        Admin Tools
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#808080] shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={handleEnterEditMode}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-[#0078d4] hover:text-white text-left"
            >
              <Edit3 className="w-3 h-3" />
              Edit Page Layout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Field Editor Panel (used when in edit mode)
interface FieldEditorProps {
  fields: FieldConfig[];
  onLabelChange: (fieldName: string, newLabel: string) => void;
  onVisibilityToggle: (fieldName: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function FieldEditor({
  fields,
  onLabelChange,
  onVisibilityToggle,
  onMoveUp,
  onMoveDown,
}: FieldEditorProps) {
  return (
    <div className="bg-white border border-[#808080] p-2 text-[11px]">
      <div className="font-semibold mb-2 text-[12px]">Field Configuration</div>
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {fields.map((field, index) => (
          <div
            key={field.fieldName}
            className={`flex items-center gap-2 p-1.5 border rounded ${
              field.visible ? "bg-white" : "bg-gray-100"
            }`}
          >
            {/* Drag Handle */}
            <div className="flex flex-col">
              <button
                onClick={() => onMoveUp(index)}
                disabled={index === 0}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                onClick={() => onMoveDown(index)}
                disabled={index === fields.length - 1}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                ▼
              </button>
            </div>

            {/* Field Name (readonly) */}
            <div className="w-24 text-gray-500 truncate" title={field.fieldName}>
              {field.fieldName}
            </div>

            {/* Label Input */}
            <input
              type="text"
              value={field.displayLabel}
              onChange={(e) => onLabelChange(field.fieldName, e.target.value)}
              className="flex-1 px-1 py-0.5 border border-[#808080] bg-[#ffffd8] text-[11px]"
              title="Display Label"
            />

            {/* Visibility Toggle */}
            <button
              onClick={() => onVisibilityToggle(field.fieldName)}
              className={`p-1 rounded ${
                field.visible
                  ? "text-green-600 hover:bg-green-50"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
              title={field.visible ? "Visible" : "Hidden"}
            >
              {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
