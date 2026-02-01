"use client";

import { useState, useRef, useEffect } from "react";

interface EditableColumnHeaderProps {
  fieldName: string;
  label: string;
  isEditMode: boolean;
  onLabelChange: (fieldName: string, newLabel: string) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: () => void;
  width?: number;
  onResizeStart?: (e: React.MouseEvent) => void;
}

export function EditableColumnHeader({
  fieldName,
  label,
  isEditMode,
  onLabelChange,
  sortColumn,
  sortDirection,
  onSort,
  width,
  onResizeStart,
}: EditableColumnHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(label);
  }, [label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Exit editing when edit mode is disabled
  useEffect(() => {
    if (!isEditMode) {
      setIsEditing(false);
    }
  }, [isEditMode]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() !== label) {
      onLabelChange(fieldName, editValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(label);
      setIsEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode && onSort) {
      onSort();
    }
  };

  const showSortIndicator = sortColumn === fieldName;

  return (
    <th
      className={`px-1 py-0.5 text-left font-medium border border-[#c0c0c0] relative select-none ${
        isEditMode
          ? "bg-blue-50 cursor-text"
          : "cursor-pointer hover:bg-[#e0e0e0]"
      }`}
      style={{ width, minWidth: width }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-1 py-0 text-[11px] border border-blue-400 bg-white rounded outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className={isEditMode ? "border-b border-dashed border-blue-400" : ""}>
            {label}
          </span>
          {showSortIndicator && !isEditMode && (
            <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
          )}
          {isEditMode && (
            <span className="ml-1 text-[9px] text-blue-500">(dbl-click)</span>
          )}
        </>
      )}
      {onResizeStart && (
        <div
          className="absolute right-[-4px] top-0 bottom-0 w-[9px] cursor-col-resize z-10 group"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart(e);
          }}
        >
          <div className="absolute top-0 left-[4px] w-[1px] h-full bg-transparent group-hover:bg-[#316ac5]" />
        </div>
      )}
    </th>
  );
}
