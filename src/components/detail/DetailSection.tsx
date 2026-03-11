"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeftRight,
  GripVertical,
} from "lucide-react";
import { DetailSectionConfig, DetailFieldPlacement, FieldDefinition } from "@/lib/detail-registry/types";
import { DetailField } from "./DetailField";
import { AddressSelection } from "@/components/ui/AddressAutocomplete";

interface DetailSectionProps {
  section: DetailSectionConfig;
  fieldDefs: Map<string, FieldDefinition>;
  formData: Record<string, any>;
  onFieldChange: (fieldName: string, value: any) => void;
  isEditing: boolean;
  isLayoutEditMode?: boolean;
  // Drag handlers for layout editing
  onFieldDragStart?: (sectionId: string, fieldName: string, e: React.DragEvent) => void;
  onFieldDragOver?: (sectionId: string, fieldName: string, e: React.DragEvent) => void;
  onFieldDrop?: (sectionId: string, fieldName: string, e: React.DragEvent) => void;
  // Drop on column (for appending to end of a column)
  onDropOnColumn?: (sectionId: string, targetColumn: 0 | 1, e: React.DragEvent) => void;
  // Field editing controls
  onToggleFieldVisibility?: (sectionId: string, fieldName: string) => void;
  onToggleFieldRequired?: (sectionId: string, fieldName: string) => void;
  onSwitchFieldColumn?: (sectionId: string, fieldName: string) => void;
  onMoveField?: (sectionId: string, fieldName: string, direction: "up" | "down") => void;
  // Inline edit support
  editingField?: string | null;
  onFieldDoubleClick?: (fieldName: string) => void;
  onFieldBlur?: (fieldName: string) => void;
  onFieldKeyDown?: (fieldName: string, e: React.KeyboardEvent) => void;
}

export function DetailSection({
  section,
  fieldDefs,
  formData,
  onFieldChange,
  isEditing,
  isLayoutEditMode,
  onFieldDragStart,
  onFieldDragOver,
  onFieldDrop,
  onDropOnColumn,
  onToggleFieldVisibility,
  onToggleFieldRequired,
  onSwitchFieldColumn,
  onMoveField,
  editingField,
  onFieldDoubleClick,
  onFieldBlur,
  onFieldKeyDown,
}: DetailSectionProps) {
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);

  if (!section.visible && !isLayoutEditMode) return null;

  const visibleFields = isLayoutEditMode
    ? section.fields
    : section.fields.filter((f) => f.visible);

  if (visibleFields.length === 0 && !isLayoutEditMode) return null;

  // ========================
  // LAYOUT EDIT MODE — WYSIWYG with drag handles
  // Shows the actual field layout but with editing overlays
  // ========================
  if (isLayoutEditMode) {
    const leftFields = section.fields.filter((f) => f.column === 0 && f.colSpan !== 2);
    const rightFields = section.fields.filter((f) => f.column === 1 && f.colSpan !== 2);
    const fullSpanFields = section.fields.filter((f) => f.colSpan === 2);

    const renderEditableField = (
      placement: DetailFieldPlacement,
    ) => {
      const def = fieldDefs.get(placement.fieldName);
      if (!def) return null;

      const value = def.valueGetter
        ? def.valueGetter(formData)
        : formData[placement.fieldName];

      const isDragOver = dragOverField === placement.fieldName;

      return (
        <div
          key={placement.fieldName}
          className={`relative group rounded-sm transition-all ${
            placement.visible
              ? "border border-dashed border-[#c8dae8] hover:border-[#0078d4] bg-white"
              : "border border-dashed border-[#d0d0d0] bg-[#f8f8f8] opacity-50"
          } ${isDragOver ? "border-[#0078d4] bg-[#e8f4fc] shadow-inner" : ""}`}
          style={isDragOver ? { borderTopWidth: 3, borderTopStyle: "solid", borderTopColor: "#0078d4" } : undefined}
          draggable
          onDragStart={(e) => {
            onFieldDragStart?.(section.id, placement.fieldName, e);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverField(placement.fieldName);
          }}
          onDragLeave={() => setDragOverField(null)}
          onDrop={(e) => {
            setDragOverField(null);
            onFieldDrop?.(section.id, placement.fieldName, e);
          }}
        >
          {/* Drag handle — left side, always visible in edit mode */}
          <div className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center cursor-grab text-[#c0c0c0] group-hover:text-[#0078d4] bg-[#f8f9fa] group-hover:bg-[#e8f0f8] border-r border-dashed border-[#e0e0e0] rounded-l-sm">
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Quick actions — top right corner, appear on hover */}
          <div className="absolute right-1 top-0.5 hidden group-hover:flex items-center gap-0.5 z-10">
            {section.columns === 2 && placement.colSpan !== 2 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSwitchFieldColumn?.(section.id, placement.fieldName);
                }}
                className="w-5 h-5 flex items-center justify-center bg-white border border-[#c0c0c0] rounded-sm hover:bg-[#e8f0f8] hover:border-[#0078d4] shadow-sm"
                title="Move to other column"
              >
                <ArrowLeftRight className="w-3 h-3 text-[#666]" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFieldVisibility?.(section.id, placement.fieldName);
              }}
              className="w-5 h-5 flex items-center justify-center bg-white border border-[#c0c0c0] rounded-sm hover:bg-[#e8f0f8] hover:border-[#0078d4] shadow-sm"
              title={placement.visible ? "Hide field" : "Show field"}
            >
              {placement.visible ? (
                <Eye className="w-3 h-3 text-[#0078d4]" />
              ) : (
                <EyeOff className="w-3 h-3 text-[#999]" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFieldRequired?.(section.id, placement.fieldName);
              }}
              className={`w-5 h-5 flex items-center justify-center bg-white border rounded-sm shadow-sm text-[11px] font-bold leading-none ${
                (placement.required ?? def.required)
                  ? "border-[#c45c5c] text-[#c45c5c] hover:bg-[#fde8e8]"
                  : "border-[#c0c0c0] text-[#ccc] hover:bg-[#e8f0f8] hover:border-[#0078d4]"
              }`}
              title={(placement.required ?? def.required) ? "Make optional" : "Make required"}
            >
              *
            </button>
          </div>

          {/* The actual field — rendered readonly in edit mode, offset for drag handle */}
          <div className="pl-6 pr-1 py-0.5">
            <DetailField
              fieldName={placement.fieldName}
              label={placement.label}
              value={value}
              onChange={() => {}} // No-op in layout edit mode
              type={def.type}
              isEditing={false} // Always readonly in layout edit mode
              readOnly={true}
              colSpan={placement.colSpan ?? def.defaultColSpan}
              labelWidth={placement.labelWidth ?? def.defaultLabelWidth ?? 80}
              staticOptions={def.staticOptions}
              picklistPageId={def.picklistPageId}
              picklistFieldName={def.picklistFieldName || placement.fieldName}
              fallbackOptions={def.fallbackOptions}
              format={def.format}
            />
          </div>
        </div>
      );
    };

    // Drop zone component for empty column areas
    const renderColumnDropZone = (columnIndex: 0 | 1) => {
      const isOver = dragOverColumn === columnIndex;
      return (
        <div
          className={`border-2 border-dashed rounded-sm p-2 text-[10px] text-center italic transition-all cursor-default ${
            isOver
              ? "border-[#0078d4] bg-[#e8f4fc] text-[#0078d4]"
              : "border-[#e0e0e0] text-[#ccc]"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverColumn(columnIndex);
          }}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={(e) => {
            setDragOverColumn(null);
            onDropOnColumn?.(section.id, columnIndex, e);
          }}
        >
          {isOver ? "Drop here" : "Drop here"}
        </div>
      );
    };

    // Build paired rows for 2-column layout (matching normal mode visual)
    const renderEditTwoColumnLayout = () => {
      const maxPaired = Math.max(leftFields.length, rightFields.length);
      const rows: Array<{
        left: DetailFieldPlacement | null;
        right: DetailFieldPlacement | null;
      }> = [];

      for (let i = 0; i < maxPaired; i++) {
        rows.push({
          left: leftFields[i] || null,
          right: rightFields[i] || null,
        });
      }

      return (
        <>
          {rows.map((row, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-1">
                {row.left ? renderEditableField(row.left) : (
                  <div className="border border-dashed border-[#e0e0e0] rounded-sm p-3 text-[10px] text-[#ccc] text-center italic">
                    Empty
                  </div>
                )}
              </div>
              <div className="flex-1">
                {row.right ? renderEditableField(row.right) : (
                  <div className="border border-dashed border-[#e0e0e0] rounded-sm p-3 text-[10px] text-[#ccc] text-center italic">
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Drop zones at the bottom of each column */}
          <div className="flex gap-4 mt-1">
            <div className="flex-1">
              {renderColumnDropZone(0)}
            </div>
            <div className="flex-1">
              {renderColumnDropZone(1)}
            </div>
          </div>
          {fullSpanFields.map((f) => renderEditableField(f))}
        </>
      );
    };

    const renderEditOneColumnLayout = () => (
      <>
        {section.fields.map((f) => renderEditableField(f))}
      </>
    );

    return (
      <div className={`${!section.visible ? "opacity-40" : ""}`}>
        {section.label && (
          <div className="text-[11px] font-semibold text-[#333] mb-1 mt-2">{section.label}</div>
        )}
        <div className="bg-white border border-[#c0c0c0] p-3 space-y-1.5">
          {section.columns === 2 ? renderEditTwoColumnLayout() : renderEditOneColumnLayout()}
        </div>
      </div>
    );
  }

  // ========================
  // NORMAL MODE — standard field rendering
  // ========================

  const fullSpanFields = visibleFields.filter((f) => f.colSpan === 2);
  const leftOnly = visibleFields.filter((f) => f.column === 0 && f.colSpan !== 2);
  const rightOnly = visibleFields.filter((f) => f.column === 1 && f.colSpan !== 2);

  const renderTwoColumnLayout = () => {
    const maxPaired = Math.max(leftOnly.length, rightOnly.length);
    const rows: Array<{ left: typeof leftOnly[0] | null; right: typeof rightOnly[0] | null }> = [];

    for (let i = 0; i < maxPaired; i++) {
      rows.push({
        left: leftOnly[i] || null,
        right: rightOnly[i] || null,
      });
    }

    return (
      <>
        {rows.map((row, i) => (
          <div key={i} className="flex gap-8">
            <div className="flex-1 space-y-2">
              {row.left && renderField(row.left)}
            </div>
            <div className="flex-1 space-y-2">
              {row.right && renderField(row.right)}
            </div>
          </div>
        ))}
        {fullSpanFields.map((f) => (
          <div key={f.fieldName}>{renderField(f)}</div>
        ))}
      </>
    );
  };

  const renderOneColumnLayout = () => (
    <div className="space-y-2">
      {visibleFields.map((f) => (
        <div key={f.fieldName}>{renderField(f)}</div>
      ))}
    </div>
  );

  const makeAddressSelectHandler = (fieldName: string): ((addr: AddressSelection) => void) | undefined => {
    if (fieldName !== "address") return undefined;
    return (addr: AddressSelection) => {
      onFieldChange("address", addr.address);
      onFieldChange("city", addr.city);
      onFieldChange("state", addr.state);
      onFieldChange("zipCode", addr.zipCode);
      onFieldChange("country", addr.country);
    };
  };

  const renderField = (placement: typeof visibleFields[0]) => {
    const def = fieldDefs.get(placement.fieldName);
    if (!def) return null;

    const value = def.valueGetter
      ? def.valueGetter(formData)
      : formData[placement.fieldName];

    return (
      <DetailField
        key={placement.fieldName}
        fieldName={placement.fieldName}
        label={placement.label}
        value={value}
        onChange={(val) => onFieldChange(placement.fieldName, val)}
        type={def.type}
        isEditing={isEditing}
        readOnly={placement.readOnly}
        required={placement.required ?? def.required}
        colSpan={placement.colSpan ?? def.defaultColSpan}
        labelWidth={placement.labelWidth ?? def.defaultLabelWidth ?? 80}
        placeholder={placement.placeholder}
        maxLength={def.maxLength}
        staticOptions={def.staticOptions}
        picklistPageId={def.picklistPageId}
        picklistFieldName={def.picklistFieldName || placement.fieldName}
        fallbackOptions={def.fallbackOptions}
        format={def.format}
        onAddressSelect={makeAddressSelectHandler(placement.fieldName)}
        editingField={editingField}
        onFieldDoubleClick={onFieldDoubleClick}
        onFieldBlur={onFieldBlur}
        onFieldKeyDown={onFieldKeyDown}
      />
    );
  };

  return (
    <div>
      {section.label && (
        <div className="text-[11px] font-semibold text-[#333] mb-1 mt-2">{section.label}</div>
      )}
      <div className="bg-white border border-[#c0c0c0] p-3 space-y-2">
        {section.columns === 2 ? renderTwoColumnLayout() : renderOneColumnLayout()}
      </div>
    </div>
  );
}
