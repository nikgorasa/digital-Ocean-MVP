"use client";

import React from "react";
import { motion } from "motion/react";
import { Building2, Map, Plane } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SEARCH_TABS = [
  { id: "holidays", label: "Plan My Holiday", icon: Map, href: "/holidays", color: "#D97706" },
  { id: "hotels", label: "Hotels", icon: Building2, href: "/hotels", color: "#D97706" },
  { id: "flights", label: "Flights", icon: Plane, href: "/flights", color: "#D97706" },
];

interface HeroSectionProps {
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  showCorporateCta?: boolean;
}

export default function HeroSection({
  imageSrc = "/images/hero.jpg",
  imageAlt = "Hero banner",
  title = "Reserve luxury",
  titleAccent = "&amp; Composure",
  subtitle = "Curated stays, flights, and packages with a dedicated concierge.",
  showCorporateCta = true,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[50vh] md:min-h-[58vh] lg:min-h-[65vh] flex items-center overflow-hidden bg-slate-900">
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/75 to-slate-900/40" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight tracking-tight">
            {title}
            {titleAccent && (
              <span
                className="block text-brand-saffron italic"
                dangerouslySetInnerHTML={{ __html: titleAccent }}
              />
            )}
          </h1>
          <p className="mt-3 text-slate-300 text-base md:text-lg max-w-md leading-relaxed">
            {subtitle}
          </p>

          <div className="flex flex-wrap gap-2.5 mt-6">
            {SEARCH_TABS.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={tab.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-sm font-medium hover:bg-brand-saffron hover:border-brand-saffron transition-colors duration-200"
                  >
                    <Icon size={16} />
                    {tab.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {showCorporateCta && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-4 text-xs text-slate-400"
            >
              Managing corporate travel?{" "}
              <Link href="/admin" className="text-brand-saffron hover:underline font-medium">
                Access dashboard
              </Link>
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
