"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  User,
  Globe,
  List,
  FolderOpen,
  Folder,
  Plus,
  Search,
  Trash2,
  FolderInput,
  Eye,
  EyeOff,
  Presentation,
  Loader2,
  X,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

interface SavedPresentation {
  id: string;
  name: string;
  description: string | null;
  customerId: string | null;
  presentationType: string;
  slideCount: number;
  folderId: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string };
  customer: { id: string; name: string } | null;
  folder: { id: string; name: string } | null;
}

interface PresentationFolder {
  id: string;
  name: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  user: { name: string };
  _count: { presentations: number };
}

type ViewType = "recent" | "my" | "public" | "all" | "folder";

const TYPE_LABELS: Record<string, string> = {
  qbr: "QBR",
  proposal: "Proposal",
  onboarding: "Onboarding",
  safety: "Safety",
  general: "General",
};

export default function SavedPresentationsView() {
  const { openTab } = useTabs();
  const [presentations, setPresentations] = useState<SavedPresentation[]>([]);
  const [folders, setFolders] = useState<PresentationFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>("all");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderPublic, setNewFolderPublic] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Move to folder dialog
  const [movePresentationId, setMovePresentationId] = useState<string | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string | null>(null);

  const fetchPresentations = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/presentations?view=";
      if (activeView === "folder" && activeFolderId) {
        url = `/api/presentations?view=all&folderId=${activeFolderId}`;
      } else {
        url += activeView;
      }
      const res = await fetch(url);
      if (res.ok) {
        setPresentations(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch presentations:", e);
    } finally {
      setLoading(false);
    }
  }, [activeView, activeFolderId]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/presentation-folders");
      if (res.ok) {
        setFolders(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch folders:", e);
    }
  }, []);

  useEffect(() => {
    fetchPresentations();
  }, [fetchPresentations]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleDeletePresentation = async (id: string) => {
    try {
      const res = await fetch(`/api/presentations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPresentations();
      }
    } catch (e) {
      console.error("Failed to delete presentation:", e);
    }
  };

  const handleTogglePublic = async (p: SavedPresentation) => {
    try {
      const res = await fetch(`/api/presentations/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !p.isPublic }),
      });
      if (res.ok) {
        fetchPresentations();
      }
    } catch (e) {
      console.error("Failed to toggle visibility:", e);
    }
  };

  const handleMoveToFolder = async () => {
    if (!movePresentationId) return;
    try {
      const res = await fetch(`/api/presentations/${movePresentationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: moveFolderId }),
      });
      if (res.ok) {
        setMovePresentationId(null);
        setMoveFolderId(null);
        fetchPresentations();
      }
    } catch (e) {
      console.error("Failed to move presentation:", e);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/presentation-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim(), isPublic: newFolderPublic }),
      });
      if (res.ok) {
        setNewFolderName("");
        setNewFolderPublic(false);
        setShowNewFolder(false);
        fetchFolders();
      }
    } catch (e) {
      console.error("Failed to create folder:", e);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      const res = await fetch(`/api/presentation-folders?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        if (activeFolderId === id) {
          setActiveView("all");
          setActiveFolderId(null);
        }
        fetchFolders();
      }
    } catch (e) {
      console.error("Failed to delete folder:", e);
    }
  };

  const handlePresentationClick = (p: SavedPresentation) => {
    openTab("Presentation Builder", `/presentation-builder?id=${p.id}`);
  };

  const filteredPresentations = searchQuery
    ? presentations.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : presentations;

  const viewLabel =
    activeView === "recent"
      ? "Recent Presentations"
      : activeView === "my"
      ? "Created by Me"
      : activeView === "public"
      ? "Public Presentations"
      : activeView === "folder"
      ? folders.find((f) => f.id === activeFolderId)?.name || "Folder"
      : "All Presentations";

  const navItems: { view: ViewType; label: string; icon: typeof Clock }[] = [
    { view: "recent", label: "Recent", icon: Clock },
    { view: "my", label: "Created by Me", icon: User },
    { view: "public", label: "Public", icon: Globe },
    { view: "all", label: "All Presentations", icon: List },
  ];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#c0c0c0] overflow-hidden" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      {/* Header */}
      <div className="bg-[#f0f0f0] border-b border-[#808080] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4 text-[#0078d4]" />
          <h1 className="text-[13px] font-semibold text-[#1a1a1a]">{viewLabel}</h1>
          <span className="text-[11px] text-[#666]">({filteredPresentations.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#999]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search presentations..."
              className="pl-6 pr-2 py-1 text-[11px] border border-[#999] bg-white w-48 focus:outline-none focus:border-[#0078d4]"
            />
          </div>
          <button
            onClick={() => openTab("Presentation Builder", "/presentation-builder")}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-[#0078d4] text-white border border-[#005a9e] hover:bg-[#005a9e]"
          >
            <Plus className="w-3 h-3" />
            New Presentation
          </button>
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-white border border-[#999] text-[#333] hover:bg-[#e8e8e8]"
          >
            <FolderOpen className="w-3 h-3" />
            New Folder
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[180px] bg-white border-r border-[#808080] flex flex-col overflow-y-auto">
          <div className="px-2 py-1.5 text-[10px] font-bold text-[#666] uppercase tracking-wider bg-[#f0f0f0] border-b border-[#ccc]">
            Presentations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view && !activeFolderId;
            return (
              <button
                key={item.view}
                onClick={() => {
                  setActiveView(item.view);
                  setActiveFolderId(null);
                }}
                className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-left hover:bg-[#e8f4fc] ${
                  isActive ? "bg-[#cce4f7] font-semibold" : ""
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#0078d4] flex-shrink-0" />
                {item.label}
              </button>
            );
          })}

          <div className="px-2 py-1.5 text-[10px] font-bold text-[#666] uppercase tracking-wider bg-[#f0f0f0] border-b border-[#ccc] border-t border-t-[#ccc] mt-1">
            Folders
          </div>
          {folders.length === 0 && (
            <div className="px-3 py-2 text-[10px] text-[#999] italic">No folders yet</div>
          )}
          {folders.map((folder) => {
            const isActive = activeView === "folder" && activeFolderId === folder.id;
            return (
              <div
                key={folder.id}
                className={`group flex items-center gap-1.5 px-3 py-1.5 text-[11px] hover:bg-[#e8f4fc] cursor-pointer ${
                  isActive ? "bg-[#cce4f7] font-semibold" : ""
                }`}
                onClick={() => {
                  setActiveView("folder");
                  setActiveFolderId(folder.id);
                }}
              >
                <Folder className="w-3.5 h-3.5 text-[#e8c56c] flex-shrink-0" />
                <span className="flex-1 truncate">{folder.name}</span>
                <span className="text-[9px] text-[#999]">{folder._count.presentations}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500"
                  title="Delete folder"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right side — presentation grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Column headers */}
          <div className="flex bg-[#f0f0f0] border-b border-[#999] text-[11px] font-semibold text-[#333]">
            <div className="flex-[3] px-2 py-1 border-r border-[#ccc]">Name</div>
            <div className="flex-[2] px-2 py-1 border-r border-[#ccc]">Customer</div>
            <div className="w-[70px] px-2 py-1 border-r border-[#ccc] text-center">Type</div>
            <div className="flex-[1] px-2 py-1 border-r border-[#ccc]">Created By</div>
            <div className="flex-[1] px-2 py-1 border-r border-[#ccc]">Date</div>
            <div className="w-[50px] px-2 py-1 border-r border-[#ccc] text-center">Slides</div>
            <div className="w-[70px] px-2 py-1 border-r border-[#ccc] text-center">Visibility</div>
            <div className="w-[100px] px-2 py-1 text-center">Actions</div>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[#0078d4]" />
                <span className="ml-2 text-[12px] text-[#666]">Loading presentations...</span>
              </div>
            ) : filteredPresentations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#999]">
                <Presentation className="w-8 h-8 mb-2" />
                <p className="text-[12px]">No saved presentations yet</p>
                <p className="text-[10px] mt-1">Create one in the Presentation Builder</p>
              </div>
            ) : (
              filteredPresentations.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center border-b border-[#e8e8e8] hover:bg-[#e8f4fc] text-[11px]"
                >
                  <div className="flex-[3] px-2 py-1.5 border-r border-[#f0f0f0]">
                    <button
                      onClick={() => handlePresentationClick(p)}
                      className="text-[#0078d4] hover:underline font-medium text-left"
                    >
                      {p.name}
                    </button>
                    {p.description && (
                      <p className="text-[10px] text-[#999] truncate mt-0.5">{p.description}</p>
                    )}
                  </div>
                  <div className="flex-[2] px-2 py-1.5 border-r border-[#f0f0f0] text-[#333]">
                    {p.customer?.name || "—"}
                  </div>
                  <div className="w-[70px] px-2 py-1.5 border-r border-[#f0f0f0] text-center">
                    <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] rounded">
                      {TYPE_LABELS[p.presentationType] || p.presentationType}
                    </span>
                  </div>
                  <div className="flex-[1] px-2 py-1.5 border-r border-[#f0f0f0] text-[#333]">
                    {p.user.name}
                  </div>
                  <div className="flex-[1] px-2 py-1.5 border-r border-[#f0f0f0] text-[#666]">
                    {new Date(p.createdAt).toLocaleDateString("en-US")}
                  </div>
                  <div className="w-[50px] px-2 py-1.5 border-r border-[#f0f0f0] text-center text-[#666]">
                    {p.slideCount}
                  </div>
                  <div className="w-[70px] px-2 py-1.5 border-r border-[#f0f0f0] text-center">
                    {p.isPublic ? (
                      <span className="inline-block px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] rounded">
                        Public
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded">
                        Private
                      </span>
                    )}
                  </div>
                  <div className="w-[100px] px-2 py-1.5 flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleTogglePublic(p)}
                      className="p-1 hover:bg-[#ddd] rounded"
                      title={p.isPublic ? "Make private" : "Make public"}
                    >
                      {p.isPublic ? (
                        <EyeOff className="w-3 h-3 text-[#666]" />
                      ) : (
                        <Eye className="w-3 h-3 text-[#666]" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setMovePresentationId(p.id);
                        setMoveFolderId(p.folderId);
                      }}
                      className="p-1 hover:bg-[#ddd] rounded"
                      title="Move to folder"
                    >
                      <FolderInput className="w-3 h-3 text-[#666]" />
                    </button>
                    <button
                      onClick={() => handleDeletePresentation(p.id)}
                      className="p-1 hover:bg-[#fee2e2] rounded"
                      title="Delete presentation"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Folder Dialog */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-[#ece9d8] border-2 border-[#0055e5] shadow-lg w-[320px]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
            <div className="bg-gradient-to-r from-[#0058e6] to-[#3a8cff] px-3 py-1.5 flex items-center justify-between">
              <span className="text-white text-[12px] font-semibold">New Folder</span>
              <button onClick={() => setShowNewFolder(false)} className="text-white hover:bg-white/20 p-0.5 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-[11px] text-[#333] mb-1">Folder name:</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-2 py-1 text-[12px] border border-[#999] bg-white focus:outline-none focus:border-[#0078d4]"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <label className="flex items-center gap-2 mt-3 text-[11px] text-[#333] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFolderPublic}
                  onChange={(e) => setNewFolderPublic(e.target.checked)}
                />
                Share with all users (public)
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowNewFolder(false)}
                  className="px-4 py-1 text-[11px] bg-[#f0f0f0] border border-[#999] hover:bg-[#e0e0e0]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || creatingFolder}
                  className="px-4 py-1 text-[11px] bg-[#0078d4] text-white border border-[#005a9e] hover:bg-[#005a9e] disabled:opacity-50"
                >
                  {creatingFolder ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Dialog */}
      {movePresentationId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-[#ece9d8] border-2 border-[#0055e5] shadow-lg w-[320px]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
            <div className="bg-gradient-to-r from-[#0058e6] to-[#3a8cff] px-3 py-1.5 flex items-center justify-between">
              <span className="text-white text-[12px] font-semibold">Move to Folder</span>
              <button onClick={() => setMovePresentationId(null)} className="text-white hover:bg-white/20 p-0.5 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-[11px] text-[#333] mb-1">Select folder:</label>
              <select
                value={moveFolderId || ""}
                onChange={(e) => setMoveFolderId(e.target.value || null)}
                className="w-full px-2 py-1 text-[12px] border border-[#999] bg-white focus:outline-none focus:border-[#0078d4]"
              >
                <option value="">No folder (root)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setMovePresentationId(null)}
                  className="px-4 py-1 text-[11px] bg-[#f0f0f0] border border-[#999] hover:bg-[#e0e0e0]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveToFolder}
                  className="px-4 py-1 text-[11px] bg-[#0078d4] text-white border border-[#005a9e] hover:bg-[#005a9e]"
                >
                  Move
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
