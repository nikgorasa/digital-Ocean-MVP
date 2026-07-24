# GoRASA CockroachDB Standalone — Learning From Mistakes

> **Purpose:** Issue deep-dives for problems that took >30 minutes to debug.
> **Format:** `Issue # | Date | Duration | Severity | Symptoms | Root Cause | Resolution | Prevention`
> **Updated:** After every significant debugging session.

---

## Issues

### Issue 001 — Stale Supabase Code Left After "Cleanup"

- **Date:** 2026-06-19
- **Duration:** ~2 hours
- **Severity:** High
- **Symptoms:** 17 TypeScript errors after session 2026-06-18 claimed Supabase was fully removed. Files `supabase.ts`, `supabase-server.ts`, `supabase-admin.ts` still existed. 10+ API routes still had `if (isPrisma())` dual-mode branches importing `supabaseAdmin`.
- **Root Cause:** Session 2026-06-18 deleted some files but did not verify completeness. Dual-mode pattern was left in all `src/lib/db/*.ts` files and 10 API routes.
- **Resolution:** Complete rewrite of all 13 db files, 10 API routes, api-logger.ts. Deleted all stale files and scripts. Full `grep` verification after.
- **Prevention:** Always run `grep -rn "@supabase\|supabaseAdmin\|isPrisma" src/` after any cleanup. Never mark work complete without verification.

### Issue 002 — Agent Hallucinated Neon/Supabase MCP Access for CockroachDB

- **Date:** 2026-06-26
- **Duration:** ~15 min
- **Severity:** Medium
- **Symptoms:** Agent called `general` and `gorasa-governance` subagents expecting them to use Neon/Supabase MCP tools to retrieve CockroachDB DATABASE_URL. Neon and Supabase were fully purged from the project in Session 4.
- **Root Cause:** The agent's available tools listed Neon and Supabase MCPs (configured at user-level). The agent bypassed reading governance docs first and assumed these MCPs could access CockroachDB clusters. The `gorasa-governance` agent description also failed to mention it cannot access external MCPs.
- **Resolution:** User clarified that credentials are in `secrets.file` and Vercel env vars. Stopped calling subagents and read docs directly.
- **Prevention:** (1) Never call any MCP-based subagent expecting it to retrieve credentials — credentials come from `secrets.file`, Vercel env vars, or CockroachDB Cloud console. (2) Always read AGENTS.md and session log before taking action. (3) The gorasa-governance agent must mention in its description that it cannot fetch credentials — it only validates governance rules.

### Issue 003 — Hardcoded Governance Script Paths

- **Date:** 2026-06-19
- **Duration:** ~30 min
- **Severity:** Medium
- **Symptoms:** `scripts/preflight-check.sh` failed with `governance-lib.sh: No such file or directory`. `Governance/scripts/detect-governance-root.sh` had hardcoded path to `/home/nikhil/Downloads/Gorasa/App-1/rasa-zero-app-main`.
- **Root Cause:** Scripts were copied from the main pipeline repo without updating paths for the standalone repo structure.
- **Resolution:** Rewrote all governance scripts to use relative path resolution from `$SCRIPT_DIR`.
- **Prevention:** Never hardcode absolute paths. Always use `$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)` for script directory resolution.

### Issue 004 — Middleware Whitelist: API Routes Return 401 When Missing from PUBLIC_API_ROUTES

- **Date:** 2026-07-09
- **Duration:** ~15 min
- **Severity:** Medium
- **Symptoms:** Hotels page calling `/api/tbo-hotels` returned 401 Unauthorized. The middleware intercepted the request and rejected it because the route was not in the `PUBLIC_API_ROUTES` whitelist. Users must search hotels before logging in, so these routes must be accessible without a session cookie.
- **Root Cause:** When `/api/tbo-hotels` and related TBO API routes were added, there was no step in the workflow to check whether new API routes need to be added to the middleware `PUBLIC_API_ROUTES` whitelist. The middleware blocks all non-whitelisted API routes that lack a valid session cookie.
- **Resolution:** Added `/api/tbo-hotels`, `/api/tbo`, and `/api/tbo-flights` to the `PUBLIC_API_ROUTES` array in `src/middleware.ts`.
- **Prevention:** Any new API route must be evaluated for middleware whitelist inclusion. Specifically, if a route must be accessible without authentication (i.e., before the user logs in), it must be added to `PUBLIC_API_ROUTES` in `src/middleware.ts`. This is now a mandatory step in the API route creation checklist.

### Issue 005 — Type Mismatch: TBOFlightDisplay.duration (number) vs Flight.duration (string) Causes Silent React Crash

- **Date:** 2026-07-09
- **Duration:** ~20 min
- **Severity:** High
- **Symptoms:** Flight search on `/flights` page returns results from API (200 OK, 111 flights), but results never render. The search spinner transitions to a blank/empty state with no error message visible. The `handleSearch` function completes without exception, but the `useMemo` for `filteredResults` crashes silently when sorting calls `parseDuration()`.
- **Root Cause:** `TBOFlightDisplay.duration` is a `number` (minutes, e.g. 135), but `Flight.duration` is typed as `string`. The mapping in `handleSearch` assigns `duration: f.duration` directly, carrying the number through. When `sortFlights("best")` calls `parseDuration(a.duration || "")`, the runtime value is a number (e.g. 135). The function calls `duration.match(...)` which throws `TypeError: duration.match is not a function` because numbers don't have `.match()`. This propagates from `useMemo` into the React render cycle, causing a component crash. Additional cascading issues: `stops` was always `0` (not derived from segments), `cabinClass` number was used as `tier` label.
- **Resolution:** Added `formatDuration(minutes)` to convert number → string ("2h 15m"). Added `CABIN_CLASS_MAP` to map numeric codes to cabin labels. Derived `stops` from `segments[0].length - 1`. Updated mapping to handle all three correctly.
- **Prevention:** When mapping API response types to frontend display types, verify that field types match EXACTLY at runtime, not just in TypeScript. Numeric fields from the API that represent display-oriented values (duration, cabin class codes) must be converted to their display format in the mapping layer. Non-null assertions and `||` fallbacks mask type mismatches but don't prevent runtime crashes from method calls on wrong types. Always validate that any function expecting a string method (`.match()`, `.split()`, `.slice()`) will actually receive a string at runtime.

### Issue 006 — Return Flight Search: JourneyType=2/3 Requires Matching Segment Count

- **Date:** 2026-07-09 (updated 2026-07-10)
- **Duration:** ~30 min total
- **Severity:** High
- **Symptoms:** One-way flight search works. Return flight search fails with "Flight search failed: Invalid segment length." Multi-city search also would have failed with same error. The TBO API returns `ResponseStatus !== 1` with `ErrorMessage: "Invalid segment length"`.
- **Root Cause:** The TBO flight search API validates that the `Segments` array length must match `JourneyType`. For `JourneyType=2` (Return), exactly 2 segments are required — one for outbound (Origin→Destination) and one for inbound (Destination→Origin). For `JourneyType=3` (Multi-city/Circle), N segments are required for N legs. The code always built a single segment regardless of `JourneyType`. The route handler also never forwarded the `returnDate` parameter from the frontend to `searchFlights()`, and multi-city dates were not passed.
- **Resolution:** Added `PreferredArrivalTime` param to `searchFlights` mapped from frontend `returnDate`. For `JourneyType === 2` with a `PreferredArrivalTime`, pushes a second segment with reversed origin/destination and the return date as `PreferredDepartureTime`. Added `multiCityDates` param for JourneyType=3 — builds N alternating segments for N legs. Flattened both outbound/inbound result arrays with `.flat()` so inbound flights aren't discarded.
- **Prevention:** Any `JourneyType` value change must ensure `Segments` array length matches. Add a parameter validation check that asserts `Segments.length === JourneyType` (with special handling for JourneyType 5). Whenever the API `tripType` or `JourneyType` changes, verify the segment-building logic produces the correct number of segments. The TBO API contract for Search requires exactly N segments where N = JourneyType (1 for one-way, 2 for return, 3+ for multi-city).

### Issue 007 — Hotel Pricing: Double-Markup and Screen Mismatch

- **Date:** 2026-07-22
- **Duration:** ~3 hours (4 iterations)
- **Severity:** Critical
- **Symptoms:** Room card showed ₹2,176 total, booking modal showed ₹2,284 total. Taxes & Fees showed ₹108 (raw TBO tax) but should have been ₹215 (tax + markup). Room Fare + Taxes & Fees ≠ Total on multiple screens. Different screens showed different prices for the same room.
- **Root Cause:** Modal used `room.totalFare + room.roomTax` (raw TBO = ₹2,176) instead of `hotel.price` (marked-up = ₹2,284). The markup from the pricing table was applied in `tbo-hotel-client.ts` by `calculatePrice()` to produce `hotel.price`, but the modal ignored it and used raw room values.
- **Failed Fix 1:** Added `calculatePrice()` call in modal useEffect — caused DOUBLE-markup because `calculatePrice()` was already called once in TBO client. Modal applied markup on top of already-marked-up price (₹37,407 vs ₹32,176).
- **Failed Fix 2:** Used `markupRatio = hotel.price / rawTotal` — ratio was derived from cheapest room's total, applied incorrectly to a different selected room.
- **Failed Fix 3:** Showed raw TBO values throughout — room card showed ₹2,176 but modal total was ₹2,284. Screens didn't match.
- **Correct Fix:** Use `hotel.price` directly as source of truth. `hotel.price` already includes markup from pricing table. Formula:
  ```
  Room Fare    = room.roomFare (raw TBO, never changes)
  Taxes & Fees = hotel.price - roomFare (TBO tax + markup combined)
  Total        = hotel.price
  ```
  User does NOT see markup as separate line. Markup is hidden inside "Taxes & Fees".
- **Prevention:**
  1. NEVER call `calculatePrice()` in a UI component — it's already called in the TBO client. Use `hotel.price` directly.
  2. The pricing table markup is baked into `hotel.price` at search time. Don't recalculate it at display time.
  3. When a value is computed upstream (TBO client), pass it through — don't recompute it downstream (component).
  4. Always verify that Room Fare + Taxes & Fees = Total on ALL screens before shipping.
  5. Use concrete numbers to verify formulas: ₹2,069 + ₹215 = ₹2,284 ✓

### Issue 008 — TBO Price Re-Validation Broke Checkout Flow

- **Date:** 2026-07-23
- **Duration:** ~1 hour
- **Severity:** Critical
- **Symptoms:** All bookings (both hotel and flight) failed at checkout with "Something went wrong" error. The checkout route was completely broken.
- **Root Cause:** Added `getFareQuote` and `preBook` imports to `src/app/api/checkout/route.ts` for price re-validation before charging. The imports themselves caused runtime issues — TBO client modules have side effects (env var reads, connection setup) that fail when imported in the checkout context.
- **Resolution:** Removed the TBO imports and price re-validation logic entirely from the checkout route.
- **Prevention:**
  1. NEVER add TBO API calls to critical paths (checkout) without thorough end-to-end testing.
  2. The checkout route must remain lightweight — verify booking exists, verify company has funds, deduct wallet, create invoice. No external API calls.
  3. If price re-validation is needed, do it in the booking modal BEFORE the user clicks "Confirm", not in the checkout route.
  4. Always test the full booking flow (search → book → checkout → confirmation) after modifying the checkout route.

### Issue 009 — supplierBookingRef Type Mismatch (TBO Returns Number, Zod Expects String)

- **Date:** 2026-07-23
- **Duration:** ~30 min
- **Severity:** High
- **Symptoms:** Flight bookings were saved to DB without `supplierBookingRef`. At checkout, the validation `if (!booking.supplierBookingRef)` failed, showing "booking was not confirmed with supplier" error. The TBO Book API succeeded (returned BookingId), but the value wasn't persisted.
- **Root Cause:** TBO returns `bookingId` as a `number` (e.g., `2165345`), but the Zod schema for the bookings API expects `supplierBookingRef` as a `string`. When Zod received a number for a string field, it rejected the parse silently, and the field was omitted from the saved booking.
- **Resolution:** Added `String(bookData.bookingId)` conversion before passing to the bookings API.
- **Prevention:**
  1. ALWAYS verify API response types match TypeScript/Zod types at runtime, not just in type definitions.
  2. TBO API returns numbers for all IDs (BookingId, HotelCode, etc.). Always convert to string with `String()` before passing to Zod schemas.
  3. Add a type-checking utility or Zod transform that coerces numbers to strings automatically.
  4. When mapping TBO response fields, explicitly document the type conversion: `supplierBookingRef: String(bookData.bookingId) // TBO returns number`.

### Issue 010 — Unnecessary Voucher Generation Step

- **Date:** 2026-07-23
- **Duration:** ~20 min
- **Severity:** Medium
- **Symptoms:** After every hotel booking, the UI showed "Voucher Failed" message to users. The `generateVoucher` API call always failed in the TBO test environment with "Booking under cancellation can only be vouchered".
- **Root Cause:** Added automatic `generateVoucher` call after every hotel booking as a mandatory step. Didn't understand that (a) voucher generation is optional in TBO's flow, and (b) the test environment automatically cancels bookings after a short period, making voucher generation impossible.
- **Resolution:** Removed automatic voucher call after booking. Kept the manual "Generate Voucher" button with a friendly message explaining test environment limitations.
- **Prevention:**
  1. Don't add mandatory post-booking steps that depend on external API behavior.
  2. Voucher generation is optional — `IsVoucherBooking: true` in the Book request already handles the voucher in production.
  3. Test environment limitations should be documented, not worked around with mandatory calls.
  4. If a step always fails in test env, it should be manual (button), not automatic.

### Issue 011 — active:scale CSS Breaking Click Targets in Vivaldi/Opera

- **Date:** 2026-07-23
- **Duration:** ~15 min
- **Severity:** Medium
- **Symptoms:** "Book Now" button was not clickable in Vivaldi/Opera browsers on Linux. The button appeared visually but clicking had no effect.
- **Root Cause:** Added `active:scale-[0.98]` Tailwind class to booking buttons. Combined with `motion/react` transforms (`whileHover`, `whileTap`), the `active:scale` CSS caused the click target to shift during the active state, making the button unclickable in certain browsers.
- **Resolution:** Removed `active:scale-[0.98]` from all booking buttons (HotelBookingModal and FlightBookingModal).
- **Prevention:**
  1. Test interactive elements on multiple browsers (Chrome, Firefox, Safari, Vivaldi, Opera) before deploying.
  2. Don't combine CSS `active:scale` with `motion/react` `whileTap` transforms — they conflict.
  3. Use only one animation system per element: either Tailwind CSS transitions OR motion/react animations, not both.
  4. If using motion/react for hover/tap, remove all CSS `active:`, `hover:`, `transition:` classes from the same element.

### Issue 012 — No Retry Logic for External API Calls

- **Date:** 2026-07-23
- **Duration:** ~10 min
- **Severity:** Medium
- **Symptoms:** Transient TBO API failures (network timeouts, 500 errors) caused entire booking flows to fail completely. Users had to restart from search.
- **Root Cause:** All TBO API calls were single-attempt with no retry logic. External APIs are inherently unreliable — network issues, rate limits, and temporary outages are expected.
- **Resolution:** Created `src/lib/fetch-with-retry.ts` utility with exponential backoff (3 retries, 1s/2s/4s delays). Applied to critical TBO endpoints: Book, Ticket, GenerateVoucher.
- **Prevention:**
  1. ALL external API calls should have retry logic with exponential backoff.
  2. Critical paths (booking, payment) need 3 retries with increasing delays.
  3. Non-critical paths (search, static data) can have 1-2 retries.
  4. Never retry on 4xx errors (client errors) — only retry on 5xx (server) and network errors.
  5. Log each retry attempt for debugging.

### Issue 013 — Flight Price Multiplied by Passenger Count

- **Date:** 2026-07-24
- **Duration:** ~20 min
- **Severity:** High
- **Symptoms:** Flight prices displayed 4x too high for family searches (4 passengers). ₹10,100 flight showed as ₹40,400.
- **Root Cause:** `PublishedFare` from TBO is the TOTAL fare for all passengers combined. Code multiplied by `totalPassengers` in 4 locations in flights/page.tsx, treating it as per-pax fare.
- **Resolution:** Removed `* totalPassengers` from all 4 locations. `PublishedFare` used directly as total.
- **Prevention:**
  1. TBO `PublishedFare` is ALWAYS the total for all passengers — never multiply by passenger count.
  2. When displaying per-pax fare, DIVIDE by passenger count: `perPax = PublishedFare / totalPassengers`.
  3. Verify pricing with single-pax AND multi-pax searches before shipping.

### Issue 014 — Hotel Search Field Name Mismatch

- **Date:** 2026-07-24
- **Duration:** ~15 min
- **Severity:** Medium
- **Symptoms:** Hotel search with children returned errors or wrong results. TBO API rejected the request.
- **Root Cause:** Code sent `AdultCount` and `ChildCount` as field names, but TBO API expects `Adults` and `Children`. Field names were assumed, not verified against TBO documentation.
- **Resolution:** Changed field names in hotels/page.tsx from `AdultCount`→`Adults`, `ChildCount`→`Children`.
- **Prevention:**
  1. Always verify TBO API field names against the official documentation.
  2. TBO uses `Adults`, `Children`, `Rooms` — not `AdultCount`, `ChildCount`, `RoomCount`.
  3. Add a type definition that maps exactly to TBO's request schema.

### Issue 015 — Hotel Room Fare Not Per-Night When dayRates Empty

- **Date:** 2026-07-24
- **Duration:** ~30 min
- **Severity:** High
- **Symptoms:** Hotel room prices showed total stay price as per-night price. A 3-night ₹6,000 stay showed as ₹6,000/night instead of ₹2,000/night.
- **Root Cause:** When TBO returns empty `dayRates` array, `roomFare` was set to `totalFare` directly without dividing by number of nights. The `dayRates` array normally contains per-night breakdowns, but when empty, the total must be divided.
- **Resolution:** When `dayRates` is empty: `roomFare = totalFare / nights`, `roomTax = totalTax / nights`. Always per-night.
- **Prevention:**
  1. Room fare must ALWAYS be per-night, regardless of whether `dayRates` is present.
  2. When `dayRates` is empty, divide totalFare by nights count.
  3. Verify: `roomFare * nights + totalTax ≈ totalFare` (within rounding).

### Issue 016 — Hotel Booking Modal Double-Counted Tax

- **Date:** 2026-07-24
- **Duration:** ~20 min
- **Severity:** High
- **Symptoms:** Hotel booking modal showed inflated price breakup. "Room Fare + Taxes & Fees" exceeded the actual total payable. Users saw incorrect price components.
- **Root Cause:** TBO's `TotalFare` already includes tax. But the modal code treated `room.roomFare` (derived from `TotalFare / nights`) as pre-tax fare, then added `room.roomTax` (from `TotalTax / nights`) on top. This double-counted the tax component. The search result card (`hotel.price`) was correct, but the modal's detailed breakup was wrong.
- **Resolution:** Changed modal to use `room.totalFare / nights` as the per-room-per-night ground truth. Simplified display to show "Room (N nights)" total without separate fare/tax breakdown (since TBO doesn't cleanly separate them). Service fee (markup) shown separately.
- **Prevention:**
  1. TBO `TotalFare` is ALWAYS inclusive of tax — never treat it as pre-tax.
  2. When displaying price breakup, use `room.totalFare` directly, not `roomFare + roomTax`.
  3. If a breakdown is needed, derive it as `totalFare - TotalTax` (fare) and `TotalTax` (tax) — never sum per-night derived values.
  4. Verify: modal total == search result card total == `hotel.price`.
