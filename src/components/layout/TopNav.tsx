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
  const [tabWidth, setTabWidth] = useState(180); // Start with max width

  const MIN_TAB_WIDTH = 100;
  const MAX_TAB_WIDTH = 180;
  const AVAILABLE_TAB_SPACE = 600; // Max space for tabs before they start shrinking

  // Calculate tab width based on number of tabs
  useEffect(() => {
    const totalTabsWidth = tabs.length * MAX_TAB_WIDTH;
    if (totalTabsWidth > AVAILABLE_TAB_SPACE) {
      const calculatedWidth = Math.max(MIN_TAB_WIDTH, AVAILABLE_TAB_SPACE / tabs.length);
      setTabWidth(calculatedWidth);
    } else {
      setTabWidth(MAX_TAB_WIDTH);
    }
  }, [tabs.length]);

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
  }, [tabs.length, tabWidth]);

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
    <header className="bg-white border-b border-[#dddbda] h-[38px] flex-shrink-0">
      <div className="flex items-center h-full">
        {/* ZEUS Logo - fixed width matching sidebar */}
        <div className="w-44 flex-shrink-0 flex items-center px-3 h-full bg-white">
          <Link href="/" className="flex items-center group relative">
            <span
              className="font-bold text-3xl"
              style={{
                fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
                color: "#1e3a5f",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)"
              }}
            >
              Z<span className="text-xl">.</span>E<span className="text-xl">.</span>U<span className="text-xl">.</span>S<span className="text-xl">.</span>
            </span>
            {/* Tooltip */}
            <span className="absolute left-0 top-full mt-2 px-3 py-1.5 bg-[#1e293b] text-[#7dd3fc] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity delay-1000 whitespace-nowrap pointer-events-none border border-[#7dd3fc]/30"
              style={{ textShadow: "0 0 5px rgba(125, 211, 252, 0.5)" }}
            >
              Zach's Enterprise Unified System
            </span>
          </Link>
        </div>

        {/* Tabs area - flexible, with Chrome-style tabs */}
        <div className="flex-1 flex items-end h-full min-w-0 bg-white">
          {/* Left scroll arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scrollTabs("left")}
              className="flex-shrink-0 w-6 h-full flex items-center justify-center hover:bg-[#c8ccd1] text-[#5f6368]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Tabs container */}
          <div
            ref={tabsContainerRef}
            className="flex-1 flex items-end h-full overflow-hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex items-end h-full pb-0">
              {tabs.map((tab, index) => {
                const isActive = activeTabId === tab.id;
                return (
                  <div
                    key={tab.id}
                    data-tab-id={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center h-[32px] cursor-pointer group transition-all duration-100
                      ${isActive
                        ? "bg-white text-[#202124] z-10"
                        : "bg-[#e8eaed] text-[#5f6368] hover:bg-[#f1f3f4]"
                      }
                    `}
                    style={{
                      width: `${tabWidth}px`,
                      minWidth: `${MIN_TAB_WIDTH}px`,
                      maxWidth: `${MAX_TAB_WIDTH}px`,
                      marginLeft: index === 0 ? "0" : "-1px",
                      borderTopLeftRadius: "8px",
                      borderTopRightRadius: "8px",
                      borderTop: isActive ? "none" : "1px solid #c0c0c0",
                      borderLeft: isActive ? "1px solid #c0c0c0" : "1px solid #c0c0c0",
                      borderRight: isActive ? "1px solid #c0c0c0" : "1px solid #c0c0c0",
                      borderBottom: isActive ? "1px solid white" : "none",
                      marginBottom: isActive ? "-1px" : "0",
                    }}
                  >
                    <span
                      className="flex-1 px-3 text-[13px] truncate"
                      title={tab.title}
                    >
                      {tab.title || "New Tab"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      className={`flex-shrink-0 w-6 h-6 mr-1 flex items-center justify-center rounded-full
                        ${isActive
                          ? "hover:bg-[#e8eaed]"
                          : "opacity-0 group-hover:opacity-100 hover:bg-[#dadce0]"
                        }
                      `}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Add Tab Button */}
              <button
                onClick={addBlankTab}
                className="flex-shrink-0 w-7 h-7 mb-[2px] ml-1 flex items-center justify-center rounded-full hover:bg-[#c8ccd1] text-[#5f6368]"
                title="New Tab"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right scroll arrow */}
          {showRightArrow && (
            <button
              onClick={() => scrollTabs("right")}
              className="flex-shrink-0 w-6 h-full flex items-center justify-center hover:bg-[#c8ccd1] text-[#5f6368]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right side actions - fixed, won't be pushed */}
        <div className="flex-shrink-0 flex items-center gap-1 px-2 h-full bg-white">
          {/* Search - smaller */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-7 pr-2 py-1 w-36 border border-gray-300 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Icon buttons */}
          <button className="p-1.5 hover:bg-[#c8ccd1] rounded">
            <Bell className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-[#c8ccd1] rounded">
            <HelpCircle className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-[#c8ccd1] rounded">
            <Settings className="w-4 h-4 text-gray-600" />
          </button>

          {/* User avatar */}
          <div className="w-7 h-7 bg-[#032d60] rounded-full flex items-center justify-center text-white text-xs font-medium ml-1">
            ZS
          </div>
        </div>
      </div>
    </header>
  );
}
