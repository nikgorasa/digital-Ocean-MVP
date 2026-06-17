"use client";

import React from "react";

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function FormSelect({
  id,
  label,
  required,
  error,
  helperText,
  options,
  placeholder,
  className = "",
  ...props
}: FormSelectProps) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        id={id}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        aria-invalid={!!error}
        aria-required={required}
        className={`w-full px-3 py-3 bg-white border ${
          error ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-brand-saffron"
        } rounded-xl text-sm focus:ring-2 focus:ring-offset-2 outline-none transition-all ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
