"use client";

import React from "react";
import { X, RotateCcw } from "lucide-react";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll: () => void;
  resultCount?: number;
  totalCount?: number;
  className?: string;
}

export default function FilterChips({ chips, onClearAll, resultCount, totalCount, className = "" }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {resultCount !== undefined && totalCount !== undefined && (
        <span className="text-sm text-slate-500 font-medium">
          {resultCount} of {totalCount}
        </span>
      )}
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="flex items-center gap-1 px-3 py-1.5 bg-brand-saffron/10 text-brand-saffron rounded-full text-xs font-medium hover:bg-brand-saffron/20 transition-colors cursor-pointer"
        >
          {chip.label}
          <X size={12} />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 px-3 py-1.5 text-slate-500 text-xs font-medium hover:text-slate-700 transition-colors cursor-pointer"
        >
          <RotateCcw size={12} />
          Clear all
        </button>
      )}
    </div>
  );
}
