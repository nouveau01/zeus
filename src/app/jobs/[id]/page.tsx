"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Briefcase, ChevronDown, X, AlertTriangle, Copy, Trash2, Edit3, Upload } from "lucide-react";
import { StatusPath } from "@/components/layout/StatusPath";
import { HighlightsPanel } from "@/components/layout/HighlightsPanel";
import { Tabs } from "@/components/layout/Tabs";
import { Section } from "@/components/layout/Section";
import { FieldGrid, Field } from "@/components/layout/FieldGrid";
import { JobHistory } from "@/components/layout/JobHistory";

const JOB_STATUSES = [
  "Open",
  "Partner Review",
  "Jonathan Review",
  "Assign Mechanic",
  "Completed",
  "Waiting to be Billed",
  "Hold",
  "Closed",
];

interface Job {
  id: string;
  jobName: string;
  externalId: string | null;
  jobDescription: string | null;
  status: string;
  type: string | null;
  contractType: string | null;
  customJobType: string | null;
  customStatus: string | null;
  priorityLevel: string | null;
  date: string | null;
  customDate: string | null;
  dueDate: string | null;
  scheduleDate: string | null;
  compDate: string | null;
  closeDate: string | null;
  reg: number | null;
  ot: number | null;
  ot17: number | null;
  dt: number | null;
  tt: number | null;
  totalHours: number | null;
  supervisor: string | null;
  projectManager: string | null;
  employeeFirstName: string | null;
  billingTerms: string | null;
  chargeable: boolean;
  sRemarks: string | null;
  customerRemarks: string | null;
  comments: string | null;
  template: string | null;
  level: string | null;
  source: string | null;
  office: string | null;
  reopen: boolean;
  tsCreatedBy: string | null;
  repRequest: string | null;
  bRev: string | null;
  lastSyncTime: string | null;
  reqDate: string | null;
  folder: string | null;
  url: string | null;
  fineFault: string | null;
  wfMisu: string | null;
  mrRequest: string | null;
  guzman: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string } | null;
  premises: { id: string; address: string } | null;
  unit: { id: string; unitNumber: string } | null;
  createdBy: { id: string; name: string } | null;
  history: Array<{
    id: string;
    field: string;
    originalValue: string | null;
    newValue: string | null;
    createdAt: string;
    user: { name: string } | null;
  }>;
  files: Array<{ id: string; name: string; url: string }>;
  activities: Array<{
    id: string;
    type: string;
    content: string | null;
    createdAt: string;
    user: { name: string } | null;
  }>;
  notes: Array<{
    id: string;
    title: string | null;
    body: string;
    createdAt: string;
  }>;
  tickets: Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
  }>;
  _count: {
    notes: number;
    tickets: number;
    files: number;
    history: number;
    activities: number;
  };
}

// Modal Component
function Modal({ isOpen, onClose, title, children, size = "md" }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#dddbda]">
            <h2 className="text-lg font-semibold text-[#3e3e3c]">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-[#706e6b]" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Form states
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");

  // Activity/Comment state
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Refs for scrolling
  const notesRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const ticketsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJob();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      // Use SQL Server direct connection
      const response = await fetch(`/api/sqlserver/jobs/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      }
    } catch (error) {
      console.error("Error fetching job:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // SQL Server connection is read-only
    alert("Read-only mode - Changes cannot be saved to Total Service.");
  };

  const handleFieldUpdate = async (fieldKey: string, value: any) => {
    if (!job) return;
    let processedValue = value;
    if (value === "") processedValue = null;
    else if (fieldKey.includes("Date") || fieldKey === "date" || fieldKey === "lastSyncTime") {
      processedValue = value ? new Date(value).toISOString() : null;
    } else if (["reg", "ot", "ot17", "dt", "tt", "totalHours"].includes(fieldKey)) {
      processedValue = value ? parseFloat(value) : null;
    } else if (["chargeable", "reopen"].includes(fieldKey)) {
      processedValue = Boolean(value);
    }

    const response = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [fieldKey]: processedValue }),
    });
    if (response.ok) await fetchJob();
    else throw new Error("Failed to update field");
  };

  const handleDelete = async () => {
    if (!job) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      if (response.ok) {
        router.push("/jobs");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClone = async () => {
    if (!job) return;
    setIsCloning(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobName: `${job.jobName} (Copy)`,
          jobDescription: job.jobDescription,
          status: "Open",
          type: job.type,
          contractType: job.contractType,
          customerId: job.customer?.id,
          premisesId: job.premises?.id,
          dueDate: job.dueDate,
          priorityLevel: job.priorityLevel,
        }),
      });
      if (response.ok) {
        const newJob = await response.json();
        router.push(`/jobs/${newJob.id}`);
      }
    } catch (error) {
      console.error("Error cloning job:", error);
    } finally {
      setIsCloning(false);
      setShowCloneModal(false);
    }
  };

  const handlePostComment = async () => {
    if (!job || !newComment.trim()) return;
    setIsPostingComment(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "comment", content: newComment }),
      });
      if (response.ok) {
        setNewComment("");
        await fetchJob();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !job) return;
    setIsUploading(true);
    try {
      // For now, we'll create a mock file entry since we don't have file storage
      const response = await fetch(`/api/jobs/${job.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: files[0].name,
          url: `/uploads/${files[0].name}`,
          size: files[0].size,
          mimeType: files[0].type,
        }),
      });
      if (response.ok) await fetchJob();
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCreateNote = async () => {
    if (!job || !noteBody.trim()) return;
    setIsCreatingNote(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle, body: noteBody }),
      });
      if (response.ok) {
        setNoteTitle("");
        setNoteBody("");
        setShowNoteModal(false);
        await fetchJob();
      }
    } catch (error) {
      console.error("Error creating note:", error);
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!job || !ticketSubject.trim()) return;
    setIsCreatingTicket(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticketSubject,
          description: ticketDescription,
          priority: ticketPriority,
        }),
      });
      if (response.ok) {
        setTicketSubject("");
        setTicketDescription("");
        setTicketPriority("Medium");
        setShowTicketModal(false);
        await fetchJob();
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0176d3]"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
        <Link href="/jobs" className="text-[#0176d3] hover:underline mt-2 inline-block">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const summaryFields: Field[] = [
    { label: "Job Name", value: job.jobName, fieldKey: "jobName" },
    { label: "External ID", value: job.externalId, fieldKey: "externalId" },
    { label: "Job Description", value: job.jobDescription, fieldKey: "jobDescription" },
    { label: "Customer", value: job.customer?.name, fieldKey: "customerId", type: "link", href: `/customers/${job.customer?.id}`, editable: false },
    { label: "Date", value: job.date, fieldKey: "date", type: "date" },
    { label: "Premises", value: job.premises?.address, fieldKey: "premisesId", type: "link", href: `/premises/${job.premises?.id}`, editable: false },
    { label: "Custom Date", value: job.customDate, fieldKey: "customDate", type: "date" },
    { label: "Unit", value: job.unit?.unitNumber, fieldKey: "unitId", editable: false },
    { label: "Due Date", value: job.dueDate, fieldKey: "dueDate", type: "date" },
    { label: "Status", value: job.status, fieldKey: "status" },
    { label: "SRemarks", value: job.sRemarks, fieldKey: "sRemarks" },
    { label: "Type", value: job.type, fieldKey: "type" },
    { label: "Reopen", value: job.reopen, fieldKey: "reopen", type: "checkbox" },
    { label: "Contract Type", value: job.contractType, fieldKey: "contractType" },
    { label: "TS Created By", value: job.tsCreatedBy, fieldKey: "tsCreatedBy" },
    { label: "Supervisor", value: job.supervisor, fieldKey: "supervisor" },
    { label: "Rep Request", value: job.repRequest, fieldKey: "repRequest" },
    { label: "Level", value: job.level, fieldKey: "level" },
    { label: "Comp. Date", value: job.compDate, fieldKey: "compDate", type: "date" },
    { label: "Template", value: job.template, fieldKey: "template" },
    { label: "Billing Terms", value: job.billingTerms, fieldKey: "billingTerms" },
    { label: "Reg", value: job.reg, fieldKey: "reg", type: "number" },
    { label: "Chargeable", value: job.chargeable, fieldKey: "chargeable", type: "checkbox" },
    { label: "OT", value: job.ot, fieldKey: "ot", type: "number" },
    { label: "Close Date", value: job.closeDate, fieldKey: "closeDate", type: "date" },
    { label: "1.7 OT", value: job.ot17, fieldKey: "ot17", type: "number" },
    { label: "DT", value: job.dt, fieldKey: "dt", type: "number" },
    { label: "TT", value: job.tt, fieldKey: "tt", type: "number" },
    { label: "Office", value: job.office, fieldKey: "office" },
    { label: "Total Hours", value: job.totalHours, fieldKey: "totalHours", type: "number" },
    { label: "Source", value: job.source, fieldKey: "source" },
    { label: "BRev", value: job.bRev, fieldKey: "bRev" },
    { label: "Schedule Date", value: job.scheduleDate, fieldKey: "scheduleDate", type: "date" },
    { label: "Customer Remarks", value: job.customerRemarks, fieldKey: "customerRemarks" },
    { label: "Priority Level", value: job.priorityLevel, fieldKey: "priorityLevel" },
    { label: "Comments", value: job.comments, fieldKey: "comments" },
    { label: "Employee First Name", value: job.employeeFirstName, fieldKey: "employeeFirstName" },
  ];

  const customFields: Field[] = [
    { label: "Project Manager", value: job.projectManager, fieldKey: "projectManager" },
    { label: "Custom Job Type", value: job.customJobType, fieldKey: "customJobType" },
    { label: "Req Date", value: job.reqDate, fieldKey: "reqDate", type: "date" },
    { label: "Fine Fault", value: job.fineFault, fieldKey: "fineFault" },
    { label: "Folder", value: job.folder, fieldKey: "folder" },
    { label: "W/F/Misu", value: job.wfMisu, fieldKey: "wfMisu" },
    { label: "URL", value: job.url, fieldKey: "url" },
    { label: "MR Request", value: job.mrRequest, fieldKey: "mrRequest" },
    { label: "GUZMAN", value: job.guzman, fieldKey: "guzman" },
    { label: "Custom Status", value: job.customStatus, fieldKey: "customStatus" },
  ];

  const historyEntries = job.history?.map((h) => ({
    id: h.id,
    date: new Date(h.createdAt).toLocaleString(),
    field: h.field,
    user: { name: h.user?.name || "System" },
    originalValue: h.originalValue,
    newValue: h.newValue,
  })) || [];

  // Quick Links with click handlers
  const quickLinks = [
    { label: "Notes", count: job._count?.notes || 0, color: "red", onClick: () => scrollToSection(notesRef) },
    { label: "Approval History", count: 0, color: "red" },
    { label: "Files", count: job._count?.files || 0, color: "gray", onClick: () => scrollToSection(filesRef) },
    { label: "Job History", count: job._count?.history || 0, color: "green", onClick: () => scrollToSection(historyRef) },
    { label: "Notes & Attachments", count: 0, color: "gray" },
    { label: "Tickets", count: job._count?.tickets || 0, color: "red", onClick: () => scrollToSection(ticketsRef) },
    { label: "Violations", count: 0, color: "purple" },
    { label: "Units", count: job.unit ? 1 : 0, color: "red" },
  ];

  // Tab Contents
  const detailsContent = (
    <div className="bg-white rounded-lg border border-[#dddbda]">
      <div className="p-4">
        <Section title="Summary & Hours Worked">
          <FieldGrid fields={summaryFields} onFieldUpdate={handleFieldUpdate} />
        </Section>

        <Section title="Custom Fields">
          <FieldGrid fields={customFields} onFieldUpdate={handleFieldUpdate} />
        </Section>

        <p className="text-sm text-[#706e6b] py-4 border-t border-[#dddbda]">
          No duplicate records found
        </p>

        <div ref={historyRef}>
          <JobHistory entries={historyEntries} totalCount={job._count?.history} />
        </div>
      </div>
    </div>
  );

  const activityContent = (
    <div className="bg-white rounded-lg border border-[#dddbda] p-4">
      <h3 className="text-sm font-semibold text-[#3e3e3c] mb-4">Activity Timeline</h3>
      <div className="space-y-4">
        {job.activities && job.activities.length > 0 ? (
          job.activities.map((activity) => {
            const userName = activity.user?.name || "System";
            const initials = userName.split(" ").map(n => n[0]).join("");
            return (
              <div key={activity.id} className="flex gap-3 pb-4 border-b border-[#f3f3f3]">
                <div className="w-8 h-8 bg-[#032d60] rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-[#0176d3]">{userName}</span>
                    {" "}<span className="text-[#706e6b]">{activity.type === "comment" ? "commented" : activity.type}</span>
                  </p>
                  {activity.content && (
                    <p className="text-sm text-[#3e3e3c] mt-1">{activity.content}</p>
                  )}
                  <p className="text-xs text-[#939393] mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-[#706e6b]">No activity yet.</p>
        )}
      </div>
    </div>
  );

  const relatedContent = (
    <div className="space-y-4">
      {/* Notes Section */}
      <div ref={notesRef} className="bg-white rounded-lg border border-[#dddbda]">
        <div className="px-4 py-3 border-b border-[#dddbda] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#3e3e3c]">Notes ({job._count?.notes || 0})</h3>
          <button onClick={() => setShowNoteModal(true)} className="text-sm text-[#0176d3] hover:underline">New Note</button>
        </div>
        <div className="p-4">
          {job.notes && job.notes.length > 0 ? (
            <div className="space-y-2">
              {job.notes.map((note) => (
                <div key={note.id} className="p-3 bg-[#f3f3f3] rounded">
                  {note.title && <p className="font-medium text-sm">{note.title}</p>}
                  <p className="text-sm text-[#3e3e3c]">{note.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#706e6b]">No notes.</p>
          )}
        </div>
      </div>

      {/* Tickets Section */}
      <div ref={ticketsRef} className="bg-white rounded-lg border border-[#dddbda]">
        <div className="px-4 py-3 border-b border-[#dddbda] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#3e3e3c]">Tickets ({job._count?.tickets || 0})</h3>
          <button onClick={() => setShowTicketModal(true)} className="text-sm text-[#0176d3] hover:underline">New Ticket</button>
        </div>
        <div className="p-4">
          {job.tickets && job.tickets.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#dddbda]">
                  <th className="text-left py-2 text-[#706e6b] font-medium">Ticket #</th>
                  <th className="text-left py-2 text-[#706e6b] font-medium">Subject</th>
                  <th className="text-left py-2 text-[#706e6b] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {job.tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-[#f3f3f3]">
                    <td className="py-2 text-[#0176d3]">{ticket.ticketNumber}</td>
                    <td className="py-2">{ticket.subject}</td>
                    <td className="py-2">{ticket.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[#706e6b]">No tickets.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {/* Page Header */}
      <div className="bg-white border-b border-[#dddbda] px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7f8de1] rounded flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[#706e6b] uppercase tracking-wide">Job</p>
              <h1 className="text-xl font-bold text-[#3e3e3c]">{job.jobName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 text-sm font-medium text-[#3e3e3c] bg-white border border-[#dddbda] rounded hover:bg-[#f3f3f3] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm font-medium text-[#3e3e3c] bg-white border border-[#dddbda] rounded hover:bg-[#f3f3f3] transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setShowCloneModal(true)}
              className="px-4 py-2 text-sm font-medium text-[#3e3e3c] bg-white border border-[#dddbda] rounded hover:bg-[#f3f3f3] transition-colors"
            >
              Clone
            </button>
          </div>
        </div>

        <HighlightsPanel
          fields={[
            { label: "Customer", value: job.customer?.name || null, isLink: true, href: `/customers/${job.customer?.id}` },
            { label: "Premises", value: job.premises?.address || null, isLink: true, href: `/premises/${job.premises?.id}` },
            { label: "Contract Type", value: job.contractType },
          ]}
        />
      </div>

      {/* Status Path */}
      <div className="px-6 py-4">
        <StatusPath statuses={JOB_STATUSES} currentStatus={job.status} onStatusChange={handleStatusChange} isUpdating={isUpdating} />
      </div>

      {/* Quick Links */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-1 flex-wrap py-3 px-4 bg-white rounded-lg border border-[#dddbda]">
          <span className="text-sm font-medium text-[#3e3e3c] mr-3">Related List Quick Links</span>
          {quickLinks.map((link, i) => (
            <button
              key={i}
              onClick={link.onClick}
              className="inline-flex items-center gap-1.5 text-sm px-2 py-1 rounded text-[#0176d3] hover:bg-blue-50 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${
                link.color === "red" ? "bg-red-500" :
                link.color === "green" ? "bg-green-500" :
                link.color === "purple" ? "bg-purple-500" : "bg-gray-400"
              }`} />
              {link.label} ({link.count})
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        <div className="flex gap-6">
          {/* Left - Tabs */}
          <div className="flex-1 min-w-0">
            <Tabs
              tabs={[
                { id: "details", label: "Details", content: detailsContent },
                { id: "activity", label: "Activity", content: activityContent },
                { id: "related", label: "Related", content: relatedContent },
              ]}
              defaultTab="details"
            />
          </div>

          {/* Right Sidebar */}
          <div className="w-80 flex-shrink-0 space-y-4">
            {/* Files Card */}
            <div ref={filesRef} className="bg-white rounded-lg border border-[#dddbda]">
              <div className="px-4 py-3 border-b border-[#dddbda] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#3e3e3c]">Files ({job._count?.files || 0})</span>
                <ChevronDown className="w-4 h-4 text-[#706e6b]" />
              </div>
              <div className="p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#dddbda] rounded-lg p-6 text-center cursor-pointer hover:border-[#0176d3] hover:bg-blue-50 transition-colors"
                >
                  <button
                    disabled={isUploading}
                    className="px-4 py-2 text-sm font-medium text-[#3e3e3c] bg-white border border-[#dddbda] rounded hover:bg-[#f3f3f3] inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? "Uploading..." : "Upload Files"}
                  </button>
                  <p className="text-sm text-[#706e6b] mt-2">Or drop files</p>
                </div>
                {job.files && job.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {job.files.map((file) => (
                      <a key={file.id} href={file.url} className="block text-sm text-[#0176d3] hover:underline">
                        {file.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chatter/Activity Feed Card */}
            <div className="bg-white rounded-lg border border-[#dddbda]">
              <div className="p-4 border-b border-[#dddbda]">
                <div className="flex gap-2 mb-3">
                  <button className="px-3 py-1.5 text-sm font-medium rounded bg-[#0176d3] text-white">Post</button>
                  <button className="px-3 py-1.5 text-sm font-medium rounded text-[#706e6b] hover:bg-[#f3f3f3]">Poll</button>
                  <button className="px-3 py-1.5 text-sm font-medium rounded text-[#706e6b] hover:bg-[#f3f3f3]">Question</button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share an update..."
                    className="flex-1 px-3 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3] focus:border-[#0176d3]"
                    onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={isPostingComment || !newComment.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0176d3] rounded hover:bg-[#014486] disabled:bg-[#c9c9c9] disabled:cursor-not-allowed transition-colors"
                  >
                    {isPostingComment ? "..." : "Share"}
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {job.activities && job.activities.length > 0 ? (
                  <div className="space-y-4">
                    {job.activities.slice(0, 5).map((activity) => {
                      const userName = activity.user?.name || "System";
                      const initials = userName.split(" ").map(n => n[0]).join("");
                      return (
                        <div key={activity.id} className="flex gap-3">
                          <div className="w-8 h-8 bg-[#032d60] rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium text-[#0176d3]">{userName}</span>
                              {" "}<span className="text-[#706e6b]">{activity.content || activity.type}</span>
                            </p>
                            <p className="text-xs text-[#939393]">{new Date(activity.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#706e6b] text-center py-4">No updates yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Job" size="lg">
        <p className="text-sm text-[#706e6b] mb-4">Click on any field's pencil icon in the Details tab to edit inline, or use the Status Path to change status.</p>
        <div className="flex justify-end">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-[#0176d3] rounded hover:bg-[#014486]">
            Got it
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Job">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-[#3e3e3c]">Are you sure you want to delete this job?</p>
            <p className="text-sm text-[#706e6b] mt-1">This action cannot be undone. All related records (history, files, notes) will also be deleted.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-[#3e3e3c] bg-white border border-[#dddbda] rounded hover:bg-[#f3f3f3]">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-white bg-[#ea001e] rounded hover:bg-[#ba0517] disabled:bg-[#c9c9c9]">
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>

      {/* Clone Modal */}
      <Modal isOpen={showCloneModal} onClose={() => setShowCloneModal(false)} title="Clone Job">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Copy className="w-5 h-5 text-[#0176d3]" />
          </div>
          <div>
            <p className="text-sm text-[#3e3e3c]">Create a copy of this job?</p>
            <p className="text-sm text-[#706e6b] mt-1">A new job will be created with the name "{job.jobName} (Copy)" and status set to "Open".</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowCloneModal(false)} className="px-4 py-2 text-sm font-medium text-[#3e3e3c] bg-white border border-[#dddbda] rounded hover:bg-[#f3f3f3]">
            Cancel
          </button>
          <button onClick={handleClone} disabled={isCloning} className="px-4 py-2 text-sm font-medium text-white bg-[#0176d3] rounded hover:bg-[#014486] disabled:bg-[#c9c9c9]">
            {isCloning ? "Cloning..." : "Clone"}
          </button>
        </div>
      </Modal>

      {/* New Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="New Note">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3e3e3c] mb-1">Title (optional)</label>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3]"
              placeholder="Note title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3e3e3c] mb-1">Body *</label>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3] resize-none"
              placeholder="Enter note content..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowNoteModal(false)} className="px-4 py-2 text-sm font-medium text-[#3e3e3c] bg-white border border-[#dddbda] rounded hover:bg-[#f3f3f3]">
            Cancel
          </button>
          <button
            onClick={handleCreateNote}
            disabled={isCreatingNote || !noteBody.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0176d3] rounded hover:bg-[#014486] disabled:bg-[#c9c9c9] disabled:cursor-not-allowed"
          >
            {isCreatingNote ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {/* New Ticket Modal */}
      <Modal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} title="New Ticket">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3e3e3c] mb-1">Subject *</label>
            <input
              type="text"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3]"
              placeholder="Ticket subject..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3e3e3c] mb-1">Priority</label>
            <select
              value={ticketPriority}
              onChange={(e) => setTicketPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3]"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3e3e3c] mb-1">Description (optional)</label>
            <textarea
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3] resize-none"
              placeholder="Ticket description..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowTicketModal(false)} className="px-4 py-2 text-sm font-medium text-[#3e3e3c] bg-white border border-[#dddbda] rounded hover:bg-[#f3f3f3]">
            Cancel
          </button>
          <button
            onClick={handleCreateTicket}
            disabled={isCreatingTicket || !ticketSubject.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0176d3] rounded hover:bg-[#014486] disabled:bg-[#c9c9c9] disabled:cursor-not-allowed"
          >
            {isCreatingTicket ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
