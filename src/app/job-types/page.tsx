"use client";

import { useState, useEffect } from "react";
import { useXPDialog } from "@/components/ui/XPDialog";
import {
  X,
  Check,
  Type,
  Scissors,
  Copy,
  ClipboardPaste,
  RotateCcw,
  Home,
  HelpCircle,
} from "lucide-react";
import { getJobTypes } from "@/lib/actions/job-templates";

interface JobType {
  id: string;
  name: string;
  type: string;
  count: number;
  color: string | null;
  remarks: string;
}

const COLOR_OPTIONS = [
  "",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Purple",
  "Pink",
  "Brown",
  "Gray",
  "Black",
  "White",
];

export default function JobTypesPage() {
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<JobType>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [sqlServerError, setSqlServerError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobTypes();
  }, []);

  const fetchJobTypes = async () => {
    try {
      // Use Server Action - pulls from SQL Server
      const data = await getJobTypes();

      setJobTypes(data);
      setSqlServerError(null);
      // Select first item by default
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
        setFormData(data[0]);
      }
    } catch (error) {
      console.error("Error fetching job types:", error);
      setSqlServerError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRow = async (jt: JobType) => {
    if (isDirty) {
      if (!(await xpConfirm("You have unsaved changes. Discard them?"))) {
        return;
      }
    }
    setSelectedId(jt.id);
    setFormData(jt);
    setIsDirty(false);
  };

  const handleChange = (field: keyof JobType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      await xpAlert("Name is required");
      return;
    }
    try {
      if (selectedId) {
        const response = await fetch(`/api/job-types/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          await fetchJobTypes();
          setIsDirty(false);
          await xpAlert("Job type saved successfully");
        } else {
          const error = await response.json();
          await xpAlert(error.error || "Failed to save job type");
        }
      } else {
        const response = await fetch("/api/job-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const created = await response.json();
          await fetchJobTypes();
          setSelectedId(created.id);
          setIsDirty(false);
          await xpAlert("Job type created successfully");
        } else {
          const error = await response.json();
          await xpAlert(error.error || "Failed to create job type");
        }
      }
    } catch (error) {
      console.error("Error saving job type:", error);
      await xpAlert("Failed to save job type");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!(await xpConfirm("Are you sure you want to delete this job type?"))) return;
    try {
      const response = await fetch(`/api/job-types/${selectedId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchJobTypes();
        setSelectedId(null);
        setFormData({});
        setIsDirty(false);
      } else {
        const error = await response.json();
        await xpAlert(error.error || "Failed to delete job type");
      }
    } catch (error) {
      console.error("Error deleting job type:", error);
      await xpAlert("Failed to delete job type");
    }
  };

  const handleNew = async () => {
    if (isDirty) {
      if (!(await xpConfirm("You have unsaved changes. Discard them?"))) {
        return;
      }
    }
    setSelectedId(null);
    setFormData({ name: "", description: "", isActive: true });
    setIsDirty(false);
  };

  const selectedType = jobTypes.find((jt) => jt.id === selectedId);

  return (
    <div
      className="h-full flex flex-col bg-[#f0f0f0]"
      style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] text-white px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-yellow-300 text-lg">⚙</span>
          <span className="font-semibold text-[13px]">Setup Job Template Types</span>
        </div>
        <button className="hover:bg-red-500 px-2 rounded text-white">×</button>
      </div>

      {/* Menu Bar */}
      <div className="bg-[#f0f0f0] flex items-center px-1 border-b border-[#a0a0a0]">
        <span className="px-3 py-1 hover:bg-[#d0d0d0] cursor-pointer">File</span>
        <span className="px-3 py-1 hover:bg-[#d0d0d0] cursor-pointer">Tools</span>
        <span className="px-3 py-1 hover:bg-[#d0d0d0] cursor-pointer">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f0f0f0] flex items-center px-1 py-1 border-b border-[#a0a0a0] gap-0.5">
        <button
          onClick={handleDelete}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#d0d0d0] rounded border border-transparent hover:border-[#808080]"
          title="Delete"
        >
          <X className="w-4 h-4 text-red-600" />
        </button>
        <button
          onClick={handleSave}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#d0d0d0] rounded border border-transparent hover:border-[#808080]"
          title="Save"
        >
          <Check className="w-4 h-4 text-green-600" />
        </button>
        <button
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#d0d0d0] rounded border border-transparent hover:border-[#808080]"
          title="ABC"
        >
          <span className="text-[10px] font-bold text-red-600">ABC</span>
        </button>
        <div className="w-px h-5 bg-[#a0a0a0] mx-1" />
        <button
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#d0d0d0] rounded border border-transparent hover:border-[#808080]"
          title="Cut"
        >
          <Scissors className="w-4 h-4 text-[#666]" />
        </button>
        <button
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#d0d0d0] rounded border border-transparent hover:border-[#808080]"
          title="Copy"
        >
          <Copy className="w-4 h-4 text-[#666]" />
        </button>
        <button
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#d0d0d0] rounded border border-transparent hover:border-[#808080]"
          title="Paste"
        >
          <ClipboardPaste className="w-4 h-4 text-[#666]" />
        </button>
        <button
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#d0d0d0] rounded border border-transparent hover:border-[#808080]"
          title="Undo"
        >
          <RotateCcw className="w-4 h-4 text-[#666]" />
        </button>
        <div className="w-px h-5 bg-[#a0a0a0] mx-1" />
        <button
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#d0d0d0] rounded border border-transparent hover:border-[#808080]"
          title="Home"
        >
          <Home className="w-4 h-4 text-[#d4a574]" />
        </button>
        <button
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#d0d0d0] rounded border border-transparent hover:border-[#808080]"
          title="Help"
        >
          <HelpCircle className="w-4 h-4 text-[#0066cc]" />
        </button>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex p-2 gap-4 overflow-hidden">
        {/* Left - List Grid */}
        <div className="w-[200px] flex flex-col border border-[#808080] bg-white">
          {/* Column Headers */}
          <div className="flex bg-[#f0f0f0] border-b border-[#808080]">
            <div className="flex-1 px-2 py-1 text-[11px] font-medium border-r border-[#c0c0c0]">
              Type
            </div>
            <div className="w-[50px] px-2 py-1 text-[11px] font-medium text-right">
              Count
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-2 text-center text-gray-500">Loading...</div>
            ) : sqlServerError ? (
              <div className="p-2 text-center text-red-600 text-[11px]">
                {sqlServerError}
              </div>
            ) : (
              jobTypes.map((jt) => (
                <div
                  key={jt.id}
                  onClick={() => handleSelectRow(jt)}
                  className={`flex cursor-pointer ${
                    selectedId === jt.id
                      ? "bg-[#0078d4] text-white"
                      : "hover:bg-[#e8e8e8]"
                  }`}
                >
                  <div className="flex-1 px-2 py-0.5 text-[11px] truncate border-r border-[#e0e0e0]">
                    {jt.type}
                  </div>
                  <div className="w-[50px] px-2 py-0.5 text-[11px] text-right">
                    {jt.count}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right - Edit Form */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Type Field */}
          <div className="flex items-center gap-2">
            <label className="w-[60px] text-[11px] text-right">Type</label>
            <input
              type="text"
              value={formData.type || ""}
              onChange={(e) => handleChange("type", e.target.value)}
              className="w-[150px] px-2 py-1 border border-[#808080] bg-[#ffffd8] text-[11px]"
            />
          </div>

          {/* Count Field */}
          <div className="flex items-center gap-2">
            <label className="w-[60px] text-[11px] text-right">Count</label>
            <input
              type="number"
              value={formData.count || 0}
              onChange={(e) => handleChange("count", parseInt(e.target.value) || 0)}
              className="w-[150px] px-2 py-1 border border-[#808080] bg-white text-[11px]"
            />
          </div>

          {/* Color Field */}
          <div className="flex items-center gap-2">
            <label className="w-[60px] text-[11px] text-right">Color</label>
            <select
              value={formData.color || ""}
              onChange={(e) => handleChange("color", e.target.value)}
              className="w-[150px] px-2 py-1 border border-[#808080] bg-white text-[11px]"
            >
              {COLOR_OPTIONS.map((color) => (
                <option key={color} value={color}>
                  {color || "(None)"}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks Field */}
          <div className="flex items-start gap-2">
            <label className="w-[60px] text-[11px] text-right pt-1">Remarks</label>
            <textarea
              value={formData.remarks || ""}
              onChange={(e) => handleChange("remarks", e.target.value)}
              className="w-[200px] h-[120px] px-2 py-1 border border-[#808080] bg-white text-[11px] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#f0f0f0] border-t border-[#a0a0a0] px-1 py-1 flex items-center text-[11px]">
        <div className="w-[100px] px-2 border-r border-[#808080]">
          {selectedType?.type || ""}
        </div>
        <div className="w-[60px] px-2 border-r border-[#808080]">
          <button className="hover:bg-[#d0d0d0] px-2">EDIT</button>
        </div>
        <div className="flex-1" />
        <div className="px-2">{jobTypes.length} types</div>
      </div>
      <XPDialogComponent />
    </div>
  );
}
