"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Tab {
  id: string;
  title: string;
  route: string;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (title: string, route: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  addBlankTab: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = (title: string, route: string) => {
    // Check if tab with this route already exists
    const existingTab = tabs.find((t) => t.route === route);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    // Create new tab
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title,
      route,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    const tabIndex = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);

    // If closing active tab, activate adjacent tab
    if (activeTabId === id) {
      if (newTabs.length === 0) {
        setActiveTabId(null);
      } else if (tabIndex >= newTabs.length) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else {
        setActiveTabId(newTabs[tabIndex].id);
      }
    }
  };

  const setActiveTab = (id: string) => {
    setActiveTabId(id);
  };

  const addBlankTab = () => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title: "New Tab",
      route: "",
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTabId,
        openTab,
        closeTab,
        setActiveTab,
        addBlankTab,
      }}
    >
      {children}
    </TabContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error("useTabs must be used within a TabProvider");
  }
  return context;
}
