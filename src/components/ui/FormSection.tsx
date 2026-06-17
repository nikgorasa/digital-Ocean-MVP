"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

interface FormSectionProps {
  icon?: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormSection({ icon: Icon, title, children, className = "" }: FormSectionProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={14} className="text-slate-400" aria-hidden="true" />}
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
