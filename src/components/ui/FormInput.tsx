"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
}

export default function FormInput({
  id,
  label,
  required,
  error,
  helperText,
  icon: Icon,
  className = "",
  ...props
}: FormInputProps) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        )}
        <input
          id={id}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-invalid={!!error}
          aria-required={required}
          className={`w-full ${Icon ? "pl-9" : "pl-3"} pr-3 py-3 bg-white border ${
            error ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-brand-saffron"
          } rounded-xl text-sm focus:ring-2 focus:ring-offset-2 outline-none transition-all ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-slate-400 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
}
