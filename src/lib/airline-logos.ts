export const AIRLINE_LOGOS: Record<
  string,
  { name: string; logo: string }
> = {
  "6E": { name: "IndiGo", logo: "https://pics.avs.io/120/60/6E.png" },
  AI: { name: "Air India", logo: "https://pics.avs.io/120/60/AI.png" },
  SG: { name: "SpiceJet", logo: "https://pics.avs.io/120/60/SG.png" },
  UK: { name: "Vistara", logo: "https://pics.avs.io/120/60/UK.png" },
  G8: { name: "GoFirst", logo: "https://pics.avs.io/120/60/G8.png" },
  I5: { name: "AirAsia India", logo: "https://pics.avs.io/120/60/I5.png" },
  IX: { name: "Air India Express", logo: "https://pics.avs.io/120/60/IX.png" },
  "9W": { name: "Jet Airways", logo: "https://pics.avs.io/120/60/9W.png" },
  S2: { name: "JetLite", logo: "https://pics.avs.io/120/60/S2.png" },
  G9: { name: "Air Arabia", logo: "https://pics.avs.io/120/60/G9.png" },
  EK: { name: "Emirates", logo: "https://pics.avs.io/120/60/EK.png" },
  QR: { name: "Qatar Airways", logo: "https://pics.avs.io/120/60/QR.png" },
  LH: { name: "Lufthansa", logo: "https://pics.avs.io/120/60/LH.png" },
  SQ: { name: "Singapore Airlines", logo: "https://pics.avs.io/120/60/SQ.png" },
  TG: { name: "Thai Airways", logo: "https://pics.avs.io/120/60/TG.png" },
};

export function getAirlineLogo(code: string): string {
  return (
    AIRLINE_LOGOS[code]?.logo ||
    `https://pics.avs.io/120/60/${code}.png`
  );
}

export function getAirlineName(code: string): string {
  return AIRLINE_LOGOS[code]?.name || code;
}
