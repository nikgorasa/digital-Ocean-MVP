"use client";

import React, { useEffect, useState } from "react";
import GoRasaLogo from "./GoRasaLogo";
import { forceAllFadeIns } from "@/components/ui/motion";

interface SplashScreenProps {
  children: React.ReactNode;
}

export default function SplashScreen({ children }: SplashScreenProps) {
  const [phase, setPhase] = useState<"visible" | "fading-out" | "hidden">("visible");
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 480;
    setMobile(isMobile);

    const seen = sessionStorage.getItem("gorasa_splash_seen");
    if (seen) {
      setPhase("hidden");
      forceAllFadeIns();
      return;
    }

    const fadeTimer = setTimeout(() => setPhase("fading-out"), 400);
    const removeTimer = setTimeout(() => {
      setPhase("hidden");
      sessionStorage.setItem("gorasa_splash_seen", "1");
      forceAllFadeIns();
    }, 650);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (phase === "hidden") return <>{children}</>;

  return (
    <>
      {children}
      {phase !== "hidden" && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ backgroundColor: "#082A24" }}
        >
          <div
            className="relative mb-5"
            style={{
              animation:
                phase === "visible"
                  ? "splashFadeIn 0.3s ease-out forwards"
                  : "splashFadeOut 0.2s ease-in forwards",
            }}
          >
            <div className="[&_img]:brightness-0 [&_img]:invert-[0.85] [&_img]:sepia-[0.2] [&_img]:saturate-[0.35]]">
              <GoRasaLogo className={mobile ? "h-9 w-auto" : "h-12 w-auto"} />
            </div>
            <div
              className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-[#C99A52]/30 to-transparent"
              style={{
                animation: "goldShimmer 1.2s ease-in-out infinite",
              }}
            />
          </div>
          <p
            className="text-[#F5EFE0]/60 text-xs tracking-[0.2em]"
            style={{
              animation: "splashFadeIn 0.3s ease-out 0.1s forwards",
              opacity: 0,
            }}
          >
            loading the finest experience for you...
          </p>
          <button
            type="button"
            onClick={() => {
              setPhase("fading-out");
              setTimeout(() => {
                setPhase("hidden");
                sessionStorage.setItem("gorasa_splash_seen", "1");
                forceAllFadeIns();
              }, 200);
            }}
            className="absolute bottom-8 right-6 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#F5EFE0]/40 hover:text-[#F5EFE0]/80 text-xs tracking-wider transition-colors cursor-pointer"
            aria-label="Skip splash screen"
          >
            Skip →
          </button>
        </div>
      )}
    </>
  );
}
