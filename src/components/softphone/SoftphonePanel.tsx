"use client";

import { useState, useEffect, useRef } from "react";
import { Minus, X, Phone, PhoneOff, PhoneIncoming, PhoneOutgoing, Clock, User, AlertTriangle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useSoftphone, CallHistoryEntry } from "@/context/SoftphoneContext";
import { DialPad } from "./DialPad";
import { CallControls } from "./CallControls";
import { IncomingCallDialog } from "./IncomingCallDialog";
import { startRingtone, stopRingtone, playBusyTone } from "@/lib/phone-audio";

type PanelTab = "dialpad" | "history";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getInitials(display: string): string {
  if (!display) return "?";
  // If it's just a number, return first 2 digits
  if (/^\+?\d[\d\s\-()]+$/.test(display)) return display.replace(/\D/g, "").slice(0, 2);
  // Otherwise get initials from name
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return display.slice(0, 2).toUpperCase();
}

function StatusDot({ status }: { status: "registered" | "connecting" | "disconnected" }) {
  const colors = {
    registered: "bg-[#16a34a]",
    connecting: "bg-[#f59e0b] animate-pulse",
    disconnected: "bg-[#dc2626]",
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status]} flex-shrink-0`} />;
}

export function SoftphonePanel() {
  const {
    config,
    configured,
    connectionStatus,
    registrationStatus,
    callState,
    callDuration,
    callerDisplay,
    isMuted,
    isOnHold,
    isRecording,
    panelOpen,
    panelMinimized,
    dialNumber,
    setPanelOpen,
    setPanelMinimized,
    setDialNumber,
    connect,
    makeCall,
    answerCall,
    rejectCall,
    hangup,
    toggleMute,
    toggleHold,
    sendDTMF,
    toggleRecording,
    callHistory,
  } = useSoftphone();

  const [activeTab, setActiveTab] = useState<PanelTab>("dialpad");
  const [showKeypad, setShowKeypad] = useState(false);
  const prevCallState = useRef(callState);

  // Play ringtone for incoming calls, busy tone for failed calls
  useEffect(() => {
    if (callState === "incoming") {
      startRingtone();
    } else if (prevCallState.current === "incoming") {
      stopRingtone();
    }

    if (callState === "call-failed") {
      playBusyTone();
    }

    prevCallState.current = callState;

    return () => {
      stopRingtone();
    };
  }, [callState]);

  if (!panelOpen) {
    // Minimized pill
    if (panelMinimized) {
      const dotStatus = registrationStatus === "registered"
        ? "registered"
        : connectionStatus === "connecting"
        ? "connecting"
        : "disconnected";

      const isActive = callState !== "idle" && callState !== "call-failed";

      return (
        <div
          onClick={() => { setPanelOpen(true); setPanelMinimized(false); }}
          className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-3 py-2 border rounded shadow-lg cursor-pointer transition-all ${
            callState === "incoming"
              ? "bg-[#16a34a] border-[#15803d] animate-pulse"
              : isActive
              ? "bg-[#1e3a5f] border-[#2a4a6f]"
              : "bg-[#ece9d8] border-[#919b9c] hover:bg-[#e0ddd0]"
          }`}
          style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}
        >
          {callState === "incoming" ? (
            <PhoneIncoming className="w-4 h-4 text-white" />
          ) : (
            <Phone className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#333]"}`} />
          )}
          {!isActive && <StatusDot status={dotStatus} />}
          {callState === "incoming" && (
            <span className="text-[11px] text-white font-semibold">Incoming Call</span>
          )}
          {callState === "on-call" && (
            <span className="text-[11px] text-white font-medium">
              {callerDisplay && `${callerDisplay} · `}{formatDuration(callDuration)}
            </span>
          )}
          {(callState === "ringing" || callState === "connecting") && (
            <span className="text-[11px] text-white font-medium">Calling...</span>
          )}
        </div>
      );
    }
    return null;
  }

  const dotStatus = registrationStatus === "registered"
    ? "registered"
    : connectionStatus === "connecting"
    ? "connecting"
    : "disconnected";

  const statusLabel = registrationStatus === "registered"
    ? "Ready"
    : connectionStatus === "connecting"
    ? "Connecting..."
    : configured
    ? "Disconnected"
    : "Not Configured";

  const handleDigit = (digit: string) => {
    if (callState === "on-call") {
      sendDTMF(digit);
    } else {
      setDialNumber(dialNumber + digit);
    }
  };

  const handleBackspace = () => {
    setDialNumber(dialNumber.slice(0, -1));
  };

  const handleCall = () => {
    if (!dialNumber.trim()) return;
    makeCall(dialNumber.trim());
  };

  const isOnCall = callState === "on-call";
  const isDialing = callState === "ringing" || callState === "connecting";

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col shadow-xl border border-[#919b9c] rounded-lg overflow-hidden"
      style={{
        width: 300,
        maxHeight: 520,
        fontFamily: "Segoe UI, Tahoma, sans-serif",
        fontSize: 12,
      }}
    >
      {/* Title bar — XP blue gradient */}
      <div
        className="flex items-center justify-between px-2.5 py-1.5 select-none"
        style={{
          background: "linear-gradient(180deg, #0997ff 0%, #0053ee 50%, #0050ee 50%, #0978f4 100%)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-white" />
          <span className="text-[12px] font-bold text-white">Phone</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { setPanelOpen(false); setPanelMinimized(true); }}
            className="w-5 h-5 rounded-sm flex items-center justify-center hover:bg-white/20 text-white"
            title="Minimize"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={() => { setPanelOpen(false); setPanelMinimized(false); }}
            className="w-5 h-5 rounded-sm flex items-center justify-center hover:bg-[#c42b1c] text-white"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-[#ece9d8] flex flex-col flex-1 overflow-hidden relative">
        {/* Incoming call overlay */}
        {callState === "incoming" && (
          <IncomingCallDialog
            callerDisplay={callerDisplay}
            onAnswer={answerCall}
            onDecline={rejectCall}
          />
        )}

        {/* Status bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#aca899]">
          <StatusDot status={dotStatus} />
          <span className="text-[11px] text-[#444] font-medium">{statusLabel}</span>
          {!configured && (
            <AlertTriangle className="w-3 h-3 text-[#f59e0b] ml-auto" />
          )}
          {configured && connectionStatus === "disconnected" && (
            <button
              onClick={connect}
              className="ml-auto text-[10px] text-[#0078d4] hover:underline font-medium"
            >
              Reconnect
            </button>
          )}
        </div>

        {/* Not configured state */}
        {!config.enabled ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <AlertTriangle className="w-8 h-8 text-[#999] mb-3" />
            <div className="text-[13px] font-semibold text-[#333] mb-1">Not Configured</div>
            <div className="text-[11px] text-[#666] leading-relaxed">
              Softphone is not enabled. Go to Settings &rarr; System to configure the SIP server.
            </div>
          </div>
        ) : (
          <>
            {/* ===== DIALING STATE ===== */}
            {isDialing && (
              <div className="flex flex-col items-center py-6 px-4">
                {/* Avatar with pulse rings */}
                <div className="relative mb-4">
                  <div className="absolute inset-[-8px] rounded-full border-2 border-[#0078d4] opacity-20 animate-ping" />
                  <div className="absolute inset-[-4px] rounded-full border border-[#0078d4] opacity-30 animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#0078d4] to-[#005a9e] flex items-center justify-center">
                    <span className="text-white text-[18px] font-bold">{getInitials(callerDisplay)}</span>
                  </div>
                </div>

                <div className="text-[10px] uppercase tracking-widest text-[#888] mb-1">Calling</div>
                <div className="text-[15px] font-semibold text-[#333] mb-0.5">{callerDisplay}</div>

                {/* Animated dots */}
                <div className="flex gap-1 my-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0078d4] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0078d4] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0078d4] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>

                {/* End call button */}
                <button
                  onClick={hangup}
                  className="mt-4 w-14 h-14 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] flex items-center justify-center transition-colors shadow-md"
                  title="Cancel Call"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
                <span className="text-[10px] text-[#888] mt-1.5">End Call</span>
              </div>
            )}

            {/* ===== CALL FAILED STATE ===== */}
            {callState === "call-failed" && (
              <div className="flex flex-col items-center py-8 px-4">
                <div className="w-16 h-16 rounded-full bg-[#fef2f2] border-2 border-[#fecaca] flex items-center justify-center mb-3">
                  <PhoneOff className="w-7 h-7 text-[#dc2626]" />
                </div>
                <div className="text-[14px] font-semibold text-[#dc2626] mb-1">Call Failed</div>
                <div className="text-[12px] text-[#666]">{callerDisplay}</div>
                <div className="text-[11px] text-[#888] mt-2">The number could not be reached</div>
              </div>
            )}

            {/* ===== ACTIVE CALL STATE ===== */}
            {isOnCall && (
              <div className="flex flex-col">
                {/* Call info header */}
                <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4a6f] text-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[14px] font-bold">{getInitials(callerDisplay)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold truncate">{callerDisplay}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12px] text-[#8bb8e8] tabular-nums">{formatDuration(callDuration)}</span>
                        {isOnHold && (
                          <span className="text-[9px] bg-[#f59e0b] text-white px-1.5 py-0.5 rounded font-semibold uppercase">
                            On Hold
                          </span>
                        )}
                        {isRecording && (
                          <span className="flex items-center gap-1 text-[9px] text-[#ef4444] font-semibold uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                            Rec
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call controls */}
                <div className="py-4">
                  <CallControls
                    isMuted={isMuted}
                    isOnHold={isOnHold}
                    isRecording={isRecording}
                    showKeypad={showKeypad}
                    callRecordingEnabled={config.callRecording}
                    onToggleMute={toggleMute}
                    onToggleHold={toggleHold}
                    onToggleKeypad={() => setShowKeypad(!showKeypad)}
                    onToggleRecording={toggleRecording}
                    onHangup={hangup}
                  />
                </div>

                {/* In-call keypad */}
                {showKeypad && (
                  <div className="border-t border-[#aca899] pt-3 pb-3">
                    <DialPad
                      onDigit={handleDigit}
                      onBackspace={() => {}}
                      onCall={() => {}}
                      inCallMode
                    />
                  </div>
                )}
              </div>
            )}

            {/* ===== IDLE STATE ===== */}
            {callState === "idle" && (
              <>
                {/* Tabs */}
                <div className="flex border-b border-[#aca899]">
                  <button
                    onClick={() => setActiveTab("dialpad")}
                    className={`flex-1 py-2 text-[11px] text-center font-medium transition-colors ${
                      activeTab === "dialpad"
                        ? "bg-white text-[#0078d4] border-b-2 border-[#0078d4]"
                        : "text-[#666] hover:bg-[#e0ddd0]"
                    }`}
                  >
                    Dial Pad
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`flex-1 py-2 text-[11px] text-center font-medium transition-colors ${
                      activeTab === "history"
                        ? "bg-white text-[#0078d4] border-b-2 border-[#0078d4]"
                        : "text-[#666] hover:bg-[#e0ddd0]"
                    }`}
                  >
                    History
                  </button>
                </div>

                {activeTab === "dialpad" ? (
                  <>
                    {/* Number input */}
                    <div className="px-3 pt-3 pb-2">
                      <input
                        type="text"
                        value={dialNumber}
                        onChange={(e) => setDialNumber(e.target.value)}
                        placeholder="Enter number..."
                        className="w-full px-3 py-2.5 border border-[#7f9db9] text-[18px] text-center bg-white rounded focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]/30"
                        style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", letterSpacing: "0.5px" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCall();
                        }}
                      />
                    </div>

                    {/* Dial pad */}
                    <div className="pb-3">
                      <DialPad
                        onDigit={handleDigit}
                        onBackspace={handleBackspace}
                        onCall={handleCall}
                        disabled={registrationStatus !== "registered"}
                      />
                    </div>
                  </>
                ) : (
                  /* Call history */
                  <div className="flex-1 overflow-auto max-h-[350px]">
                    {callHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-[#999]">
                        <Clock className="w-6 h-6 mb-2 opacity-60" />
                        <div className="text-[11px]">No call history</div>
                      </div>
                    ) : (
                      callHistory.map((entry: CallHistoryEntry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#e0ddd0] hover:bg-[#e8e5da] cursor-pointer transition-colors"
                          onClick={() => {
                            setDialNumber(entry.number);
                            setActiveTab("dialpad");
                          }}
                        >
                          {/* Direction icon */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            entry.status === "missed"
                              ? "bg-[#fef2f2]"
                              : entry.direction === "inbound"
                              ? "bg-[#f0fdf4]"
                              : "bg-[#eff6ff]"
                          }`}>
                            {entry.status === "missed" ? (
                              <PhoneIncoming className="w-3.5 h-3.5 text-[#dc2626]" />
                            ) : entry.direction === "inbound" ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-[#16a34a]" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-[#0078d4]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium text-[#333] truncate">{entry.number}</div>
                            <div className="text-[10px] text-[#888]">
                              {formatTime(entry.timestamp)}
                              {entry.duration > 0 && ` · ${formatDuration(entry.duration)}`}
                            </div>
                          </div>
                          {entry.status === "missed" && (
                            <span className="text-[9px] text-[#dc2626] font-semibold bg-[#fef2f2] px-1.5 py-0.5 rounded">
                              Missed
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
