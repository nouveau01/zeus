"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Bell,
  HelpCircle,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

export function TopNav() {
  const { tabs, activeTabId, setActiveTab, closeTab, addBlankTab } = useTabs();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check if we need scroll arrows
  useEffect(() => {
    const checkOverflow = () => {
      const container = tabsContainerRef.current;
      if (container) {
        const hasOverflow = container.scrollWidth > container.clientWidth;
        setShowLeftArrow(hasOverflow && container.scrollLeft > 0);
        setShowRightArrow(hasOverflow && container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
      }
    };

    checkOverflow();
    const container = tabsContainerRef.current;
    container?.addEventListener("scroll", checkOverflow);
    window.addEventListener("resize", checkOverflow);

    return () => {
      container?.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [tabs.length]);

  const scrollTabs = (direction: "left" | "right") => {
    const container = tabsContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Scroll active tab into view
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container && activeTabId) {
      const activeTabElement = container.querySelector(`[data-tab-id="${activeTabId}"]`);
      if (activeTabElement) {
        activeTabElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }
  }, [activeTabId]);

  return (
    <header className="flex-shrink-0">
      {/* Tab bar row - Chrome style gray background */}
      <div className="bg-[#dee1e6] flex items-end h-[40px] pt-[6px]">
        {/* ZEUS Logo area */}
        <div className="w-44 flex-shrink-0 flex items-center px-3 h-full">
          <Link href="/" className="flex items-center">
            <span
              className="font-bold text-xl tracking-tight"
              style={{
                fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
                color: "#1e3a5f",
              }}
            >
              Z.E.U.S.
            </span>
          </Link>
        </div>

        {/* Tabs area */}
        <div className="flex-1 flex items-end min-w-0 h-full">
          {/* Left scroll arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scrollTabs("left")}
              className="flex-shrink-0 w-7 h-[34px] flex items-center justify-center hover:bg-[#c8ccd1] text-[#5f6368] rounded-t-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Tabs container */}
          <div
            ref={tabsContainerRef}
            className="flex-1 flex items-end overflow-x-auto h-full gap-[2px]"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <div
                  key={tab.id}
                  data-tab-id={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center h-[34px] cursor-pointer group px-3 rounded-t-lg transition-colors
                    ${isActive
                      ? "bg-white"
                      : "bg-[#c8ccd1] hover:bg-[#d5d8dc]"
                    }
                  `}
                  style={{
                    minWidth: "160px",
                    maxWidth: "240px",
                  }}
                >
                  {/* Tab content */}
                  <span
                    className={`flex-1 text-[13px] truncate select-none pr-1 ${
                      isActive ? "text-[#202124] font-medium" : "text-[#5f6368]"
                    }`}
                    title={tab.title || "New Tab"}
                  >
                    {tab.title || "New Tab"}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full
                      hover:bg-[#d3d5d8]
                      ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                    `}
                    title="Close tab"
                  >
                    <X className="w-3.5 h-3.5 text-[#5f6368]" />
                  </button>
                </div>
              );
            })}

            {/* New Tab Button - Chrome style circular plus */}
            <button
              onClick={addBlankTab}
              className="flex-shrink-0 w-7 h-7 ml-1 flex items-center justify-center hover:bg-[#c8ccd1] text-[#5f6368] rounded-full self-center mb-[3px]"
              title="New tab"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Right scroll arrow */}
          {showRightArrow && (
            <button
              onClick={() => scrollTabs("right")}
              className="flex-shrink-0 w-7 h-[34px] flex items-center justify-center hover:bg-[#c8ccd1] text-[#5f6368] rounded-t-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex-shrink-0 flex items-center gap-1 px-3 h-full pb-[6px]">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 w-40 border border-[#dadce0] rounded-full text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] bg-white"
            />
          </div>

          {/* Icon buttons */}
          <button className="p-1.5 hover:bg-[#c8ccd1] rounded-full" title="Notifications">
            <Bell className="w-4 h-4 text-[#5f6368]" />
          </button>
          <button className="p-1.5 hover:bg-[#c8ccd1] rounded-full" title="Help">
            <HelpCircle className="w-4 h-4 text-[#5f6368]" />
          </button>
          <button className="p-1.5 hover:bg-[#c8ccd1] rounded-full" title="Settings">
            <Settings className="w-4 h-4 text-[#5f6368]" />
          </button>

          {/* User avatar */}
          <div className="w-7 h-7 bg-[#1a73e8] rounded-full flex items-center justify-center text-white text-xs font-medium ml-1">
            ZS
          </div>
        </div>
      </div>

      {/* White content area border - seamlessly connects with active tab */}
      <div className="h-[1px] bg-white" />
    </header>
  );
}
