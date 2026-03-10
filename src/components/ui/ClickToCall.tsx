"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { useSoftphone } from "@/context/SoftphoneContext";

interface ClickToCallProps {
  number: string | null | undefined;
}

/**
 * Small phone icon that appears next to phone number fields.
 * Clicking it opens the softphone panel with the number pre-filled and initiates a call.
 * When softphone is not enabled/configured, shows a "not set up" tooltip.
 */
export function ClickToCall({ number }: ClickToCallProps) {
  const { config, configured, registrationStatus, setPanelOpen, setPanelMinimized, setDialNumber, makeCall } = useSoftphone();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!number?.trim()) return null;

  const cleanNumber = number.trim();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Feature not enabled or not configured — show tooltip
    if (!config.enabled || !configured) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }

    setDialNumber(cleanNumber);
    setPanelOpen(true);
    setPanelMinimized(false);
    if (registrationStatus === "registered") {
      makeCall(cleanNumber);
    }
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center w-4 h-4 rounded hover:bg-[#e0e0e0] transition-colors ml-1 flex-shrink-0"
        title={config.enabled && configured ? `Call ${cleanNumber}` : "Softphone not configured"}
      >
        <Phone className={`w-3 h-3 ${config.enabled && configured ? "text-[#0078d4]" : "text-[#bbb]"}`} />
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#333] text-white text-[10px] rounded shadow-lg whitespace-nowrap z-50">
          Softphone not set up. Contact your admin.
        </div>
      )}
    </span>
  );
}
