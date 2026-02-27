"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

export type UIMode = "classic" | "modern";

interface UIModeContextType {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
  isModern: boolean;
  isClassic: boolean;
}

const UIModeContext = createContext<UIModeContextType>({
  mode: "classic",
  setMode: () => {},
  toggleMode: () => {},
  isModern: false,
  isClassic: true,
});

export function UIModeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [mode, setModeState] = useState<UIMode>("classic");
  const [initialized, setInitialized] = useState(false);

  // Initialize from session (DB value) or localStorage fallback
  useEffect(() => {
    if (initialized) return;

    const user = session?.user as any;
    if (user?.uiMode) {
      setModeState(user.uiMode as UIMode);
      setInitialized(true);
    } else {
      // Fallback to localStorage before session loads
      const stored = localStorage.getItem("zeus-ui-mode") as UIMode | null;
      if (stored === "classic" || stored === "modern") {
        setModeState(stored);
      }
    }
  }, [session, initialized]);

  const setMode = useCallback(async (newMode: UIMode) => {
    setModeState(newMode);
    localStorage.setItem("zeus-ui-mode", newMode);

    // Persist to DB
    try {
      await fetch("/api/user/ui-mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uiMode: newMode }),
      });
    } catch {
      // Silently fail — localStorage is the fallback
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "classic" ? "modern" : "classic");
  }, [mode, setMode]);

  return (
    <UIModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isModern: mode === "modern",
        isClassic: mode === "classic",
      }}
    >
      {children}
    </UIModeContext.Provider>
  );
}

export function useUIMode() {
  return useContext(UIModeContext);
}
