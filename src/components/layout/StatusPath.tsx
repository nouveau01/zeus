"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface StatusPathProps {
  statuses: string[];
  currentStatus: string;
  onStatusChange: (newStatus: string) => Promise<void>;
  isUpdating?: boolean;
}

export function StatusPath({
  statuses,
  currentStatus,
  onStatusChange,
  isUpdating = false
}: StatusPathProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const currentIndex = statuses.indexOf(currentStatus);
  const selectedIndex = selectedStatus ? statuses.indexOf(selectedStatus) : -1;

  const handleStepClick = (status: string) => {
    if (status === currentStatus) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status);
    }
  };

  const handleMarkCurrentStatus = async () => {
    if (selectedStatus && selectedStatus !== currentStatus) {
      await onStatusChange(selectedStatus);
      setSelectedStatus(null);
    }
  };

  const handleMarkComplete = async () => {
    // Move to next status
    const nextIndex = currentIndex + 1;
    if (nextIndex < statuses.length) {
      await onStatusChange(statuses[nextIndex]);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#dddbda] p-4">
      <div className="flex items-center">
        {/* Status chevrons */}
        <div className="flex flex-1">
          {statuses.map((status, index) => {
            const isCurrent = status === currentStatus;
            const isComplete = index < currentIndex;
            const isSelected = status === selectedStatus;

            return (
              <button
                key={status}
                onClick={() => handleStepClick(status)}
                disabled={isUpdating}
                className={`
                  relative flex-1 py-3 px-2 text-xs font-medium text-center transition-all
                  ${isSelected ? "ring-2 ring-[#0176d3] ring-offset-1 z-10" : ""}
                  ${isCurrent ? "bg-[#0176d3] text-white" : ""}
                  ${isComplete ? "bg-[#2e844a] text-white" : ""}
                  ${!isCurrent && !isComplete ? "bg-[#e5e5e5] text-[#706e6b] hover:bg-[#d8d8d8]" : ""}
                  ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
                style={{
                  clipPath: index === 0
                    ? "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)"
                    : index === statuses.length - 1
                    ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 10px 50%)"
                    : "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)",
                  marginLeft: index > 0 ? "-5px" : "0",
                }}
              >
                <span className="relative z-10 truncate">{status}</span>
              </button>
            );
          })}
        </div>

        {/* Action button */}
        <div className="ml-4 flex-shrink-0">
          {selectedStatus && selectedStatus !== currentStatus ? (
            <button
              onClick={handleMarkCurrentStatus}
              disabled={isUpdating}
              className={`
                px-4 py-2 text-white text-sm font-medium rounded flex items-center gap-2
                ${isUpdating ? "bg-gray-400 cursor-not-allowed" : "bg-[#0176d3] hover:bg-[#014486]"}
              `}
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Mark Current Status
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleMarkComplete}
              disabled={isUpdating || currentIndex >= statuses.length - 1}
              className={`
                px-4 py-2 text-white text-sm font-medium rounded flex items-center gap-2
                ${isUpdating || currentIndex >= statuses.length - 1
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#2e844a] hover:bg-[#236b3b]"}
              `}
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Mark Status as Complete
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Selected status indicator */}
      {selectedStatus && selectedStatus !== currentStatus && (
        <div className="mt-3 pt-3 border-t border-[#dddbda]">
          <p className="text-sm text-[#706e6b]">
            Click <strong>"Mark Current Status"</strong> to change status from{" "}
            <span className="font-medium text-[#3e3e3c]">{currentStatus}</span> to{" "}
            <span className="font-medium text-[#0176d3]">{selectedStatus}</span>
          </p>
        </div>
      )}
    </div>
  );
}
