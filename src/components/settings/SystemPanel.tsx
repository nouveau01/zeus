"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, RefreshCw, Phone, Puzzle, KeyRound } from "lucide-react";
import { useXPDialog } from "@/components/ui/XPDialog";

type AuthMode = "none" | "sso" | "manual";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-[44px] h-[22px] rounded-full transition-colors ${
        checked ? "bg-[#0078d4]" : "bg-[#ccc]"
      } ${disabled ? "opacity-50" : "cursor-pointer"}`}
    >
      <div
        className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
          checked ? "left-[24px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

export function SystemPanel() {
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [authMode, setAuthMode] = useState<AuthMode>("sso");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password setup state (shown when enabling manual login)
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/system-settings");
      if (res.ok) {
        const data = await res.json();
        setAuthMode(data.authMode || (data.authRequired ? "sso" : "none"));
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAuthMode = async (newMode: AuthMode) => {
    setSaving(true);
    try {
      const res = await fetch("/api/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authMode: newMode }),
      });

      if (res.ok) {
        const data = await res.json();
        const mode = data.authMode as AuthMode;
        setAuthMode(mode);

        const messages: Record<AuthMode, string> = {
          sso: "SSO enabled. Users must sign in with Google.",
          manual: "Manual login enabled. Send credentials to other users via User Management.",
          none: "Authentication disabled. No sign-in required.",
        };
        await xpAlert(messages[mode]);
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

  const handleToggleSSO = async () => {
    if (authMode === "sso") {
      const confirmed = await xpConfirm(
        "Disable SSO? Authentication will be turned off and anyone can access the platform."
      );
      if (confirmed) await updateAuthMode("none");
    } else {
      const confirmed = await xpConfirm(
        "Enable SSO? Users will need to sign in with their Google account."
      );
      if (confirmed) {
        setShowPasswordSetup(false);
        await updateAuthMode("sso");
      }
    }
  };

  const handleToggleManual = async () => {
    if (authMode === "manual") {
      const confirmed = await xpConfirm(
        "Disable manual login? Authentication will be turned off and anyone can access the platform."
      );
      if (confirmed) {
        setShowPasswordSetup(false);
        await updateAuthMode("none");
      }
    } else {
      // Show password setup form instead of switching immediately
      setShowPasswordSetup(true);
      setAdminPassword("");
      setAdminPasswordConfirm("");
      setPasswordError("");
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  };

  const handleActivateManualLogin = async () => {
    setPasswordError("");

    if (adminPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (adminPassword !== adminPasswordConfirm) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      // Step 1: Set the admin's password first
      const pwRes = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: adminPassword }),
      });

      if (!pwRes.ok) {
        const data = await pwRes.json();
        setPasswordError(data.error || "Failed to set password.");
        setSaving(false);
        return;
      }

      // Step 2: Now switch to manual mode
      setShowPasswordSetup(false);
      await updateAuthMode("manual");
    } catch {
      setPasswordError("Network error. Please try again.");
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
        <div className="p-4 space-y-4">
          {/* Toggle 1: SSO */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-medium text-[#333]">Require SSO Sign-In</div>
              <div className="text-[11px] text-[#666] mt-0.5">
                Users must sign in with their Google account.
              </div>
            </div>
            <Toggle
              checked={authMode === "sso"}
              onChange={handleToggleSSO}
              disabled={saving}
            />
          </div>

          {/* Toggle 2: Manual Login (only visible when SSO is off) */}
          {authMode !== "sso" && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-medium text-[#333]">Setup Manual Login</div>
                <div className="text-[11px] text-[#666] mt-0.5">
                  Users sign in with email and password. Send credentials via User Management.
                </div>
              </div>
              <Toggle
                checked={authMode === "manual"}
                onChange={handleToggleManual}
                disabled={saving}
              />
            </div>
          )}

          {/* Admin password setup form — shown before enabling manual login */}
          {showPasswordSetup && authMode !== "manual" && (
            <div className="border border-[#b8daff] rounded bg-[#f0f7ff] p-4">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="w-4 h-4 text-[#0078d4]" />
                <span className="text-[12px] font-semibold text-[#333]">Set Your Admin Password</span>
              </div>
              <div className="text-[11px] text-[#555] mb-3">
                You need a password to log in after enabling manual login. Other users will get theirs via User Management.
              </div>

              {passwordError && (
                <div className="mb-3 p-2 bg-[#f8d7da] border border-[#f5c6cb] rounded text-[11px] text-[#721c24]">
                  {passwordError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#666] mb-1">Password</label>
                  <input
                    ref={passwordRef}
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#666] mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={adminPasswordConfirm}
                    onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
                    placeholder="Re-enter your password"
                    onKeyDown={(e) => { if (e.key === "Enter") handleActivateManualLogin(); }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleActivateManualLogin}
                    disabled={saving}
                    className="px-4 py-1.5 text-[11px] bg-[#316ac5] text-white border border-[#003c74] hover:bg-[#2a5db0] rounded disabled:opacity-50"
                  >
                    {saving ? "Activating..." : "Set Password & Enable Manual Login"}
                  </button>
                  <button
                    onClick={() => setShowPasswordSetup(false)}
                    disabled={saving}
                    className="px-3 py-1.5 text-[11px] bg-[#f0f0f0] text-[#333] border border-[#a0a0a0] hover:bg-[#e0e0e0] rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode-specific banners */}
          {authMode === "sso" && (
            <div className="p-2 bg-[#e8f4fc] border border-[#b8daff] rounded text-[11px] text-[#004085]">
              Users must sign in with their Google account.
            </div>
          )}

          {authMode === "manual" && (
            <div className="p-2 bg-[#e8f4fc] border border-[#b8daff] rounded text-[11px] text-[#004085]">
              Users sign in with email and password. Send credentials via User Management.
            </div>
          )}

          {authMode === "none" && !showPasswordSetup && (
            <div className="p-2 bg-[#fff3cd] border border-[#ffc107] rounded text-[11px] text-[#856404]">
              Authentication is currently OFF. The login screen is bypassed.
            </div>
          )}
        </div>
      </div>

      {/* Softphone — moved to Integrations */}
      <div className="border border-[#d0d0d0] rounded bg-white mb-4">
        <div className="bg-[#f0f0f0] px-3 py-2 border-b border-[#d0d0d0] flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#333]" />
          <span className="font-semibold text-[12px]">Softphone (Twilio)</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-[11px] text-[#666]">
            <Puzzle className="w-3.5 h-3.5 text-[#0078d4] flex-shrink-0" />
            Twilio softphone setup has moved to <strong>Settings &rarr; Integrations</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
