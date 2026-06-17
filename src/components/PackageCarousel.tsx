"use client";

import React, { useRef } from "react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib";
import { ChevronLeft, ChevronRight, Check, Star, Tag } from "lucide-react";

interface CarouselItem {
  id: string;
  title: string;
  duration: string;
  price: number;
  originalPrice?: number;
  rating: number;
  imageUrl: string;
  provider: string;
  inclusions: string[];
  category?: string;
}

interface PackageCarouselProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: CarouselItem[];
  badgeColor: string;
  badgeText: string;
  onInterested?: (pkg: CarouselItem) => void;
}

export default function PackageCarousel({
  title,
  subtitle,
  icon,
  items,
  badgeColor,
  badgeText,
  onInterested,
}: PackageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -400 : 400,
        behavior: "smooth",
      });
    }
  };

  const calculateDiscount = (price: number, originalPrice?: number) => {
    if (!originalPrice) return null;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  return (
    <div className="space-y-6 pt-12 first:pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 px-2">
        <motion.div
          initial={{ opacity: 1, x: 0 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${badgeColor}`}
            >
              {icon}
              <span className="ml-1.5">{badgeText}</span>
            </span>
          </div>
          <h3 className="text-3xl font-serif font-black text-slate-900 mt-2 tracking-tight">
            {title}
          </h3>
          <p className="text-slate-500 text-sm font-normal">{subtitle}</p>
        </motion.div>

        <div className="hidden sm:flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "#fff7ed" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scroll("left")}
            className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-orange-500 rounded-full hover:shadow-md transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "#fff7ed" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scroll("right")}
            className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-orange-500 rounded-full hover:shadow-md transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex space-x-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((pkg, idx) => {
            const discount = calculateDiscount(pkg.price, pkg.originalPrice);
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -6 }}
                className="w-[310px] sm:w-[380px] shrink-0 bg-white rounded-[2.5rem] border border-slate-150 shadow-sm hover:shadow-xl transition-shadow duration-300 snap-start overflow-hidden flex flex-col group cursor-pointer"
                onClick={() => onInterested?.(pkg)}
              >
                {/* Image */}
                <div className="h-56 relative overflow-hidden shrink-0">
                  <img
                    src={pkg.imageUrl}
                    alt={pkg.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                  <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                    {discount && (
                      <span className="bg-orange-500 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow-md flex items-center w-fit">
                        <Tag className="w-3.5 h-3.5 mr-1" />
                        Save {discount}%
                      </span>
                    )}
                    <span className="bg-white/90 backdrop-blur-md text-slate-900 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-xs w-fit">
                      {pkg.duration}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span className="bg-slate-900/80 backdrop-blur-md text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-xs">
                      {pkg.provider}
                    </span>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-amber-400 text-slate-900 font-extrabold text-[11px] px-2.5 py-1 rounded-lg flex items-center shadow-md">
                    <Star className="w-3.5 h-3.5 fill-slate-900 text-slate-900 mr-1" />
                    {pkg.rating.toFixed(1)}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-orange-500 transition-colors line-clamp-2">
                      {pkg.title}
                    </h4>

                    <div className="mt-4 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                        Premium Inclusions
                      </span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {pkg.inclusions.slice(0, 3).map((inc, i) => (
                          <div key={i} className="flex items-center text-xs text-slate-600">
                            <Check className="w-3.5 h-3.5 text-orange-500 shrink-0 mr-2" />
                            <span className="truncate">{inc}</span>
                          </div>
                        ))}
                        {pkg.inclusions.length > 3 && (
                          <p className="text-[10px] italic text-slate-400 pl-5">
                            + And {pkg.inclusions.length - 3} premium features
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {pkg.originalPrice && (
                        <span className="text-xs text-slate-400 line-through block font-medium">
                          {formatCurrency(pkg.originalPrice)}
                        </span>
                      )}
                      <div className="flex items-baseline">
                        <span className="text-2xl font-black font-mono text-slate-900">
                          {formatCurrency(pkg.price)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">
                          /Pax
                        </span>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05, backgroundColor: "#f97316" }}
                      whileTap={{ scale: 0.92 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onInterested?.(pkg);
                      }}
                      className="bg-slate-900 text-white font-bold text-xs uppercase px-5 py-3 rounded-2xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Interested
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
