"use client";

import { useState, useEffect } from "react";
import { Presentation, Phone, Mail, CheckCircle, RefreshCw, ExternalLink, Send, Save } from "lucide-react";
import { useXPDialog } from "@/components/ui/XPDialog";

const PRESENTATION_PROVIDERS = [
  { value: "zeus", label: "Zeus Built-in (Claude AI)", description: "Uses your Anthropic API key to generate slide content locally. No external service." },
  { value: "gamma", label: "Gamma.app", description: "Professional AI presentations with polished designs, themes, and images. Requires Gamma Pro account." },
];

export function IntegrationsPanel() {
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Presentation provider ──
  const [presentationProvider, setPresentationProvider] = useState("zeus");
  const [presentationApiKey, setPresentationApiKey] = useState("");
  const [presentationApiKeySet, setPresentationApiKeySet] = useState(false);
  const [presentationApiUrl, setPresentationApiUrl] = useState("");

  // ── Telephony (Twilio) ──
  const [softphoneEnabled, setSoftphoneEnabled] = useState(false);
  const [twilioConfigured, setTwilioConfigured] = useState(false);
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");
  const [callRecording, setCallRecording] = useState(false);
  const [setupAccountSid, setSetupAccountSid] = useState("");
  const [setupAuthToken, setSetupAuthToken] = useState("");
  const [setupPhoneNumber, setSetupPhoneNumber] = useState("");
  const [setupWebhookUrl, setSetupWebhookUrl] = useState("");
  const [settingUp, setSettingUp] = useState(false);

  // ── Email (SMTP) ──
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [intRes, sysRes, emailRes] = await Promise.all([
        fetch("/api/integration-settings"),
        fetch("/api/system-settings"),
        fetch("/api/email-settings"),
      ]);

      if (intRes.ok) {
        const data = await intRes.json();
        setPresentationProvider(data.presentationProvider || "zeus");
        setPresentationApiKey(data.presentationApiKey || "");
        setPresentationApiKeySet(data.presentationApiKeySet || false);
        setPresentationApiUrl(data.presentationApiUrl || "");
      }

      if (sysRes.ok) {
        const data = await sysRes.json();
        setSoftphoneEnabled(data.softphoneEnabled ?? false);
        setTwilioConfigured(data.twilioConfigured ?? false);
        setTwilioAccountSid(data.twilioAccountSid ?? "");
        setTwilioPhoneNumber(data.twilioPhoneNumber ?? "");
        setCallRecording(data.callRecording ?? false);
        if (data.twilioWebhookUrl) setSetupWebhookUrl(data.twilioWebhookUrl);
      }

      if (emailRes.ok) {
        const data = await emailRes.json();
        setSmtpHost(data.smtpHost || "");
        setSmtpPort(data.smtpPort || 587);
        setSmtpUser(data.smtpUser || "");
        setSmtpPassword(data.smtpPassword || "");
        setSmtpFrom(data.smtpFrom || "");
        setSmtpConfigured(data.isConfigured || false);
      }
    } catch (error) {
      console.error("Error fetching integration settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Presentation handlers ──
  const handleSavePresentationProvider = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/integration-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentationProvider, presentationApiKey, presentationApiUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setPresentationApiKey(data.presentationApiKey || "");
        setPresentationApiKeySet(data.presentationApiKeySet || false);
        await xpAlert("Presentation provider settings saved.");
      } else {
        await xpAlert("Failed to save settings.");
      }
    } catch {
      await xpAlert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestGammaKey = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/integration-settings/test-gamma", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        await xpAlert("Gamma API key is valid. Connection successful.");
      } else {
        await xpAlert(data.error || "Gamma API key test failed. Check your key.");
      }
    } catch {
      await xpAlert("Failed to test Gamma connection.");
    } finally {
      setSaving(false);
    }
  };

  // ── Twilio handlers ──
  const handleToggleSoftphone = async () => {
    const newVal = !softphoneEnabled;
    setSaving(true);
    try {
      const res = await fetch("/api/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ softphoneEnabled: newVal }),
      });
      if (res.ok) {
        setSoftphoneEnabled(newVal);
        await xpAlert(newVal ? "Softphone enabled." : "Softphone disabled.");
      }
    } catch {
      await xpAlert("Failed to update setting.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRecording = async () => {
    const newVal = !callRecording;
    setSaving(true);
    try {
      const res = await fetch("/api/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callRecording: newVal }),
      });
      if (res.ok) {
        setCallRecording(newVal);
        await xpAlert(newVal ? "Call recording enabled." : "Call recording disabled.");
      }
    } catch {
      await xpAlert("Failed to update setting.");
    } finally {
      setSaving(false);
    }
  };

  const handleTwilioSetup = async () => {
    if (!setupAccountSid || !setupAuthToken || !setupPhoneNumber) {
      await xpAlert("Please fill in Account SID, Auth Token, and Phone Number.");
      return;
    }
    setSettingUp(true);
    try {
      const res = await fetch("/api/twilio-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid: setupAccountSid.trim(),
          authToken: setupAuthToken.trim(),
          phoneNumber: setupPhoneNumber.trim(),
          webhookUrl: setupWebhookUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTwilioConfigured(true);
        setTwilioAccountSid(setupAccountSid.trim());
        setTwilioPhoneNumber(setupPhoneNumber.trim());
        setSoftphoneEnabled(true);
        setSetupAuthToken("");
        await xpAlert(data.message || "Twilio configured successfully! Reload the page to connect the softphone.");
      } else {
        await xpAlert(data.error || "Setup failed. Check your credentials.");
      }
    } catch {
      await xpAlert("Failed to connect to Twilio. Check your credentials and try again.");
    } finally {
      setSettingUp(false);
    }
  };

  // ── SMTP handlers ──
  const handleSaveSmtp = async () => {
    setSmtpSaving(true);
    try {
      const res = await fetch("/api/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom }),
      });
      if (res.ok) {
        const data = await res.json();
        setSmtpHost(data.smtpHost || "");
        setSmtpPort(data.smtpPort || 587);
        setSmtpUser(data.smtpUser || "");
        setSmtpPassword(data.smtpPassword || "");
        setSmtpFrom(data.smtpFrom || "");
        setSmtpConfigured(data.isConfigured || false);
        await xpAlert("SMTP settings saved.");
      } else {
        await xpAlert("Failed to save SMTP settings.");
      }
    } catch {
      await xpAlert("Failed to save SMTP settings.");
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) return;
    setTestStatus("Sending...");
    try {
      const res = await fetch("/api/email-triggers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      });
      const data = await res.json();
      setTestStatus(res.ok ? data.message : `Error: ${data.error}`);
    } catch {
      setTestStatus("Error: Could not connect");
    }
    setTimeout(() => setTestStatus(null), 5000);
  };

  // ── Toggle component ──
  const Toggle = ({ value, onChange, disabled }: { value: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-[44px] h-[22px] rounded-full transition-colors ${
        value ? "bg-[#0078d4]" : "bg-[#ccc]"
      } ${disabled ? "opacity-50" : "cursor-pointer"}`}
    >
      <div
        className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
          value ? "left-[24px]" : "left-[2px]"
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-[#666]" />
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      <XPDialogComponent />

      <div className="mb-4">
        <h2 className="text-[14px] font-semibold text-[#333] mb-1">Integrations</h2>
        <p className="text-[11px] text-[#666]">Configure external service providers for presentations, telephony, email, and more.</p>
      </div>

      {/* ═══════════════════════════════════════════════
          PRESENTATION BUILDER
          ═══════════════════════════════════════════════ */}
      <div className="border border-[#d0d0d0] rounded bg-white mb-4">
        <div className="bg-[#f0f0f0] px-3 py-2 border-b border-[#d0d0d0] flex items-center gap-2">
          <Presentation className="w-4 h-4 text-[#333]" />
          <span className="font-semibold text-[12px]">Presentation Builder</span>
          {presentationProvider !== "zeus" && presentationApiKeySet && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-[#16a34a]">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          )}
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-[#333] block mb-2">Provider</label>
            <div className="space-y-2">
              {PRESENTATION_PROVIDERS.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
                    presentationProvider === p.value
                      ? "border-[#0078d4] bg-[#f0f7ff]"
                      : "border-[#d0d0d0] hover:border-[#999]"
                  }`}
                >
                  <input
                    type="radio"
                    name="presentationProvider"
                    value={p.value}
                    checked={presentationProvider === p.value}
                    onChange={(e) => setPresentationProvider(e.target.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-[12px] font-medium text-[#333]">{p.label}</div>
                    <div className="text-[10px] text-[#666] mt-0.5">{p.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Gamma Config */}
          {presentationProvider === "gamma" && (
            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded space-y-3">
              <div className="text-[12px] font-semibold text-[#333]">Gamma.app Configuration</div>
              <div>
                <label className="text-[11px] font-medium text-[#555] block mb-1">API Key</label>
                <input
                  type="password"
                  value={presentationApiKey}
                  onChange={(e) => setPresentationApiKey(e.target.value)}
                  placeholder="Your Gamma API key"
                  className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded font-mono"
                />
                <div className="text-[10px] text-[#888] mt-0.5">
                  Get your API key from{" "}
                  <a href="https://gamma.app/settings/api" target="_blank" rel="noopener noreferrer" className="text-[#0078d4] hover:underline inline-flex items-center gap-0.5">
                    gamma.app/settings/api <ExternalLink className="w-2.5 h-2.5" />
                  </a>. Requires Gamma Pro plan.
                </div>
              </div>
              <div className="p-2 bg-[#f0f4f8] border border-[#c0d0e0] rounded text-[11px] text-[#555]">
                <div className="font-medium mb-1">How to get a Gamma API key:</div>
                <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
                  <li>Go to gamma.app and sign in</li>
                  <li>Upgrade to Pro if you haven&apos;t already</li>
                  <li>Go to Settings &rarr; API</li>
                  <li>Generate a new API key and paste it above</li>
                </ol>
              </div>
              {presentationApiKeySet && (
                <button
                  onClick={handleTestGammaKey}
                  disabled={saving}
                  className="px-3 py-1.5 text-[11px] bg-white border border-[#999] rounded hover:bg-[#e8e8e8] disabled:opacity-50"
                >
                  Test Connection
                </button>
              )}
            </div>
          )}

          {/* Zeus Built-in Info */}
          {presentationProvider === "zeus" && (
            <div className="p-3 bg-[#f0fdf4] border border-[#86efac] rounded">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-[#16a34a]" />
                <span className="text-[12px] font-semibold text-[#166534]">Ready to Use</span>
              </div>
              <div className="text-[10px] text-[#555]">
                Zeus built-in uses your existing Anthropic API key (ANTHROPIC_API_KEY) to generate slide content with Claude AI.
                Slides are generated as structured data and rendered in the ZEUS presentation editor.
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSavePresentationProvider}
              disabled={saving}
              className="px-4 py-1.5 text-[11px] bg-[#0078d4] text-white border border-[#005a9e] rounded hover:bg-[#005a9e] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Provider Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          TELEPHONY (TWILIO)
          ═══════════════════════════════════════════════ */}
      <div className="border border-[#d0d0d0] rounded bg-white mb-4">
        <div className="bg-[#f0f0f0] px-3 py-2 border-b border-[#d0d0d0] flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#333]" />
          <span className="font-semibold text-[12px]">Telephony (Twilio)</span>
          {twilioConfigured && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-[#16a34a]">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          )}
        </div>
        <div className="p-4 space-y-4">
          {/* Enable Softphone Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-medium text-[#333]">Enable Softphone</div>
              <div className="text-[11px] text-[#666] mt-0.5">
                {softphoneEnabled
                  ? "Softphone is enabled. Users can make and receive calls."
                  : "Softphone is disabled. Enable to show phone controls in the UI."}
              </div>
            </div>
            <Toggle value={softphoneEnabled} onChange={handleToggleSoftphone} disabled={saving} />
          </div>

          {/* Twilio Status */}
          {twilioConfigured ? (
            <div className="p-3 bg-[#f0fdf4] border border-[#86efac] rounded">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-[#16a34a]" />
                <span className="text-[12px] font-semibold text-[#166534]">Twilio Connected</span>
              </div>
              <div className="text-[11px] text-[#555] space-y-0.5">
                <div>Account: {twilioAccountSid ? `...${twilioAccountSid.slice(-6)}` : "—"}</div>
                <div>Phone: {twilioPhoneNumber || "—"}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Setup Form */}
              <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded space-y-3">
                <div className="text-[12px] font-semibold text-[#333] mb-1">Connect Twilio Account</div>

                <div>
                  <label className="text-[11px] font-medium text-[#555] block mb-1">Account SID</label>
                  <input
                    type="text"
                    value={setupAccountSid}
                    onChange={(e) => setSetupAccountSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#555] block mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={setupAuthToken}
                    onChange={(e) => setSetupAuthToken(e.target.value)}
                    placeholder="Your Twilio Auth Token"
                    className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#555] block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={setupPhoneNumber}
                    onChange={(e) => setSetupPhoneNumber(e.target.value)}
                    placeholder="+15551234567"
                    className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded font-mono"
                  />
                  <div className="text-[10px] text-[#888] mt-0.5">Your Twilio phone number in E.164 format</div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#555] block mb-1">
                    Webhook URL <span className="text-[#888] font-normal">(optional for now)</span>
                  </label>
                  <input
                    type="text"
                    value={setupWebhookUrl}
                    onChange={(e) => setSetupWebhookUrl(e.target.value)}
                    placeholder="https://your-server.com or ngrok URL"
                    className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
                  />
                  <div className="text-[10px] text-[#888] mt-0.5">
                    Public URL where Twilio can reach this server. For local dev, use ngrok.
                  </div>
                </div>

                <button
                  onClick={handleTwilioSetup}
                  disabled={settingUp || !setupAccountSid || !setupAuthToken || !setupPhoneNumber}
                  className="w-full py-2 bg-[#0078d4] text-white text-[12px] font-semibold rounded hover:bg-[#006abc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {settingUp ? "Setting up..." : "Connect Twilio"}
                </button>
              </div>

              <div className="p-2 bg-[#f0f4f8] border border-[#c0d0e0] rounded text-[11px] text-[#555]">
                <div className="font-medium mb-1">How to get Twilio credentials:</div>
                <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
                  <li>Go to console.twilio.com</li>
                  <li>Copy your Account SID and Auth Token from the dashboard</li>
                  <li>Go to Phone Numbers &rarr; Buy a Number and get a US number</li>
                  <li>Paste all three above and click Connect</li>
                </ol>
              </div>
            </>
          )}

          {/* Call Recording Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-medium text-[#333]">Call Recording</div>
              <div className="text-[11px] text-[#666] mt-0.5">
                {callRecording
                  ? "Call recording is enabled. Users can record calls from the softphone."
                  : "Call recording is disabled."}
              </div>
            </div>
            <Toggle value={callRecording} onChange={handleToggleRecording} disabled={saving} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          EMAIL (SMTP)
          ═══════════════════════════════════════════════ */}
      <div className="border border-[#d0d0d0] rounded bg-white mb-4">
        <div className="bg-[#f0f0f0] px-3 py-2 border-b border-[#d0d0d0] flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#333]" />
          <span className="font-semibold text-[12px]">Email (SMTP)</span>
          {smtpConfigured ? (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-[#16a34a]">
              <CheckCircle className="w-3 h-3" /> Configured
            </span>
          ) : (
            <span className="ml-auto text-[10px] text-[#e3730a]">Not Configured</span>
          )}
        </div>
        <div className="p-4 space-y-4">
          <p className="text-[10px] text-[#666]">
            For Google Workspace: use smtp.gmail.com, port 587, and an App Password
            (Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords).
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[#555] block mb-1">SMTP Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#555] block mb-1">Port</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#555] block mb-1">Username / Email</label>
              <input
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="alerts@nouveauelevator.com"
                className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#555] block mb-1">Password / App Password</label>
              <input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-medium text-[#555] block mb-1">From Address</label>
              <input
                type="text"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                placeholder="noreply@nouveauelevator.com"
                className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSmtp}
              disabled={smtpSaving}
              className="flex items-center gap-1 px-4 py-1.5 text-[11px] bg-[#0078d4] text-white border border-[#005a9e] rounded hover:bg-[#005a9e] disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              {smtpSaving ? "Saving..." : "Save SMTP Settings"}
            </button>
          </div>

          {/* Test Email */}
          <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded space-y-2">
            <div className="text-[12px] font-semibold text-[#333]">Send Test Email</div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Email address to test..."
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
              />
              <button
                onClick={handleSendTestEmail}
                disabled={!smtpConfigured || !testEmail.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] bg-white border border-[#999] rounded hover:bg-[#e8e8e8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3 h-3" /> Send Test
              </button>
            </div>
            {testStatus && (
              <p className={`text-[11px] ${testStatus.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
                {testStatus}
              </p>
            )}
            {!smtpConfigured && (
              <p className="text-[10px] text-[#e3730a]">Save SMTP settings above first.</p>
            )}
          </div>

          <div className="text-[10px] text-[#888]">
            Email triggers and notification rules are configured in Settings &rarr; Notifications.
          </div>
        </div>
      </div>
    </div>
  );
}
