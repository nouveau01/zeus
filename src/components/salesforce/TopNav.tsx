"use client";

import Link from "next/link";
import {
  Search,
  Plus,
  Bell,
  HelpCircle,
  Settings,
  X,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

export function TopNav() {
  const { tabs, activeTabId, setActiveTab, closeTab, addBlankTab } = useTabs();

  return (
    <header className="bg-white border-b border-[#dddbda] px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Logo and tabs */}
        <div className="flex items-center gap-4">
          {/* ZEUS Logo */}
          <Link href="/" className="flex items-center gap-2 mr-4">
            <div className="flex gap-0.5">
              <div className="w-2 h-6 bg-red-500"></div>
              <div className="w-2 h-6 bg-yellow-400"></div>
              <div className="w-2 h-6 bg-blue-500"></div>
            </div>
            <span className="font-bold text-lg text-[#032d60]">ZEUS</span>
          </Link>

          {/* Tabs */}
          <div className="flex items-center">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm cursor-pointer border-b-2 ${
                  activeTabId === tab.id
                    ? "border-[#0176d3] text-[#0176d3] bg-[#f3f3f3]"
                    : "border-transparent text-[#706e6b] hover:text-[#0176d3] hover:bg-[#f9f9f9]"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="max-w-[120px] truncate">{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-1 p-0.5 hover:bg-[#e0e0e0] rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add Tab Button */}
            <button
              onClick={addBlankTab}
              className="p-1.5 ml-1 text-[#706e6b] hover:text-[#0176d3] hover:bg-[#f3f3f3] rounded"
              title="New Tab"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-1.5 w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Icon buttons */}
          <button className="p-2 hover:bg-gray-100 rounded">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* User avatar */}
          <div className="w-8 h-8 bg-[#032d60] rounded-full flex items-center justify-center text-white text-sm font-medium ml-2">
            ZS
          </div>
        </div>
      </div>
    </header>
  );
}
