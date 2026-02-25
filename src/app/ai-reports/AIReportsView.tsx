"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Download,
  FileText,
  Loader2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  ThumbsUp,
  ThumbsDown,
  Database,
  AlertTriangle,
} from "lucide-react";

interface ReportColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: "text" | "currency" | "number";
}

interface ReportData {
  title: string;
  summary?: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  dataSource?: "live" | "sample";
  sql?: string;
}

type SortDirection = "asc" | "desc";

function formatCellValue(value: unknown, format?: string): string {
  if (value == null) return "";
  if (format === "currency") {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  if (format === "number") {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString("en-US");
  }
  return String(value);
}

const SUGGESTED_PROMPTS = [
  "List all of our accounts with their address and balance",
  "Show me all open service tickets",
  "Top 10 customers by number of premises",
  "Completed tickets from the last 30 days",
  "All unpaid invoices with amount and customer",
  "Active jobs with budget vs actual cost",
];

export default function AIReportsView() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [history, setHistory] = useState<string[]>([]);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const generateReport = async (text: string) => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setSortKey(null);
    setFeedbackSent(false);
    setShowSql(false);

    // Add to history
    setHistory((prev) => {
      const updated = [text, ...prev.filter((h) => h !== text)];
      return updated.slice(0, 20);
    });

    try {
      const res = await fetch("/api/ai-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate report");
        return;
      }

      setReport(data);
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      setError("Network error - could not reach the server");
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (type: "preference" | "correction", message: string) => {
    try {
      await fetch("/api/ai-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: { type, message } }),
      });
      setFeedbackSent(true);
    } catch {
      // Silent fail for feedback
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateReport(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateReport(prompt);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getSortedRows = () => {
    if (!report || !sortKey) return report?.rows || [];
    return [...report.rows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const aNum = typeof aVal === "string" ? parseFloat(aVal.replace(/[$,%]/g, "")) : Number(aVal);
      const bNum = typeof bVal === "string" ? parseFloat(bVal.replace(/[$,%]/g, "")) : Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDir === "asc" ? aNum - bNum : bNum - aNum;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (sortDir === "asc") return aStr.localeCompare(bStr);
      return bStr.localeCompare(aStr);
    });
  };

  const exportCSV = () => {
    if (!report) return;
    const header = report.columns.map((c) => c.label).join(",");
    const rows = report.rows.map((row) =>
      report.columns
        .map((col) => {
          const val = String(row[col.key] ?? "");
          if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPrintable = () => {
    if (!report) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = getSortedRows();
    const tableRows = rows
      .map(
        (row) =>
          `<tr>${report.columns
            .map(
              (col) =>
                `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:${col.align || "left"};font-size:13px">${formatCellValue(row[col.key], col.format)}</td>`
            )
            .join("")}</tr>`
      )
      .join("");

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #1a1a1a; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .summary { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
    .meta { color: #9ca3af; font-size: 12px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
    tr:hover { background: #f9fafb; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  ${report.summary ? `<div class="summary">${report.summary}</div>` : ""}
  <div class="meta">Generated ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} &bull; ${rows.length} records</div>
  <table>
    <thead>
      <tr>${report.columns.map((col) => `<th style="text-align:${col.align || "left"}">${col.label}</th>`).join("")}</tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const sortedRows = getSortedRows();

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f8f9fa] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#e0e0e0] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0176d3] to-[#014486] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#1a1a1a]">AI Report Builder</h1>
            <p className="text-xs text-[#6b7280]">
              Describe the report you need in plain English — powered by your live database
            </p>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Prompt Section */}
        <div className="px-6 pt-6 pb-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="bg-white rounded-xl border border-[#d1d5db] shadow-sm focus-within:border-[#0176d3] focus-within:ring-2 focus-within:ring-[#0176d3]/20 transition-all">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Show me all accounts with a balance over $1,000..."
                rows={2}
                className="w-full px-4 pt-3 pb-2 text-sm bg-transparent border-none outline-none resize-none placeholder:text-[#9ca3af]"
              />
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-[10px] text-[#9ca3af]">
                  Press Enter to generate &bull; Shift+Enter for new line
                </span>
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#0176d3] rounded-lg hover:bg-[#014486] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Generate
                </button>
              </div>
            </div>
          </form>

          {/* Suggestions - only show when no report */}
          {!report && !loading && !error && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[#6b7280] mb-2">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setPrompt(suggestion);
                      generateReport(suggestion);
                    }}
                    className="px-3 py-1.5 text-xs bg-white border border-[#e5e7eb] rounded-full text-[#374151] hover:border-[#0176d3] hover:text-[#0176d3] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* History - show when no report and has history */}
          {!report && !loading && !error && history.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[#6b7280] mb-2">Recent:</p>
              <div className="flex flex-wrap gap-2">
                {history.slice(0, 5).map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setPrompt(h);
                      generateReport(h);
                    }}
                    className="px-3 py-1.5 text-xs bg-[#f0f7ff] border border-[#b8d4f0] rounded-full text-[#0176d3] hover:bg-[#e0efff] transition-colors"
                  >
                    {h.length > 50 ? h.substring(0, 50) + "..." : h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-[#e5e7eb]" />
              <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-2 border-transparent border-t-[#0176d3] animate-spin" />
            </div>
            <p className="mt-4 text-sm text-[#6b7280]">Querying your database...</p>
            <p className="text-xs text-[#9ca3af] mt-1">AI is writing a query and fetching real data</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mx-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Failed to generate report</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Results */}
        {report && !loading && (
          <div ref={tableRef} className="px-6 pb-6">
            {/* Report Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-[#1a1a1a]">{report.title}</h2>
                {report.summary && (
                  <p className="text-xs text-[#6b7280] mt-0.5">{report.summary}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[10px] text-[#9ca3af]">
                    {sortedRows.length} records &bull; Generated just now
                  </p>
                  {report.dataSource === "live" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                      <Database className="w-3 h-3" />
                      Live Data
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      Sample Data (SQL Server unavailable)
                    </span>
                  )}
                  {report.sql && (
                    <button
                      onClick={() => setShowSql(!showSql)}
                      className="text-[10px] text-[#0176d3] hover:underline"
                    >
                      {showSql ? "Hide SQL" : "Show SQL"}
                    </button>
                  )}
                </div>
                {showSql && report.sql && (
                  <pre className="mt-2 p-3 bg-[#1e1e1e] text-[#d4d4d4] text-[11px] rounded-lg overflow-x-auto font-mono leading-relaxed">
                    {report.sql}
                  </pre>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#d1d5db] rounded-lg text-[#374151] hover:bg-[#f9fafb] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
                <button
                  onClick={exportPrintable}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#d1d5db] rounded-lg text-[#374151] hover:bg-[#f9fafb] transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Print Report
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f9fafb]">
                      {report.columns.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className="px-4 py-2.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#e5e7eb] cursor-pointer hover:bg-[#f3f4f6] select-none transition-colors whitespace-nowrap"
                          style={{ textAlign: col.align || "left" }}
                        >
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            {sortKey === col.key ? (
                              sortDir === "asc" ? (
                                <ChevronUp className="w-3 h-3 text-[#0176d3]" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-[#0176d3]" />
                              )
                            ) : (
                              <ChevronDown className="w-3 h-3 text-[#d1d5db]" />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="border-b border-[#f3f4f6] hover:bg-[#f0f7ff] transition-colors"
                      >
                        {report.columns.map((col) => (
                          <td
                            key={col.key}
                            className="px-4 py-2 text-[13px] text-[#1a1a1a] whitespace-nowrap"
                            style={{ textAlign: col.align || "left" }}
                          >
                            {formatCellValue(row[col.key], col.format)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feedback bar */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!feedbackSent ? (
                  <>
                    <span className="text-[11px] text-[#9ca3af]">Was this report helpful?</span>
                    <button
                      onClick={() => sendFeedback("preference", `User liked report: "${prompt}" → "${report.title}"`)}
                      className="p-1 rounded hover:bg-green-50 text-[#9ca3af] hover:text-green-600 transition-colors"
                      title="Good report"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const correction = window.prompt("What was wrong with this report? This helps the AI learn.");
                        if (correction) {
                          sendFeedback("correction", `Report "${prompt}" issue: ${correction}`);
                        }
                      }}
                      className="p-1 rounded hover:bg-red-50 text-[#9ca3af] hover:text-red-500 transition-colors"
                      title="Report an issue"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] text-green-600">Thanks for the feedback!</span>
                )}
              </div>
              {sortedRows.length === 0 && (
                <span className="text-xs text-[#9ca3af]">No records found. Try a different query.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
