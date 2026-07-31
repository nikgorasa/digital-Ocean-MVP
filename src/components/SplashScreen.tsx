"use client";

import React, { useEffect, useState } from "react";
import GoRasaLogo from "./GoRasaLogo";
import { forceAllFadeIns } from "@/components/ui/motion";

interface SplashScreenProps {
  children: React.ReactNode;
}

export default function SplashScreen({ children }: SplashScreenProps) {
  const [phase, setPhase] = useState<"visible" | "fading-out" | "hidden">("visible");

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase("fading-out"), 1000);
    const removeTimer = setTimeout(() => {
      setPhase("hidden");
      // Trigger all below-fold FadeIn animations after splash completes
      forceAllFadeIns();
    }, 1300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {children}
      {phase !== "hidden" && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden px-4"
          style={{ backgroundColor: "#082A24" }}
        >
          <div
            className="relative mb-6"
            style={{
              animation: phase === "visible" ? "splashFadeIn 0.8s ease-out forwards" : "splashFadeOut 0.3s ease-in forwards",
            }}
          >
            <div className="[&_img]:brightness-0 [&_img]:invert-[0.85] [&_img]:sepia-[0.2] [&_img]:saturate-[0.35]">
              <GoRasaLogo className="h-14 w-auto" />
            </div>
            <div
              className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-[#C99A52]/40 to-transparent"
              style={{
                animation: "goldShimmer 1.8s ease-in-out infinite",
              }}
            />
          </div>
          <p
            className="text-[#F5EFE0]/70 text-xs sm:text-sm tracking-[0.12em] sm:tracking-[0.25em] max-w-[88vw] leading-relaxed"
            style={{
              animation: "splashFadeIn 1s ease-out forwards",
            }}
          >
            loading the finest experience for you...
          </p>
        </div>
      )}
    </>
  );
}
