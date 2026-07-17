"use client";

import React, { useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
  /** Force visible after this many ms even if not scrolled into view (default: 2500) */
  fallbackMs?: number;
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Reuse the global force flag from FadeIn
let _globalForceVisible = false;
let _globalForceCallbacks: Array<() => void> = [];

export function forceAllStaggers() {
  _globalForceVisible = true;
  _globalForceCallbacks.forEach((cb) => cb());
  _globalForceCallbacks = [];
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export default function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
  delayChildren = 0,
  fallbackMs = 2500,
}: StaggerContainerProps) {
  const [forceVisible, setForceVisible] = useState(_globalForceVisible);

  useEffect(() => {
    if (_globalForceVisible) return;

    const timer = setTimeout(() => {
      forceAllStaggers();
    }, fallbackMs);

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
        initial="hidden"
        animate="visible"
        custom={staggerDelay}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: staggerDelay,
              delayChildren,
            },
          },
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      custom={staggerDelay}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
