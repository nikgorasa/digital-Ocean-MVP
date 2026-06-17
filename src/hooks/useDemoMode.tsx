"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
    const saved = localStorage.getItem("demoMode");
    if (saved === "true") setDemoMode(true);
  }, []);

  const toggleDemoMode = () => {
    const next = !demoMode;
    setDemoMode(next);
    localStorage.setItem("demoMode", String(next));
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
