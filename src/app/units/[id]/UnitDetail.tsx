"use client";

import { useState, useEffect, useCallback } from "react";
import { useTabs } from "@/context/TabContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";
import {
  FileText,
  Save,
  Undo2,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface UnitData {
  id: string;
  unitNumber: string;
  description: string;
  stateNumber: string;
  template: string;
  category: string;
  type: string;
  building: string;
  accountId: string;
  accountTag: string;
  status: string;
  group: string;
  onServiceSince: string;
  lastServiceOn: string;
  installed: string;
  installedBy: string;
  manufacturer: string;
  serialNumber: string;
  priceS: string;
  week: string;
}

interface TemplateCustomField {
  field: string;
  value: string;
}

interface Test {
  id: string;
  name: string;
  status: string;
  last: string;
  next: string;
  ticketed: boolean;
  ticket: string;
}

interface UnitCustomData {
  testIncluded: string;
  testCustomPricing: string;
  custom3: string;
  custom4: string;
  custom5: string;
  custom6: string;
  custom7: string;
  custom8: string;
  custom9: string;
  custom10: string;
  custom11: string;
  custom12: string;
  custom13: string;
  custom14: string;
  custom15: string;
  custom16: string;
  custom17: string;
  custom18: string;
  custom19: string;
  custom20: string;
}

interface UnitDetailProps {
  unitId: string;
  onClose: () => void;
}

export default function UnitDetail({ unitId, onClose }: UnitDetailProps) {
  const { openTab } = useTabs();
  const [activeTab, setActiveTab] = useState<"general" | "templateCustom" | "tests" | "remarks" | "unitCustom">("general");
  const [isEditing, setIsEditing] = useState(false);
  const [savingFromHook, setSavingFromHook] = useState(false);

  // Unit data state
  const [unit, setUnit] = useState<UnitData>({
    id: "",
    unitNumber: "",
    description: "",
    stateNumber: "",
    template: "Standard",
    category: "CONSULTANT",
    type: "Elevator",
    building: "Office / Commercial",
    accountId: "",
    accountTag: "",
    status: "Inactive",
    group: "",
    onServiceSince: "",
    lastServiceOn: "",
    installed: "",
    installedBy: "",
    manufacturer: "",
    serialNumber: "",
    priceS: "$0.00",
    week: "",
  });
  const [originalUnit, setOriginalUnit] = useState<UnitData | null>(null);

  // Template Custom fields
  const [templateCustomFields, setTemplateCustomFields] = useState<TemplateCustomField[]>([
    { field: "Hours Allocations", value: "" },
    { field: "Capacity", value: "3500" },
    { field: "Motor Room Location", value: "" },
    { field: "Machine Type", value: "" },
    { field: "Machine Location", value: "" },
    { field: "Machine Make", value: "" },
    { field: "Machine Model #", value: "" },
    { field: "Machine Serial #", value: "" },
    { field: "Controller Manufacturer", value: "" },
    { field: "Controller Model", value: "" },
    { field: "Controller Serial #", value: "" },
    { field: "Controller Manufacturer Job #", value: "" },
    { field: "Car Governor Manufacturer", value: "" },
    { field: "Car Governor Model", value: "" },
    { field: "Car Governor Serial #", value: "" },
  ]);
  const [originalTemplateCustom, setOriginalTemplateCustom] = useState<TemplateCustomField[]>([]);

  // Tests
  const [tests, setTests] = useState<Test[]>([
    { id: "1", name: "OUTSIDE N'", status: "No Proposal", last: "11/26/2016", next: "11/26/2023", ticketed: false, ticket: "" },
    { id: "2", name: "OUTSIDE N'", status: "Job Awarded", last: "4/1/2021", next: "4/1/2022", ticketed: false, ticket: "" },
    { id: "3", name: "OUTSIDE N'", status: "No Proposal", last: "12/23/2020", next: "12/23/2022", ticketed: false, ticket: "" },
  ]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [originalTests, setOriginalTests] = useState<Test[]>([]);

  // Remarks
  const [remarks, setRemarks] = useState("");
  const [originalRemarks, setOriginalRemarks] = useState("");

  // Unit Custom
  const [unitCustom, setUnitCustom] = useState<UnitCustomData>({
    testIncluded: "",
    testCustomPricing: "",
    custom3: "",
    custom4: "",
    custom5: "",
    custom6: "",
    custom7: "",
    custom8: "",
    custom9: "",
    custom10: "",
    custom11: "",
    custom12: "",
    custom13: "",
    custom14: "",
    custom15: "",
    custom16: "",
    custom17: "",
    custom18: "",
    custom19: "",
    custom20: "",
  });
  const [originalUnitCustom, setOriginalUnitCustom] = useState<UnitCustomData | null>(null);

  // Add Test Dialog
  const [showAddTestDialog, setShowAddTestDialog] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [newTest, setNewTest] = useState<Partial<Test>>({
    name: "",
    status: "No Proposal",
    last: "",
    next: "",
    ticketed: false,
    ticket: "",
  });

  // Save callback for the unsaved changes hook
  const handleSaveForHook = useCallback(async () => {
    setSavingFromHook(true);
    try {
      const response = await fetch(`/api/units/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitNumber: unit.unitNumber,
          state: unit.stateNumber,
          description: unit.description,
          template: unit.template,
          cat: unit.category,
          unitType: unit.type,
          building: unit.building,
          manufacturer: unit.manufacturer,
          serial: unit.serialNumber,
          status: unit.status,
          price: unit.priceS ? parseFloat(unit.priceS.replace(/[^0-9.-]/g, '')) : null,
          group: unit.group,
          week: unit.week,
          sinceDate: unit.onServiceSince,
          lastDate: unit.lastServiceOn,
          installDate: unit.installed,
          installBy: unit.installedBy,
          premisesId: unit.accountId,
          remarks: remarks,
          custom1: unitCustom.testIncluded,
          custom2: unitCustom.testCustomPricing,
          custom3: unitCustom.custom3,
          custom4: unitCustom.custom4,
          custom5: unitCustom.custom5,
          custom6: unitCustom.custom6,
          custom7: unitCustom.custom7,
          custom8: unitCustom.custom8,
          custom9: unitCustom.custom9,
          custom10: unitCustom.custom10,
          custom11: unitCustom.custom11,
          custom12: unitCustom.custom12,
          custom13: unitCustom.custom13,
          custom14: unitCustom.custom14,
          custom15: unitCustom.custom15,
          custom16: unitCustom.custom16,
          custom17: unitCustom.custom17,
          custom18: unitCustom.custom18,
          custom19: unitCustom.custom19,
          custom20: unitCustom.custom20,
        }),
      });
      if (!response.ok) throw new Error("Failed to save unit");
      const updated = await response.json();
      // Update local state with saved data
      const updatedUnit: UnitData = {
        id: updated.id,
        unitNumber: updated.unitNumber || "",
        description: updated.description || "",
        stateNumber: updated.state || "",
        template: updated.template || "Standard",
        category: updated.cat || "",
        type: updated.unitType || "Elevator",
        building: updated.building || "",
        accountId: updated.premisesId || "",
        accountTag: updated.premises?.address || updated.premises?.premisesId || "",
        status: updated.status || "Active",
        group: updated.group || "",
        onServiceSince: updated.sinceDate ? new Date(updated.sinceDate).toLocaleDateString() : "",
        lastServiceOn: updated.lastDate ? new Date(updated.lastDate).toLocaleDateString() : "",
        installed: updated.installDate ? new Date(updated.installDate).toLocaleDateString() : "",
        installedBy: updated.installBy || "",
        manufacturer: updated.manufacturer || "",
        serialNumber: updated.serial || "",
        priceS: updated.price ? `$${parseFloat(updated.price).toFixed(2)}` : "$0.00",
        week: updated.week || "",
      };
      setUnit(updatedUnit);
      setOriginalUnit(updatedUnit);
      setOriginalRemarks(updated.remarks || "");
      setRemarks(updated.remarks || "");
    } finally {
      setSavingFromHook(false);
    }
  }, [unitId, unit, remarks, unitCustom]);

  // Unsaved changes hook
  const {
    isDirty: hasChanges,
    setIsDirty: setHasChanges,
    markDirty,
    confirmNavigation,
    showDialog,
    handleDialogSave,
    handleDialogDiscard,
    handleDialogCancel,
  } = useUnsavedChanges({ onSave: handleSaveForHook });

  // Load unit data from API
  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const response = await fetch(`/api/units/${unitId}`);
        if (response.ok) {
          const data = await response.json();
          const loadedUnit: UnitData = {
            id: data.id,
            unitNumber: data.unitNumber || "",
            description: data.description || "",
            stateNumber: data.state || "",
            template: data.template || "Standard",
            category: data.cat || "",
            type: data.unitType || "Elevator",
            building: data.building || "",
            accountId: data.premisesId || "",
            accountTag: data.premises?.address || data.premises?.premisesId || "",
            status: data.status || "Active",
            group: data.group || "",
            onServiceSince: data.sinceDate ? new Date(data.sinceDate).toLocaleDateString() : "",
            lastServiceOn: data.lastDate ? new Date(data.lastDate).toLocaleDateString() : "",
            installed: data.installDate ? new Date(data.installDate).toLocaleDateString() : "",
            installedBy: data.installBy || "",
            manufacturer: data.manufacturer || "",
            serialNumber: data.serial || "",
            priceS: data.price ? `$${parseFloat(data.price).toFixed(2)}` : "$0.00",
            week: data.week || "",
          };
          setUnit(loadedUnit);
          setOriginalUnit(loadedUnit);
          setRemarks(data.remarks || "");
          setOriginalRemarks(data.remarks || "");
          // Load custom fields
          const loadedCustom: UnitCustomData = {
            testIncluded: data.custom1 || "",
            testCustomPricing: data.custom2 || "",
            custom3: data.custom3 || "",
            custom4: data.custom4 || "",
            custom5: data.custom5 || "",
            custom6: data.custom6 || "",
            custom7: data.custom7 || "",
            custom8: data.custom8 || "",
            custom9: data.custom9 || "",
            custom10: data.custom10 || "",
            custom11: data.custom11 || "",
            custom12: data.custom12 || "",
            custom13: data.custom13 || "",
            custom14: data.custom14 || "",
            custom15: data.custom15 || "",
            custom16: data.custom16 || "",
            custom17: data.custom17 || "",
            custom18: data.custom18 || "",
            custom19: data.custom19 || "",
            custom20: data.custom20 || "",
          };
          setUnitCustom(loadedCustom);
          setOriginalUnitCustom(loadedCustom);
        }
      } catch (error) {
        console.error("Error fetching unit:", error);
      }
    };
    fetchUnit();
    setOriginalTemplateCustom([...templateCustomFields]);
    setOriginalTests([...tests]);
  }, [unitId]);

  // Track changes
  useEffect(() => {
    if (originalUnit) {
      const unitChanged = JSON.stringify(unit) !== JSON.stringify(originalUnit);
      const templateChanged = JSON.stringify(templateCustomFields) !== JSON.stringify(originalTemplateCustom);
      const testsChanged = JSON.stringify(tests) !== JSON.stringify(originalTests);
      const remarksChanged = remarks !== originalRemarks;
      const customChanged = JSON.stringify(unitCustom) !== JSON.stringify(originalUnitCustom);
      setHasChanges(unitChanged || templateChanged || testsChanged || remarksChanged || customChanged);
    }
  }, [unit, templateCustomFields, tests, remarks, unitCustom, originalUnit, originalTemplateCustom, originalTests, originalRemarks, originalUnitCustom]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/units/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitNumber: unit.unitNumber,
          state: unit.stateNumber,
          description: unit.description,
          template: unit.template,
          cat: unit.category,
          unitType: unit.type,
          building: unit.building,
          manufacturer: unit.manufacturer,
          serial: unit.serialNumber,
          status: unit.status,
          price: unit.priceS ? parseFloat(unit.priceS.replace(/[^0-9.-]/g, '')) : null,
          group: unit.group,
          week: unit.week,
          sinceDate: unit.onServiceSince,
          lastDate: unit.lastServiceOn,
          installDate: unit.installed,
          installBy: unit.installedBy,
          premisesId: unit.accountId,
          remarks: remarks,
          custom1: unitCustom.testIncluded,
          custom2: unitCustom.testCustomPricing,
          custom3: unitCustom.custom3,
          custom4: unitCustom.custom4,
          custom5: unitCustom.custom5,
          custom6: unitCustom.custom6,
          custom7: unitCustom.custom7,
          custom8: unitCustom.custom8,
          custom9: unitCustom.custom9,
          custom10: unitCustom.custom10,
          custom11: unitCustom.custom11,
          custom12: unitCustom.custom12,
          custom13: unitCustom.custom13,
          custom14: unitCustom.custom14,
          custom15: unitCustom.custom15,
          custom16: unitCustom.custom16,
          custom17: unitCustom.custom17,
          custom18: unitCustom.custom18,
          custom19: unitCustom.custom19,
          custom20: unitCustom.custom20,
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        const updatedUnit: UnitData = {
          id: updated.id,
          unitNumber: updated.unitNumber || "",
          description: updated.description || "",
          stateNumber: updated.state || "",
          template: updated.template || "Standard",
          category: updated.cat || "",
          type: updated.unitType || "Elevator",
          building: updated.building || "",
          accountId: updated.premisesId || "",
          accountTag: updated.premises?.address || updated.premises?.premisesId || "",
          status: updated.status || "Active",
          group: updated.group || "",
          onServiceSince: updated.sinceDate ? new Date(updated.sinceDate).toLocaleDateString() : "",
          lastServiceOn: updated.lastDate ? new Date(updated.lastDate).toLocaleDateString() : "",
          installed: updated.installDate ? new Date(updated.installDate).toLocaleDateString() : "",
          installedBy: updated.installBy || "",
          manufacturer: updated.manufacturer || "",
          serialNumber: updated.serial || "",
          priceS: updated.price ? `$${parseFloat(updated.price).toFixed(2)}` : "$0.00",
          week: updated.week || "",
        };
        setUnit(updatedUnit);
        setOriginalUnit(updatedUnit);
        setOriginalTemplateCustom([...templateCustomFields]);
        setOriginalTests([...tests]);
        setOriginalRemarks(updated.remarks || "");
        setRemarks(updated.remarks || "");
        setOriginalUnitCustom({ ...unitCustom });
        setHasChanges(false);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving unit:", error);
    }
  };

  const handleUndo = () => {
    if (originalUnit) {
      setUnit({ ...originalUnit });
      setTemplateCustomFields([...originalTemplateCustom]);
      setTests([...originalTests]);
      setRemarks(originalRemarks);
      if (originalUnitCustom) {
        setUnitCustom({ ...originalUnitCustom });
      }
      setHasChanges(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // Navigate to Account
  const handleNavigateToAccount = () => {
    if (unit.accountId) {
      openTab(unit.accountTag, `/accounts/${unit.accountId}`);
    }
  };

  // Template Custom handlers
  const handleTemplateFieldChange = (index: number, value: string) => {
    const updated = [...templateCustomFields];
    updated[index].value = value;
    setTemplateCustomFields(updated);
  };

  // Test handlers
  const handleAddTest = () => {
    setEditingTest(null);
    setNewTest({
      name: "",
      status: "No Proposal",
      last: "",
      next: "",
      ticketed: false,
      ticket: "",
    });
    setShowAddTestDialog(true);
  };

  const handleCreateTest = () => {
    if (!newTest.name) {
      alert("Please enter a test name");
      return;
    }

    const test: Test = {
      id: String(tests.length + 1),
      name: newTest.name || "",
      status: newTest.status || "No Proposal",
      last: newTest.last || "",
      next: newTest.next || "",
      ticketed: newTest.ticketed || false,
      ticket: newTest.ticket || "",
    };

    setTests([...tests, test]);
    setShowAddTestDialog(false);
  };

  const handleTestTicketedChange = (testId: string, checked: boolean) => {
    setTests(tests.map(t => t.id === testId ? { ...t, ticketed: checked } : t));
  };

  const handleEditTest = () => {
    if (!selectedTest) return;
    setEditingTest(selectedTest);
    setNewTest({
      name: selectedTest.name,
      status: selectedTest.status,
      last: selectedTest.last,
      next: selectedTest.next,
      ticketed: selectedTest.ticketed,
      ticket: selectedTest.ticket,
    });
    setShowAddTestDialog(true);
  };

  const handleUpdateTest = () => {
    if (!editingTest) return;
    setTests(tests.map(t => {
      if (t.id === editingTest.id) {
        return {
          ...t,
          name: newTest.name || "",
          status: newTest.status || "No Proposal",
          last: newTest.last || "",
          next: newTest.next || "",
          ticketed: newTest.ticketed || false,
          ticket: newTest.ticket || "",
        };
      }
      return t;
    }));
    setShowAddTestDialog(false);
    setEditingTest(null);
  };

  const handleDeleteTest = () => {
    if (!selectedTest) return;
    if (confirm("Delete this test?")) {
      setTests(tests.filter(t => t.id !== selectedTest.id));
      setSelectedTest(null);
    }
  };

  const templates = ["Standard", "Hydraulic", "Traction", "MRL", "Freight"];
  const categories = ["CONSULTANT", "N/A", "Other", "Private", "Public", "Service"];
  const types = ["Elevator", "Hydraulic", "Service", "Escalator", "Dumbwaiter"];
  const buildings = ["Hospital", "Office / Commercial", "Store / Retail", "School", "Residential", "Other"];
  const statuses = ["Active", "Inactive", "Pending", "On Hold"];
  const testStatuses = ["No Proposal", "Job Awarded", "Proposal Sent", "Completed", "Cancelled"];

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
        <span className="font-bold text-[13px]">Editing Unit '{unit.unitNumber}'</span>
        <button onClick={() => confirmNavigation(() => onClose())} className="hover:bg-[#c0c0c0] hover:text-black px-2 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">PIM</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Move</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Save"
        >
          <Save className="w-4 h-4" style={{ color: "#4a90d9" }} />
        </button>
        <button
          onClick={handleUndo}
          disabled={!hasChanges}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[11px] font-bold" style={{ color: "#e74c3c" }}>✓</span>
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[11px]" style={{ color: "#3498db" }}>ABC</span>
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[12px]" style={{ color: "#9b59b6" }}>🔗</span>
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[11px]" style={{ color: "#27ae60" }}>◯</span>
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronsLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronsRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button onClick={() => confirmNavigation(() => onClose())} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
      </div>

      {/* Tabs - Two rows */}
      <div className="bg-[#f5f5f5] px-2 pt-2">
        {/* Secondary Tab Row (Unit Custom) */}
        <div className="flex">
          <button
            onClick={() => setActiveTab("unitCustom")}
            className={`px-4 py-1 border border-b-0 text-[12px] ${
              activeTab === "unitCustom"
                ? "bg-[#f5f5f5] border-[#808080] font-medium -mb-px z-10"
                : "bg-[#d4d0c8] border-[#808080] text-[#606060]"
            }`}
          >
            5 Unit Custom
          </button>
        </div>
        {/* Primary Tab Row */}
        <div className="flex border-b border-[#808080]">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-1 border border-b-0 text-[12px] ${
              activeTab === "general"
                ? "bg-[#f5f5f5] border-[#808080] font-medium -mb-px z-10"
                : "bg-[#d4d0c8] border-[#808080] text-[#606060]"
            }`}
          >
            1 General
          </button>
          <button
            onClick={() => setActiveTab("templateCustom")}
            className={`px-4 py-1 border border-b-0 text-[12px] ${
              activeTab === "templateCustom"
                ? "bg-[#f5f5f5] border-[#808080] font-medium -mb-px z-10"
                : "bg-[#d4d0c8] border-[#808080] text-[#606060]"
            }`}
          >
            2 Template Custom
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-4 py-1 border border-b-0 text-[12px] ${
              activeTab === "tests"
                ? "bg-[#f5f5f5] border-[#808080] font-medium -mb-px z-10"
                : "bg-[#d4d0c8] border-[#808080] text-[#606060]"
            }`}
          >
            3 Tests
          </button>
          <button
            onClick={() => setActiveTab("remarks")}
            className={`px-4 py-1 border border-b-0 text-[12px] ${
              activeTab === "remarks"
                ? "bg-[#f5f5f5] border-[#808080] font-medium -mb-px z-10"
                : "bg-[#d4d0c8] border-[#808080] text-[#606060]"
            }`}
          >
            4 Remarks
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-[#f5f5f5] p-4">
        {/* General Tab */}
        {activeTab === "general" && (
          <div className="flex gap-8">
            {/* Left Column */}
            <div className="flex flex-col gap-2 min-w-[280px]">
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Unit #</label>
                <input
                  type="text"
                  value={unit.unitNumber}
                  onChange={(e) => setUnit({ ...unit, unitNumber: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#ffffe1]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Description</label>
                <input
                  type="text"
                  value={unit.description}
                  onChange={(e) => setUnit({ ...unit, description: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">State #</label>
                <input
                  type="text"
                  value={unit.stateNumber}
                  onChange={(e) => setUnit({ ...unit, stateNumber: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Template</label>
                <select
                  value={unit.template}
                  onChange={(e) => setUnit({ ...unit, template: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  {templates.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Category</label>
                <select
                  value={unit.category}
                  onChange={(e) => setUnit({ ...unit, category: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Type</label>
                <select
                  value={unit.type}
                  onChange={(e) => setUnit({ ...unit, type: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Building</label>
                <select
                  value={unit.building}
                  onChange={(e) => setUnit({ ...unit, building: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  {buildings.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Account</label>
                <div className="flex-1 flex gap-1">
                  <input
                    type="text"
                    value={unit.accountTag}
                    readOnly
                    onClick={handleNavigateToAccount}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white text-[#0000ff] cursor-pointer hover:underline"
                    title="Click to open account"
                  />
                  <button className="px-2 border border-[#7f9db9] bg-white text-[12px]">...</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Status</label>
                <select
                  value={unit.status}
                  onChange={(e) => setUnit({ ...unit, status: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-2 min-w-[280px]">
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Group</label>
                <select
                  value={unit.group}
                  onChange={(e) => setUnit({ ...unit, group: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  <option value=""></option>
                  <option value="Group A">Group A</option>
                  <option value="Group B">Group B</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">On Service Since</label>
                <div className="flex-1 flex gap-1">
                  <input
                    type="text"
                    value={unit.onServiceSince}
                    onChange={(e) => setUnit({ ...unit, onServiceSince: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                  <button className="px-2 border border-[#7f9db9] bg-white text-[12px]">...</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Last Service On</label>
                <div className="flex-1 flex gap-1">
                  <input
                    type="text"
                    value={unit.lastServiceOn}
                    onChange={(e) => setUnit({ ...unit, lastServiceOn: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                  <button className="px-2 border border-[#7f9db9] bg-white text-[12px]">...</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Installed</label>
                <div className="flex-1 flex gap-1">
                  <input
                    type="text"
                    value={unit.installed}
                    onChange={(e) => setUnit({ ...unit, installed: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                  <button className="px-2 border border-[#7f9db9] bg-white text-[12px]">...</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Installed By</label>
                <input
                  type="text"
                  value={unit.installedBy}
                  onChange={(e) => setUnit({ ...unit, installedBy: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Manufacturer</label>
                <input
                  type="text"
                  value={unit.manufacturer}
                  onChange={(e) => setUnit({ ...unit, manufacturer: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Serial Number</label>
                <input
                  type="text"
                  value={unit.serialNumber}
                  onChange={(e) => setUnit({ ...unit, serialNumber: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Price (S)</label>
                <input
                  type="text"
                  value={unit.priceS}
                  onChange={(e) => setUnit({ ...unit, priceS: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Week</label>
                <input
                  type="text"
                  value={unit.week}
                  onChange={(e) => setUnit({ ...unit, week: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Template Custom Tab */}
        {activeTab === "templateCustom" && (
          <div className="bg-white border border-[#808080]">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-[#f0f0f0]">
                <tr>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "40%" }}>Field</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Value</th>
                </tr>
              </thead>
              <tbody>
                {templateCustomFields.map((field, index) => (
                  <tr key={field.field}>
                    <td className="px-2 py-1 border border-[#e0e0e0] bg-[#f8f8f8]">{field.field}</td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleTemplateFieldChange(index, e.target.value)}
                        className="w-full px-1 py-0 border-0 text-[12px] bg-transparent focus:outline-none focus:bg-[#ffffe1]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === "tests" && (
          <div className="flex flex-col h-full">
            <div className="bg-white border border-[#808080] flex-1 overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f0f0f0] sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "20px" }}></th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Name</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Status</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Last</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Next</th>
                    <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]">Ticketed</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr
                      key={test.id}
                      onClick={() => setSelectedTest(test)}
                      className={`cursor-pointer ${selectedTest?.id === test.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"}`}
                    >
                      <td className="px-2 py-1 border border-[#e0e0e0]">
                        {selectedTest?.id === test.id && "▶"}
                      </td>
                      <td className="px-2 py-1 border border-[#e0e0e0]">{test.name}</td>
                      <td className="px-2 py-1 border border-[#e0e0e0]">{test.status}</td>
                      <td className="px-2 py-1 border border-[#e0e0e0]">{test.last}</td>
                      <td className="px-2 py-1 border border-[#e0e0e0]">{test.next}</td>
                      <td className="px-2 py-1 border border-[#e0e0e0] text-center">
                        <input
                          type="checkbox"
                          checked={test.ticketed}
                          onChange={(e) => handleTestTicketedChange(test.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-2 py-1 border border-[#e0e0e0]">{test.ticket}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAddTest}
                className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
              >
                Add
              </button>
              <button
                onClick={handleEditTest}
                disabled={!selectedTest}
                className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] disabled:opacity-50"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteTest}
                disabled={!selectedTest}
                className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Remarks Tab */}
        {activeTab === "remarks" && (
          <div className="h-full">
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-64 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white resize-none focus:outline-none"
              placeholder="Enter remarks..."
            />
          </div>
        )}

        {/* Unit Custom Tab */}
        {activeTab === "unitCustom" && (
          <div className="flex gap-8">
            {/* Left Column */}
            <div className="flex flex-col gap-2 min-w-[280px]">
              <div className="flex items-center gap-2">
                <label className="w-32 text-[12px]">Test Included</label>
                <input
                  type="text"
                  value={unitCustom.testIncluded}
                  onChange={(e) => setUnitCustom({ ...unitCustom, testIncluded: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-[12px]">Test Custom Pricing</label>
                <input
                  type="text"
                  value={unitCustom.testCustomPricing}
                  onChange={(e) => setUnitCustom({ ...unitCustom, testCustomPricing: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-[12px]">Custom3</label>
                <input
                  type="text"
                  value={unitCustom.custom3}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom3: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-[12px]">Custom4</label>
                <input
                  type="text"
                  value={unitCustom.custom4}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom4: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-[12px]">Custom5</label>
                <input
                  type="text"
                  value={unitCustom.custom5}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom5: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-[12px]">Custom6</label>
                <input
                  type="text"
                  value={unitCustom.custom6}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom6: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-[12px]">Custom7</label>
                <input
                  type="text"
                  value={unitCustom.custom7}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom7: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-[12px]">Custom8</label>
                <input
                  type="text"
                  value={unitCustom.custom8}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom8: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-[12px]">Custom9</label>
                <input
                  type="text"
                  value={unitCustom.custom9}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom9: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-32 text-[12px]">Custom10</label>
                <input
                  type="text"
                  value={unitCustom.custom10}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom10: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-2 min-w-[280px]">
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom11</label>
                <input
                  type="text"
                  value={unitCustom.custom11}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom11: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom12</label>
                <input
                  type="text"
                  value={unitCustom.custom12}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom12: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom13</label>
                <input
                  type="text"
                  value={unitCustom.custom13}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom13: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom14</label>
                <input
                  type="text"
                  value={unitCustom.custom14}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom14: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom15</label>
                <input
                  type="text"
                  value={unitCustom.custom15}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom15: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom16</label>
                <input
                  type="text"
                  value={unitCustom.custom16}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom16: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom17</label>
                <input
                  type="text"
                  value={unitCustom.custom17}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom17: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom18</label>
                <input
                  type="text"
                  value={unitCustom.custom18}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom18: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom19</label>
                <input
                  type="text"
                  value={unitCustom.custom19}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom19: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom20</label>
                <input
                  type="text"
                  value={unitCustom.custom20}
                  onChange={(e) => setUnitCustom({ ...unitCustom, custom20: e.target.value })}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center text-[11px]">
        <button
          onClick={handleEdit}
          className={`px-4 py-1 border border-[#808080] ${isEditing ? "bg-[#e0e0e0]" : "bg-[#f0f0f0] hover:bg-[#e0e0e0]"} text-[12px]`}
        >
          EDIT
        </button>
        <span className="flex-1" />
        {hasChanges && <span className="text-[#c00] mr-4">Unsaved changes</span>}
      </div>

      {/* Add/Edit Test Dialog */}
      {showAddTestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "400px" }}>
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">{editingTest ? "Edit Test" : "Add Test"}</span>
              <button
                onClick={() => { setShowAddTestDialog(false); setEditingTest(null); }}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Name</label>
                  <input
                    type="text"
                    value={newTest.name || ""}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Status</label>
                  <select
                    value={newTest.status || "No Proposal"}
                    onChange={(e) => setNewTest({ ...newTest, status: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    {testStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Last</label>
                  <input
                    type="text"
                    value={newTest.last || ""}
                    onChange={(e) => setNewTest({ ...newTest, last: e.target.value })}
                    placeholder="MM/DD/YYYY"
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Next</label>
                  <input
                    type="text"
                    value={newTest.next || ""}
                    onChange={(e) => setNewTest({ ...newTest, next: e.target.value })}
                    placeholder="MM/DD/YYYY"
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#808080]">
                <button
                  onClick={editingTest ? handleUpdateTest : handleCreateTest}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  OK
                </button>
                <button
                  onClick={() => { setShowAddTestDialog(false); setEditingTest(null); }}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onSave={handleDialogSave}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
        saving={savingFromHook}
      />
    </div>
  );
}
