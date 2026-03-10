"use client";

import { Phone, PhoneOff, User } from "lucide-react";

interface IncomingCallDialogProps {
  callerDisplay: string;
  onAnswer: () => void;
  onDecline: () => void;
}

function getInitials(display: string): string {
  if (!display) return "?";
  if (/^\+?\d[\d\s\-()]+$/.test(display)) return display.replace(/\D/g, "").slice(0, 2);
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return display.slice(0, 2).toUpperCase();
}

export function IncomingCallDialog({ callerDisplay, onAnswer, onDecline }: IncomingCallDialogProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a3550] to-[#0c1f33]">
      {/* Pulsing ring indicator */}
      <div className="relative mb-5">
        {/* Outer pulse ring */}
        <div className="absolute inset-[-16px] rounded-full border-2 border-[#16a34a] opacity-20 animate-ping" />
        <div className="absolute inset-[-8px] rounded-full border border-[#16a34a] opacity-40 animate-pulse" />
        {/* Avatar circle */}
        <div className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#16a34a] to-[#15803d] flex items-center justify-center shadow-lg">
          <span className="text-white text-[22px] font-bold">{getInitials(callerDisplay)}</span>
        </div>
      </div>

      {/* Caller info */}
      <div className="text-white text-center mb-1 px-4">
        <div className="text-[10px] uppercase tracking-[0.15em] text-[#7eb8a0] mb-2 font-medium">Incoming Call</div>
        <div className="text-[18px] font-semibold leading-tight">{callerDisplay || "Unknown Caller"}</div>
      </div>

      {/* Answer / Decline buttons */}
      <div className="flex gap-10 mt-8">
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={onDecline}
            className="w-[56px] h-[56px] rounded-full bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] active:scale-95 flex items-center justify-center transition-all shadow-lg"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
          <span className="text-[10px] text-[#aaa] font-medium">Decline</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={onAnswer}
            className="w-[56px] h-[56px] rounded-full bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] active:scale-95 flex items-center justify-center transition-all shadow-lg animate-pulse"
            title="Answer"
          >
            <Phone className="w-6 h-6 text-white" />
          </button>
          <span className="text-[10px] text-[#aaa] font-medium">Answer</span>
        </div>
      </div>
    </div>
  );
}
