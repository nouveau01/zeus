"use client";

import { useState, useEffect } from "react";
import { Bell, Send, RefreshCw, ChevronDown, ChevronUp, Mail, CheckCircle, XCircle, Settings, Save, Plus, Trash2 } from "lucide-react";

interface EmailTrigger {
  id: string;
  event: string;
  label: string;
  description: string | null;
  isActive: boolean;
  recipients: string;
  subject: string;
  bodyHtml: string;
}

interface AvailableEvent {
  event: string;
  label: string;
  description: string;
  variables: string[];
  defaultSubject: string;
}

interface EmailLog {
  id: string;
  event: string;
  recipients: string;
  subject: string;
  status: string;
  error: string | null;
  createdAt: string;
  trigger: { label: string; event: string } | null;
}

interface SmtpSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  isConfigured: boolean;
}

export function NotificationsPanel() {
  const [triggers, setTriggers] = useState<EmailTrigger[]>([]);
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTrigger, setExpandedTrigger] = useState<string | null>(null);
  const [editingRecipients, setEditingRecipients] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTriggerEvent, setNewTriggerEvent] = useState("");
  const [newTriggerRecipients, setNewTriggerRecipients] = useState("");
  const [creating, setCreating] = useState(false);

  // SMTP settings state
  const [smtp, setSmtp] = useState<SmtpSettings>({
    smtpHost: "", smtpPort: 587, smtpUser: "", smtpPassword: "", smtpFrom: "", isConfigured: false,
  });
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<string | null>(null);
  const [showSmtp, setShowSmtp] = useState(false);

  const fetchSmtpSettings = async () => {
    try {
      const res = await fetch("/api/email-settings");
      if (res.ok) setSmtp(await res.json());
    } catch (error) {
      console.error("Error fetching SMTP settings:", error);
    }
  };

  const saveSmtpSettings = async () => {
    setSmtpSaving(true);
    setSmtpStatus(null);
    try {
      const res = await fetch("/api/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtp),
      });
      if (res.ok) {
        setSmtp(await res.json());
        setSmtpStatus("Settings saved");
      } else {
        setSmtpStatus("Error saving settings");
      }
    } catch {
      setSmtpStatus("Error saving settings");
    } finally {
      setSmtpSaving(false);
      setTimeout(() => setSmtpStatus(null), 3000);
    }
  };

  const fetchTriggers = async () => {
    try {
      const res = await fetch("/api/email-triggers");
      if (res.ok) {
        const data = await res.json();
        setTriggers(data);
        const recipientMap: Record<string, string> = {};
        data.forEach((t: EmailTrigger) => { recipientMap[t.id] = t.recipients; });
        setEditingRecipients(recipientMap);
      }
    } catch (error) {
      console.error("Error fetching triggers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEvents = async () => {
    try {
      const res = await fetch("/api/email-triggers?type=available-events");
      if (res.ok) setAvailableEvents(await res.json());
    } catch (error) {
      console.error("Error fetching available events:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/email-triggers/logs");
      if (res.ok) setLogs(await res.json());
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    fetchTriggers();
    fetchAvailableEvents();
    fetchSmtpSettings();
  }, []);

  // Events that don't already have a trigger
  const unusedEvents = availableEvents.filter(
    ae => !triggers.some(t => t.event === ae.event)
  );

  const createTrigger = async () => {
    if (!newTriggerEvent) return;
    setCreating(true);
    const eventDef = availableEvents.find(e => e.event === newTriggerEvent);
    try {
      const res = await fetch("/api/email-triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: newTriggerEvent,
          label: eventDef?.label || newTriggerEvent,
          recipients: newTriggerRecipients,
        }),
      });
      if (res.ok) {
        await fetchTriggers();
        setShowCreateForm(false);
        setNewTriggerEvent("");
        setNewTriggerRecipients("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create trigger");
      }
    } catch (error) {
      console.error("Error creating trigger:", error);
    } finally {
      setCreating(false);
    }
  };

  const deleteTrigger = async (trigger: EmailTrigger) => {
    if (!confirm(`Delete trigger "${trigger.label}"?`)) return;
    try {
      const res = await fetch(`/api/email-triggers?id=${trigger.id}`, { method: "DELETE" });
      if (res.ok) {
        setTriggers(prev => prev.filter(t => t.id !== trigger.id));
      }
    } catch (error) {
      console.error("Error deleting trigger:", error);
    }
  };

  const toggleActive = async (trigger: EmailTrigger) => {
    setSaving(trigger.id);
    try {
      const res = await fetch("/api/email-triggers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trigger.id, isActive: !trigger.isActive }),
      });
      if (res.ok) {
        setTriggers(prev => prev.map(t => t.id === trigger.id ? { ...t, isActive: !t.isActive } : t));
      }
    } catch (error) {
      console.error("Error toggling trigger:", error);
    } finally {
      setSaving(null);
    }
  };

  const saveRecipients = async (trigger: EmailTrigger) => {
    setSaving(trigger.id);
    try {
      const res = await fetch("/api/email-triggers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trigger.id, recipients: editingRecipients[trigger.id] || "" }),
      });
      if (res.ok) {
        setTriggers(prev => prev.map(t => t.id === trigger.id ? { ...t, recipients: editingRecipients[trigger.id] || "" } : t));
      }
    } catch (error) {
      console.error("Error saving recipients:", error);
    } finally {
      setSaving(null);
    }
  };

  const sendTestEmail = async () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-5 h-5 animate-spin text-[#666]" />
      </div>
    );
  }

  return (
    <div className="p-4" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#316ac5]" />
          <h2 className="text-[14px] font-semibold">Email Notifications</h2>
        </div>
        {smtp.isConfigured ? (
          <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 border border-green-200">
            <CheckCircle className="w-3 h-3" /> SMTP Configured
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 border border-orange-200">
            <XCircle className="w-3 h-3" /> SMTP Not Configured
          </span>
        )}
      </div>

      <p className="text-[11px] text-[#666] mb-4">
        Configure SMTP delivery and set up mandatory system notifications. For building custom email templates and sales sequences, use <strong>15 - Automation</strong> in the sidebar.
      </p>

      {/* SMTP Configuration */}
      <div className="border border-[#808080] bg-white mb-4">
        <button
          onClick={() => setShowSmtp(!showSmtp)}
          className="flex items-center justify-between w-full bg-[#f0f0f0] px-3 py-2 border-b border-[#808080] hover:bg-[#e8e8e8]"
        >
          <h3 className="text-[12px] font-semibold flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" />
            SMTP Configuration
          </h3>
          {showSmtp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showSmtp && (
          <div className="p-3">
            <p className="text-[10px] text-[#666] mb-3">
              For Google Workspace: use smtp.gmail.com, port 587, and an App Password
              (Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords).
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[11px] font-medium block mb-0.5">SMTP Host</label>
                <input type="text" value={smtp.smtpHost} onChange={(e) => setSmtp(prev => ({ ...prev, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white" />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-0.5">Port</label>
                <input type="number" value={smtp.smtpPort} onChange={(e) => setSmtp(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))} className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white" />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-0.5">Username / Email</label>
                <input type="text" value={smtp.smtpUser} onChange={(e) => setSmtp(prev => ({ ...prev, smtpUser: e.target.value }))} placeholder="alerts@nouveauelevator.com" className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white" />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-0.5">Password / App Password</label>
                <input type="password" value={smtp.smtpPassword} onChange={(e) => setSmtp(prev => ({ ...prev, smtpPassword: e.target.value }))} placeholder="Enter password" className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-medium block mb-0.5">From Address</label>
                <input type="text" value={smtp.smtpFrom} onChange={(e) => setSmtp(prev => ({ ...prev, smtpFrom: e.target.value }))} placeholder="noreply@nouveauelevator.com" className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveSmtpSettings} disabled={smtpSaving} className="flex items-center gap-1 px-3 py-1 bg-[#316ac5] text-white text-[11px] border border-[#003c74] hover:bg-[#4a8ae6] disabled:opacity-50">
                <Save className="w-3 h-3" />
                {smtpSaving ? "Saving..." : "Save Settings"}
              </button>
              {smtpStatus && <span className={`text-[11px] ${smtpStatus.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>{smtpStatus}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Test Email */}
      <div className="bg-[#f0f0f0] border border-[#808080] p-3 mb-4">
        <h3 className="text-[12px] font-semibold mb-2">Send Test Email</h3>
        <div className="flex items-center gap-2">
          <input type="email" placeholder="Email address to test..." value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          <button onClick={sendTestEmail} disabled={!smtp.isConfigured} className="flex items-center gap-1 px-3 py-1 bg-[#316ac5] text-white text-[11px] border border-[#003c74] hover:bg-[#4a8ae6] disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-3 h-3" /> Send Test
          </button>
        </div>
        {testStatus && <p className={`text-[11px] mt-1 ${testStatus.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>{testStatus}</p>}
        {!smtp.isConfigured && <p className="text-[10px] text-orange-600 mt-1">Configure SMTP settings above first.</p>}
      </div>

      {/* System Event Triggers (admin mandatory notifications) */}
      <div className="border border-[#808080] bg-white mb-4">
        <div className="flex items-center justify-between bg-[#f0f0f0] px-3 py-2 border-b border-[#808080]">
          <div>
            <h3 className="text-[12px] font-semibold">System Event Triggers</h3>
            <p className="text-[10px] text-[#888]">Mandatory notifications that fire automatically when system events occur</p>
          </div>
          {unusedEvents.length > 0 && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-1 px-2 py-0.5 bg-[#316ac5] text-white text-[11px] border border-[#003c74] hover:bg-[#4a8ae6]"
            >
              <Plus className="w-3 h-3" /> New Trigger
            </button>
          )}
        </div>

        {/* Create Trigger Form */}
        {showCreateForm && (
          <div className="p-3 bg-[#fffff0] border-b border-[#e0e0e0]">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-[11px] font-medium w-[50px]">Event:</label>
              <select
                value={newTriggerEvent}
                onChange={(e) => setNewTriggerEvent(e.target.value)}
                className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
              >
                <option value="">-- Select an event --</option>
                {unusedEvents.map(ae => (
                  <option key={ae.event} value={ae.event}>{ae.label}</option>
                ))}
              </select>
            </div>

            {newTriggerEvent && (
              <>
                <p className="text-[10px] text-[#666] mb-2 ml-[58px]">
                  {availableEvents.find(e => e.event === newTriggerEvent)?.description}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-[11px] font-medium w-[50px]">To:</label>
                  <input
                    type="text"
                    value={newTriggerRecipients}
                    onChange={(e) => setNewTriggerRecipients(e.target.value)}
                    placeholder="email1@company.com, email2@company.com"
                    className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2 ml-[58px]">
              <button
                onClick={createTrigger}
                disabled={!newTriggerEvent || creating}
                className="flex items-center gap-1 px-3 py-1 bg-[#316ac5] text-white text-[11px] border border-[#003c74] hover:bg-[#4a8ae6] disabled:opacity-50"
              >
                {creating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Create Trigger
              </button>
              <button
                onClick={() => { setShowCreateForm(false); setNewTriggerEvent(""); setNewTriggerRecipients(""); }}
                className="px-3 py-1 bg-white text-[11px] border border-[#808080] hover:bg-[#f0f0f0]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {triggers.length === 0 && !showCreateForm ? (
          <div className="p-4 text-center text-[12px] text-[#666]">
            No system triggers configured. Click &quot;New Trigger&quot; to create one.
          </div>
        ) : (
          <div>
            {triggers.map((trigger) => {
              const isExpanded = expandedTrigger === trigger.id;
              return (
                <div key={trigger.id} className="border-b border-[#e0e0e0] last:border-b-0">
                  <div className="flex items-center px-3 py-2 hover:bg-[#f5f5f5]">
                    <button onClick={() => setExpandedTrigger(isExpanded ? null : trigger.id)} className="mr-2 text-[#666]">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input type="checkbox" checked={trigger.isActive} onChange={() => toggleActive(trigger)} disabled={saving === trigger.id} className="cursor-pointer" />
                      <div>
                        <span className="text-[12px] font-medium">{trigger.label}</span>
                        <span className="text-[10px] text-[#888] ml-2">{trigger.event}</span>
                      </div>
                    </label>

                    <div className="flex items-center gap-2">
                      {trigger.recipients ? (
                        <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 border border-green-200">
                          {trigger.recipients.split(",").length} recipient(s)
                        </span>
                      ) : (
                        <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 border border-orange-200">
                          No recipients
                        </span>
                      )}
                      <button onClick={() => deleteTrigger(trigger)} className="text-[#999] hover:text-red-600" title="Delete trigger">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 bg-[#fafafa] border-t border-[#e0e0e0]">
                      {trigger.description && <p className="text-[11px] text-[#666] mb-2">{trigger.description}</p>}

                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-[11px] font-medium w-[70px]">Recipients:</label>
                        <input
                          type="text"
                          value={editingRecipients[trigger.id] || ""}
                          onChange={(e) => setEditingRecipients(prev => ({ ...prev, [trigger.id]: e.target.value }))}
                          placeholder="email1@company.com, email2@company.com"
                          className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                        />
                        <button onClick={() => saveRecipients(trigger)} disabled={saving === trigger.id} className="px-2 py-1 bg-[#316ac5] text-white text-[10px] border border-[#003c74] hover:bg-[#4a8ae6] disabled:opacity-50">
                          Save
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium">Subject:</label>
                        <p className="text-[11px] text-[#444] bg-white border border-[#ccc] px-2 py-1 mt-0.5 font-mono text-[10px]">{trigger.subject}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Email Log */}
      <div className="border border-[#808080] bg-white">
        <button
          onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchLogs(); }}
          className="flex items-center justify-between w-full bg-[#f0f0f0] px-3 py-2 border-b border-[#808080] hover:bg-[#e8e8e8]"
        >
          <h3 className="text-[12px] font-semibold flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" /> Email Log
          </h3>
          {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showLogs && (
          <div className="max-h-[300px] overflow-auto">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-[12px] text-[#666]">No emails sent yet.</div>
            ) : (
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-[#f0f0f0] sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1 border-b border-[#ccc]">Time</th>
                    <th className="text-left px-2 py-1 border-b border-[#ccc]">Event</th>
                    <th className="text-left px-2 py-1 border-b border-[#ccc]">To</th>
                    <th className="text-left px-2 py-1 border-b border-[#ccc]">Subject</th>
                    <th className="text-left px-2 py-1 border-b border-[#ccc]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#f5f5f5]">
                      <td className="px-2 py-1 border-b border-[#eee] whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-2 py-1 border-b border-[#eee]">{log.trigger?.label || log.event}</td>
                      <td className="px-2 py-1 border-b border-[#eee] max-w-[150px] truncate">{log.recipients}</td>
                      <td className="px-2 py-1 border-b border-[#eee] max-w-[200px] truncate">{log.subject}</td>
                      <td className="px-2 py-1 border-b border-[#eee]">
                        {log.status === "sent" ? (
                          <span className="flex items-center gap-1 text-green-700"><CheckCircle className="w-3 h-3" /> Sent</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600" title={log.error || ""}><XCircle className="w-3 h-3" /> Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
