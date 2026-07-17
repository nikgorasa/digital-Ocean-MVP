# TBO API Static Data Reference

## Source Documentation

Fetched from https://apidoc.tektravels.com/hotelnew/ on 2026-06-23:

| Page | URL |
|---|---|
| CountryList | https://apidoc.tektravels.com/hotelnew/countrylist.aspx |
| CityList | https://apidoc.tektravels.com/hotelnew/citylist.aspx |
| TBOHotelCodeList | https://apidoc.tektravels.com/hotelnew/tbohotelcodelist.aspx |
| HotelDetails | https://apidoc.tektravels.com/hotelnew/hoteldetails.aspx |
| HotelCodes | https://apidoc.tektravels.com/hotelnew/hotelcodes.aspx |

---

## Static Data Flow

```
CountryList → CityList → TBOHotelCodeList → HotelDetails
```

TBO recommends downloading static data locally and refreshing every 15 days.

---

## Dual-Authentication Architecture

The TBO Hotel API requires **two separate credential pairs** for different endpoint groups:

| Group | Base URL | Auth | Env Vars |
|---|---|---|---|
| **Static Data** (CountryList, CityList, TBOHotelCodeList, HotelDetails) | `http://api.tbotechnology.in/TBOHolidays_HotelAPI` | Basic Auth — `TBOStaticAPITest` / `Tbo@11530818` | `TBO_HOTEL_USERNAME`, `TBO_HOTEL_PASSWORD` |
| **Search/Book** (Search, PreBook, Book, GetBookingDetail, Voucher, Cancel) | `https://affiliate.tektravels.com/HotelAPI` | Basic Auth — `RasaT` / `RasaT@123` | `TBO_USERNAME`, `TBO_PASSWORD` |

These MUST remain separate — the staging static data endpoint does not accept RasaT credentials, and the production search endpoint does not accept TBOStaticAPITest credentials.

### Verified Live Test Results

| Test | Result |
|---|---|
| CountryList (GET, staging auth) | 200, 249 countries |
| CityList (POST `{"CountryCode":"IN"}`, staging auth) | 200, 1089 Indian cities |
| TBOHotelCodeList (POST `{"CityCode":"119805"}`, staging auth) | 200, 4356 Goa hotels |
| HotelDetails (POST, staging auth) | 200, details returned |
| Search (POST, agency auth) | 200 (was working, temporary date issue) |
| PreBook (POST, agency auth) | 200, auth working |

---

## Endpoints

### 1. CountryList

- **HTTP Method:** GET
- **URL:** `{TBO_STATIC_ENDPOINT}/CountryList`
- **Request Body:** None
- **Auth:** Basic Auth (TBO_HOTEL_USERNAME / TBO_HOTEL_PASSWORD)

**Response:**
```json
{
  "Status": { "Code": 200, "Description": "Success" },
  "CountryList": [
    { "Code": "IN", "Name": "India" },
    { "Code": "AE", "Name": "United Arab Emirates" }
  ]
}
```

**Current Usage:**
- `tbo-hotel-api.ts:getCountries()` — shared library function using STATIC_AUTH_HEADER
- `/api/tbo-hotels` route action `static-data/countries`
- `/api/cities/tbo` — accepts countryCode query parameter

---

### 2. CityList

- **HTTP Method:** POST
- **URL:** `{TBO_STATIC_ENDPOINT}/CityList`
- **Request Body:**
```json
{ "CountryCode": "IN" }
```
- **Auth:** Basic Auth (TBO_HOTEL_USERNAME / TBO_HOTEL_PASSWORD)

**Response:**
```json
{
  "Status": { "Code": 200, "Description": "Success" },
  "CityList": [
    { "Code": "100758", "Name": "Abersee" },
    { "Code": "130443", "Name": "New Delhi" }
  ]
}
```

**Current Usage:**
- `tbo-hotel-api.ts:getCities(countryCode)` — shared library function using STATIC_AUTH_HEADER
- `/api/tbo-hotels` route action `static-data/cities`
- `/api/cities/tbo` — frontend-facing endpoint with caching + IATA enrichment
- `tbo-hotel-client.ts:lookupTboCityCode()` — city code resolution for search

---

### 3. TBOHotelCodeList

- **HTTP Method:** POST
- **URL:** `{TBO_STATIC_ENDPOINT}/TBOHotelCodeList`
- **Request Body:**
```json
{ "CityCode": "130443" }
```
- **Auth:** Basic Auth (TBO_HOTEL_USERNAME / TBO_HOTEL_PASSWORD)

**Response:**
```json
{
  "Status": { "Code": 200, "Description": "Success" },
  "Hotels": [
    {
      "HotelCode": "1218373",
      "HotelName": "Airport Hotel Ramhan Palace Mahipalpur",
      "Latitude": "28.54907",
      "Longitude": "77.127326",
      "HotelRating": "FourStar",
      "Address": "...",
      "CountryName": "India",
      "CountryCode": "IN",
      "CityName": "New Delhi"
    }
  ]
}
```

**Current Usage:**
- `tbo-hotel-api.ts:getHotelCodeList(cityCode)` — shared library function using STATIC_AUTH_HEADER
- `/api/tbo-hotels` route action `static-data/hotel-codes`
- `tbo-hotel-client.ts:resolveHotelCodes()` — automatically resolves hotel codes for search

---

### 4. HotelDetails

- **HTTP Method:** POST
- **URL:** `{TBO_STATIC_ENDPOINT}/HotelDetails`
- **Request Body:**
```json
{ "Hotelcodes": "1000000", "Language": "EN", "IsRoomDetailRequired": true }
```
- **Auth:** Basic Auth (TBO_HOTEL_USERNAME / TBO_HOTEL_PASSWORD)

**Response:**
```json
{
  "Status": { "Code": 200, "Description": "Successful" },
  "HotelDetails": [
    {
      "HotelCode": "1000000",
      "HotelName": "Sofitel Legend Old Cataract Aswan",
      "Description": "...",
      "HotelFacilities": ["Library", "Pool"],
      "Images": ["https://..."],
      "Address": "...",
      "HotelRating": 5,
      "CityName": "Aswan",
      "CountryCode": "EG",
      "CheckInTime": "3:00 PM",
      "CheckOutTime": "12:00 PM"
    }
  ]
}
```

**Current Usage:**
- `tbo-hotel-api.ts:getHotelDetails(hotelCodes)` — shared library function with hotel codes as comma-separated string, uses STATIC_AUTH_HEADER
- `tbo-hotel-client.ts:fetchHotelImages()` — fetches images and details in batches of 15

---

### 5. HotelCodes (not currently used)

- **HTTP Method:** GET
- **URL:** `{TBO_STATIC_ENDPOINT}/HotelCodes`
- **Request Body:** None
- **Auth:** Basic Auth (TBO_HOTEL_USERNAME / TBO_HOTEL_PASSWORD)

**Response:**
```json
{
  "HotelCodes": [1000000, 1000001, 1000002]
}
```

Not currently used in the codebase.

---

## Authentication

### Static Data Endpoints
All static data endpoints use **Basic Auth** with TBOStaticAPITest credentials:

| Env Var | Value |
|---|---|
| `TBO_HOTEL_USERNAME` | `TBOStaticAPITest` |
| `TBO_HOTEL_PASSWORD` | `Tbo@11530818` |

### Search/PreBook/Book Endpoints
All booking endpoints use **Basic Auth** with RasaT credentials (shared with flights):

| Env Var | Value |
|---|---|
| `TBO_USERNAME` | `RasaT` |
| `TBO_PASSWORD` | `RasaT@123` |

---

## Configuration

### Env Vars

| Env Var | Default | Purpose |
|---|---|---|
| `TBO_HOTEL_USERNAME` | `TBOStaticAPITest` | Static data Basic Auth username |
| `TBO_HOTEL_PASSWORD` | `Tbo@11530818` | Static data Basic Auth password |
| `TBO_STATIC_ENDPOINT` | `http://api.tbotechnology.in/TBOHolidays_HotelAPI` | Base URL for CountryList, CityList, TBOHotelCodeList, HotelDetails |
| `TBO_USERNAME` | `RasaT` | Agency Basic Auth username (shared with flights) |
| `TBO_PASSWORD` | `RasaT@123` | Agency Basic Auth password (shared with flights) |
| `TBO_ENDPOINT` | `https://affiliate.tektravels.com/HotelAPI` | Base URL for Search, PreBook |
| `TBO_BOOKING_ENDPOINT` | `https://HotelBE.tektravels.com/hotelservice.svc/rest` | Base URL for Book, GetBookingDetail, Voucher, Cancel |
| `TBO_HOTEL_FORCE_MOCK` | (empty) | Set to `"true"` to use mock data without API calls |

### ConfigProvider Settings

The `ConfigProvider` DB table stores runtime configuration that takes priority over environment variables. The table is read via `readConfig()` in `config-service.ts`.

| Provider Key | Field | Typical Value | Source |
|---|---|---|---|
| `tbo_hotel` | `baseUrl` | `https://affiliate.tektravels.com/HotelAPI` | Env falls back to `TBO_ENDPOINT` |
| `tbo_hotel` | `bookingUrl` | `https://HotelBE.tektravels.com/hotelservice.svc/rest` | Env falls back to `TBO_BOOKING_ENDPOINT` |
| `tbo_hotel` | `clientId` | `ApiIntegrationNew` | Env falls back to `TBO_CLIENT_ID` |
| `tbo_hotel` | `username` | `RasaT` | Env falls back to `TBO_USERNAME` |
| `tbo_hotel` | `password` | `RasaT@123` | Env falls back to `TBO_PASSWORD` |
| `tbo_hotel_static` | `staticUrl` | `http://api.tbotechnology.in/TBOHolidays_HotelAPI` | Env falls back to `TBO_STATIC_ENDPOINT` |
| `tbo_hotel_static` | `staticUsername` | `TBOStaticAPITest` | Env falls back to `TBO_HOTEL_USERNAME` |
| `tbo_hotel_static` | `staticPassword` | `Tbo@11530818` | Env falls back to `TBO_HOTEL_PASSWORD` |

The `envFallback()` function in `config-service.ts` resolves these values:
- If a DB row exists for the provider, its stored values are used (decrypted for secrets).
- If no DB row exists (or fields are null), the corresponding env var is read.
- If neither DB nor env var is set, the hardcoded default in `envFallback()` is used.

### Transport Functions

The codebase uses four transport functions in `tbo-hotel-api.ts`:

| Function | Base URL | Auth Header | Used By |
|---|---|---|---|
| `staticGet()` | `STATIC_DATA_BASE` | `STATIC_AUTH_HEADER` (TBOStaticAPITest) | `getCountries()` |
| `staticJsonPost()` | `STATIC_DATA_BASE` | `STATIC_AUTH_HEADER` (TBOStaticAPITest) | `getCities()`, `getHotelCodeList()`, `getHotelDetails()` |
| `searchPost()` | `SEARCH_BASE` | `AGENCY_AUTH_HEADER` (RasaT) | `searchHotels()`, `preBook()` |
| `bookingPost()` | `BOOKING_BASE` | `AGENCY_AUTH_HEADER` (RasaT) | `bookHotel()`, `getBookingDetail()`, `generateVoucher()`, `sendChangeRequest()`, `getChangeRequestStatus()` |

---

## Known Limitation: City Code Discrepancy

### The Problem
The staging static data endpoint (`api.tbotechnology.in`) uses **different city codes** than the production Search endpoint (`affiliate.tektravels.com`).

**Examples:**
| City | Staging Code (static data) | Mock Code (codebase) |
|---|---|---|
| Goa | 119805 | 49592 |
| Delhi | 130443 | 42374 |
| Mumbai | 144306 | 41924 |

- Using staging codes in TBOHotelCodeList → **works** (4356 hotels for Goa)
- Using codebase mock codes in TBOHotelCodeList → **"No Hotels Found"**
- Staging codes may NOT work with production Search endpoint

### Impact on Flow
1. `CitySearchDropdown` fetches cities from `/api/cities/tbo` which uses the static endpoint
2. The returned codes are staging codes
3. These codes are passed to `searchHotels()` which calls the production Search endpoint
4. The production Search endpoint uses its own city code system — staging codes may be rejected

### Current Mitigation
- `lookupTboCityCode()` in `tbo-hotel-client.ts` returns staging codes and is documented as potentially incompatible
- The `CitySearchDropdown` component passes codes through transparently — if the Search endpoint accepts them, it works; if not, it falls back to mock
- The `resolveHotelCodes()` function uses `api.getHotelCodeList()` (staging) to resolve hotel codes from city codes, then passes those hotel codes to Search — meaning the hotel codes themselves come from staging and should be valid regardless of the Search endpoint's city code system

---

## Implementation History

### Phase 1: Dual Auth Separation (2026-06-23)
- [x] Restore separate `TBO_HOTEL_USERNAME`/`TBO_HOTEL_PASSWORD` for static data
- [x] Restore `TBO_STATIC_ENDPOINT` default to `http://api.tbotechnology.in/TBOHolidays_HotelAPI`
- [x] Split transport functions: staticGet/staticJsonPost use static auth, searchPost/bookingPost use agency auth
- [x] Document city code discrepancy
- [x] Update `.env.example` with separated env vars
- [x] Update reference document with dual-auth architecture

### Phase 2: Frontend Integration (Completed 2026-06-25)
- [x] `/api/cities/tbo` now accepts `?countryCode=XX` query parameter
- [x] Country list exposed via `/api/tbo-hotels` (`action: "static-data/countries"`)
- [x] City list exposed via `/api/tbo-hotels` (`action: "static-data/cities"`)
- [x] Parameterized by country code (not India-only)
- [x] Proper caching (60-min TTL) in API route

---

## TBO Flight API

### Architecture (Separate from Hotel API)

The Flight API uses **completely different endpoints** than the Hotel API. This is by design — TBO has separate services for flights and hotels.

| Service | Base URL | Auth |
|---|---|---|
| **Flight Auth** | `http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate` | RasaT / RasaT@123 |
| **Flight Search/Book** | `http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest` | Token from Auth |

### Flight Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/Authenticate` | POST | Get daily token (cached) |
| `/Search` | POST | Search flights |
| `/FareRule` | POST | Get fare rules |
| `/FareQuote` | POST | Get fare quote (price verification) |
| `/SSR` | POST | Get ancillary services (meals, baggage, seats) |
| `/Book` | POST | Book flight |
| `/Ticket` | POST | Issue ticket |
| `/GetBookingDetail` | POST | Get booking details |

### Cabin Class Values

| Value | Name |
|---|---|
| 0 | All |
| 1 | Economy |
| 2 | Premium Economy |
| 3 | Business |
| 4 | Premium Business |
| 5 | First |

### Known Issues (See TBO-ARCH-EPIC #237)

1. **Endpoints hardcoded** — Not configurable via ConfigProvider or env vars
2. **No mock fallback** — TBO 'No Result Found' shows error to user
3. **No retry logic** — Single failure = complete failure
4. **Raw error exposure** — TBO errors shown directly to users

### ConfigProvider (tbo_flight)

| Field | Env Var Fallback | Default |
|---|---|---|
| `clientId` | `TBO_CLIENT_ID` | `ApiIntegrationNew` |
| `username` | `TBO_USERNAME` | (empty) |
| `password` | `TBO_PASSWORD` | (empty) |
| `forceMock` | `TBO_FLIGHT_FORCE_MOCK` | `false` |

### CRITICAL: Hotel Cities vs Flight Airports

**NEVER MIX THESE TWO DATA SOURCES:**

| Use Case | Data Source | Component Mode | Example |
|---|---|---|---|
| **Hotel Search** | TBO Hotel API (`/api/cities/tbo`) | `mode="hotel"` (default) | Goa → code: "15648" |
| **Flight Search** | Curated airport list (FALLBACK_CITIES) | `mode="flight"` | Goa → iata_code: "GOI" |

**Why:** TBO's Hotel CityList returns hotel destination codes (e.g., "15648" for Goa). The Flight API requires IATA airport codes (e.g., "GOI" for Goa). Using hotel city codes for flights causes "No Result Found" errors.

**Implementation:**
- `CitySearchDropdown` has a `mode` prop: `"hotel"` | `"flight"`
- Flight pages (`/flights`) MUST use `mode="flight"`
- Hotel pages (`/hotels`) use `mode="hotel"` (default)
- Flight mode uses `FALLBACK_CITIES` which has IATA codes + airport names
- Hotel mode fetches from TBO API

**Airport Data (FALLBACK_CITIES):**

| Country | Airports |
|---|---|
| India (IN) | GOI (Dabolim), BOM (Chhatrapati Shivaji), DEL (Indira Gandhi), BLR (Kempegowda), HYD (Rajiv Gandhi), MAA (Chennai), JAI (Jaipur), CCU (Netaji Subhas), PNQ (Pune), AMD (Sardar Patel), COK (Cochin), TRV (Trivandrum), LKO (Chaudhary Charan Singh), GAU (Lokpriya Gopinath), VNS (Lal Bahadur Shastri) |
| UAE (AE) | DXB (Dubai), AUH (Zayed), SHJ (Sharjah) |
| Thailand (TH) | BKK (Suvarnabhumi), HKT (Phuket), CNX (Chiang Mai) |
| Singapore (SG) | SIN (Changi) |
| Malaysia (MY) | KUL (Kuala Lumpur), LGK (Langkawi), PEN (Penang) |
| USA (US) | JFK (John F Kennedy), LAX (Los Angeles), SFO (San Francisco), MIA (Miami), ORD (O'Hare) |
| UK (GB) | LHR (Heathrow), MAN (Manchester), EDI (Edinburgh) |
| France (FR) | CDG (Charles de Gaulle), NCE (Cote d'Azur) |
| Germany (DE) | BER (Berlin Brandenburg), MUC (Franz Josef Strauss), FRA (Frankfurt) |
| Australia (AU) | SYD (Kingsford Smith), MEL (Tullamarine) |
| Japan (JP) | NRT (Narita), KIX (Kansai) |
| Sri Lanka (LK) | CMB (Bandaranaike) |
| Maldives (MV) | MLE (Velana) |
