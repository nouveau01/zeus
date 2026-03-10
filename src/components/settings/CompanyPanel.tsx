"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Upload, Trash2, Building2, Link, Palette, Sparkles, Loader2 } from "lucide-react";

interface CompanyData {
  companyName: string;
  companySubtitle: string;
  address: string;
  phone: string;
  fax: string;
  website: string;
  logoBase64: string;
  logoUrl: string;
  removeLogoBg: boolean;
  themeMode: string; // "auto" | "manual"
  brandColor: string;
  extractedColors: string; // JSON array
}

const EMPTY: CompanyData = {
  companyName: "",
  companySubtitle: "",
  address: "",
  phone: "",
  fax: "",
  website: "",
  logoBase64: "",
  logoUrl: "",
  removeLogoBg: false,
  themeMode: "auto",
  brandColor: "",
  extractedColors: "[]",
};

export function CompanyPanel() {
  const [form, setForm] = useState<CompanyData>(EMPTY);
  const [original, setOriginal] = useState<CompanyData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsed extracted colors
  const extractedColors: string[] = (() => {
    try { return JSON.parse(form.extractedColors) || []; } catch { return []; }
  })();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/company-settings");
        if (res.ok) {
          const data = await res.json();
          const d = dataToForm(data);
          setForm(d);
          setOriginal(d);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function dataToForm(data: any): CompanyData {
    return {
      companyName: data.companyName || "",
      companySubtitle: data.companySubtitle || "",
      address: data.address || "",
      phone: data.phone || "",
      fax: data.fax || "",
      website: data.website || "",
      logoBase64: data.logoBase64 || "",
      logoUrl: data.logoUrl || "",
      removeLogoBg: data.removeLogoBg || false,
      themeMode: data.themeMode || "auto",
      brandColor: data.brandColor || "",
      extractedColors: data.extractedColors || "[]",
    };
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  const setField = (field: keyof CompanyData, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file (PNG, JPG, SVG, etc.)");
      return;
    }

    if (file.size > 500 * 1024) {
      setMessage("Logo must be under 500KB. Please resize or compress the image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setField("logoBase64", base64);
      setMessage("");

      // Auto-extract colors from the new logo
      await processLogo(base64, form.removeLogoBg);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const processLogo = async (logoBase64: string, removeBg: boolean) => {
    if (!logoBase64) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/company-settings/process-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoBase64, removeBackground: removeBg }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update extracted colors
        if (data.extractedColors?.length) {
          setField("extractedColors", JSON.stringify(data.extractedColors));
        }
        // If bg was removed, update the logo
        if (removeBg && data.processedLogo) {
          setForm((f) => ({ ...f, logoBase64: data.processedLogo, extractedColors: JSON.stringify(data.extractedColors || []) }));
        }
      }
    } catch {
      // silently fail — colors are optional
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveLogo = () => {
    setForm((f) => ({ ...f, logoBase64: "", extractedColors: "[]" }));
  };

  const handleToggleRemoveBg = async (checked: boolean) => {
    setField("removeLogoBg", checked);
    if (checked && form.logoBase64) {
      // Process the logo to remove background now
      await processLogo(form.logoBase64, true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/company-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const d = dataToForm(data);
      setForm(d);
      setOriginal(d);
      setMessage("Company settings saved successfully.");
    } catch {
      setMessage("Failed to save company settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[12px] text-[#666]">
        Loading...
      </div>
    );
  }

  const labelStyle = "text-[11px] text-[#333] font-medium whitespace-nowrap";
  const inputStyle =
    "border border-[#c0c0c0] px-2 py-1 text-[12px] rounded w-full bg-white focus:outline-none focus:border-[#0078d4]";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#d0d0d0] bg-[#fafafa]">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-[#0078d4]" />
          <div>
            <h2 className="text-[15px] font-semibold text-[#333]">Company Settings</h2>
            <p className="text-[11px] text-[#666]">
              Configure company info, logo, and branding used on proposals, presentations, and documents.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Logo Section */}
          <div className="bg-white border border-[#d0d0d0] rounded p-4">
            <h3 className="text-[13px] font-semibold text-[#333] mb-3">
              Company Logo
            </h3>
            <p className="text-[11px] text-[#666] mb-3">
              Used on proposal PDFs, presentations, contracts, and other generated documents.
              Recommended: PNG or JPG, max 500KB, landscape orientation.
            </p>

            {form.logoBase64 ? (
              <div className="space-y-3">
                <div className="border border-[#e0e0e0] rounded p-3 bg-[#fafafa] inline-block">
                  <img
                    src={form.logoBase64}
                    alt="Company logo"
                    className="max-h-[60px] max-w-[300px] object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
                  >
                    <Upload className="w-3 h-3" /> Replace
                  </button>
                  <button
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[#c0392b]"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>

                {/* Remove Background Checkbox */}
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.removeLogoBg}
                    onChange={(e) => handleToggleRemoveBg(e.target.checked)}
                    className="accent-[#0078d4]"
                  />
                  <span className="text-[11px] text-[#333]">
                    Remove background for presentations, proposals, contracts, and documents
                  </span>
                  {processing && <Loader2 className="w-3 h-3 text-[#0078d4] animate-spin" />}
                </label>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-[#c0c0c0] rounded text-[12px] text-[#666] hover:border-[#0078d4] hover:text-[#0078d4] transition-colors w-full justify-center"
              >
                <Upload className="w-4 h-4" />
                Click to upload logo image
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          {/* Logo URL for Presentations */}
          <div className="bg-white border border-[#d0d0d0] rounded p-4">
            <h3 className="text-[13px] font-semibold text-[#333] mb-1">
              Logo URL (for Presentations)
            </h3>
            <p className="text-[11px] text-[#666] mb-3">
              Paste a public URL to your logo (e.g. from Imgur, your website, or any image host).
              The Presentation Builder requires a publicly accessible image URL.
            </p>
            <div className="flex items-center gap-2">
              <Link className="w-3.5 h-3.5 text-[#666] flex-shrink-0" />
              <input
                className={inputStyle}
                value={form.logoUrl}
                onChange={(e) => setField("logoUrl", e.target.value)}
                placeholder="https://i.imgur.com/yourlogo.png"
              />
            </div>
            {form.logoUrl && (
              <div className="mt-2 border border-[#e0e0e0] rounded p-2 bg-[#fafafa] inline-block">
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  className="max-h-[40px] max-w-[200px] object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>

          {/* Brand Theme / Colors */}
          <div className="bg-white border border-[#d0d0d0] rounded p-4">
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4 text-[#0078d4]" />
              <h3 className="text-[13px] font-semibold text-[#333]">
                Brand Theme
              </h3>
            </div>
            <p className="text-[11px] text-[#666] mb-3">
              Controls the color scheme used in presentations, templates, and generated documents.
            </p>

            {/* Toggle: Auto vs Manual */}
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="themeMode"
                  value="auto"
                  checked={form.themeMode === "auto"}
                  onChange={() => setField("themeMode", "auto")}
                  className="accent-[#0078d4]"
                />
                <span className="text-[12px] text-[#333] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#d4a017]" />
                  Extract from logo
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="themeMode"
                  value="manual"
                  checked={form.themeMode === "manual"}
                  onChange={() => setField("themeMode", "manual")}
                  className="accent-[#0078d4]"
                />
                <span className="text-[12px] text-[#333]">Pick manually</span>
              </label>
            </div>

            {form.themeMode === "auto" ? (
              <div>
                {extractedColors.length > 0 ? (
                  <div>
                    <p className="text-[11px] text-[#666] mb-2">Colors detected from your logo:</p>
                    <div className="flex items-center gap-2">
                      {extractedColors.map((color, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div
                            className="w-10 h-10 rounded border border-[#c0c0c0] shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                          <span className="text-[9px] text-[#999] font-mono">{color}</span>
                        </div>
                      ))}
                    </div>
                    {form.logoBase64 && (
                      <button
                        onClick={() => processLogo(form.logoBase64, form.removeLogoBg)}
                        disabled={processing}
                        className="mt-3 flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
                      >
                        {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[#d4a017]" />}
                        Re-extract colors
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#999] italic">
                    {form.logoBase64
                      ? "Upload or save your logo to extract brand colors automatically."
                      : "Upload a logo to automatically extract your brand colors."}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-[11px] text-[#666] mb-2">Pick your primary brand color:</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.brandColor || "#1e3a5f"}
                    onChange={(e) => setField("brandColor", e.target.value)}
                    className="w-10 h-8 border border-[#c0c0c0] rounded cursor-pointer"
                  />
                  <input
                    className={`${inputStyle} w-[120px]`}
                    value={form.brandColor}
                    onChange={(e) => setField("brandColor", e.target.value)}
                    placeholder="#1e3a5f"
                    maxLength={7}
                  />
                  {form.brandColor && (
                    <div
                      className="w-20 h-8 rounded border border-[#c0c0c0]"
                      style={{ backgroundColor: form.brandColor }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="bg-white border border-[#d0d0d0] rounded p-4">
            <h3 className="text-[13px] font-semibold text-[#333] mb-3">
              Company Information
            </h3>
            <p className="text-[11px] text-[#666] mb-3">
              This info appears on proposal PDFs and other generated documents.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${labelStyle} block mb-1`}>Company Name</label>
                  <input
                    className={inputStyle}
                    value={form.companyName}
                    onChange={(e) => setField("companyName", e.target.value)}
                    placeholder="e.g. Nouveau Elevator Industries, Inc."
                  />
                </div>
                <div>
                  <label className={`${labelStyle} block mb-1`}>Subtitle / Division</label>
                  <input
                    className={inputStyle}
                    value={form.companySubtitle}
                    onChange={(e) => setField("companySubtitle", e.target.value)}
                    placeholder="e.g. Elevator Division"
                  />
                </div>
              </div>

              <div>
                <label className={`${labelStyle} block mb-1`}>Address</label>
                <input
                  className={inputStyle}
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="e.g. 4755 37th Street, Long Island City, NY 11101"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`${labelStyle} block mb-1`}>Phone</label>
                  <input
                    className={inputStyle}
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="e.g. (718) 349-4700"
                  />
                </div>
                <div>
                  <label className={`${labelStyle} block mb-1`}>Fax</label>
                  <input
                    className={inputStyle}
                    value={form.fax}
                    onChange={(e) => setField("fax", e.target.value)}
                    placeholder="e.g. (718) 349-4747"
                  />
                </div>
                <div>
                  <label className={`${labelStyle} block mb-1`}>Website</label>
                  <input
                    className={inputStyle}
                    value={form.website}
                    onChange={(e) => setField("website", e.target.value)}
                    placeholder="e.g. www.nouveauelevator.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`flex items-center gap-1 px-4 py-1.5 border border-[#c0c0c0] rounded text-[12px] ${
                saving || !isDirty
                  ? "bg-[#e0e0e0] text-[#999]"
                  : "bg-[#4a7c59] text-white hover:bg-[#3d6b4a]"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
            {message && (
              <span
                className={`text-[11px] ${
                  message.includes("success") ? "text-[#2e7d32]" : "text-[#c0392b]"
                }`}
              >
                {message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
