# EPIC: API Logger Enhancement for TBO Certification + Ongoing Work

> **Created:** 2026-07-25
> **Purpose:** Comprehensive epic list for API logging gaps, TBO certification readiness, and all ongoing project work
> **Status:** Planning

---

## 1. TBO Certification Log Requirements — Gap Analysis

### What TBO Requires (from apidoc.tektravels.com/hotelnew/Certification.aspx)

TBO Hotel certification requires **8 test cases**, each submitted as **individual JSON request/response attachments**:

| Case | Description | Rooms |
|------|-------------|-------|
| 1 | Domestic, 1 Room, 1 Adult | R1: 1A |
| 2 | Domestic, 1 Room, 2 Adults + 2 Children | R1: 2A+2C |
| 3 | Domestic, 2 Rooms, 1 Adult each | R1: 1A, R2: 1A |
| 4 | Domestic, 2 Rooms, Mixed | R1: 1A+2C, R2: 2A |
| 5 | International, 1 Room, 1 Adult | R1: 1A |
| 6 | International, 1 Room, 2 Adults + 2 Children | R1: 2A+2C |
| 7 | International, 2 Rooms, 1 Adult each | R1: 1A, R2: 1A |
| 8 | International, 2 Rooms, Mixed | R1: 1A+2C, R2: 2A |

**Certification Process:**
1. **Step 1:** Execute all 8 cases, submit JSON logs case-by-case with confirmation numbers
2. **Step 2:** TBO shares validation sheet for general queries
3. **Step 3:** Portal verification (website/app link)
4. **Step 4:** Sign-off + live credentials
5. **Step 5:** IP whitelisting (static public IP)

**Critical requirements:**
- JSON Request/Response in TBO's exact format — NOT summarized or transformed
- Confirmation numbers (BookingId) for each case
- Logs sent **case-by-case** (not all in one file)
- Processing time: 3-4 working days per step

### What We Currently Capture

| Field | Source | Status |
|-------|--------|--------|
| `provider` | api-logger.ts | ✅ `tbo_hotel_search`, `tbo_hotel_booking`, etc. |
| `endpoint` | api-logger.ts | ✅ e.g., `/Search`, `/PreBook`, `/book/` |
| `method` | api-logger.ts | ✅ POST |
| `request_body` | api-logger.ts | ✅ Full JSON (8KB limit) |
| `response_body` | api-logger.ts | ✅ Full JSON (8KB limit) |
| `status_code` | api-logger.ts | ✅ HTTP status |
| `tbo_status_code` | api-logger.ts | ✅ `Status.Code` extracted |
| `response_time_ms` | api-logger.ts | ✅ |
| `error_message` | api-logger.ts | ✅ |
| `request_id` | api-logger.ts | ✅ Groups search→prebook→book flow |
| `batch_index/total` | api-logger.ts | ✅ For batched hotel detail calls |
| `summary` | api-logger.ts | ✅ Human-readable (e.g., "22 hotels found") |
| `environment` | api-logger.ts | ✅ dev/staging/production |
| `vercel_deployment_id` | api-logger.ts | ✅ |
| `created_at` | Prisma default | ✅ UTC timestamp |
| `token_id` | api-logger.ts | ✅ TBO auth token |
| `end_user_ip` | api-logger.ts | ✅ Client IP |
| `city_codes` | api-logger.ts | ✅ From request body |
| `hotel_codes` | api-logger.ts | ✅ From request body |
| `check_in` | api-logger.ts | ✅ From request body |
| `check_out` | api-logger.ts | ✅ From request body |
| `pax_config` | api-logger.ts | ✅ From request body |
| `guest_nationality` | api-logger.ts | ✅ From request body |
| `preferred_currency` | api-logger.ts | ✅ From request body |
| `trace_id` | api-logger.ts | ✅ TBO TraceId from response |
| `flight_source` | api-logger.ts | ✅ TBO Source (4=Amadeus, 14=AirIndiaExpress, etc.) |
| `cert_case` | api-logger.ts | 🔲 Reserved for certification case tagging |
| `cert_label` | api-logger.ts | 🔲 Reserved for certification case description |

### What We're Missing for Certification

| Missing Field | Why TBO Needs It | Priority |
|---------------|------------------|----------|
| **TokenId** | TBO verifies auth token was valid for each request | HIGH |
| **EndUserIp** | TBO tracks client IP for rate limiting / fraud detection | HIGH |
| **CityCode(s) sent** | Verify correct city code system was used | HIGH |
| **HotelCodes sent** | Verify hotel codes match TBO's inventory | HIGH |
| **CheckIn/CheckOut dates** | Verify date format and range compliance | HIGH |
| **PaxRooms configuration** | Verify room/adult/child structure per case | HIGH |
| **GuestNationality** | Must match nationality per test case spec | HIGH |
| **PreferredCurrency** | Verify currency code compliance | MEDIUM |
| **IsDetailedResponse** | TBO recommends true for certification | MEDIUM |
| **ResponseTime param** | TBO's timeout hint (29s recommended) | LOW |
| **Certification case tag** | Map log → test case (1-8) for submission | HIGH |
| **Full untruncated body** | 8KB may truncate large Search responses (20+ hotels) | HIGH |
| **TraceId from response** | Required for PreBook→Book→Voucher chain | HIGH |

### Current Limitations

1. **8KB truncation** — Large search responses (20+ hotels with full room details) exceed 8KB. TBO needs complete JSON.
2. **No certification case mapping** — No way to tag a log as "Case 3: Domestic, 2 rooms, 1A each" for submission.
3. **No token tracking** — TokenId is generated in `tbo-hotel-client.ts` but never logged.
4. **No structured field extraction** — City codes, dates, room config are buried in request_body JSON. No indexed columns for quick filtering.
5. **No export-for-submission feature** — Admin UI shows logs but has no "Export as TBO certification attachment" function.

---

## 2. EPIC 7: API Logger Enhancement for TBO Certification

### Description
Enhance the API logger to capture all fields TBO requires for certification log submission, add certification case tagging, and build an export workflow for submitting logs to TBO.

### Sub-Issues

#### LOG-01: Add certification-specific columns to ApiLog schema
**Priority:** HIGH
**Effort:** 2h

**Acceptance Criteria:**
- [ ] Add `token_id` (String, nullable) to ApiLog model
- [ ] Add `end_user_ip` (String, nullable) to ApiLog model
- [ ] Add `city_codes` (String, nullable) — comma-separated city codes sent
- [ ] Add `hotel_codes` (String, nullable) — comma-separated hotel codes sent
- [ ] Add `check_in` (String, nullable) — check-in date
- [ ] Add `check_out` (String, nullable) — check-out date
- [ ] Add `pax_config` (String, nullable) — JSON of room/adult/child config
- [ ] Add `guest_nationality` (String, nullable)
- [ ] Add `preferred_currency` (String, nullable)
- [ ] Add `trace_id` (String, nullable) — TBO TraceId from response
- [ ] Add `cert_case` (Int, nullable) — certification case number (1-8)
- [ ] Add `cert_label` (String, nullable) — human-readable case description
- [ ] Apply migration via direct SQL to BOTH DEV and PROD clusters
- [ ] Add indexes on `cert_case`, `trace_id`, `token_id`

**Schema SQL:**
```sql
ALTER TABLE api_logs ADD COLUMN token_id STRING NULL;
ALTER TABLE api_logs ADD COLUMN end_user_ip STRING NULL;
ALTER TABLE api_logs ADD COLUMN city_codes STRING NULL;
ALTER TABLE api_logs ADD COLUMN hotel_codes STRING NULL;
ALTER TABLE api_logs ADD COLUMN check_in STRING NULL;
ALTER TABLE api_logs ADD COLUMN check_out STRING NULL;
ALTER TABLE api_logs ADD COLUMN pax_config STRING NULL;
ALTER TABLE api_logs ADD COLUMN guest_nationality STRING NULL;
ALTER TABLE api_logs ADD COLUMN preferred_currency STRING NULL;
ALTER TABLE api_logs ADD COLUMN trace_id STRING NULL;
ALTER TABLE api_logs ADD COLUMN cert_case INT NULL;
ALTER TABLE api_logs ADD COLUMN cert_label STRING NULL;
CREATE INDEX idx_api_logs_cert_case ON api_logs(cert_case);
CREATE INDEX idx_api_logs_trace_id ON api_logs(trace_id);
CREATE INDEX idx_api_logs_token_id ON api_logs(token_id);
```

**Dependencies:** None

---

#### LOG-02: Extract structured fields from TBO request/response in logApiCall
**Priority:** HIGH
**Effort:** 3h

**Acceptance Criteria:**
- [ ] `logApiCall` accepts new optional params: `tokenId`, `endUserIp`, `traceId`
- [ ] For `tbo_hotel_search` provider: extract `CheckIn`, `CheckOut`, `HotelCodes`, `GuestNationality`, `PreferredCurrency`, `PaxRooms` from request body
- [ ] For `tbo_hotel_booking` provider: extract `BookingCode` from request body
- [ ] For `tbo_hotel_prebook` provider: extract `BookingCode` from request body
- [ ] Extract `TraceId` from response body (TBO search responses include it)
- [ ] Populate all new columns when data is available
- [ ] No performance regression — fire-and-forget pattern preserved

**Files to modify:**
- `src/lib/api-logger.ts` — add new params + extraction logic
- `src/lib/tbo-hotel-api.ts` — pass `tokenId`, `endUserIp` to `logApiCall` calls
- `src/lib/tbo-flight-api.ts` — pass `tokenId` to `logApiCall` calls

**Dependencies:** LOG-01

---

#### LOG-03: Increase truncation limit for certification-critical endpoints
**Priority:** HIGH
**Effort:** 1h

**Acceptance Criteria:**
- [ ] Search, PreBook, Book, GetBookingDetail, GenerateVoucher endpoints log FULL request/response (no truncation)
- [ ] Static data endpoints (CountryList, CityList, HotelCodeList) keep 8KB limit
- [ ] Maximum body size: 64KB for critical endpoints (prevents DB bloat)
- [ ] Truncation adds `...[truncated at N bytes]` marker

**Implementation:**
```typescript
const MAX_BODY_CERT = 65536; // 64KB for certification endpoints
const MAX_BODY_DEFAULT = 8192; // 8KB for everything else

function getTruncationLimit(provider: string): number {
  if (['tbo_hotel_search', 'tbo_hotel_prebook', 'tbo_hotel_booking',
       'tbo_hotel_voucher', 'tbo_hotel_cancel'].includes(provider)) {
    return MAX_BODY_CERT;
  }
  return MAX_BODY_DEFAULT;
}
```

**Dependencies:** None

---

#### LOG-04: Certification case tagging in admin UI
**Priority:** HIGH
**Effort:** 4h

**Acceptance Criteria:**
- [ ] Admin logs page shows a "Tag for Certification" button on each log group
- [ ] Tagging dialog: select case number (1-8) + auto-fills description from template
- [ ] Case descriptions:
  - Case 1: "Domestic Booking (Room 1 – Adult 1)"
  - Case 2: "Domestic Booking (Room 1 – Adult 2, Child 2)"
  - Case 3: "Domestic Booking (Room 1 – Adult 1) (Room 2 – Adult 1)"
  - Case 4: "Domestic Booking (Room 1 – Adult 1, Child 2) (Room 2 – Adult 2)"
  - Case 5: "International Booking (Room 1 – Adult 1)"
  - Case 6: "International Booking (Room 1 – Adult 2, Child 2)"
  - Case 7: "International Booking (Room 1 – Adult 1) (Room 2 – Adult 1)"
  - Case 8: "International Booking (Room 1 – Adult 1, Child 2) (Room 2 – Adult 2)"
- [ ] Tagged logs show badge: "Case N: Description"
- [ ] Filter by certification case in logs page
- [ ] PATCH endpoint to update cert_case and cert_label on existing logs

**Files to modify:**
- `src/app/admin/api-logs/page.tsx` — tag button, filter, badge display
- `src/app/api/admin/api-logs/route.ts` — PATCH handler for tagging

**Dependencies:** LOG-01

---

#### LOG-05: Export logs as TBO certification submission
**Priority:** HIGH
**Effort:** 4h

**Acceptance Criteria:**
- [ ] "Export for TBO" button on tagged log groups
- [ ] Exports JSON file with naming: `Case{N}_{Description}_{date}.json`
- [ ] File contains: request body, response body, endpoint, timestamp, BookingId
- [ ] Each case exported as separate file (TBO requires case-by-case)
- [ ] Batch export: "Export All Tagged Cases" generates a ZIP with all 8 cases
- [ ] Exported JSON matches TBO's expected format exactly (no transforms)
- [ ] Includes metadata header: Agency name, credentials used, timestamp, IP

**Implementation approach:**
```json
{
  "caseNumber": 1,
  "caseDescription": "Domestic Booking (Room 1 – Adult 1)",
  "agencyName": "GoRASA",
  "timestamp": "2026-07-24T14:30:00Z",
  "environment": "sandbox",
  "search": { "request": {...}, "response": {...} },
  "prebook": { "request": {...}, "response": {...} },
  "book": { "request": {...}, "response": {...}, "bookingId": "2165799" }
}
```

**Dependencies:** LOG-01, LOG-02, LOG-04

---

#### LOG-06: Pass tokenId and endUserIp to logApiCall from TBO client
**Priority:** HIGH
**Effort:** 2h

**Acceptance Criteria:**
- [ ] `searchHotels()` in tbo-hotel-client.ts passes tokenId to `searchPost()` → `logApiCall()`
- [ ] `preBook()` passes tokenId and bookingCode
- [ ] `bookHotel()` passes tokenId
- [ ] `getBookingDetail()` passes tokenId
- [ ] `generateVoucher()` passes tokenId
- [ ] `cancelBooking()` passes tokenId
- [ ] `getCancelStatus()` passes tokenId
- [ ] `setEndUserIp()` value passed through to all search calls
- [ ] `authenticate()` logs the TokenId from response
- [ ] Flight API: `searchFlights()`, `bookFlight()`, `ticketFlight()` pass tokenId

**Files to modify:**
- `src/lib/tbo-hotel-api.ts` — update `searchPost()`, `bookingPost()`, `staticJsonPost()` to accept and pass tokenId
- `src/lib/tbo-hotel-client.ts` — pass tokenId to API functions
- `src/lib/tbo-flight-api.ts` — pass tokenId to `logApiCall`

**Dependencies:** LOG-01, LOG-02

---

#### LOG-07: Add full-body storage for certification endpoints (S3/Blob)
**Priority:** MEDIUM
**Effort:** 6h

**Acceptance Criteria:**
- [ ] Search responses > 8KB stored in Vercel Blob (or separate table)
- [ ] ApiLog links to full body via `full_request_url` / `full_response_url`
- [ ] Admin UI has "View Full Body" button when truncated
- [ ] Blob storage has 90-day retention matching api_logs cleanup
- [ ] Cost-estimated: ~500 logs/day × 50KB avg = ~750MB/month

**Note:** This is optional for initial certification. TBO accepts 8KB logs as long as the key fields (Status.Code, HotelResult count, BookingId) are visible. Full body is needed only if TBO rejects truncated logs.

**Dependencies:** LOG-03

---

#### LOG-08: Flight Source (GDS/LCC) in logs + admin filter + UI badge ✅ DONE
**Priority:** MEDIUM
**Effort:** 3h (actual: 1.5h)
**Status:** COMPLETED 2026-07-26

**Acceptance Criteria:**
- [x] `flight_source` column added to `api_logs` table (DEV + PROD)
- [x] TBO `Source` field extracted from flight search `Results[0][0].Source`
- [x] Source passed through to client in `Flight` interface
- [x] Source badge shown on flight cards: GDS (Source 4/5) vs LCC (others)
- [x] Admin logs page has Source filter dropdown (All/Amadeus/Galileo/SpiceJet/IndiGo/etc.)
- [x] Source column visible in admin logs table (group header + expanded detail)
- [x] Source included in log exports

**Files modified:**
- `Governance/migrations/20260726_api_logs_flight_source.sql` — migration
- `prisma/schema.prisma` — `flight_source Int?` + index
- `src/lib/api-logger.ts` — extract `Source` from `Results[0][0].Source`
- `src/app/flights/page.tsx` — `Flight.source` + badge + mapping
- `src/app/admin/api-logs/page.tsx` — filter + column + export

**TBO Source values:**
| Source | Value | Type |
|--------|-------|------|
| NotSet | 0 | - |
| SpiceJet | 3 | LCC |
| Amadeus | 4 | GDS |
| Galileo | 5 | GDS |
| IndiGo | 6 | LCC |
| GoAir | 10 | LCC |
| AirArabia | 13 | LCC |
| AirIndiaExpress | 14 | LCC |
| FlyDubai | 17 | LCC |
| AirAsia | 19 | LCC |

**Dependencies:** None

---

#### LOG-09: TBO SSR Certification Compliance ✅ DONE
**Priority:** HIGH
**Effort:** 2h (actual: 2h)
**Status:** COMPLETED 2026-07-26

**Acceptance Criteria:**
- [x] SSR 2D→1D array flattening fixed (`Baggage[][]` → `Baggage[]`)
- [x] User SSR selections pass through to TBO ticket request (not just cosmetic)
- [x] SSR API call has retry logic (2 retries, exponential backoff)
- [x] SSR failure shows error message to user (not silent)
- [x] Non-LCC SSR response format handled (`SeatPreference[]`, `Meal[]`)
- [x] TypeScript compiles clean

**Files modified:**
- `src/lib/tbo-flight-client.ts` — flatten SSR arrays, accept user selections, fallback logic
- `src/lib/tbo-flight-api.ts` — SSR retry (maxRetries=2)
- `src/app/api/tbo/route.ts` — forward ssrBaggage/ssrMeals/ssrSeats to ticketFlight
- `src/components/FlightBookingModal.tsx` — buildSSRBaggage/Meals/Seats helpers, error handling

**Dependencies:** None

---

### Epic 7 Summary

| Issue | Title | Priority | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| LOG-01 | Add certification columns to ApiLog | HIGH | 2h | None |
| LOG-02 | Extract structured fields in logApiCall | HIGH | 3h | LOG-01 |
| LOG-03 | Increase truncation for cert endpoints | HIGH | 1h | None |
| LOG-04 | Certification case tagging in admin UI | HIGH | 4h | LOG-01 |
| LOG-05 | Export logs as TBO certification submission | HIGH | 4h | LOG-01, LOG-02, LOG-04 |
| LOG-06 | Pass tokenId/endUserIp to logApiCall | HIGH | 2h | LOG-01, LOG-02 |
| LOG-07 | Full-body storage for cert endpoints | MEDIUM | 6h | LOG-03 |
| LOG-08 | Flight Source (GDS/LCC) in logs + admin filter + UI badge | MEDIUM | 3h | None |
| LOG-09 | TBO SSR Certification Compliance | HIGH | 2h | None |

**Total estimated effort:** 25h
**Critical path:** LOG-01 → LOG-02 → LOG-06 → LOG-04 → LOG-05

---

## 3. EPIC 8: TBO Sandbox Recovery

### Description
The TBO hotel search sandbox has been returning `Status.Code: 201` ("No Available rooms") for ALL queries since July 24. This blocks hotel search functionality on the DEV environment and prevents re-running certification cases. This epic tracks recovery actions.

### Known State

| Environment | Hotel Search | Flight Search | Status |
|-------------|-------------|---------------|--------|
| DEV (cckr.vercel.app) | HTTP 200, TBO 201 | Working | Sandbox degraded |
| PROD (project-yidb6.vercel.app) | HTTP 404 | Unknown | Config misaligned |

### Sub-Issues

#### SANDBOX-01: Investigate TBO sandbox 201 status code root cause
**Priority:** HIGH
**Effort:** 2h

**Acceptance Criteria:**
- [ ] Test search with different city codes (Delhi, Mumbai, Goa, Dubai)
- [ ] Test with different date ranges (near-term, far-out, past dates)
- [ ] Test with different room configs (1 room 1 adult, 2 rooms 2 adults)
- [ ] Test from both DEV and PROD environments
- [ ] Check if authentication succeeds (TokenId received)
- [ ] Contact TBO support if sandbox-wide issue confirmed
- [ ] Document findings in LEARNING-FROM-MISTAKES.md

**Dependencies:** None

---

#### SANDBOX-02: Implement TBO sandbox fallback handling
**Priority:** HIGH
**Effort:** 2h

**Acceptance Criteria:**
- [ ] When TBO returns 201 for Search, show user-friendly message: "No rooms available for these dates. Try different dates or destination."
- [ ] Don't throw error for 201 — it's a valid TBO response meaning "no availability"
- [ ] Log 201 responses with full context for debugging
- [ ] Search cache does NOT cache 201 responses (availability changes frequently)
- [ ] Admin dashboard shows 201 count as metric

**Files to modify:**
- `src/lib/tbo-hotel-client.ts` — handle 201 gracefully in `searchHotels()`
- `src/app/hotels/page.tsx` — show "no availability" instead of error

**Dependencies:** None

---

#### SANDBOX-03: Verify TBO sandbox credentials are active
**Priority:** HIGH
**Effort:** 1h

**Acceptance Criteria:**
- [ ] Test `Authenticate` endpoint with current credentials
- [ ] Verify TokenId is returned and valid
- [ ] Check if staging account is still active (TBO deactivates after 1 month of live creds)
- [ ] If expired, request reactivation from TBO
- [ ] Document credential status in Cckr-CONFIG-REFERENCE.md

**Dependencies:** None

---

#### SANDBOX-04: Hotel search date range validation
**Priority:** MEDIUM
**Effort:** 1h

**Acceptance Criteria:**
- [ ] Reject check-in dates in the past (before today)
- [ ] Reject check-out dates before check-in
- [ ] Reject date ranges > 30 nights
- [ ] Show clear error message for invalid dates
- [ ] Log date validation failures

**Dependencies:** None

---

### Epic 8 Summary

| Issue | Title | Priority | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| SANDBOX-01 | Investigate TBO sandbox 201 root cause | HIGH | 2h | None |
| SANDBOX-02 | Implement TBO sandbox fallback handling | HIGH | 2h | None |
| SANDBOX-03 | Verify TBO sandbox credentials active | HIGH | 1h | None |
| SANDBOX-04 | Hotel search date range validation | MEDIUM | 1h | None |

**Total estimated effort:** 6h
**Blocker:** Hotel search on DEV returns 201 for all queries

---

## 4. EPIC 9: CCKR2 Production Parity

### Description
CCKR2 (PROD) hotel search returns HTTP 404. The PROD environment is misaligned with DEV — likely missing API route handlers or middleware whitelist entries. This epic ensures PROD matches DEV functionality.

### Known Issues

| Issue | Detail |
|-------|--------|
| Hotel search 404 | `/api/tbo-hotels` returns 404 on PROD |
| Possible causes | Route not deployed, middleware blocking, env vars missing, build failed |

### Sub-Issues

#### PARITY-01: Diagnose CCKR2 hotel search 404
**Priority:** HIGH
**Effort:** 2h

**Acceptance Criteria:**
- [ ] Verify `/api/tbo-hotels` exists in PROD deployment
- [ ] Check Vercel deployment logs for build errors
- [ ] Verify middleware whitelist includes `/api/tbo-hotels` in PROD
- [ ] Check PROD env vars: `TBO_USERNAME`, `TBO_PASSWORD`, `TBO_CLIENT_ID`
- [ ] Test flight search on PROD (compare with DEV)
- [ ] Verify ConfigProvider table exists in PROD CockroachDB cluster
- [ ] Document root cause in LEARNING-FROM-MISTAKES.md

**Dependencies:** None

---

#### PARITY-02: Sync PROD ConfigProvider with DEV
**Priority:** HIGH
**Effort:** 1h

**Acceptance Criteria:**
- [ ] Compare ConfigProvider rows between DEV and PROD
- [ ] Ensure PROD has `tbo_hotel` and `tbo_hotel_static` entries
- [ ] Verify PROD bookingUrl points to `HotelBE.tektravels.com` (not affiliate)
- [ ] Verify PROD credentials are correct (RasaT / RasaT@123 for search, TBOStaticAPITest for static)
- [ ] Run `Governance/scripts/Cckr-api-config-check.sh` against PROD

**Dependencies:** PARITY-01

---

#### PARITY-03: Deploy latest DEV code to PROD
**Priority:** HIGH
**Effort:** 1h

**Acceptance Criteria:**
- [ ] Link to cckr2 project: `vercel link --yes --project cckr2`
- [ ] Deploy: `vercel deploy --prod --yes`
- [ ] Verify deployment succeeds
- [ ] Test hotel search on PROD
- [ ] Test flight search on PROD
- [ ] Re-link to cckr project: `vercel link --yes --project cckr`

**Dependencies:** PARITY-01, PARITY-02

---

#### PARITY-04: Verify PROD schema matches DEV
**Priority:** MEDIUM
**Effort:** 1h

**Acceptance Criteria:**
- [ ] Compare table counts between DEV and PROD
- [ ] Verify `api_logs` table exists in PROD with all columns
- [ ] Verify `static_cache` and `cache_config` tables exist in PROD
- [ ] Verify `City` table has airport columns in PROD
- [ ] Run `Governance/scripts/Cckr-preflight-check.sh` against both

**Dependencies:** PARITY-03

---

### Epic 9 Summary

| Issue | Title | Priority | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| PARITY-01 | Diagnose CCKR2 hotel search 404 | HIGH | 2h | None |
| PARITY-02 | Sync PROD ConfigProvider with DEV | HIGH | 1h | PARITY-01 |
| PARITY-03 | Deploy latest DEV code to PROD | HIGH | 1h | PARITY-01, PARITY-02 |
| PARITY-04 | Verify PROD schema matches DEV | MEDIUM | 1h | PARITY-03 |

**Total estimated effort:** 5h
**Blocker:** PROD hotel search is non-functional

---

## 5. EPIC 10: Brevo Email Recovery

### Description
The email system is completely non-functional. Nodemailer uses Gmail SMTP with blank credentials. 16 Brevo email issues are open (#251-#275). This epic tracks getting transactional emails working via Brevo.

### Current State

| Component | Status |
|-----------|--------|
| Email library | `nodemailer` v9.0.0 |
| SMTP host | `smtp.gmail.com:587` (default) |
| SMTP credentials | BLANK in `.env.local`, ABSENT in `.env.production` |
| Templates | 6 templates (auth reset/verify, payment, invoice, reminder, cancellation, overdue) |
| Brevo MCP | Configured in `.opencode/opencode.json` |
| Brevo token | Stored in `.env.local` (gitignored) |
| Template links | Hardcoded to `cckr.vercel.app` |

### Sub-Issues

#### EMAIL-01: Configure Brevo SMTP credentials
**Priority:** HIGH
**Effort:** 2h

**Acceptance Criteria:**
- [ ] Generate Brevo SMTP key (Settings → SMTP & API → SMTP Key)
- [ ] Add `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_PASS` to `.env.local`
- [ ] Add same vars to `.env.production` (via Vercel dashboard)
- [ ] Update `src/lib/email.ts` to use Brevo SMTP config
- [ ] Test: send a verification email from DEV
- [ ] Verify email arrives in inbox (not spam)

**Dependencies:** None

---

#### EMAIL-02: Fix hardcoded template URLs
**Priority:** HIGH
**Effort:** 1h

**Acceptance Criteria:**
- [ ] All email template links use `NEXT_PUBLIC_APP_URL` env var
- [ ] Dev: `https://cckr.vercel.app`
- [ ] Prod: `https://project-yidb6.vercel.app`
- [ ] No hardcoded `cckr.vercel.app` in email templates

**Files to modify:**
- `src/lib/email.ts` — replace hardcoded URLs with env var

**Dependencies:** None

---

#### EMAIL-03: Configure Brevo sender domain
**Priority:** HIGH
**Effort:** 3h (+ DNS propagation time)

**Acceptance Criteria:**
- [ ] Add sender domain in Brevo (Settings → Sender Authentication)
- [ ] Add SPF, DKIM, DMARC DNS records to domain
- [ ] Verify domain ownership in Brevo
- [ ] Set `noreply@gorasa.com` (or appropriate domain) as default sender
- [ ] Test: sender shows correct domain in email headers

**Dependencies:** EMAIL-01

---

#### EMAIL-04: Wire all email touchpoints
**Priority:** HIGH
**Effort:** 2h

**Acceptance Criteria:**
- [ ] Auth: email verification on signup → works
- [ ] Auth: password reset → works
- [ ] Booking: confirmation email after payment → works
- [ ] Booking: cancellation email → works
- [ ] Invoice: invoice issued email → works
- [ ] Invoice: overdue reminder cron → works
- [ ] Payment: payment reminder (12h before expiry) → works

**Dependencies:** EMAIL-01, EMAIL-02

---

#### EMAIL-05: Remove dead `verifyEmailConnection()` code
**Priority:** LOW
**Effort:** 0.5h

**Acceptance Criteria:**
- [ ] Remove `verifyEmailConnection()` from `src/lib/email.ts` (lines 26-35)
- [ ] Remove any imports of this function
- [ ] TypeScript: 0 errors

**Dependencies:** None

---

### Epic 10 Summary

| Issue | Title | Priority | Effort | Dependencies |
|-------|-------|----------|--------|--------------|
| EMAIL-01 | Configure Brevo SMTP credentials | HIGH | 2h | None |
| EMAIL-02 | Fix hardcoded template URLs | HIGH | 1h | None |
| EMAIL-03 | Configure Brevo sender domain | HIGH | 3h+DNS | EMAIL-01 |
| EMAIL-04 | Wire all email touchpoints | HIGH | 2h | EMAIL-01, EMAIL-02 |
| EMAIL-05 | Remove dead verifyEmailConnection | LOW | 0.5h | None |

**Total estimated effort:** 8.5h + DNS propagation
**Blocker:** All transactional emails non-functional

---

## 6. Additional Epics for Ongoing Work

### EPIC 11: Flight Booking Pipeline Fixes

**Description:** Flight booking has 6 open issues (FLT-03 through FLT-08) — bookFlight() never called before ticketFlight(), only 1 passenger generated, multi-leg selection broken, price change silently ignored.

| Issue | Title | Priority | Status |
|-------|-------|----------|--------|
| FLT-03 (#58) | bookFlight() never called before ticketFlight() | P0 | OPEN |
| FLT-04 (#59) | Only 1 passenger generated regardless of count | P0 | OPEN |
| FLT-05 (#60) | No multi-leg selection state | P0 | OPEN |
| FLT-06 (#61) | Multi-city wrong JourneyType | HIGH | OPEN |
| FLT-07 (#62) | Price change silently ignored | MEDIUM | OPEN |
| FLT-08 (#63) | SSR endpoint wrong + hardcoded traceId | MEDIUM | OPEN |

**Note:** Session 36 partially fixed some of these (TraceId lifecycle, LCC detection). Verify actual status against current codebase.

---

### EPIC 12: Payment Gateway (Zaakpay) Production Readiness

**Description:** Zaakpay integration is code-complete but blocked on sandbox credentials. Needs E2E testing, webhook hardening, and production credentials.

| Issue | Title | Priority | Status |
|-------|-------|----------|--------|
| PAY-08 (#111) | Zaakpay sandbox credentials missing | P0 | BLOCKED |
| PAY-06 (#112) | Cancellation bypasses refund API | HIGH | OPEN |
| ZAK-02 | Webhook hardening (idempotency, retry) | HIGH | OPEN |

---

### EPIC 13: Mock Code Cleanup

**Description:** 5 mock code instances remain in production code paths. These should be removed or gated behind environment checks.

| Issue | Title | Priority | Status |
|-------|-------|----------|--------|
| MOCK-EPIC (#92) | 5 mock code instances remain | MEDIUM | OPEN |

**Acceptance Criteria:**
- [ ] Audit all mock code paths in tbo-hotel-mock.ts, tbo-flight-mock.ts
- [ ] Ensure `forceMock` flag is only true in DEV/STAGING
- [ ] Remove mock fallbacks from PROD code paths
- [ ] Add preflight check for mock code in production

---

### EPIC 14: QA & Testing Infrastructure

**Description:** No E2E tests exist. Core booking flows are untested automatically.

| Issue | Title | Priority | Status |
|-------|-------|----------|--------|
| QA-01 (#26) | E2E Playwright tests for booking flows | HIGH | OPEN |
| QA-02 (#27) | Performance audit | MEDIUM | OPEN |

---

### EPIC 15: Infrastructure & Monitoring

**Description:** No error monitoring, no custom domain, no alerting.

| Issue | Title | Priority | Status |
|-------|-------|----------|--------|
| INFRA-02 (#19) | Error monitoring (Sentry/Vercel) | MEDIUM | OPEN |
| INFRA-03 (#20) | Custom domain (DNS) | LOW | EXTERNAL |

---

### EPIC 16: Invoice System Completion

**Description:** Invoice PDF/cron/email done. Admin features and partial payments remain.

| Issue | Title | Priority | Status |
|-------|-------|----------|--------|
| INV-05 (#165) | Admin invoice edit modal | MEDIUM | OPEN |
| INV-06 (#166) | Partial payment support | MEDIUM | OPEN |
| INV-07 (#167) | Non-corporate invoices | MEDIUM | OPEN |
| INV-09 (#169) | Booking type filter | LOW | OPEN |
| INV-10 (#170) | Column sorting + search | LOW | OPEN |

---

### EPIC 17: Search UX Enhancements (Post-Certification)

**Description:** 3 SEARCH-UX EPICs (#297, #298, #299) with research complete, implementation pending. Implement after TBO certification is complete.

| Issue | Title | Priority | Status |
|-------|-------|----------|--------|
| SEARCH-UX-EPIC-1 (#297) | Cold Start & Loading States | P0 | IMPLEMENTED (Session 42) |
| SEARCH-UX-EPIC-2 (#298) | Domestic/International Separation | P0 | IMPLEMENTED (Session 42) |
| SEARCH-UX-EPIC-3 (#299) | Display Clutter Reduction | P0 | IMPLEMENTED (Session 42) |

**Note:** All 3 were implemented in Session 42. Verify against GitHub and close if done.

---

## 7. Priority Matrix

### P0 — Must Complete Before TBO Certification Submission

| Epic | Title | Effort | Why |
|------|-------|--------|-----|
| EPIC 7 (LOG-01 to LOG-06) | API Logger Enhancement | 16h | Certification logs must capture all TBO fields |
| EPIC 8 (SANDBOX-01 to 03) | TBO Sandbox Recovery | 5h | Can't re-run certification cases if sandbox returns 201 |
| EPIC 9 (PARITY-01 to 03) | CCKR2 Production Parity | 4h | PROD must work for live certification |

### P1 — Must Complete Before Go-Live

| Epic | Title | Effort | Why |
|------|-------|--------|-----|
| EPIC 10 (EMAIL-01 to 04) | Brevo Email Recovery | 8.5h | Transactional emails required for booking confirmations |
| EPIC 11 | Flight Booking Pipeline | 8h | Core flight booking broken |
| EPIC 12 | Zaakpay Production | 4h | Payment gateway needed for revenue |
| EPIC 13 | Mock Code Cleanup | 2h | Mocks in production = false data |

### P2 — Post-Launch

| Epic | Title | Effort | Why |
|------|-------|--------|-----|
| EPIC 14 | QA & Testing | 16h | Quality assurance |
| EPIC 15 | Infrastructure | 4h | Monitoring, custom domain |
| EPIC 16 | Invoice Completion | 8h | Admin features |

---

## 8. Recommended Execution Order

```
Phase 1: Unblocks (Parallel)
├── EPIC 8: Sandbox Recovery (SANDBOX-01, 03) ──── 3h
├── EPIC 9: CCKR2 Parity (PARITY-01, 02) ─────── 3h
└── EPIC 7: Logger Schema (LOG-01) ────────────── 2h

Phase 2: Logger Build (Sequential)
├── EPIC 7: Field Extraction (LOG-02, 06) ──────── 5h
├── EPIC 7: Truncation Fix (LOG-03) ───────────── 1h
├── EPIC 7: Case Tagging UI (LOG-04) ──────────── 4h
└── EPIC 7: Export Feature (LOG-05) ────────────── 4h

Phase 3: Production Readiness (Parallel)
├── EPIC 9: Deploy to PROD (PARITY-03, 04) ─────── 2h
├── EPIC 10: Brevo Email (EMAIL-01, 02, 04) ────── 5h
└── EPIC 8: Fallback Handling (SANDBOX-02, 04) ── 3h

Phase 4: Pre-Launch (Parallel)
├── EPIC 11: Flight Fixes (FLT-03 to FLT-08) ──── 8h
├── EPIC 12: Zaakpay (PAY-08, PAY-06) ─────────── 4h
└── EPIC 13: Mock Cleanup ──────────────────────── 2h
```

**Total estimated effort:** ~55h
**Critical path to certification:** Phase 1 + Phase 2 = ~20h

---

## 9. Existing Issues NOT Duplicated

The following GitHub issues are already tracked and NOT re-created here:

| Issue | Title | Epic |
|-------|-------|------|
| #297 | SEARCH-UX-EPIC-1: Cold Start & Loading States | SEARCH-UX |
| #298 | SEARCH-UX-EPIC-2: Domestic/International Separation | SEARCH-UX |
| #299 | SEARCH-UX-EPIC-3: Display Clutter Reduction | SEARCH-UX |
| #289 | TBO-CERT-UX: Certification UX gaps | TBO-CERT |
| #290 | PRICING-FIX: Multi-room pricing | PRICING |
| #291 | COMPAT-FIX: Opera/Vivaldi compatibility | COMPAT |
| #240 | TBO-ARCH-03: Retry logic | TBO-ARCH |
| #215 | UX-A11Y-01: Accessibility | UX-A11Y |
| #237 | TBO-ARCH-EPIC | TBO-ARCH |
| #111 | PAY-08: Zaakpay sandbox creds | ZAAKPAY |
| #112 | PAY-06: Cancellation refund bypass | PAY |

---

## 10. Appendix: TBO Certification Checklist

### Pre-Submission Checklist

- [ ] All 8 test cases execute successfully (search → prebook → book → voucher)
- [ ] Each case's JSON logs captured with full request/response
- [ ] TokenId logged for every API call
- [ ] City codes and hotel codes captured
- [ ] Check-in/check-out dates in correct format
- [ ] Room configuration matches case spec
- [ ] Guest nationality matches case spec
- [ ] Each case exported as separate JSON file
- [ ] BookingId (confirmation number) captured for each case
- [ ] Logs are case-by-case (not bundled)

### Submission Email Template

```
Subject: Hotel Certification Cases - "GoRASA"

Dear TBO API Team,

Please find below the certification test cases for GoRASA:

Case 1: Domestic Booking (Room 1 – Adult 1) — BookingId: XXXXXX
[Attached: Case1_Domestic_1R1A.json]

Case 2: Domestic Booking (Room 1 – Adult 2, Child 2)
[Attached: Case2_Domestic_1R2A2C.json]

... (Cases 3-8)

Environment: Sandbox (affiliate.tektravels.com)
IP Address: [Vercel egress IP]
Credentials: RasaT / RasaT@123
Integration: REST/JSON via Next.js serverless functions

 Regards,
 GoRASA Team
```

### Post-Submission Monitoring

- [ ] Monitor email for TBO response (3-4 working days)
- [ ] Be ready to re-submit if any case is rejected
- [ ] Prepare validation sheet responses (Step 2)
- [ ] Ensure website is accessible for portal verification (Step 3)
- [ ] Have static public IP ready for whitelisting (Step 5)
