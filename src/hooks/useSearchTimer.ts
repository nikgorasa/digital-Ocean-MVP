"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SearchTimerResult {
  elapsed: number;
  statusMessage: string;
  reset: () => void;
}

export function useSearchTimer(isSearching: boolean, city?: string): SearchTimerResult {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const reset = useCallback(() => {
    setElapsed(0);
    startTimeRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isSearching) {
      startTimeRef.current = Date.now();
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 500);
    } else {
      reset();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSearching, reset]);

  const seconds = Math.floor(elapsed / 1000);

  let statusMessage: string;
  if (seconds < 2) {
    statusMessage = city
      ? `Searching hotels in ${city}...`
      : "Searching flights...";
  } else if (seconds < 5) {
    statusMessage = city
      ? "Searching 50+ hotel providers..."
      : "Searching 50+ flight providers...";
  } else if (seconds < 10) {
    statusMessage = "Still searching... finding the best rates";
  } else {
    statusMessage = "Almost there... this is taking longer than usual";
  }

  return { elapsed, statusMessage, reset };
}
