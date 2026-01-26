"use client";

import { useEffect, useRef } from "react";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  saving?: boolean;
}

export function UnsavedChangesDialog({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  title = "Save Changes?",
  message = "Do you want to save changes before leaving?",
  saving = false,
}: UnsavedChangesDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap and escape key
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onCancel();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-[#f0f0f0] border-2 border-[#808080] shadow-lg min-w-[350px] max-w-[450px]"
        style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}
      >
        {/* Title Bar */}
        <div className="bg-[#0078d4] text-white px-3 py-1.5 flex items-center justify-between">
          <span className="text-[12px] font-medium">{title}</span>
          <button
            onClick={onCancel}
            className="w-5 h-5 flex items-center justify-center hover:bg-[#c42b1c] rounded-sm text-[14px] leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            {/* Warning Icon */}
            <div className="w-8 h-8 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <path
                  d="M12 2L1 21h22L12 2z"
                  fill="#f0c000"
                  stroke="#000"
                  strokeWidth="1"
                />
                <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#000">!</text>
              </svg>
            </div>
            <p className="text-[12px] text-[#000] pt-1">{message}</p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-1.5 bg-[#f0f0f0] border border-[#808080] text-[12px] hover:bg-[#e0e0e0] disabled:opacity-50 min-w-[75px]"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onDiscard}
              disabled={saving}
              className="px-4 py-1.5 bg-[#f0f0f0] border border-[#808080] text-[12px] hover:bg-[#e0e0e0] disabled:opacity-50 min-w-[75px]"
            >
              Don't Save
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-1.5 bg-[#f0f0f0] border border-[#808080] text-[12px] hover:bg-[#e0e0e0] disabled:opacity-50 min-w-[75px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
