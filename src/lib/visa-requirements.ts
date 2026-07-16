interface VisaRequirement {
  visaRequired: boolean;
  visaOnArrival?: boolean;
  eVisa?: boolean;
  notes?: string;
  transitVisaRequired?: boolean;
}

const VISA_DATA: Record<string, VisaRequirement> = {
  US: { visaRequired: true, eVisa: true, notes: "B1/B2 visa or e-Visa required for Indian passport holders" },
  GB: { visaRequired: true, eVisa: true, notes: "UK Standard Visitor visa or e-Visa required" },
  CA: { visaRequired: true, notes: "Canadian visa required for Indian passport holders" },
  AU: { visaRequired: true, eVisa: true, notes: "Australian e-Visa (ETA) required" },
  DE: { visaRequired: false, notes: "Schengen visa required — apply via German consulate" },
  FR: { visaRequired: false, notes: "Schengen visa required — apply via French consulate" },
  IT: { visaRequired: false, notes: "Schengen visa required — apply via Italian consulate" },
  ES: { visaRequired: false, notes: "Schengen visa required — apply via Spanish consulate" },
  NL: { visaRequired: false, notes: "Schengen visa required — apply via Dutch consulate" },
  CH: { visaRequired: false, notes: "Schengen visa required — apply via Swiss consulate" },
  AT: { visaRequired: false, notes: "Schengen visa required" },
  BE: { visaRequired: false, notes: "Schengen visa required" },
  PT: { visaRequired: false, notes: "Schengen visa required" },
  GR: { visaRequired: false, notes: "Schengen visa required" },
  SE: { visaRequired: false, notes: "Schengen visa required" },
  NO: { visaRequired: false, notes: "Schengen visa required" },
  DK: { visaRequired: false, notes: "Schengen visa required" },
  FI: { visaRequired: false, notes: "Schengen visa required" },
  PL: { visaRequired: false, notes: "Schengen visa required" },
  CZ: { visaRequired: false, notes: "Schengen visa required" },
  HU: { visaRequired: false, notes: "Schengen visa required" },
  JP: { visaRequired: true, notes: "Japanese visa required for Indian passport holders" },
  KR: { visaRequired: true, eVisa: true, notes: "Korean e-Visa available for Indian nationals" },
  CN: { visaRequired: true, notes: "Chinese visa required" },
  SG: { visaRequired: true, notes: "Singapore visa required for Indian passport holders" },
  MY: { visaRequired: true, visaOnArrival: true, eVisa: true, notes: "e-Visa or Visa on Arrival available" },
  TH: { visaRequired: false, visaOnArrival: true, notes: "Visa on Arrival for 15 days (Indian passport)" },
  ID: { visaRequired: false, visaOnArrival: true, notes: "Visa on Arrival for 30 days" },
  VN: { visaRequired: true, eVisa: true, notes: "Vietnam e-Visa available" },
  PH: { visaRequired: false, notes: "Visa-free for up to 30 days with valid US/Japan/Aus visa" },
  LK: { visaRequired: true, eVisa: true, notes: "Sri Lanka ETA required" },
  NP: { visaRequired: false, notes: "No visa required for Indian citizens" },
  MV: { visaRequired: false, notes: "Visa on Arrival for 30 days (free)" },
  BH: { visaRequired: true, visaOnArrival: true, notes: "Visa on Arrival or e-Visa" },
  QA: { visaRequired: true, visaOnArrival: true, notes: "Visa on Arrival for 30 days" },
  OM: { visaRequired: true, eVisa: true, notes: "Oman e-Visa required" },
  KW: { visaRequired: true, notes: "Kuwait visa required" },
  SA: { visaRequired: true, eVisa: true, notes: "Saudi e-Visa available for tourism" },
  AE: { visaRequired: false, visaOnArrival: true, notes: "Visa on Arrival for 14 days (Indian passport)" },
  IL: { visaRequired: true, notes: "Israeli visa required" },
  TR: { visaRequired: true, eVisa: true, notes: "Turkey e-Visa required" },
  EG: { visaRequired: true, visaOnArrival: true, notes: "Visa on Arrival available" },
  KE: { visaRequired: true, eVisa: true, notes: "Kenya eTA required" },
  ZA: { visaRequired: true, notes: "South African visa required" },
  NZ: { visaRequired: true, notes: "New Zealand visa/NZeTA required" },
  MX: { visaRequired: true, eVisa: true, notes: "Mexican e-Visa or valid US visa accepted" },
  BR: { visaRequired: true, eVisa: true, notes: "Brazilian e-Visa required" },
  AR: { visaRequired: false, notes: "No visa required for Indian passport for tourism up to 90 days" },
  CL: { visaRequired: false, notes: "No visa required for tourism up to 90 days with valid US visa" },
  RU: { visaRequired: true, notes: "Russian visa required" },
  IN: { visaRequired: false, notes: "Domestic — no visa required" },
};

const SCHENGEN_COUNTRIES = new Set([
  "DE", "FR", "IT", "ES", "NL", "CH", "AT", "BE", "PT", "GR",
  "SE", "NO", "DK", "FI", "PL", "CZ", "HU", "LU", "IS", "LI",
  "MT", "SK", "SI", "EE", "LV", "LT", "HR", "BG", "RO",
]);

export function isSchengenCountry(code: string): boolean {
  return SCHENGEN_COUNTRIES.has(code.toUpperCase());
}

export function getVisaRequirement(
  destinationCode: string,
  passportNationality: string = "IN",
): VisaRequirement | null {
  if (passportNationality.toUpperCase() !== "IN") return null;
  const dest = destinationCode.toUpperCase();
  const data = VISA_DATA[dest];
  if (!data) return null;

  if (SCHENGEN_COUNTRIES.has(dest)) {
    return { ...data, visaRequired: true, notes: "Schengen visa required for Indian passport holders" };
  }
  return data;
}

export function getTransitVisaRequirement(
  transitCode: string,
  passportNationality: string = "IN",
): VisaRequirement | null {
  if (passportNationality.toUpperCase() !== "IN") return null;
  const code = transitCode.toUpperCase();

  const transitFree: Record<string, string> = {
    SG: "Transit without visa for up to 96 hours with valid onward ticket",
    AE: "Transit without visa for up to 48 hours with valid onward ticket",
    TH: "Transit without visa for up to 12 hours",
    MY: "Transit without visa for up to 120 hours with valid onward ticket",
    JP: "Transit without visa for up to 72 hours (shore pass)",
    KR: "Transit without visa for up to 30 days with valid US/Canada/Australia visa",
    HK: "Transit without visa for up to 14 days",
    DO: "Transit without visa for up to 30 days",
    PH: "Transit without visa for up to 72 hours with valid onward ticket",
  };

  if (transitFree[code]) {
    return { visaRequired: false, transitVisaRequired: false, notes: transitFree[code] };
  }

  const mainVisa = VISA_DATA[code];
  if (mainVisa) {
    return {
      visaRequired: mainVisa.visaRequired,
      transitVisaRequired: mainVisa.visaRequired,
      notes: `Transit visa may be required. ${mainVisa.notes || ""}`.trim(),
    };
  }

  return null;
}

export function getRouteVisaWarnings(
  origin: string,
  destination: string,
  stops: number,
  segments?: { origin: string; destination: string }[],
): string[] {
  const warnings: string[] = [];
  const destReq = getVisaRequirement(destination);
  if (destReq?.visaRequired) {
    warnings.push(
      `Visa required: ${destReq.notes || `Visa needed for ${destination}`}`,
    );
  } else if (destReq?.visaOnArrival) {
    warnings.push(
      `Visa on Arrival available: ${destReq.notes || `Visa on Arrival for ${destination}`}`,
    );
  } else if (destReq?.eVisa) {
    warnings.push(
      `e-Visa available: ${destReq.notes || `Apply for e-Visa for ${destination}`}`,
    );
  }

  if (stops > 0 && segments?.length) {
    const transitCountries = new Set<string>();
    for (const seg of segments) {
      if (seg.origin !== origin && seg.destination !== destination) {
        transitCountries.add(seg.destination);
      }
    }
    for (const transit of transitCountries) {
      const transitReq = getTransitVisaRequirement(transit);
      if (transitReq?.transitVisaRequired) {
        warnings.push(
          `Transit visa may be needed at ${transit}: ${transitReq.notes || ""}`.trim(),
        );
      }
    }
  }

  return warnings;
}
