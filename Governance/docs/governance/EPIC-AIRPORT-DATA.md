# EPIC: Airport Data — Replace Hardcoded List with DB-Backed Airport Registry

**Issue:** #276
**Status:** DONE ✓
**Priority:** High
**Created:** 2026-07-18

---

## Sub-Issues

| Issue | Title | Status |
|-------|-------|--------|
| #277 | Schema: Add airport columns to City model | ✅ DONE |
| #278 | Seed: Airport data download + DB upsert script | ✅ DONE |
| #279 | API: New /api/cities/airports endpoint | ✅ DONE |
| #280 | Component: CitySearchDropdown fetches from API | ✅ DONE |
| #281 | Preflight: Airport count validation check | ✅ DONE |

---

## Problem Statement

The flight search `CitySearchDropdown` uses a **hardcoded array of ~50 airports** (`src/components/CitySearchDropdown.tsx:28-147`). When new airports open (e.g., Ayodhya AYJ — opened Dec 2023), they don't appear in the dropdown. Users cannot search flights to/from these airports.

**Missing airports confirmed:**

| Airport | IATA | Opened | Status |
|---------|------|--------|--------|
| Ayodhya | AYJ | Dec 2023 | Not in list |
| Dehradun (Jolly Grant) | DED | Existing | Not in list |
| Tiruchirappalli | TRZ | Existing | Not in list |
| Bhubaneswar | BBI | Existing | Not in list |
| Patna | PAT | Existing | Not in list |
| Surat | STV | Existing | Not in list |
| Mangalore | IXE | Existing | Not in list |
| Chandigarh | IXC | Existing | Not in list |
| Bagdogra | IXB | Existing | Not in list |
| Imphal | IMF | Existing | Not in list |
| Don Mueang (Bangkok) | DMK | Existing | Not in list |
| Ras Al Khaimah | RKT | Existing | Not in list |
| Toronto Pearson | YYZ | Existing | Not in list |
| Vancouver | YVR | Existing | Not in list |

**Root cause:** No TBO endpoint exists for flight airport data. TBO's static data API (CountryList, CityList, TBOHotelCodeList) is for **hotels only** — returns hotel destination codes (e.g., "15648" for Goa), not IATA airport codes. The TBO Flight API accepts any valid IATA code in search requests but has no endpoint to list supported airports.

---

## Data Source: OurAirports (Free, Open Data)

### Why OurAirports

| Source | Cost | Format | Coverage | License |
|--------|------|--------|----------|---------|
| **OurAirports** | Free | CSV | 12,677 airports worldwide | Public Domain (CC0) |
| IATA Official | Paid ($) | Fixed-width | 12,000 locations | Proprietary |
| AirHex API | Free tier | JSON | Full | Commercial |
| datahub.io | Free | CSV | Derived from OurAirports | Public Domain |

**OurAirports** (`ourairports.com/data/`) is a community-maintained, nightly-updated dataset with:
- IATA codes, ICAO codes, airport names
- Country codes (ISO 3166-1 Alpha-2)
- Latitude/longitude coordinates
- Airport type (large, medium, small, closed, heliport, etc.)
- City names

### Data Format

```csv
id,type,name,latitude_deg,longitude_deg,elevation_ft,continent_code,country_code,iso_region,municipality,scheduled_service,gps_code,iata_code,local_code,home_link,wikipedia_link,keywords
6523,large_airport,"Chhatrapati Shivaji International Airport",19.0886993408,72.8678970337,39,"AS","IN","IN-MH","Mumbai","yes","VABB","BOM",,"http://www.csia.in","https://en.wikipedia.org/wiki/Chhatrapati_Shivaji_International_Airport","airport civil"
```

### Filtering Strategy

From ~12,677 total airports, we filter to:

1. **`type` = `large_airport` OR `medium_airport`** — commercial service airports (excludes heliports, glider ports,Closed airports)
2. **`scheduled_service` = `yes`** — has scheduled commercial flights
3. **`iata_code` IS NOT EMPTY** — has an IATA code (required for TBO Flight API)
4. **`country_code` IN target countries** — India + key source markets (UAE, Thailand, Singapore, Malaysia, Sri Lanka, Maldives, Nepal, Indonesia, Turkey, UK, USA, France, Germany, Australia, Japan, Hong Kong, China, South Korea, Vietnam, Saudi Arabia, Qatar, Oman, Kuwait, Egypt, South Africa, Canada)

**Estimated result: ~800-1,200 airports worldwide, ~100-150 in India alone.**

### Download Method

```bash
# Download airports.csv from OurAirports GitHub (nightly updated)
curl -o /tmp/airports.csv https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv

# Filter: large/medium airports with IATA codes, scheduled service
# Convert to JSON and seed into DB
```

---

## Architecture Decision: Extend City Model vs. New Airport Model

### Option A: Extend City Model (RECOMMENDED)

Add columns to existing `City` table:

```prisma
model City {
  id            String    @id @default(uuid())
  name          String
  country       String    @default("India")
  type          String    @default("domestic")
  searchcount   Int       @default(0)
  isactive      Boolean   @default(true)
  createdAt     DateTime? @default(now()) @db.Timestamptz
  iata_code     String?

  // NEW FIELDS
  airport_name  String?   // "Chhatrapati Shivaji International Airport"
  country_code  String?   // "IN" (ISO Alpha-2)
  flag          String?   // "🇮🇳" (emoji flag)
  latitude      Float?    // 19.0887
  longitude     Float?    // 72.8679
  airport_type  String?   // "large_airport" | "medium_airport"
}
```

**Pros:**
- No new model — uses existing infrastructure
- `findTBOCodes()` and `search()` still work
- Single dropdown component serves both modes
- Existing `/api/cities/tbo` route can be extended

**Cons:**
- City table grows from ~1000 rows to ~2000 rows (negligible)
- Mixes hotel cities and flight airports in one table

### Option B: New Airport Model

```prisma
model Airport {
  id           String   @id @default(uuid())
  iata_code    String   @unique
  icao_code    String?
  name         String
  airport_name String
  country_code String
  flag         String?
  latitude     Float?
  longitude    Float?
  airport_type String   @default("medium_airport")
  is_active    Boolean  @default(true)
  created_at   DateTime @default(now())
}
```

**Pros:**
- Clean separation of concerns
- Explicit airport-specific fields
- Can add airport-specific features later (maps, distance calc)

**Cons:**
- New model + migration
- Need new API endpoint
- Dropdown component needs separate data path

### Recommendation: **Option A (Extend City)**

Reason: Simpler, fewer moving parts, the City model already has `iata_code`. Adding 5 columns is a minor schema change. The ~1000 hotel cities + ~1000 airports = ~2000 rows is trivial for CockroachDB.

---

## Implementation Plan

### Phase 1: Schema + Seed Script

**Files:**
- `prisma/schema.prisma` — Add columns to City model
- `scripts/seed-airports.ts` — Download OurAirports CSV, filter, upsert into City table

**Schema Migration:**
```sql
ALTER TABLE "City" ADD COLUMN "airport_name" STRING;
ALTER TABLE "City" ADD COLUMN "country_code" STRING;
ALTER TABLE "City" ADD COLUMN "flag" STRING;
ALTER TABLE "City" ADD COLUMN "latitude" FLOAT8;
ALTER TABLE "City" ADD COLUMN "longitude" FLOAT8;
ALTER TABLE "City" ADD COLUMN "airport_type" STRING;
```

**Seed Script Logic:**
1. Download `airports.csv` from OurAirports GitHub
2. Parse CSV, filter to `type IN ('large_airport', 'medium_airport')` AND `scheduled_service = 'yes'` AND `iata_code IS NOT NULL`
3. Map country codes to emoji flags
4. For each airport: upsert into City table (match on `iata_code`)
5. Preserve existing hotel cities (don't delete rows without `airport_name`)

**Flag Mapping:**
```typescript
const COUNTRY_FLAGS: Record<string, string> = {
  IN: "🇮🇳", AE: "🇦🇪", TH: "🇹🇭", SG: "🇸🇬", MY: "🇲🇾",
  LK: "🇱🇰", MV: "🇲🇻", NP: "🇳🇵", ID: "🇮🇩", TR: "🇹🇷",
  GB: "🇬🇧", US: "🇺🇸", FR: "🇫🇷", DE: "🇩🇪", AU: "🇦🇺",
  JP: "🇯🇵", HK: "🇭🇰", CN: "🇨🇳", KR: "🇰🇷", VN: "🇻🇳",
  SA: "🇸🇦", QA: "🇶🇦", OM: "🇴🇲", KW: "🇰🇼", EG: "🇪🇬",
  ZA: "🇿🇦", CA: "🇨🇦", NZ: "🇳🇿", PH: "🇵🇭", MT: "🇲🇹",
  // ... ~50 more
};
```

### Phase 2: API Endpoint

**New file:** `src/app/api/cities/airports/route.ts`

```typescript
// GET /api/cities/airports
// Returns all airports with IATA codes, grouped by country
// Query params: ?countryCode=IN&search=mumbai

export async function GET(req: NextRequest) {
  const countryCode = req.nextUrl.searchParams.get("countryCode");
  const search = req.nextUrl.searchParams.get("search");

  const airports = await prisma.city.findMany({
    where: {
      isactive: true,
      iata_code: { not: null },
      airport_name: { not: null },
      ...(countryCode ? { country_code: countryCode.toUpperCase() } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { iata_code: { contains: search.toUpperCase() } },
          { airport_name: { contains: search, mode: "insensitive" } },
        ]
      } : {}),
    },
    orderBy: [{ country_code: "asc" }, { name: "asc" }],
    select: {
      id: true, name: true, iata_code: true, airport_name: true,
      country_code: true, flag: true, latitude: true, longitude: true,
    },
  });

  return NextResponse.json({ airports });
}
```

### Phase 3: Component Update

**File:** `src/components/CitySearchDropdown.tsx`

Changes:
1. Add state: `const [airports, setAirports] = useState<City[]>([]);`
2. In flight mode, fetch from `/api/cities/airports` on mount (like hotel mode fetches from `/api/cities/tbo`)
3. Keep hardcoded `ALL_AIRPORTS` as offline fallback (if fetch fails)
4. Country groups now dynamic — built from fetched data instead of hardcoded

```typescript
// Flight mode: fetch airports from DB
useEffect(() => {
  if (mode !== "flight") return;
  fetch("/api/cities/airports")
    .then(r => r.json())
    .then(data => setAirports(data.airports || []))
    .catch(() => {}); // Falls back to ALL_AIRPORTS
}, [mode]);
```

### Phase 4: Admin Seed Trigger

**File:** `scripts/seed-airports.ts` (run manually or via cron)

```bash
# Download + seed
npx tsx scripts/seed-airports.ts

# Or with custom country filter
npx tsx scripts/seed-airports.ts --country=IN --min-type=medium_airport
```

**Also add to:** `scripts/preflight-check.sh` — check that airport count > 50 in DB.

---

## File Changes Summary

| File | Change | Risk |
|------|--------|------|
| `prisma/schema.prisma` | Add 5 columns to City model | Low — additive only |
| `scripts/seed-airports.ts` | NEW — download + seed airports | Low — isolated script |
| `src/app/api/cities/airports/route.ts` | NEW — airport API endpoint | Low — new route |
| `src/components/CitySearchDropdown.tsx` | Fetch from API instead of hardcoded | Medium — UX change |
| `src/lib/db/cities.ts` | Add `searchAirports()` query | Low — additive |
| `Governance/docs/governance/DB-CHANGES.md` | Document schema change | None |

---

## Verification

1. **Seed script:** Run `npx tsx scripts/seed-airports.ts` — verify row count > 100 for India
2. **API endpoint:** `curl localhost:3000/api/cities/airports` — verify airports returned with IATA codes
3. **Dropdown:** Open flight search → click "From" → verify Ayodhya (AYJ) appears under India
4. **Search:** Type "AYJ" in dropdown → verify Ayodhya appears as result
5. **Performance:** Dropdown opens in <200ms with 1000+ airports in DB
6. **Existing hotel mode:** Verify hotel search still works unchanged
7. **TBO search:** Search DEL→AYJ → verify TBO API accepts the code (may return "No Result" if route not served, but no errors)

---

## Open Questions

1. **TBO route support:** Does TBO actually serve Ayodhya (AYJ)? If not, search will return "No Result Found" — but this is a TBO limitation, not ours. The dropdown should still list it.
2. **Refresh cadence:** How often to re-seed? Airports open rarely (1-2 per year). Annual refresh is sufficient. Could add a cron job or manual admin button.
3. **Flag emoji rendering:** Some systems don't render flag emojis. Fallback to country code ("IN") if emoji fails.
