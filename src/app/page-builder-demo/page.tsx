"use client";

import { useState, useEffect, useRef } from "react";
import { PageBuilder, ticketDetailLayout, PageLayout } from "@/components/page-builder";

// Sample ticket data
const sampleTicket = {
  ticketNumber: 4107886,
  workOrderNumber: 4107886,
  category: "None",
  level: "10",
  jobId: "169999",
  phase: 1,
  unitName: "",
  nameAddress: "QUEENSBRIDGESOU\nELEVATOR SERVICES AND REPAIR DEPARTMENT\n23-02 49TH AVENUE, 3RD FLOOR - (718) 000-0000\nLONG ISLAND CITY, NY",
  scopeOfWork: "Preventive maintenance",
  resolution: "-----Codes-----\nMOD     - Modernization in Progress\nParts   - Parts\nSTBY    - Standby Service\n-----Notes-----\nPaperwork post buildings going forward and standby",
  date: "2026-02-02",
  workTime: "07:00 AM",
  mechCrew: "MCGILL NORMAN",
  wage: "461- APPRENTICE (90)",
  enRouteTime: "06:53 AM",
  onSiteTime: "07:00 AM",
  completedTime: "09:45 AM",
  mileageStarting: 0,
  mileageEnding: 0,
  mileageTraveled: 0,
  partsUsed: "",
  hours: 2.75,
  overtimeHours: 0,
  oneSevenHours: 0,
  doubleTimeHours: 0,
  travelHours: 0,
  totalHours: 2.75,
  estTime: 0,
  difference: 2.75,
  workCompleted: true,
  chargeable: false,
  inv: false,
  emailOnSave: false,
  updateLocation: false,
  internetAccess: false,
  reviewStatus: "Dispatch Review",
  expensePhase: 1,
  expenseMileage: 0,
  expenseZone: 0,
  expenseTolls: 0,
  expenseMisc: 0,
  expenseTotal: 0,
  contractType: "S",
  internalComments: "",
};

export default function PageBuilderDemo() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<PageLayout>(ticketDetailLayout);
  const [data, setData] = useState(sampleTicket);
  const [containerWidth, setContainerWidth] = useState(900);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 20);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleChange = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLayoutChange = (newLayout: PageLayout) => {
    setLayout(newLayout);
  };

  const handleSaveLayout = () => {
    // In a real app, this would save to the database
    console.log("Saving layout:", JSON.stringify(layout, null, 2));
    alert("Layout saved! Check console for JSON.");
  };

  const handleResetLayout = () => {
    setLayout(ticketDetailLayout);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f0f0f0]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] text-white px-4 py-2 flex items-center justify-between">
        <span className="font-semibold">Page Builder Demo - Ticket #{data.ticketNumber}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1 rounded text-sm ${
              isEditMode
                ? "bg-yellow-500 text-black"
                : "bg-white text-blue-700"
            }`}
          >
            {isEditMode ? "Exit Edit Mode" : "Edit Layout"}
          </button>
          {isEditMode && (
            <>
              <button
                onClick={handleSaveLayout}
                className="px-3 py-1 rounded text-sm bg-green-500 text-white"
              >
                Save Layout
              </button>
              <button
                onClick={handleResetLayout}
                className="px-3 py-1 rounded text-sm bg-red-500 text-white"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      {isEditMode && (
        <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-sm">
          <strong>Edit Mode:</strong> Drag sections to move them. Drag the bottom-right corner to resize.
          Click "Save Layout" when done.
        </div>
      )}

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-auto p-2">
        <div className="bg-white border border-[#a0a0a0] p-2">
          <PageBuilder
            layout={layout}
            data={data}
            onChange={handleChange}
            isEditMode={isEditMode}
            onLayoutChange={handleLayoutChange}
            width={containerWidth}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#a0a0a0] px-4 py-1 text-[11px]">
        Called in by Who on Mon, 2/2/2026 at 01:53 AM, Taken By NORMAN MCGILL, Resolved By CMCMURREN, No Email Sent
      </div>
    </div>
  );
}
