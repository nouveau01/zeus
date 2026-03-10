"use client";

import { useState, useEffect, useRef } from "react";

const ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "note", label: "Note" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "sms", label: "SMS" },
  { value: "task", label: "Task" },
] as const;

const DIRECTION_TYPES = [
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Inbound" },
] as const;

interface Contact {
  id: string;
  name: string;
}

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  entityType: "Account" | "Customer" | "Contact";
  entityId: string;
  contacts?: Contact[];
}

export function LogActivityModal({
  isOpen,
  onClose,
  onSaved,
  entityType,
  entityId,
  contacts = [],
}: LogActivityModalProps) {
  const [type, setType] = useState("call");
  const [direction, setDirection] = useState("outbound");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [durationSec, setDurationSec] = useState("");
  const [callStatus, setCallStatus] = useState("answered");
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setType("call");
      setDirection("outbound");
      setSubject("");
      setBody("");
      setPhoneNumber("");
      setDurationMin("");
      setDurationSec("");
      setCallStatus("answered");
      setContactId("");
      setContactName("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Update contactName when contactId changes
  useEffect(() => {
    if (contactId) {
      const c = contacts.find((c) => c.id === contactId);
      if (c) setContactName(c.name);
    } else {
      setContactName("");
    }
  }, [contactId, contacts]);

  const showDirection = type === "call" || type === "email";
  const showPhone = type === "call";
  const showDuration = type === "call";
  const showCallStatus = type === "call";
  const showRecipients = type === "email";

  const handleSave = async () => {
    if (!subject && !body) return;

    setSaving(true);
    try {
      const entityField =
        entityType === "Account"
          ? "premisesId"
          : entityType === "Customer"
          ? "customerId"
          : "contactId";

      const totalSeconds =
        (parseInt(durationMin || "0") * 60) + parseInt(durationSec || "0");

      const payload: Record<string, any> = {
        type,
        subject: subject || null,
        body: body || null,
        contactName: contactName || null,
        [entityField]: entityId,
      };

      if (contactId) payload.contactId = contactId;
      if (showDirection) payload.direction = direction;
      if (showPhone && phoneNumber) payload.phoneNumber = phoneNumber;
      if (showDuration && totalSeconds > 0) payload.callDuration = totalSeconds;
      if (showCallStatus) payload.callStatus = callStatus;

      const res = await fetch("/api/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error("Failed to save activity:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div
        ref={dialogRef}
        className="relative bg-[#f0f0f0] border-2 border-[#808080] shadow-lg w-[480px] max-h-[90vh] flex flex-col"
        style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}
      >
        {/* Title Bar */}
        <div className="bg-[#0078d4] text-white px-3 py-1.5 flex items-center justify-between flex-shrink-0">
          <span className="text-[12px] font-medium">Log Activity</span>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center hover:bg-[#c42b1c] rounded-sm text-[14px] leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {/* Type selector */}
          <div>
            <label className="block text-[11px] font-semibold text-[#333] mb-1">Type</label>
            <div className="flex gap-1">
              {ACTIVITY_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`px-2.5 py-1 text-[11px] border rounded ${
                    type === t.value
                      ? "bg-[#0078d4] text-white border-[#0078d4]"
                      : "bg-white text-[#333] border-[#999] hover:bg-[#e8e8e8]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          {showDirection && (
            <div>
              <label className="block text-[11px] font-semibold text-[#333] mb-1">Direction</label>
              <div className="flex gap-1">
                {DIRECTION_TYPES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDirection(d.value)}
                    className={`px-3 py-1 text-[11px] border rounded ${
                      direction === d.value
                        ? "bg-[#0078d4] text-white border-[#0078d4]"
                        : "bg-white text-[#333] border-[#999] hover:bg-[#e8e8e8]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-semibold text-[#333] mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={type === "note" ? "Note title..." : "Subject..."}
              className="w-full border border-[#999] px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-[#0078d4]"
            />
          </div>

          {/* Body / Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-[#333] mb-1">
              {type === "note" ? "Notes" : "Details"}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Enter details..."
              className="w-full border border-[#999] px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-[#0078d4] resize-none"
            />
          </div>

          {/* Phone Number */}
          {showPhone && (
            <div>
              <label className="block text-[11px] font-semibold text-[#333] mb-1">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="555-1234"
                className="w-full border border-[#999] px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-[#0078d4]"
              />
            </div>
          )}

          {/* Duration */}
          {showDuration && (
            <div>
              <label className="block text-[11px] font-semibold text-[#333] mb-1">Duration</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  placeholder="0"
                  className="w-[60px] border border-[#999] px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-[#0078d4] text-center"
                />
                <span className="text-[11px] text-[#666]">min</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationSec}
                  onChange={(e) => setDurationSec(e.target.value)}
                  placeholder="0"
                  className="w-[60px] border border-[#999] px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-[#0078d4] text-center"
                />
                <span className="text-[11px] text-[#666]">sec</span>
              </div>
            </div>
          )}

          {/* Call Status */}
          {showCallStatus && (
            <div>
              <label className="block text-[11px] font-semibold text-[#333] mb-1">Call Status</label>
              <select
                value={callStatus}
                onChange={(e) => setCallStatus(e.target.value)}
                className="border border-[#999] px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-[#0078d4]"
              >
                <option value="answered">Answered</option>
                <option value="missed">Missed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          )}

          {/* Contact */}
          {contacts.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-[#333] mb-1">Contact</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full border border-[#999] px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-[#0078d4]"
              >
                <option value="">-- None --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#c0c0c0] flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#f0f0f0] border border-[#808080] text-[12px] hover:bg-[#e0e0e0] min-w-[75px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!subject && !body)}
            className="px-4 py-1.5 bg-[#0078d4] text-white border border-[#005a9e] text-[12px] hover:bg-[#006cbd] min-w-[75px] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
