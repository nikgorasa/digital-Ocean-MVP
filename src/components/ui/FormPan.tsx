"use client";

import React, { useState } from "react";
import { CreditCard } from "lucide-react";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface FormPanProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  id?: string;
  label?: string;
  error?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export default function FormPan({
  id = "pan",
  label = "PAN Card Number",
  error: externalError,
  onValidationChange,
  value,
  onChange,
  className = "",
  ...props
}: FormPanProps) {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState("");

  const error = externalError || internalError;
  const errorId = `${id}-error`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    const syntheticEvent = { ...e, target: { ...e.target, value: val } };
    onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);

    if (val && !PAN_REGEX.test(val)) {
      setInternalError("Invalid PAN format");
      onValidationChange?.(false);
    } else {
      setInternalError("");
      onValidationChange?.(true);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    const val = e.target.value.toUpperCase();
    if (val && !PAN_REGEX.test(val)) {
      setInternalError("Invalid PAN format. Expected: ABCDE1234F");
    }
    props.onBlur?.(e);
  };

  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        <input
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={10}
          autoComplete="off"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          className={`w-full pl-9 pr-3 py-3 bg-white border ${
            error && touched ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-brand-saffron"
          } rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-offset-2 outline-none transition-all ${className}`}
          {...props}
        />
      </div>
      {error && touched && (
        <p id={errorId} className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {!error && !touched && (
        <p className="text-xs text-slate-400 mt-1">Format: ABCDE1234F</p>
      )}
    </div>
  );
}
