"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Presentation,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
  Sparkles,
  Loader2,
  Type,
  Image,
  BarChart3,
  List,
  Eye,
  Edit3,
  Copy,
  Save,
  RefreshCw,
  Send,
  Check,
} from "lucide-react";
import { useXPDialog } from "@/components/ui/XPDialog";

// ============================================================
// Presentation Builder — Two modes:
// 1. Chat: Conversational AI generates slides through tool calls
// 2. Editor: Slide list | preview | editor panels with save/load
// ============================================================

type SlideLayout = "title" | "content" | "two-column" | "bullets" | "chart-placeholder" | "image-placeholder" | "blank";

interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  leftContent?: string;
  rightContent?: string;
  notes?: string;
}

interface CustomerResult {
  id: string;
  label: string;
  description: string;
  data: any;
}

interface ToolCall {
  tool: string;
  summary?: string;
  status: "running" | "done";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  generationId?: string;       // for server-side PPTX export
  downloadUrl?: string;        // pre-signed direct download URL
  presentationName?: string;   // auto-generated name from AI
}

const LAYOUT_OPTIONS: { value: SlideLayout; label: string; icon: React.ReactNode }[] = [
  { value: "title", label: "Title Slide", icon: <Type size={14} /> },
  { value: "content", label: "Content", icon: <Type size={14} /> },
  { value: "bullets", label: "Bullet Points", icon: <List size={14} /> },
  { value: "two-column", label: "Two Column", icon: <BarChart3 size={14} /> },
  { value: "chart-placeholder", label: "Chart", icon: <BarChart3 size={14} /> },
  { value: "image-placeholder", label: "Image", icon: <Image size={14} /> },
  { value: "blank", label: "Blank", icon: <Presentation size={14} /> },
];

function newSlideId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function createSlide(layout: SlideLayout = "content", title = ""): Slide {
  return {
    id: newSlideId(),
    layout,
    title,
    body: "",
    bullets: layout === "bullets" ? [""] : undefined,
    leftContent: layout === "two-column" ? "" : undefined,
    rightContent: layout === "two-column" ? "" : undefined,
    notes: "",
  };
}

function msgId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const SUGGESTION_CHIPS = [
  "Create a QBR for a customer",
  "Build a proposal for a building manager",
  "Make a safety presentation",
  "Presentation for a prospect in Manhattan",
];

const TOOL_LABELS: Record<string, string> = {
  search_customers: "Searching customers",
  search_by_location: "Looking up location",
  find_similar_customers: "Finding similar clients",
  get_customer_data: "Loading customer data",
  generate_presentation: "Generating slides",
};

interface PresentationBuilderViewProps {
  presentationId?: string | null;
}

export default function PresentationBuilderView({ presentationId }: PresentationBuilderViewProps) {
  const { alert: xpAlert, DialogComponent: XPDialogComponent } = useXPDialog();

  // Mode: "chat" (no slides) or "editor" (has slides)
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const slideListRef = useRef<HTMLDivElement>(null);

  // Chat state — restored from localStorage so tab switches don't lose history
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("zeus-pres-chat");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // PPTX download state
  const [downloading, setDownloading] = useState(false);

  // Save state — also restored from localStorage
  const [presentationName, setPresentationName] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("zeus-pres-name") || "";
  });
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [presentationType, setPresentationType] = useState("general");
  const [savedId, setSavedId] = useState<string | null>(() => {
    if (presentationId) return presentationId;
    if (typeof window === "undefined") return null;
    return localStorage.getItem("zeus-pres-savedId") || null;
  });
  const [saving, setSaving] = useState(false);
  const [loadingPresentation, setLoadingPresentation] = useState(false);

  // Persist chat state to localStorage
  useEffect(() => {
    try {
      // Only save non-streaming messages (finalized state)
      const toSave = chatMessages.map((m) => ({ ...m, isStreaming: false }));
      localStorage.setItem("zeus-pres-chat", JSON.stringify(toSave));
    } catch { /* quota exceeded — ignore */ }
  }, [chatMessages]);

  useEffect(() => {
    if (presentationName) localStorage.setItem("zeus-pres-name", presentationName);
  }, [presentationName]);

  useEffect(() => {
    if (savedId) localStorage.setItem("zeus-pres-savedId", savedId);
  }, [savedId]);

  const isEditorMode = slides.length > 0;
  const selectedSlide = slides[selectedSlideIndex] || slides[0];

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load existing presentation if ID provided
  useEffect(() => {
    if (presentationId) {
      loadPresentation(presentationId);
    }
  }, [presentationId]);

  const loadPresentation = async (id: string) => {
    setLoadingPresentation(true);
    try {
      const res = await fetch(`/api/presentations/${id}`);
      if (res.ok) {
        const data = await res.json();
        const loadedSlides = Array.isArray(data.slides) ? data.slides : [];
        if (loadedSlides.length > 0) {
          setSlides(loadedSlides);
          setSelectedSlideIndex(0);
        }
        setPresentationName(data.name || "");
        setSavedId(data.id);
        if (data.customer) {
          setSelectedCustomer({
            id: data.customer.id,
            label: data.customer.name,
            description: "",
            data: data.customer,
          });
        }
        if (data.presentationType) {
          setPresentationType(data.presentationType);
        }
      }
    } catch (e) {
      console.error("Failed to load presentation:", e);
    } finally {
      setLoadingPresentation(false);
    }
  };

  // ---- Chat Send ----
  const handleChatSend = useCallback(async (text?: string) => {
    const input = (text || chatInput).trim();
    if (!input || chatStreaming) return;

    const userMsg: ChatMessage = { id: msgId(), role: "user", content: input };
    const assistantMsg: ChatMessage = { id: msgId(), role: "assistant", content: "", isStreaming: true, toolCalls: [] };

    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
    setChatInput("");
    setChatStreaming(true);

    // Build message history for API
    const apiMessages = [...chatMessages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/presentation-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        const errorMsg = res.status === 401
          ? "Session expired. Please refresh the page and try again."
          : err.error || "Something went wrong. Please try again.";
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: errorMsg, isStreaming: false }
              : m
          )
        );
        setChatStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setChatStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let accContent = "";
      let accTools: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const event = JSON.parse(raw);

            if (event.type === "text") {
              accContent += event.content;
              setChatMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: accContent, toolCalls: [...accTools] }
                    : m
                )
              );
            } else if (event.type === "tool_start") {
              accTools = [...accTools, { tool: event.tool, summary: event.summary, status: "running" }];
              setChatMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, toolCalls: [...accTools] }
                    : m
                )
              );
            } else if (event.type === "tool_result") {
              accTools = accTools.map((t) =>
                t.tool === event.tool && t.status === "running"
                  ? { ...t, summary: event.summary, status: "done" as const }
                  : t
              );
              setChatMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, toolCalls: [...accTools] }
                    : m
                )
              );
            } else if (event.type === "slides") {
              // Zeus provider — slides generated directly, load into editor
              const autoName = event.presentationName || undefined;
              if (autoName) setPresentationName(autoName);
              if (Array.isArray(event.slides) && event.slides.length > 0) {
                setSlides(event.slides);
                setSelectedSlideIndex(0);
              }
            } else if (event.type === "presentation") {
              const autoName = event.presentationName || undefined;
              if (autoName) setPresentationName(autoName);
              setChatMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, generationId: event.generationId, downloadUrl: event.downloadUrl || undefined, presentationName: autoName }
                    : m
                )
              );
            } else if (event.type === "done") {
              // Final update
            }
          } catch {
            // skip parse errors
          }
        }
      }

      // Finalize
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, isStreaming: false }
            : m
        )
      );

    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Chat error:", err);
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: "Connection error. Please try again.", isStreaming: false }
            : m
        )
      );
    } finally {
      setChatStreaming(false);
      abortRef.current = null;
    }
  }, [chatInput, chatStreaming, chatMessages]);

  // ---- Save ----
  const handleSave = useCallback(async () => {
    if (!presentationName.trim()) {
      await xpAlert("Please enter a presentation name.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: presentationName.trim(),
        customerId: selectedCustomer?.id || null,
        presentationType,
        slides,
      };

      let res: Response;
      if (savedId) {
        res = await fetch(`/api/presentations/${savedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/presentations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (!savedId) setSavedId(data.id);
        await xpAlert("Presentation saved successfully");
      } else {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        await xpAlert(err.error || "Failed to save presentation.");
      }
    } catch (err) {
      console.error("Save failed:", err);
      await xpAlert("Failed to save presentation.");
    } finally {
      setSaving(false);
    }
  }, [presentationName, selectedCustomer, presentationType, slides, savedId, xpAlert]);

  // ---- Slide CRUD ----
  const addSlide = useCallback((layout: SlideLayout = "content") => {
    const slide = createSlide(layout, "");
    setSlides((prev) => {
      const next = [...prev];
      next.splice(selectedSlideIndex + 1, 0, slide);
      return next;
    });
    setSelectedSlideIndex((prev) => prev + 1);
  }, [selectedSlideIndex]);

  const duplicateSlide = useCallback(() => {
    const dup = { ...selectedSlide, id: newSlideId() };
    setSlides((prev) => {
      const next = [...prev];
      next.splice(selectedSlideIndex + 1, 0, dup);
      return next;
    });
    setSelectedSlideIndex((prev) => prev + 1);
  }, [selectedSlide, selectedSlideIndex]);

  const deleteSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== selectedSlideIndex));
    setSelectedSlideIndex((prev) => Math.min(prev, slides.length - 2));
  }, [selectedSlideIndex, slides.length]);

  const moveSlide = useCallback((dir: -1 | 1) => {
    const newIndex = selectedSlideIndex + dir;
    if (newIndex < 0 || newIndex >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      [next[selectedSlideIndex], next[newIndex]] = [next[newIndex], next[selectedSlideIndex]];
      return next;
    });
    setSelectedSlideIndex(newIndex);
  }, [selectedSlideIndex, slides.length]);

  const updateSlide = useCallback((field: keyof Slide, value: any) => {
    setSlides((prev) =>
      prev.map((s, i) => (i === selectedSlideIndex ? { ...s, [field]: value } : s))
    );
  }, [selectedSlideIndex]);

  const updateBullet = useCallback((bulletIndex: number, value: string) => {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== selectedSlideIndex || !s.bullets) return s;
        const bullets = [...s.bullets];
        bullets[bulletIndex] = value;
        return { ...s, bullets };
      })
    );
  }, [selectedSlideIndex]);

  const addBullet = useCallback(() => {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== selectedSlideIndex || !s.bullets) return s;
        return { ...s, bullets: [...s.bullets, ""] };
      })
    );
  }, [selectedSlideIndex]);

  const removeBullet = useCallback((bulletIndex: number) => {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== selectedSlideIndex || !s.bullets || s.bullets.length <= 1) return s;
        return { ...s, bullets: s.bullets.filter((_, bi) => bi !== bulletIndex) };
      })
    );
  }, [selectedSlideIndex]);

  // ---- Export as PPTX ----
  const handleExportPPTX = useCallback(async () => {
    try {
      const res = await fetch("/api/presentations/export-pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides, presentationName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        await xpAlert(err.error || "Failed to export PPTX.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${presentationName || "presentation"}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PPTX export error:", err);
      await xpAlert("Failed to export presentation.");
    }
  }, [slides, presentationName, xpAlert]);

  // ---- Render bold text (same pattern as dispatch AI summary) ----
  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // ---- Slide Thumbnail ----
  const renderThumbnail = (slide: Slide, index: number) => {
    const isSelected = index === selectedSlideIndex;
    return (
      <div
        key={slide.id}
        onClick={() => setSelectedSlideIndex(index)}
        className={`relative cursor-pointer border-2 rounded bg-white p-2 mb-2 transition-colors ${
          isSelected ? "border-[#0078d4] shadow-sm" : "border-[#d0d0d0] hover:border-[#999]"
        }`}
        style={{ minHeight: 60 }}
      >
        <div className="flex items-start gap-1.5">
          <span className="text-[10px] text-[#999] font-mono flex-shrink-0 mt-0.5">{index + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-[#333] truncate">
              {slide.title || "(Untitled)"}
            </div>
            <div className="text-[9px] text-[#999] mt-0.5">
              {LAYOUT_OPTIONS.find((l) => l.value === slide.layout)?.label || slide.layout}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---- Slide Editor ----
  const renderEditor = () => {
    if (!selectedSlide) return null;

    return (
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-4">
        {/* Layout selector */}
        <div>
          <label className="block text-[11px] font-semibold text-[#333] mb-1">Layout</label>
          <div className="flex gap-1 flex-wrap">
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  updateSlide("layout", opt.value);
                  if (opt.value === "bullets" && !selectedSlide.bullets) updateSlide("bullets", [""]);
                  if (opt.value === "two-column") {
                    if (!selectedSlide.leftContent) updateSlide("leftContent", "");
                    if (!selectedSlide.rightContent) updateSlide("rightContent", "");
                  }
                }}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] border rounded ${
                  selectedSlide.layout === opt.value
                    ? "bg-[#0078d4] text-white border-[#0078d4]"
                    : "bg-white text-[#333] border-[#999] hover:bg-[#e8e8e8]"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[11px] font-semibold text-[#333] mb-1">Title</label>
          <input
            type="text"
            value={selectedSlide.title}
            onChange={(e) => updateSlide("title", e.target.value)}
            placeholder="Slide title..."
            className="w-full border border-[#999] px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[#0078d4]"
          />
        </div>

        {/* Subtitle (title slide) */}
        {selectedSlide.layout === "title" && (
          <div>
            <label className="block text-[11px] font-semibold text-[#333] mb-1">Subtitle</label>
            <input
              type="text"
              value={selectedSlide.subtitle || ""}
              onChange={(e) => updateSlide("subtitle", e.target.value)}
              placeholder="Subtitle..."
              className="w-full border border-[#999] px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[#0078d4]"
            />
          </div>
        )}

        {/* Body */}
        {(selectedSlide.layout === "content" || selectedSlide.layout === "title" || selectedSlide.layout === "blank" || selectedSlide.layout === "chart-placeholder" || selectedSlide.layout === "image-placeholder") && (
          <div>
            <label className="block text-[11px] font-semibold text-[#333] mb-1">Body</label>
            <textarea
              value={selectedSlide.body || ""}
              onChange={(e) => updateSlide("body", e.target.value)}
              rows={5}
              placeholder="Slide content..."
              className="w-full border border-[#999] px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[#0078d4] resize-none"
            />
          </div>
        )}

        {/* Bullets */}
        {selectedSlide.layout === "bullets" && selectedSlide.bullets && (
          <div>
            <label className="block text-[11px] font-semibold text-[#333] mb-1">Bullet Points</label>
            {selectedSlide.bullets.map((b, bi) => (
              <div key={bi} className="flex items-center gap-1 mb-1">
                <span className="text-[11px] text-[#999]">&bull;</span>
                <input
                  type="text"
                  value={b}
                  onChange={(e) => updateBullet(bi, e.target.value)}
                  placeholder={`Point ${bi + 1}...`}
                  className="flex-1 border border-[#999] px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-[#0078d4]"
                />
                <button
                  onClick={() => removeBullet(bi)}
                  className="p-0.5 text-[#999] hover:text-[#d13438]"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={addBullet}
              className="text-[11px] text-[#0078d4] hover:underline mt-1"
            >
              + Add bullet
            </button>
          </div>
        )}

        {/* Two-column */}
        {selectedSlide.layout === "two-column" && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-[#333] mb-1">Left Column</label>
              <textarea
                value={selectedSlide.leftContent || ""}
                onChange={(e) => updateSlide("leftContent", e.target.value)}
                rows={5}
                placeholder="Left column content..."
                className="w-full border border-[#999] px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[#0078d4] resize-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-[#333] mb-1">Right Column</label>
              <textarea
                value={selectedSlide.rightContent || ""}
                onChange={(e) => updateSlide("rightContent", e.target.value)}
                rows={5}
                placeholder="Right column content..."
                className="w-full border border-[#999] px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[#0078d4] resize-none"
              />
            </div>
          </div>
        )}

        {/* Speaker notes */}
        <div>
          <label className="block text-[11px] font-semibold text-[#333] mb-1">Speaker Notes</label>
          <textarea
            value={selectedSlide.notes || ""}
            onChange={(e) => updateSlide("notes", e.target.value)}
            rows={2}
            placeholder="Notes for the presenter..."
            className="w-full border border-[#999] px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[#0078d4] resize-none text-[#666] italic"
          />
        </div>
      </div>
    );
  };

  // ---- Slide Preview ----
  const renderPreviewSlide = (slide: Slide) => {
    const bg = slide.layout === "title" ? "bg-gradient-to-br from-[#000080] to-[#1084d0]" : "bg-white";
    const textColor = slide.layout === "title" ? "text-white" : "text-[#333]";

    return (
      <div className={`w-full aspect-[16/9] ${bg} rounded border border-[#c0c0c0] shadow-sm flex flex-col justify-center p-8`}>
        <h1 className={`${textColor} ${slide.layout === "title" ? "text-[28px]" : "text-[20px]"} font-bold mb-2`}>
          {slide.title || "(Untitled)"}
        </h1>

        {slide.subtitle && (
          <h2 className={`${slide.layout === "title" ? "text-[#a0c0ff]" : "text-[#666]"} text-[16px] mb-4`}>
            {slide.subtitle}
          </h2>
        )}

        {slide.body && (
          <p className={`${textColor} text-[13px] leading-relaxed whitespace-pre-line`}>
            {slide.body}
          </p>
        )}

        {slide.layout === "bullets" && slide.bullets && (
          <ul className={`${textColor} text-[13px] leading-relaxed list-disc pl-5 space-y-1`}>
            {slide.bullets.filter(Boolean).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}

        {slide.layout === "two-column" && (
          <div className="flex gap-6 mt-2">
            <div className="flex-1 text-[13px] text-[#333] whitespace-pre-line">
              {slide.leftContent}
            </div>
            <div className="w-px bg-[#d0d0d0]" />
            <div className="flex-1 text-[13px] text-[#333] whitespace-pre-line">
              {slide.rightContent}
            </div>
          </div>
        )}

        {slide.layout === "chart-placeholder" && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#c0c0c0] rounded mt-4 min-h-[100px]">
            <div className="text-center text-[#999]">
              <BarChart3 size={32} className="mx-auto mb-1" />
              <span className="text-[11px]">Chart Placeholder</span>
            </div>
          </div>
        )}

        {slide.layout === "image-placeholder" && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#c0c0c0] rounded mt-4 min-h-[100px]">
            <div className="text-center text-[#999]">
              <Image size={32} className="mx-auto mb-1" />
              <span className="text-[11px]">Image Placeholder</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---- Fullscreen Preview Mode ----
  if (previewMode) {
    const slide = slides[previewIndex];
    return (
      <>
        <XPDialogComponent />
        <div
          className="fixed inset-0 z-[200] bg-black flex flex-col"
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreviewMode(false);
            if (e.key === "ArrowRight" || e.key === " ") setPreviewIndex((i) => Math.min(i + 1, slides.length - 1));
            if (e.key === "ArrowLeft") setPreviewIndex((i) => Math.max(i - 1, 0));
          }}
          tabIndex={0}
          autoFocus
        >
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-[960px]">{slide && renderPreviewSlide(slide)}</div>
          </div>
          <div className="flex items-center justify-between px-6 py-3 bg-[#1a1a1a] text-white text-[12px]">
            <span>
              Slide {previewIndex + 1} of {slides.length}
            </span>
            <div className="flex items-center gap-3">
              <button onClick={() => setPreviewIndex((i) => Math.max(i - 1, 0))} className="hover:text-[#80b0ff]">
                &larr; Prev
              </button>
              <button onClick={() => setPreviewIndex((i) => Math.min(i + 1, slides.length - 1))} className="hover:text-[#80b0ff]">
                Next &rarr;
              </button>
              <button onClick={() => setPreviewMode(false)} className="hover:text-[#ff8080]">
                Exit (Esc)
              </button>
            </div>
            {slide?.notes && (
              <div className="text-[11px] text-[#999] italic max-w-[300px] truncate">
                Notes: {slide.notes}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ---- Loading State ----
  if (loadingPresentation) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f0f0f0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
        <XPDialogComponent />
        <div className="flex items-center gap-2 text-[#666]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[13px]">Loading presentation...</span>
        </div>
      </div>
    );
  }

  // ---- CHAT MODE ----
  if (!isEditorMode) {
    return (
      <div className="h-full flex flex-col bg-[#f0f0f0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
        <XPDialogComponent />
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f8f8f8] border-b border-[#d0d0d0]">
          <Presentation size={16} className="text-[#0078d4]" />
          <span className="text-[12px] font-semibold text-[#333]">Presentation Builder</span>
          <div className="flex-1" />
          {chatMessages.length > 0 && (
            <button
              onClick={() => {
                setChatMessages([]);
                setChatInput("");
                setPresentationName("");
                setSavedId(null);
                setSelectedCustomer(null);
                setPresentationType("general");
                localStorage.removeItem("zeus-pres-chat");
                localStorage.removeItem("zeus-pres-name");
                localStorage.removeItem("zeus-pres-savedId");
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-white border border-[#999] rounded hover:bg-[#e8e8e8] text-[#333]"
            >
              <Plus size={12} /> New Chat
            </button>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[680px] mx-auto px-4 py-6">
            {/* Empty state */}
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={22} className="text-[#e3730a]" />
                  <h2 className="text-[16px] font-semibold text-[#333]">Presentation Builder</h2>
                </div>
                <p className="text-[12px] text-[#666] mb-6 text-center max-w-[400px]">
                  Describe the presentation you need. I&apos;ll search our database, gather the right data, and generate your slides.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChatSend(chip)}
                      className="px-3 py-1.5 text-[11px] border border-[#c0c0c0] bg-white rounded-full text-[#333] hover:bg-[#e8f4fc] hover:border-[#0078d4] transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 ${
                    msg.role === "user"
                      ? "bg-[#0078d4] text-white"
                      : "bg-white border border-[#d0d0d0]"
                  }`}
                >
                  {/* Tool call pills */}
                  {msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {msg.toolCalls.map((tc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f0f0f0] rounded text-[10px] text-[#555] border border-[#e0e0e0]"
                        >
                          {tc.status === "running" ? (
                            <Loader2 size={10} className="animate-spin text-[#0078d4]" />
                          ) : (
                            <Check size={10} className="text-[#107c10]" />
                          )}
                          {TOOL_LABELS[tc.tool] || tc.tool}
                          {tc.status === "done" && tc.summary && (
                            <span className="text-[#999] ml-0.5">— {tc.summary}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message text */}
                  {msg.content && (
                    <div className={`text-[12px] leading-relaxed whitespace-pre-line ${
                      msg.role === "user" ? "text-white" : "text-[#333]"
                    }`}>
                      {msg.role === "assistant" ? renderBoldText(msg.content) : msg.content}
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 bg-[#e3730a] ml-0.5 animate-pulse" />
                      )}
                    </div>
                  )}

                  {/* Only show streaming cursor if no content yet but streaming */}
                  {msg.role === "assistant" && !msg.content && msg.isStreaming && (
                    <div className="text-[12px] text-[#999]">
                      <span className="inline-block w-1.5 h-3.5 bg-[#e3730a] animate-pulse" />
                    </div>
                  )}

                  {/* Presentation actions */}
                  {msg.generationId && !msg.isStreaming && (
                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[#e0e0e0]">
                      <button
                        onClick={async () => {
                          if (downloading) return;
                          setDownloading(true);
                          const fname = msg.presentationName || presentationName || "Presentation";
                          try {
                            const res = await fetch("/api/presentations/gamma-export", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                generationId: msg.generationId,
                                downloadUrl: msg.downloadUrl || undefined,
                                filename: fname,
                              }),
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({ error: "Download failed" }));
                              await xpAlert(err.error || "Failed to download presentation.");
                              return;
                            }
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${fname}.pptx`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error("PPTX download error:", err);
                            await xpAlert("Failed to download presentation.");
                          } finally {
                            setDownloading(false);
                          }
                        }}
                        disabled={downloading}
                        className="flex items-center gap-1 px-3 py-1.5 text-[11px] bg-[#0078d4] text-white rounded hover:bg-[#005a9e] border border-[#005a9e] disabled:opacity-50"
                      >
                        {downloading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Download size={12} />
                        )}
                        {downloading ? "Downloading..." : "Download PPTX"}
                      </button>
                      <button
                        onClick={async () => {
                          const fname = msg.presentationName || presentationName || "Presentation";
                          setSaving(true);
                          try {
                            const body = {
                              name: fname,
                              presentationType,
                              customerId: selectedCustomer?.id || null,
                              generationPrompt: msg.generationId || null,
                              slides: [],
                            };

                            let res: Response;
                            if (savedId) {
                              res = await fetch(`/api/presentations/${savedId}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(body),
                              });
                            } else {
                              res = await fetch("/api/presentations", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(body),
                              });
                            }

                            if (res.ok) {
                              const data = await res.json();
                              if (!savedId) setSavedId(data.id);
                              setPresentationName(fname);
                              await xpAlert(`"${fname}" saved to Saved Presentations`);
                            } else {
                              const err = await res.json().catch(() => ({ error: "Save failed" }));
                              await xpAlert(err.error || "Failed to save.");
                            }
                          } catch (err) {
                            console.error("Save failed:", err);
                            await xpAlert("Failed to save presentation.");
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 text-[11px] bg-[#107c10] text-white rounded hover:bg-[#0b5e0b] border border-[#0b5e0b] disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}
                        {saving ? "Saving..." : savedId ? "Saved" : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-[#d0d0d0] bg-white px-4 py-3">
          <div className="max-w-[680px] mx-auto flex items-end gap-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSend();
                }
              }}
              rows={1}
              placeholder="Describe your presentation..."
              className="flex-1 border border-[#999] rounded px-3 py-2 text-[12px] bg-white focus:outline-none focus:border-[#0078d4] resize-none min-h-[36px] max-h-[120px]"
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
              disabled={chatStreaming}
            />
            <button
              onClick={() => handleChatSend()}
              disabled={!chatInput.trim() || chatStreaming}
              className="flex items-center justify-center w-9 h-9 bg-[#0078d4] text-white rounded hover:bg-[#005a9e] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              title="Send"
            >
              {chatStreaming ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
            <button
              onClick={() => {
                setSlides([createSlide("title", ""), createSlide("content", "")]);
                setSelectedSlideIndex(0);
                setPresentationName("Untitled Presentation");
              }}
              className="flex items-center gap-1 px-3 h-9 text-[11px] bg-white border border-[#999] text-[#333] hover:bg-[#e8e8e8] rounded flex-shrink-0"
              title="Start with blank slides"
            >
              <Presentation size={13} /> Blank
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- EDITOR MODE ----
  return (
    <div className="h-full flex flex-col bg-[#f0f0f0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      <XPDialogComponent />
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#f8f8f8] border-b border-[#d0d0d0]">
        <Presentation size={16} className="text-[#0078d4]" />

        {/* Presentation name */}
        <input
          type="text"
          value={presentationName}
          onChange={(e) => setPresentationName(e.target.value)}
          placeholder="Presentation name..."
          className="text-[12px] font-semibold text-[#333] bg-transparent border-b border-transparent hover:border-[#999] focus:border-[#0078d4] focus:outline-none px-1 py-0.5 min-w-[200px]"
        />

        <div className="flex-1" />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[#107c10] text-white border border-[#0b5e0b] rounded hover:bg-[#0b5e0b] disabled:opacity-50"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? "Saving..." : "Save"}
        </button>

        {/* Regenerate — returns to chat with history */}
        <button
          onClick={() => {
            setSlides([]);
            setSelectedSlideIndex(0);
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-white border border-[#999] rounded hover:bg-[#e8e8e8]"
          title="Back to chat"
        >
          <RefreshCw size={13} /> Regenerate
        </button>

        <div className="w-px h-5 bg-[#d0d0d0] mx-1" />

        <button
          onClick={() => { setPreviewIndex(selectedSlideIndex); setPreviewMode(true); }}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-white border border-[#999] rounded hover:bg-[#e8e8e8]"
          title="Present"
        >
          <Eye size={13} /> Present
        </button>
        <button
          onClick={handleExportPPTX}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-white border border-[#999] rounded hover:bg-[#e8e8e8]"
          title="Export as PowerPoint"
        >
          <Download size={13} /> Export
        </button>
      </div>

      {/* Main area: slide list | preview | editor */}
      <div className="flex-1 flex min-h-0">
        {/* Slide list panel */}
        <div className="w-[160px] flex-shrink-0 border-r border-[#d0d0d0] bg-[#f4f4f4] flex flex-col">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#d0d0d0]">
            <span className="text-[10px] font-semibold text-[#666] uppercase">Slides</span>
            <button
              onClick={() => addSlide("content")}
              className="p-0.5 text-[#0078d4] hover:text-[#005a9e]"
              title="Add slide"
            >
              <Plus size={14} />
            </button>
          </div>
          <div ref={slideListRef} className="flex-1 overflow-y-auto px-2 py-2">
            {slides.map((slide, index) => renderThumbnail(slide, index))}
          </div>
          <div className="flex items-center justify-center gap-1 px-2 py-1.5 border-t border-[#d0d0d0]">
            <button onClick={() => moveSlide(-1)} disabled={selectedSlideIndex === 0} className="p-1 text-[#666] hover:text-[#333] disabled:text-[#ccc]" title="Move up">
              <ChevronUp size={13} />
            </button>
            <button onClick={() => moveSlide(1)} disabled={selectedSlideIndex === slides.length - 1} className="p-1 text-[#666] hover:text-[#333] disabled:text-[#ccc]" title="Move down">
              <ChevronDown size={13} />
            </button>
            <button onClick={duplicateSlide} className="p-1 text-[#666] hover:text-[#333]" title="Duplicate">
              <Copy size={13} />
            </button>
            <button onClick={deleteSlide} disabled={slides.length <= 1} className="p-1 text-[#666] hover:text-[#d13438] disabled:text-[#ccc]" title="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Slide preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#e0e0e0] min-w-0">
          <div className="w-full max-w-[640px]">
            {renderPreviewSlide(selectedSlide)}
          </div>
          <div className="text-[11px] text-[#888] mt-2">
            Slide {selectedSlideIndex + 1} of {slides.length}
            {selectedCustomer && (
              <span className="ml-2 text-[#0078d4]">| {selectedCustomer.label}</span>
            )}
          </div>
        </div>

        {/* Editor panel */}
        <div className="w-[300px] flex-shrink-0 border-l border-[#d0d0d0] bg-white flex flex-col">
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#d0d0d0]">
            <Edit3 size={13} className="text-[#666]" />
            <span className="text-[11px] font-semibold text-[#666]">Edit Slide</span>
          </div>
          {renderEditor()}
        </div>
      </div>
    </div>
  );
}
