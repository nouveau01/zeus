"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div>
      {/* Tab headers */}
      <div className="flex border-b border-[#dddbda]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? "sf-tab-active" : "sf-tab"}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-4">{activeContent}</div>
    </div>
  );
}
