"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "rectangular" | "circular" | "text";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses = "skeleton-pulse bg-slate-100";
  const variantClasses = {
    rectangular: "rounded-lg",
    circular: "rounded-full",
    text: "rounded-md",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/15 overflow-hidden ${className}`}>
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-5 w-3/4" variant="text" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" variant="text" />
          <Skeleton className="h-3 w-5/6" variant="text" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-24" variant="text" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function HotelCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/15 overflow-hidden ${className}`}>
      <div className="flex flex-col md:flex-row">
        <Skeleton className="h-48 md:h-auto md:w-72 shrink-0 rounded-none" />
        <div className="flex-1 p-5 space-y-3">
          <Skeleton className="h-5 w-2/3" variant="text" />
          <Skeleton className="h-3 w-1/3" variant="text" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-3 mt-auto">
            <Skeleton className="h-7 w-28" variant="text" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlightCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/15 p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" variant="text" />
            <Skeleton className="h-3 w-16" variant="text" />
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center space-y-1">
            <Skeleton className="h-5 w-16 mx-auto" variant="text" />
            <Skeleton className="h-3 w-12 mx-auto" variant="text" />
          </div>
          <Skeleton className="h-px w-20" />
          <div className="text-center space-y-1">
            <Skeleton className="h-5 w-16 mx-auto" variant="text" />
            <Skeleton className="h-3 w-12 mx-auto" variant="text" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-6 w-24 ml-auto" variant="text" />
          <Skeleton className="h-10 w-28 rounded-xl ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton({ count = 4, type = "hotel" }: { count?: number; type?: "hotel" | "flight" | "card" }) {
  const SkeletonComponent = type === "hotel" ? HotelCardSkeleton : type === "flight" ? FlightCardSkeleton : CardSkeleton;
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
