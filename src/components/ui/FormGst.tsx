"use client";

import React, { useState } from "react";
import { Building2, ChevronDown, ChevronUp } from "lucide-react";

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d$/;

interface FormGstProps {
  id?: string;
  gstNumber: string;
  gstCompanyName: string;
  onGstNumberChange: (value: string) => void;
  onGstCompanyNameChange: (value: string) => void;
  error?: string;
  hidden?: boolean;
}

export default function FormGst({
  id = "gst",
  gstNumber,
  gstCompanyName,
  onGstNumberChange,
  onGstCompanyNameChange,
  error: externalError,
  hidden,
}: FormGstProps) {
  if (hidden) return null;
  const [expanded, setExpanded] = useState(false);
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState("");

  const error = externalError || internalError;
  const gstinErrorId = `${id}-gstin-error`;

  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    onGstNumberChange(val);
    if (val && !GSTIN_REGEX.test(val)) {
      setInternalError("Invalid GSTIN format");
    } else {
      setInternalError("");
    }
  };

  const handleGstinBlur = () => {
    setTouched(true);
    if (gstNumber && !GSTIN_REGEX.test(gstNumber)) {
      setInternalError("Invalid GSTIN format. Expected 15 characters.");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
        aria-expanded={expanded}
        aria-controls={`${id}-fields`}
      >
        <Building2 size={14} aria-hidden="true" />
        <span>B2B GST Invoice (Optional)</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div id={`${id}-fields`} className="mt-3 space-y-3 pl-6">
          <div>
            <label htmlFor={`${id}-gstin`} className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
              GSTIN
            </label>
            <input
              id={`${id}-gstin`}
              value={gstNumber}
              onChange={handleGstinChange}
              onBlur={handleGstinBlur}
              maxLength={15}
              autoComplete="off"
              aria-describedby={error && touched ? gstinErrorId : undefined}
              aria-invalid={!!error && touched}
              className={`w-full px-3 py-3 bg-white border ${
                error && touched ? "border-red-300" : "border-slate-200"
              } rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all`}
            />
            {error && touched && (
              <p id={gstinErrorId} className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">
                {error}
              </p>
            )}
            {!error && !touched && (
              <p className="text-xs text-slate-400 mt-1">15-character GSTIN</p>
            )}
          </div>
          <div>
            <label htmlFor={`${id}-company`} className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
              Company Name
            </label>
            <input
              id={`${id}-company`}
              value={gstCompanyName}
              onChange={(e) => onGstCompanyNameChange(e.target.value)}
              autoComplete="organization"
              className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none transition-all"
            />
          </div>
        </div>
      )}
    </div>
  );
}
