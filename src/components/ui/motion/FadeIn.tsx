"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  as?: keyof React.JSX.IntrinsicElements;
  /** Force visible after this many ms even if not scrolled into view (default: 2500) */
  fallbackMs?: number;
}

const directionMap = {
  up: { y: 1, x: 0 },
  down: { y: -1, x: 0 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  none: { x: 0, y: 0 },
};

// Global flag: set once after splash screen completes, shared by all FadeIn instances
let _globalForceVisible = false;
let _globalForceCallbacks: Array<() => void> = [];

export function forceAllFadeIns() {
  _globalForceVisible = true;
  _globalForceCallbacks.forEach((cb) => cb());
  _globalForceCallbacks = [];
}

export default function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  direction = "up",
  distance = 24,
  fallbackMs = 2500,
}: FadeInProps) {
  const dir = directionMap[direction];
  const initialX = dir.x * distance;
  const initialY = dir.y * distance;
  const [forceVisible, setForceVisible] = useState(_globalForceVisible);

  useEffect(() => {
    if (_globalForceVisible) return;

    const timer = setTimeout(() => {
      forceAllFadeIns();
    }, fallbackMs);

    // Also register for immediate notification if another instance triggers first
    const callback = () => setForceVisible(true);
    _globalForceCallbacks.push(callback);

    return () => {
      clearTimeout(timer);
      _globalForceCallbacks = _globalForceCallbacks.filter((cb) => cb !== callback);
    };
  }, [fallbackMs]);

  if (forceVisible) {
    return (
      <motion.div
        initial={{ opacity: 0, x: initialX, y: initialY }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{
          duration,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX, y: initialY }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
