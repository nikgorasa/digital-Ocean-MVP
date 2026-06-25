#!/bin/bash

# GoRASA CockroachDB Standalone — API Configuration Validation
# Validates that all API endpoint configurations are correct and consistent.
# Run as part of pre-flight and post-task checks.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[API-CONFIG]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${CYAN}════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}════════════════════════════════════════════════════${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOVERNANCE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$GOVERNANCE_ROOT/.." && pwd)"

cd "$REPO_ROOT"

print_header "GoRASA API Configuration Validation"
echo ""

ERRORS=0

# ═══════════════════════════════════════════════════════
# Expected values — single source of truth
# ═══════════════════════════════════════════════════════
SEARCH_BASE="https://affiliate.tektravels.com/HotelAPI"
BOOKING_BASE="https://HotelBE.tektravels.com/hotelservice.svc/rest"
STATIC_BASE="http://api.tbotechnology.in/TBOHolidays_HotelAPI"
AGENCY_USERNAME="RasaT"
STATIC_USERNAME="TBOStaticAPITest"

# ═══════════════════════════════════════════════════════
# Check 1: Source code has correct defaults
# ═══════════════════════════════════════════════════════
print_status "CHECK 1/6: Source code default values..."

# config-service.ts — envFallback bookingUrl
if grep -q "bookingUrl.*HotelBE.tektravels.com" src/lib/config-service.ts 2>/dev/null; then
    print_status "  ✓ config-service.ts bookingUrl default is correct"
else
    print_error "  ✗ config-service.ts bookingUrl default is WRONG (expected $BOOKING_BASE)"
    ERRORS=$((ERRORS + 1))
fi

# config-service.ts — envFallback baseUrl
if grep -q "baseUrl.*affiliate.tektravels.com/HotelAPI" src/lib/config-service.ts 2>/dev/null; then
    print_status "  ✓ config-service.ts baseUrl default is correct"
else
    print_error "  ✗ config-service.ts baseUrl default is WRONG (expected $SEARCH_BASE)"
    ERRORS=$((ERRORS + 1))
fi

# tbo-hotel-api.ts — getBookingActionContext fallback
if grep -q "HotelBE.tektravels.com/hotelservice.svc/rest" src/lib/tbo-hotel-api.ts 2>/dev/null; then
    print_status "  ✓ tbo-hotel-api.ts booking endpoint fallback is correct"
else
    print_error "  ✗ tbo-hotel-api.ts booking endpoint fallback is WRONG"
    ERRORS=$((ERRORS + 1))
fi

# tbo-hotel-api.ts — getSearchContext fallback
if grep -q "affiliate.tektravels.com/HotelAPI" src/lib/tbo-hotel-api.ts 2>/dev/null; then
    print_status "  ✓ tbo-hotel-api.ts search endpoint fallback is correct"
else
    print_error "  ✗ tbo-hotel-api.ts search endpoint fallback is WRONG"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 2: Admin config page has correct defaults
# ═══════════════════════════════════════════════════════
print_status "CHECK 2/6: Admin config UI default values..."

if grep -q "HotelBE.tektravels.com/hotelservice.svc/rest" src/app/admin/config/page.tsx 2>/dev/null; then
    print_status "  ✓ Admin config page bookingUrl default is correct"
else
    print_error "  ✗ Admin config page bookingUrl default is WRONG (expected $BOOKING_BASE)"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 3: Seed config has correct values
# ═══════════════════════════════════════════════════════
print_status "CHECK 3/6: Seed config values..."

TBO_HOTEL_BOOKING_SEED=$(grep -c "bookingUrl: 'https://HotelBE.tektravels.com/hotelservice.svc/rest'" scripts/seed-config.ts 2>/dev/null || echo "0")
if [[ "$TBO_HOTEL_BOOKING_SEED" -ge 2 ]]; then
    print_status "  ✓ seed-config.ts tbo_hotel bookingUrl is correct"
else
    print_error "  ✗ seed-config.ts tbo_hotel bookingUrl is WRONG (expected $BOOKING_BASE)"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 4: No wrong affiliate references in bookingUrl context
# ═══════════════════════════════════════════════════════
print_status "CHECK 4/6: No stray wrong bookingUrl references..."

WRONG_REFS=$(grep -rn "bookingUrl.*affiliate" scripts/ src/ 2>/dev/null || true)
if [[ -z "$WRONG_REFS" ]]; then
    print_status "  ✓ No wrong bookingUrl references found"
else
    print_warning "  ⚠ Possible wrong bookingUrl references:"
    echo "$WRONG_REFS" | while read -r line; do
        print_warning "    $line"
    done
fi

# ═══════════════════════════════════════════════════════
# Check 5: Endpoint routing in tbo-hotel-api.ts matches documented flow
# ═══════════════════════════════════════════════════════
print_status "CHECK 5/6: Endpoint routing correctness..."

# Search → getSearchContext → affiliate
SEARCH_CTX=$(grep -A3 "export async function searchHotels" src/lib/tbo-hotel-api.ts | grep -c "getSearchContext" 2>/dev/null || echo "0")
if [[ "$SEARCH_CTX" -ge 1 ]]; then
    print_status "  ✓ searchHotels() uses search context (affiliate)"
else
    print_error "  ✗ searchHotels() may use wrong context"
    ERRORS=$((ERRORS + 1))
fi

# preBook → getSearchContext → affiliate
PREBOOK_CTX=$(grep -A3 "export async function preBook" src/lib/tbo-hotel-api.ts | grep -c "getSearchContext" 2>/dev/null || echo "0")
if [[ "$PREBOOK_CTX" -ge 1 ]]; then
    print_status "  ✓ preBook() uses search context (affiliate)"
else
    print_error "  ✗ preBook() may use wrong context"
    ERRORS=$((ERRORS + 1))
fi

# bookHotel → getBookingActionContext → HotelBE
BOOK_CTX=$(grep -A3 "export async function bookHotel" src/lib/tbo-hotel-api.ts | grep -c "getBookingActionContext" 2>/dev/null || echo "0")
if [[ "$BOOK_CTX" -ge 1 ]]; then
    print_status "  ✓ bookHotel() uses booking context (HotelBE)"
else
    print_error "  ✗ bookHotel() may use wrong context"
    ERRORS=$((ERRORS + 1))
fi

# generateVoucher → getBookingActionContext → HotelBE
VOUCHER_CTX=$(grep -A3 "export async function generateVoucher" src/lib/tbo-hotel-api.ts | grep -c "getBookingActionContext" 2>/dev/null || echo "0")
if [[ "$VOUCHER_CTX" -ge 1 ]]; then
    print_status "  ✓ generateVoucher() uses booking context (HotelBE)"
else
    print_error "  ✗ generateVoucher() may use wrong context"
    ERRORS=$((ERRORS + 1))
fi

# getBookingDetail → getBookingActionContext → HotelBE
DETAIL_CTX=$(grep -A3 "export async function getBookingDetail" src/lib/tbo-hotel-api.ts | grep -c "getBookingActionContext" 2>/dev/null || echo "0")
if [[ "$DETAIL_CTX" -ge 1 ]]; then
    print_status "  ✓ getBookingDetail() uses booking context (HotelBE)"
else
    print_error "  ✗ getBookingDetail() may use wrong context"
    ERRORS=$((ERRORS + 1))
fi

# sendChangeRequest → getBookingActionContext → HotelBE
CHANGE_CTX=$(grep -A3 "export async function sendChangeRequest" src/lib/tbo-hotel-api.ts | grep -c "getBookingActionContext" 2>/dev/null || echo "0")
if [[ "$CHANGE_CTX" -ge 1 ]]; then
    print_status "  ✓ sendChangeRequest() uses booking context (HotelBE)"
else
    print_error "  ✗ sendChangeRequest() may use wrong context"
    ERRORS=$((ERRORS + 1))
fi

# getChangeRequestStatus → getBookingActionContext → HotelBE
CHANGE_STATUS_CTX=$(grep -A3 "export async function getChangeRequestStatus" src/lib/tbo-hotel-api.ts | grep -c "getBookingActionContext" 2>/dev/null || echo "0")
if [[ "$CHANGE_STATUS_CTX" -ge 1 ]]; then
    print_status "  ✓ getChangeRequestStatus() uses booking context (HotelBE)"
else
    print_error "  ✗ getChangeRequestStatus() may use wrong context"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 6: ConfigProvider fields documented in static data reference
# ═══════════════════════════════════════════════════════
print_status "CHECK 6/6: ConfigProvider documentation..."

if grep -q "ConfigProvider Settings" Governance/docs/static-data/TBO-STATIC-DATA-REFERENCE.md 2>/dev/null; then
    print_status "  ✓ ConfigProvider Settings section exists in TBO-STATIC-DATA-REFERENCE.md"
else
    print_warning "  ⚠ ConfigProvider Settings section missing from TBO-STATIC-DATA-REFERENCE.md"
fi

# ═══════════════════════════════════════════════════════
# FINAL RESULT
# ═══════════════════════════════════════════════════════
echo ""
print_header "API CONFIG VALIDATION RESULT"

if [[ "$ERRORS" -gt 0 ]]; then
    print_error "FAILED — $ERRORS check(s) failed"
    print_error "Fix all API config errors before proceeding"
    exit 1
else
    print_status "✓ ALL 6 CHECKS PASSED"
    print_status "✓ API endpoint configurations are valid"
    print_status ""
    print_status "Dual Endpoint Architecture:"
    print_status "  Search/PreBook  → $SEARCH_BASE"
    print_status "  Book/Voucher/etc → $BOOKING_BASE"
    print_status "  Static Data     → $STATIC_BASE"
    exit 0
fi
