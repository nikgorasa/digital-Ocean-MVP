/**
 * seed-airports.ts
 *
 * Downloads airport data from OurAirports (CC0 public domain)
 * and upserts into the City table.
 *
 * Usage:
 *   npx tsx scripts/seed-airports.ts              # Seed all airports
 *   npx tsx scripts/seed-airports.ts --country=IN # Seed Indian airports only
 *   npx tsx scripts/seed-airports.ts --dry-run    # Preview without writing
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const prisma = new PrismaClient();

const AIRPORTS_CSV_URL =
  "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv";

// Official city name overrides — OurAirports municipality field may be outdated
const CITY_NAME_OVERRIDES: Record<string, string> = {
  AYJ: "Ayodhya",       // OurAirports: Faizabad
  IXD: "Prayagraj",     // OurAirports: Allahabad
  CCJ: "Kozhikode",     // OurAirports: Calicut
  GOI: "Goa",           // OurAirports: Vasco da Gama
  IXG: "Belagavi",      // OurAirports: Belgaum
};

// Target countries for GoRASA (India + key source markets)
const TARGET_COUNTRIES = new Set([
  "IN", "AE", "TH", "SG", "MY", "LK", "MV", "NP", "ID", "TR",
  "GB", "US", "FR", "DE", "AU", "JP", "HK", "CN", "KR", "VN",
  "SA", "QA", "OM", "KW", "EG", "ZA", "CA", "NZ", "PH", "MT",
  "IT", "ES", "NL", "CH", "PT", "GR", "RU", "BR", "MX",
  "MA", "TN", "JO", "LB", "BH", "PK", "BD", "MM",
]);

const COUNTRY_FLAGS: Record<string, string> = {
  IN: "🇮🇳", AE: "🇦🇪", TH: "🇹🇭", SG: "🇸🇬", MY: "🇲🇾",
  LK: "🇱🇰", MV: "🇲🇻", NP: "🇳🇵", ID: "🇮🇩", TR: "🇹🇷",
  GB: "🇬🇧", US: "🇺🇸", FR: "🇫🇷", DE: "🇩🇪", AU: "🇦🇺",
  JP: "🇯🇵", HK: "🇭🇰", CN: "🇨🇳", KR: "🇰🇷", VN: "🇻🇳",
  SA: "🇸🇦", QA: "🇶🇦", OM: "🇴🇲", KW: "🇰🇼", EG: "🇪🇬",
  ZA: "🇿🇦", CA: "🇨🇦", NZ: "🇳🇿", PH: "🇵🇭", MT: "🇲🇹",
  IT: "🇮🇹", ES: "🇪🇸", NL: "🇳🇱", CH: "🇨🇭", PT: "🇵🇹",
  GR: "🇬🇷", RU: "🇷🇺", BR: "🇧🇷", MX: "🇲🇽", MA: "🇲🇦",
  TN: "🇹🇳", JO: "🇯🇴", LB: "🇱🇧", BH: "🇧🇭", PK: "🇵🇰",
  BD: "🇧🇩", MM: "🇲🇲", CY: "🇨🇾", IL: "🇮🇱", KE: "🇰🇪",
  TZ: "🇹🇿", MU: "🇲🇺", SN: "🇸🇳", GH: "🇬🇭", NG: "🇳🇬",
  ET: "🇪🇹", UG: "🇺🇬", RW: "🇷🇼", CM: "🇨🇲", CI: "🇨🇮",
  RE: "🇷🇪", GP: "🇬🇵", MQ: "🇲🇶", PF: "🇵🇫", NC: "🇳🇨",
  FJ: "🇫🇯", GU: "🇬🇺", AS: "🇦🇸", PR: "🇵🇷", VI: "🇻🇮",
  MO: "🇲🇴", TW: "🇹🇼", MN: "🇲🇳", KZ: "🇰🇿",
  UZ: "🇺🇿", GE: "🇬🇪", AM: "🇦🇲", AZ: "🇦🇿", KG: "🇰🇬",
  TJ: "🇹🇯", TM: "🇹🇲", AF: "🇦🇫", IR: "🇮🇷", IQ: "🇮🇶",
  SY: "🇸🇾", YE: "🇾🇪",
};

interface AirportRow {
  id: string;
  ident: string;
  type: string;
  name: string;
  latitude_deg: string;
  longitude_deg: string;
  elevation_ft: string;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: string;
  icao_code: string;
  iata_code: string;
  gps_code: string;
  local_code: string;
  home_link: string;
  wikipedia_link: string;
  keywords: string;
}

function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const filePath = path.join("/tmp", "ourairports.csv");
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
      if (ageHours < 24) {
        console.log(`Using cached ${filePath} (${ageHours.toFixed(1)}h old)`);
        resolve(fs.readFileSync(filePath, "utf-8"));
        return;
      }
    }
    console.log(`Downloading airports from ${url}...`);
    const file = fs.createWriteStream(filePath);
    https
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          https.get(response.headers.location!, (res2) => {
            res2.pipe(file);
            file.on("finish", () => {
              file.close();
              resolve(fs.readFileSync(filePath, "utf-8"));
            });
          });
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(fs.readFileSync(filePath, "utf-8"));
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseAirports(csv: string): AirportRow[] {
  const lines = csv.split("\n");
  const headers = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  const airports: AirportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || "").replace(/^"|"$/g, "").trim();
    });
    airports.push(row as unknown as AirportRow);
  }
  return airports;
}

function filterAirports(airports: AirportRow[], countryCode?: string): AirportRow[] {
  return airports.filter((a) => {
    // Must have IATA code
    if (!a.iata_code || a.iata_code.length !== 3) return false;
    // Must be large or medium airport
    if (a.type !== "large_airport" && a.type !== "medium_airport") return false;
    // Must have scheduled service
    if (a.scheduled_service !== "yes") return false;
    // Filter by country if specified
    if (countryCode && a.iso_country !== countryCode.toUpperCase()) return false;
    // For no country filter, only target countries
    if (!countryCode && !TARGET_COUNTRIES.has(a.iso_country)) return false;
    return true;
  });
}

function airportToCity(a: AirportRow) {
  const iata = a.iata_code.toUpperCase();
  return {
    name: CITY_NAME_OVERRIDES[iata] || a.municipality || a.name.split(" ").slice(0, 2).join(" "),
    country: a.iso_country,
    type: "domestic",
    iata_code: iata,
    airport_name: a.name,
    country_code: a.iso_country,
    flag: COUNTRY_FLAGS[a.iso_country] || "",
    latitude: parseFloat(a.latitude_deg) || null,
    longitude: parseFloat(a.longitude_deg) || null,
    airport_type: a.type,
    isactive: true,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const countryArg = args.find((a) => a.startsWith("--country="));
  const countryCode = countryArg ? countryArg.split("=")[1] : undefined;
  const dryRun = args.includes("--dry-run");

  console.log(`\n✈️  Airport Seed Script`);
  console.log(`   Country filter: ${countryCode || "all target countries"}`);
  console.log(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  // Download and parse
  const csv = await downloadFile(AIRPORTS_CSV_URL);
  const allAirports = parseAirports(csv);
  console.log(`Total airports in CSV: ${allAirports.length}`);

  const filtered = filterAirports(allAirports, countryCode);
  console.log(`After filtering: ${filtered.length}`);

  // Group by country for summary
  const byCountry: Record<string, number> = {};
  filtered.forEach((a) => {
    byCountry[a.iso_country] = (byCountry[a.iso_country] || 0) + 1;
  });
  console.log(`\nBy country:`);
  Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cc, count]) => {
      console.log(`  ${COUNTRY_FLAGS[cc] || cc} ${cc}: ${count}`);
    });

  if (dryRun) {
    console.log(`\nDry run — would upsert ${filtered.length} airports.`);
    // Show first 5 as sample
    console.log(`\nSample airports:`);
    filtered.slice(0, 5).forEach((a) => {
      const c = airportToCity(a);
      console.log(`  ${c.flag} ${c.iata_code} — ${c.name} (${c.airport_name})`);
    });
    return;
  }

  // Upsert into City table
  console.log(`\nUpserting ${filtered.length} airports into City table...`);
  let upserted = 0;
  let skipped = 0;

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
    const batch = filtered.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (a) => {
      const city = airportToCity(a);
      try {
        // Check if airport already exists by iata_code
        const existing = await prisma.city.findFirst({
          where: { iata_code: city.iata_code },
        });

        if (existing) {
          // Update existing row with airport data
          await prisma.city.update({
            where: { id: existing.id },
            data: {
              airport_name: city.airport_name,
              country_code: city.country_code,
              flag: city.flag,
              latitude: city.latitude,
              longitude: city.longitude,
              airport_type: city.airport_type,
              name: city.name,
              country: city.country,
            },
          });
          skipped++;
        } else {
          // Insert new row
          await prisma.city.create({
            data: {
              name: city.name,
              country: city.country,
              type: city.type,
              iata_code: city.iata_code,
              airport_name: city.airport_name,
              country_code: city.country_code,
              flag: city.flag,
              latitude: city.latitude,
              longitude: city.longitude,
              airport_type: city.airport_type,
              isactive: true,
            },
          });
          upserted++;
        }
      } catch (e) {
        console.error(`  Error upserting ${city.iata_code}: ${(e as Error).message}`);
      }
    });

    await Promise.all(promises);
    process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, filtered.length)}/${filtered.length}`);
  }

  console.log(`\n\n✅ Done!`);
  console.log(`   New airports added: ${upserted}`);
  console.log(`   Existing airports updated: ${skipped}`);

  // Verify count
  const count = await prisma.city.count({
    where: { iata_code: { not: null }, airport_name: { not: null }, isactive: true },
  });
  console.log(`   Total airports in DB: ${count}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  prisma.$disconnect();
  process.exit(1);
});
