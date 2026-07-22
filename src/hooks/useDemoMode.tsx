"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const DEMO_MODE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

interface DemoModeContextType {
  demoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
  demoMode: false,
  toggleDemoMode: () => {},
});

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("demoMode");
      const ts = localStorage.getItem("demoModeTs");
      if (saved === "true" && ts) {
        const elapsed = Date.now() - Number(ts);
        if (elapsed < DEMO_MODE_TTL_MS) {
          setDemoMode(true);
        } else {
          localStorage.removeItem("demoMode");
          localStorage.removeItem("demoModeTs");
        }
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const toggleDemoMode = () => {
    const next = !demoMode;
    setDemoMode(next);
    try {
      if (next) {
        localStorage.setItem("demoMode", "true");
        localStorage.setItem("demoModeTs", String(Date.now()));
      } else {
        localStorage.removeItem("demoMode");
        localStorage.removeItem("demoModeTs");
      }
    } catch {
      // localStorage not available
    }
  };

  return (
    <DemoModeContext.Provider value={{ demoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
