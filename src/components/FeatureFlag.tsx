"use client";

import React from "react";
import { isFeatureEnabled, featureFlags } from "@/lib/config/flags";

interface FeatureFlagProps {
  flag: keyof typeof featureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function FeatureFlag({ flag, children, fallback }: FeatureFlagProps) {
  if (isFeatureEnabled(flag)) {
    return <>{children}</>;
  }

  return <>{fallback || null}</>;
}

export function useFeatureFlag(flag: keyof typeof featureFlags): boolean {
  return isFeatureEnabled(flag);
}
