import React from "react";

interface GoRasaLogoProps {
  className?: string;
}

export default function GoRasaLogo({ className = "h-9 w-auto" }: GoRasaLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="GoRASA"
      className={className}
    />
  );
}
