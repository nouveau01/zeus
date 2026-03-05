"use client";

import { useState, useEffect } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { useXPDialog } from "@/components/ui/XPDialog";

export function SystemPanel() {
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [authRequired, setAuthRequired] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/system-settings");
      if (res.ok) {
        const data = await res.json();
        setAuthRequired(data.authRequired);
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuth = async () => {
    const newValue = !authRequired;
    const message = newValue
      ? "Enable authentication? Users will need to sign in with Google."
      : "Disable authentication? Anyone will be able to access the platform without signing in.";

    const confirmed = await xpConfirm(message);
    if (!confirmed) return;

    setSaving(true);
    try {
      const res = await fetch("/api/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authRequired: newValue }),
      });

      if (res.ok) {
        const data = await res.json();
        setAuthRequired(data.authRequired);
        await xpAlert(
          newValue
            ? "Authentication enabled. Users must sign in."
            : "Authentication disabled. No sign-in required."
        );
      } else {
        await xpAlert("Failed to update setting.");
      }
    } catch (error) {
      console.error("Error updating system settings:", error);
      await xpAlert("Failed to update setting.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-[#666]" />
      </div>
    );
  }

  return (
    <div className="p-4" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      <XPDialogComponent />

      <div className="mb-4">
        <h2 className="text-[14px] font-semibold text-[#333] mb-1">System</h2>
        <p className="text-[11px] text-[#666]">Platform-wide configuration and diagnostics.</p>
      </div>

      {/* Authentication Section */}
      <div className="border border-[#d0d0d0] rounded bg-white mb-4">
        <div className="bg-[#f0f0f0] px-3 py-2 border-b border-[#d0d0d0] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#333]" />
          <span className="font-semibold text-[12px]">Authentication</span>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-medium text-[#333]">Require Sign-In</div>
              <div className="text-[11px] text-[#666] mt-0.5">
                {authRequired
                  ? "Users must sign in with Google to access the platform."
                  : "Authentication is disabled. Anyone can access the platform."}
              </div>
            </div>
            <button
              onClick={handleToggleAuth}
              disabled={saving}
              className={`relative w-[44px] h-[22px] rounded-full transition-colors ${
                authRequired ? "bg-[#0078d4]" : "bg-[#ccc]"
              } ${saving ? "opacity-50" : "cursor-pointer"}`}
            >
              <div
                className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
                  authRequired ? "left-[24px]" : "left-[2px]"
                }`}
              />
            </button>
          </div>

          {!authRequired && (
            <div className="mt-3 p-2 bg-[#fff3cd] border border-[#ffc107] rounded text-[11px] text-[#856404]">
              Authentication is currently OFF. The login screen is bypassed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
