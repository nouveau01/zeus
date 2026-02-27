"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ============================================================
// XP-themed dialog component — replaces native alert()/confirm()
// Usage:
//   const { alert, confirm, DialogComponent } = useXPDialog();
//   await alert("Something happened");
//   const ok = await confirm("Delete this item?");
//   // Render <DialogComponent /> somewhere in your JSX
// ============================================================

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: "alert" | "confirm";
  resolve: ((value: boolean) => void) | null;
}

export function useXPDialog() {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
    resolve: null,
  });

  const alert = useCallback((message: string, title?: string): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title: title || "Alert",
        message,
        type: "alert",
        resolve: () => resolve(),
      });
    });
  }, []);

  const confirm = useCallback((message: string, title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title: title || "Confirm",
        message,
        type: "confirm",
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    dialog.resolve?.(result);
    setDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialog.resolve]);

  const DialogComponent = useCallback(() => (
    <XPDialogInner
      isOpen={dialog.isOpen}
      title={dialog.title}
      message={dialog.message}
      type={dialog.type}
      onClose={handleClose}
    />
  ), [dialog.isOpen, dialog.title, dialog.message, dialog.type, handleClose]);

  return { alert, confirm, DialogComponent };
}

// ----- Internal dialog renderer -----

interface XPDialogInnerProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: "alert" | "confirm";
  onClose: (result: boolean) => void;
}

function XPDialogInner({ isOpen, title, message, type, onClose }: XPDialogInnerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose(false);
        } else if (e.key === "Enter") {
          onClose(type === "alert" ? false : true);
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose, type]);

  if (!isOpen) return null;

  const isWarning = type === "confirm";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => onClose(false)}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-[#f0f0f0] border-2 border-[#808080] shadow-lg min-w-[320px] max-w-[420px]"
        style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}
      >
        {/* Title Bar */}
        <div className="bg-[#0078d4] text-white px-3 py-1.5 flex items-center justify-between">
          <span className="text-[12px] font-medium">{title}</span>
          <button
            onClick={() => onClose(false)}
            className="w-5 h-5 flex items-center justify-center hover:bg-[#c42b1c] rounded-sm text-[14px] leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            {/* Icon */}
            <div className="w-8 h-8 flex-shrink-0">
              {isWarning ? (
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                  <path
                    d="M12 2L1 21h22L12 2z"
                    fill="#f0c000"
                    stroke="#000"
                    strokeWidth="1"
                  />
                  <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#000">!</text>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                  <circle cx="12" cy="12" r="10" fill="#0078d4" />
                  <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">i</text>
                </svg>
              )}
            </div>
            <p className="text-[12px] text-[#000] pt-1">{message}</p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            {type === "confirm" ? (
              <>
                <button
                  onClick={() => onClose(true)}
                  className="px-4 py-1.5 bg-[#f0f0f0] border border-[#808080] text-[12px] hover:bg-[#e0e0e0] min-w-[75px]"
                  autoFocus
                >
                  Yes
                </button>
                <button
                  onClick={() => onClose(false)}
                  className="px-4 py-1.5 bg-[#f0f0f0] border border-[#808080] text-[12px] hover:bg-[#e0e0e0] min-w-[75px]"
                >
                  No
                </button>
              </>
            ) : (
              <button
                onClick={() => onClose(false)}
                className="px-4 py-1.5 bg-[#f0f0f0] border border-[#808080] text-[12px] hover:bg-[#e0e0e0] min-w-[75px]"
                autoFocus
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
