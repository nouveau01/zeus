"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

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

const STORAGE_KEY = "zeus-tabs";
const ACTIVE_TAB_KEY = "zeus-active-tab";

export function TabProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load tabs from localStorage on mount
  useEffect(() => {
    try {
      const savedTabs = localStorage.getItem(STORAGE_KEY);
      const savedActiveTab = localStorage.getItem(ACTIVE_TAB_KEY);

      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        setTabs(parsedTabs);
      }

      if (savedActiveTab) {
        setActiveTabId(savedActiveTab);
      }
    } catch (error) {
      console.error("Error loading tabs from localStorage:", error);
    }
    setIsHydrated(true);
  }, []);

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
      } catch (error) {
        console.error("Error saving tabs to localStorage:", error);
      }
    }
  }, [tabs, isHydrated]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        if (activeTabId) {
          localStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
        } else {
          localStorage.removeItem(ACTIVE_TAB_KEY);
        }
      } catch (error) {
        console.error("Error saving active tab to localStorage:", error);
      }
    }
  }, [activeTabId, isHydrated]);

  const openTab = (title: string, route: string) => {
    // Check if tab with this route already exists
    const existingTab = tabs.find((t) => t.route === route);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    // Check if the active tab is blank (empty route) - if so, update it instead of creating new
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && activeTab.route === "") {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId ? { ...t, title, route } : t
        )
      );
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
