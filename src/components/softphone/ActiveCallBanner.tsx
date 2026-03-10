"use client";

import { Phone, Mic, MicOff, Pause, Play, PhoneOff, ChevronUp } from "lucide-react";
import { useSoftphone } from "@/context/SoftphoneContext";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ActiveCallBanner() {
  const {
    callState,
    callDuration,
    callerDisplay,
    isMuted,
    isOnHold,
    panelOpen,
    setPanelOpen,
    setPanelMinimized,
    toggleMute,
    toggleHold,
    hangup,
  } = useSoftphone();

  // Only show when there's an active call and the panel is not fully open
  const isActive = callState === "on-call" || callState === "ringing" || callState === "connecting";
  if (!isActive || panelOpen) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-1.5 border-b border-[#aca899]"
      style={{
        background: "linear-gradient(180deg, #2a5580 0%, #1e3a5f 100%)",
        fontFamily: "Segoe UI, Tahoma, sans-serif",
        fontSize: 12,
      }}
    >
      {/* Pulsing green dot */}
      <div className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse flex-shrink-0" />

      {/* Call info */}
      <div className="flex items-center gap-2 flex-1 min-w-0 text-white">
        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-[11px] font-medium truncate">
          {callState === "on-call"
            ? `${callerDisplay || "Call"}`
            : "Calling..."}
        </span>
        {callState === "on-call" && (
          <span className="text-[11px] text-[#8bb8e8] tabular-nums flex-shrink-0">
            {formatDuration(callDuration)}
          </span>
        )}
        {isOnHold && (
          <span className="text-[9px] bg-[#f59e0b] text-white px-1 py-px rounded font-semibold flex-shrink-0">
            HOLD
          </span>
        )}
      </div>

      {/* Quick controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {callState === "on-call" && (
          <>
            <button
              onClick={toggleMute}
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                isMuted ? "bg-[#dc2626] text-white" : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleHold}
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                isOnHold ? "bg-[#f59e0b] text-white" : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title={isOnHold ? "Resume" : "Hold"}
            >
              {isOnHold ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
        <button
          onClick={hangup}
          className="w-6 h-6 rounded bg-[#dc2626] hover:bg-[#b91c1c] flex items-center justify-center transition-colors"
          title="End Call"
        >
          <PhoneOff className="w-3.5 h-3.5 text-white" />
        </button>
        <button
          onClick={() => { setPanelOpen(true); setPanelMinimized(false); }}
          className="w-6 h-6 rounded text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors ml-1"
          title="Open Phone Panel"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
