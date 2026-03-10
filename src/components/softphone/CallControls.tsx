"use client";

import { Mic, MicOff, Pause, Play, Grid3X3, PhoneOff, Circle } from "lucide-react";

interface CallControlsProps {
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  showKeypad: boolean;
  callRecordingEnabled: boolean;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onToggleKeypad: () => void;
  onToggleRecording: () => void;
  onHangup: () => void;
}

function ControlButton({
  active,
  activeColor = "bg-[#dc2626]",
  icon,
  label,
  onClick,
}: {
  active: boolean;
  activeColor?: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-[50px] h-[50px] rounded-full flex flex-col items-center justify-center transition-all active:scale-95 ${
        active
          ? `${activeColor} text-white shadow-md`
          : "bg-white border border-[#d0d0d0] text-[#555] hover:bg-[#f5f5f5] shadow-sm"
      }`}
      title={label}
    >
      {icon}
      <span className={`text-[8px] mt-0.5 font-medium ${active ? "text-white/90" : "text-[#888]"}`}>
        {label}
      </span>
    </button>
  );
}

export function CallControls({
  isMuted,
  isOnHold,
  isRecording,
  showKeypad,
  callRecordingEnabled,
  onToggleMute,
  onToggleHold,
  onToggleKeypad,
  onToggleRecording,
  onHangup,
}: CallControlsProps) {
  return (
    <div className="flex flex-col gap-3 px-4">
      {/* Control buttons row */}
      <div className="flex justify-center gap-3">
        <ControlButton
          active={isMuted}
          activeColor="bg-[#dc2626]"
          icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          label={isMuted ? "Unmute" : "Mute"}
          onClick={onToggleMute}
        />

        <ControlButton
          active={isOnHold}
          activeColor="bg-[#f59e0b]"
          icon={isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          label={isOnHold ? "Resume" : "Hold"}
          onClick={onToggleHold}
        />

        <ControlButton
          active={showKeypad}
          activeColor="bg-[#0078d4]"
          icon={<Grid3X3 className="w-5 h-5" />}
          label="Keypad"
          onClick={onToggleKeypad}
        />

        {callRecordingEnabled && (
          <ControlButton
            active={isRecording}
            activeColor="bg-[#dc2626]"
            icon={<Circle className={`w-5 h-5 ${isRecording ? "fill-current" : ""}`} />}
            label={isRecording ? "Stop" : "Record"}
            onClick={onToggleRecording}
          />
        )}
      </div>

      {/* Hangup button */}
      <div className="flex justify-center">
        <button
          onClick={onHangup}
          className="w-[56px] h-[56px] rounded-full bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] active:scale-95 flex items-center justify-center transition-all shadow-lg"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
