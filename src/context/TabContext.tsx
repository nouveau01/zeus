"use client";

import React, { createContext, useContext, useState, useRef, ReactNode, useEffect, useCallback } from "react";

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
  updateTab: (id: string, title: string, route: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

const STORAGE_KEY = "zeus-tabs";
const ACTIVE_TAB_KEY = "zeus-active-tab";

// History state shape
interface ZeusHistoryState {
  zeus: true; // marker so we know this is our state
  activeTabId: string;
  wasNewTab: boolean; // true = back should close this tab
}

export function TabProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Ref to prevent popstate handler from pushing new history entries
  const isHandlingPopstate = useRef(false);
  // Ref to track current history state (what tab we're on and how we got here)
  const currentHistoryState = useRef<ZeusHistoryState | null>(null);
  // Ref to access latest tabs in popstate handler without stale closures
  const tabsRef = useRef<Tab[]>([]);
  tabsRef.current = tabs;

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

  // Set initial browser history state on hydration
  useEffect(() => {
    if (isHydrated && activeTabId) {
      const state: ZeusHistoryState = { zeus: true, activeTabId, wasNewTab: false };
      window.history.replaceState(state, "");
      currentHistoryState.current = state;
    }
    // Only run once on hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

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

  // Helper to push browser history
  const pushHistory = useCallback((tabId: string, wasNewTab: boolean) => {
    if (isHandlingPopstate.current) return; // Don't push during popstate handling
    const state: ZeusHistoryState = { zeus: true, activeTabId: tabId, wasNewTab };
    window.history.pushState(state, "");
    currentHistoryState.current = state;
  }, []);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopstate = (event: PopStateEvent) => {
      const state = event.state as ZeusHistoryState | null;

      // Not our state — user went back before ZEUS history started
      if (!state?.zeus) return;

      isHandlingPopstate.current = true;

      // The tab we're leaving — if it was opened as a new tab, close it
      const leavingState = currentHistoryState.current;
      if (leavingState?.wasNewTab) {
        const leavingTabExists = tabsRef.current.some(t => t.id === leavingState.activeTabId);
        if (leavingTabExists) {
          setTabs(prev => prev.filter(t => t.id !== leavingState.activeTabId));
        }
      }

      // Activate the tab we're going back to
      const targetExists = tabsRef.current.some(t => t.id === state.activeTabId);
      if (targetExists) {
        setActiveTabId(state.activeTabId);
      } else if (tabsRef.current.length > 0) {
        // Target tab was closed — activate the last tab
        setActiveTabId(tabsRef.current[tabsRef.current.length - 1].id);
      } else {
        setActiveTabId(null);
      }

      currentHistoryState.current = state;

      // Reset flag after a tick so subsequent state updates don't push history
      setTimeout(() => {
        isHandlingPopstate.current = false;
      }, 0);
    };

    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  const openTab = (title: string, route: string) => {
    // Check if tab with this route already exists
    const existingTab = tabs.find((t) => t.route === route);
    if (existingTab) {
      if (existingTab.id !== activeTabId) {
        pushHistory(existingTab.id, false); // switching to existing = not a new tab
      }
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
      // Filling a blank tab — push history but not as "new tab" (don't auto-close on back)
      if (activeTabId) pushHistory(activeTabId, false);
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
    pushHistory(newTab.id, true); // new tab = back will close it
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
    if (id !== activeTabId) {
      pushHistory(id, false); // switching tabs = not a new tab
    }
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
    pushHistory(newTab.id, true); // new tab = back will close it
  };

  const updateTab = (id: string, title: string, route: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title, route } : t))
    );
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
        updateTab,
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
