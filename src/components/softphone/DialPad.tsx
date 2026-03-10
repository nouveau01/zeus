"use client";

import { useCallback } from "react";
import { playDTMFTone } from "@/lib/phone-audio";

interface DialPadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onCall: () => void;
  disabled?: boolean;
  inCallMode?: boolean; // When true, hides call/backspace buttons (used during active call)
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

const SUB_LABELS: Record<string, string> = {
  "2": "ABC",
  "3": "DEF",
  "4": "GHI",
  "5": "JKL",
  "6": "MNO",
  "7": "PQRS",
  "8": "TUV",
  "9": "WXYZ",
  "0": "+",
};

export function DialPad({ onDigit, onBackspace, onCall, disabled, inCallMode }: DialPadProps) {
  const handleDigit = useCallback((digit: string) => {
    playDTMFTone(digit);
    onDigit(digit);
  }, [onDigit]);

  return (
    <div className="flex flex-col gap-1.5 px-4">
      {KEYS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-2">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleDigit(key)}
              disabled={disabled}
              className="w-[64px] h-[44px] rounded-lg bg-white border border-[#d0d0d0] hover:bg-[#f0f0f0] active:bg-[#e0e0e0] active:scale-[0.97] flex flex-col items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-white shadow-sm"
              style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}
            >
              <span className="text-[16px] font-semibold text-[#333] leading-none">{key}</span>
              {SUB_LABELS[key] && (
                <span className="text-[8px] text-[#999] leading-none mt-0.5 tracking-wider">
                  {SUB_LABELS[key]}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}

      {/* Bottom row: backspace, call, empty — hidden in in-call mode */}
      {!inCallMode && (
        <div className="flex justify-center gap-2 mt-1">
          <button
            onClick={onBackspace}
            className="w-[64px] h-[44px] rounded-lg bg-white border border-[#d0d0d0] hover:bg-[#f0f0f0] active:bg-[#e0e0e0] active:scale-[0.97] flex items-center justify-center transition-all shadow-sm"
            title="Backspace"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
          <button
            onClick={onCall}
            disabled={disabled}
            className="w-[64px] h-[44px] rounded-lg bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] active:scale-[0.97] border border-[#15803d] flex items-center justify-center transition-all disabled:opacity-40 shadow-sm"
            title="Call"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <div className="w-[64px]" /> {/* spacer */}
        </div>
      )}
    </div>
  );
}
