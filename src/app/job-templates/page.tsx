"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";
import {
  FileText,
  Save,
  Pencil,
  Printer,
  X,
  Plus,
  Trash2,
  HelpCircle,
} from "lucide-react";

interface JobType {
  id: string;
  name: string;
}

interface JobTemplate {
  id: string;
  name: string;
  typeId: string | null;
  type: JobType | null;
  revNum: number;
  expNum: number;
  isActive: boolean;
  isBillable: boolean;
  isChargeable: boolean;
  defaultStatus: string | null;
  defaultContractType: string | null;
  defaultBillRate: number | null;
  defaultMarkup: number | null;
  glRevenue: number | null;
  glExpense: number | null;
  _count?: {
    jobs?: number;
  };
}

const TYPE_TABS = ["All", "Maintenance", "Modernization", "Repair", "Other", "NEW REPAIR"];

export default function JobTemplatesPage() {
  const { openTab } = useTabs();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<Partial<JobTemplate>>({});

  useEffect(() => {
    fetchTemplates();
    fetchJobTypes();
  }, []);

  const fetchTemplates = async () => {
    try {
      // Use SQL Server direct connection
      const response = await fetch("/api/sqlserver/job-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobTypes = async () => {
    try {
      // Use SQL Server direct connection
      const response = await fetch("/api/sqlserver/job-types");
      if (response.ok) {
        const data = await response.json();
        setJobTypes(data);
      }
    } catch (error) {
      console.error("Error fetching job types:", error);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (activeType === "All") return true;
    return template.type?.name === activeType;
  });

  const handleSelectTemplate = (template: JobTemplate) => {
    if (hasChanges) {
      if (!confirm("You have unsaved changes. Do you want to discard them?")) {
        return;
      }
    }
    setSelectedTemplate(template);
    setFormData(template);
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleNewTemplate = () => {
    if (hasChanges) {
      if (!confirm("You have unsaved changes. Do you want to discard them?")) {
        return;
      }
    }
    const newTemplate: Partial<JobTemplate> = {
      name: "",
      typeId: null,
      revNum: 1,
      expNum: 2,
      isActive: true,
      isBillable: true,
      isChargeable: true,
    };
    setSelectedTemplate(null);
    setFormData(newTemplate);
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleInputChange = (field: keyof JobTemplate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // SQL Server connection is read-only
    alert("Read-only mode - Changes cannot be saved to Total Service.\n\nThis view is connected directly to your SQL Server database for viewing only.");
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    // SQL Server connection is read-only
    alert("Read-only mode - Cannot delete from Total Service.");
  };

  const handleDeleteOld = async () => {
    if (!selectedTemplate?.id) return;

    if (!confirm(`Are you sure you want to delete "${selectedTemplate.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/job-templates/${selectedTemplate.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchTemplates();
        setSelectedTemplate(null);
        setFormData({});
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Error deleting template");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f0f0f0]">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#f0f0f0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Pim</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-1">
        <button
          onClick={handleNewTemplate}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="New"
        >
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={() => setIsEditing(true)}
          disabled={!selectedTemplate}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Edit"
        >
          <Pencil className="w-4 h-4" style={{ color: "#d4a574" }} />
        </button>
        <button
          onClick={handleDelete}
          disabled={!selectedTemplate}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Delete"
        >
          <X className="w-4 h-4" style={{ color: "#c45c5c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Save"
        >
          <Save className="w-4 h-4" style={{ color: hasChanges ? "#4a90d9" : "#999" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="Print"
        >
          <Printer className="w-4 h-4" style={{ color: "#6b8cae" }} />
        </button>
        <button
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="Help"
        >
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
      </div>

      {/* Type Tabs */}
      <div className="bg-white flex items-end px-2 pt-1 border-b border-[#808080]">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveType(tab)}
            className={`px-4 py-1 text-[11px] border-t border-l border-r rounded-t -mb-px ${
              activeType === tab
                ? "bg-white border-[#808080] border-b-white z-10"
                : "bg-[#d4d0c8] border-[#808080] text-[#000]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Template List */}
        <div className="w-[500px] flex flex-col border-r border-[#808080]">
          {/* Grid Header */}
          <div className="bg-[#f0f0f0] border-b border-[#808080]">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left font-medium border-r border-[#c0c0c0]" style={{ width: "45%" }}>Description</th>
                  <th className="px-2 py-1 text-left font-medium border-r border-[#c0c0c0]" style={{ width: "25%" }}>Type</th>
                  <th className="px-2 py-1 text-center font-medium border-r border-[#c0c0c0]" style={{ width: "10%" }}># Rev</th>
                  <th className="px-2 py-1 text-center font-medium border-r border-[#c0c0c0]" style={{ width: "10%" }}># Exp</th>
                  <th className="px-2 py-1 text-right font-medium" style={{ width: "10%" }}>Count</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Grid Body */}
          <div className="flex-1 overflow-auto bg-white">
            <table className="w-full border-collapse text-[11px]">
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    onDoubleClick={() => {
                      handleSelectTemplate(template);
                      setIsEditing(true);
                    }}
                    className={`cursor-pointer ${
                      selectedTemplate?.id === template.id
                        ? "bg-[#0078d4] text-white"
                        : "hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-0.5 border-b border-[#e0e0e0]" style={{ width: "45%" }}>{template.name}</td>
                    <td className="px-2 py-0.5 border-b border-[#e0e0e0]" style={{ width: "25%" }}>{template.type?.name || ""}</td>
                    <td className="px-2 py-0.5 border-b border-[#e0e0e0] text-center" style={{ width: "10%" }}>{template.revNum}</td>
                    <td className="px-2 py-0.5 border-b border-[#e0e0e0] text-center" style={{ width: "10%" }}>{template.expNum}</td>
                    <td className="px-2 py-0.5 border-b border-[#e0e0e0] text-right" style={{ width: "10%" }}>{template._count?.jobs || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 bg-white p-4 overflow-auto">
          {(selectedTemplate || isEditing) ? (
            <div className="bg-white border border-[#c0c0c0] p-4">
              <h3 className="font-bold text-[12px] mb-4">
                {selectedTemplate ? (isEditing ? "Edit Template" : "Template Details") : "New Template"}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-right text-[11px]">Name</label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white disabled:bg-[#f0f0f0]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-right text-[11px]">Type</label>
                    <select
                      value={formData.typeId || ""}
                      onChange={(e) => handleInputChange("typeId", e.target.value || null)}
                      disabled={!isEditing}
                      className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white disabled:bg-[#f0f0f0]"
                    >
                      <option value="">Select...</option>
                      {jobTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-right text-[11px]"># Rev</label>
                    <input
                      type="number"
                      value={formData.revNum || 1}
                      onChange={(e) => handleInputChange("revNum", parseInt(e.target.value) || 1)}
                      disabled={!isEditing}
                      className="w-20 px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white disabled:bg-[#f0f0f0]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-right text-[11px]"># Exp</label>
                    <input
                      type="number"
                      value={formData.expNum || 2}
                      onChange={(e) => handleInputChange("expNum", parseInt(e.target.value) || 2)}
                      disabled={!isEditing}
                      className="w-20 px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white disabled:bg-[#f0f0f0]"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-right text-[11px]">Status</label>
                    <select
                      value={formData.isActive ? "Active" : "Inactive"}
                      onChange={(e) => handleInputChange("isActive", e.target.value === "Active")}
                      disabled={!isEditing}
                      className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white disabled:bg-[#f0f0f0]"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-right text-[11px]">Billable</label>
                    <input
                      type="checkbox"
                      checked={formData.isBillable ?? true}
                      onChange={(e) => handleInputChange("isBillable", e.target.checked)}
                      disabled={!isEditing}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-right text-[11px]">Chargeable</label>
                    <input
                      type="checkbox"
                      checked={formData.isChargeable ?? true}
                      onChange={(e) => handleInputChange("isChargeable", e.target.checked)}
                      disabled={!isEditing}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-right text-[11px]">Default Bill Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.defaultBillRate || ""}
                      onChange={(e) => handleInputChange("defaultBillRate", parseFloat(e.target.value) || null)}
                      disabled={!isEditing}
                      className="w-24 px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white disabled:bg-[#f0f0f0] text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-[#c0c0c0]">
                  <button
                    onClick={handleSave}
                    className="px-4 py-1 bg-[#4a90d9] text-white text-[11px] hover:bg-[#3a7bc8] border border-[#3a7bc8]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      if (selectedTemplate) {
                        setFormData(selectedTemplate);
                      } else {
                        setFormData({});
                      }
                      setIsEditing(false);
                      setHasChanges(false);
                    }}
                    className="px-4 py-1 bg-[#f0f0f0] text-[11px] hover:bg-[#e0e0e0] border border-[#a0a0a0]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              Select a template or click New to create one
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1 flex items-center justify-between text-[11px]">
        <span>{selectedTemplate?.name || ""}</span>
        <div className="flex gap-4">
          <span>Totals Off</span>
          <span>Totals Off</span>
        </div>
      </div>
    </div>
  );
}
