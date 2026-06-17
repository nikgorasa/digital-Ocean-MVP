"use client";

import React from "react";

export interface SortOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SortBarProps {
  options: SortOption[];
  activeSort: string;
  onSortChange: (sort: string) => void;
  className?: string;
}

export default function SortBar({ options, activeSort, onSortChange, className = "" }: SortBarProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSortChange(option.value)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeSort === option.value
              ? "bg-brand-saffron text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:border-brand-saffron/30 hover:text-slate-900"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
