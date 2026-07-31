#!/bin/bash

# GoRASA Context-Aware Governance Check
# Unified script that runs the right checks for the right task type.
#
# Usage:
#   bash Governance/scripts/Cckr-governance-check.sh --task TYPE --phase PHASE
#
# Task types: css, ui, api_new, api_modify, tbo, schema, db_seed, flight_ui,
#             hotel_ui, config, middleware, email, payment, governance, deploy, all
#
# Phase: preflight (before work), post-task (after work), all (both)
#
# Flags:
#   --task TYPE     Task type (default: all — runs all checks, backward compatible)
#   --phase PHASE   preflight, post-task, or all (default: preflight)
#   --quick         Run only gating checks (skip informational)
#   --help          Show this help

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[GOV]${NC} $1"; }
print_warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error()  { echo -e "${RED}[FAIL]${NC} $1"; }
print_header() { echo -e "${CYAN}════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}════════════════════════════════════════════════════${NC}"; }
print_check()  { echo -e "${MAGENTA}[$1]${NC} $2"; }
print_pass()   { echo -e "  ${GREEN}✓${NC} $1"; }
print_fail()   { echo -e "  ${RED}✗${NC} $1"; }
print_skip()   { echo -e "  ${CYAN}○${NC} $1 (skipped — not needed for this task)"; }

# ─── Resolve paths ───────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOVERNANCE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$GOVERNANCE_ROOT/.." && pwd)"
DOCS_DIR="$GOVERNANCE_ROOT/docs/governance"

cd "$REPO_ROOT"

# ─── Parse arguments ─────────────────────────────────
TASK_TYPE="all"
PHASE="preflight"
QUICK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --task)   TASK_TYPE="$2"; shift 2 ;;
        --phase)  PHASE="$2"; shift 2 ;;
        --quick)  QUICK=true; shift ;;
        --help|-h)
            echo "Usage: bash Governance/scripts/Cckr-governance-check.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --task TYPE     Task type (default: all)"
            echo "                  Types: css, ui, api_new, api_modify, tbo, schema, db_seed,"
            echo "                         flight_ui, hotel_ui, config, middleware, email,"
            echo "                         payment, governance, deploy, all"
            echo "  --phase PHASE   preflight (before work), post-task (after work), all (default: preflight)"
            echo "  --quick         Run only gating checks (skip informational)"
            echo "  --help          Show this help"
            echo ""
            echo "Examples:"
            echo "  bash scripts/preflight-check.sh --task css          # CSS fix — 3 checks"
            echo "  bash scripts/preflight-check.sh --task tbo          # TBO work — 8 checks"
            echo "  bash scripts/preflight-check.sh --task api_new      # New API route — 7 checks"
            echo "  bash scripts/preflight-check.sh                     # All checks (backward compat)"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Validate task type
VALID_TASKS="css ui api_new api_modify tbo schema db_seed flight_ui hotel_ui config middleware email payment governance deploy all"
if ! echo "$VALID_TASKS" | grep -qw "$TASK_TYPE"; then
    print_error "Invalid task type: $TASK_TYPE"
    print_error "Valid types: $VALID_TASKS"
    exit 1
fi

# Validate phase
if [[ "$PHASE" != "preflight" && "$PHASE" != "post-task" && "$PHASE" != "all" ]]; then
    print_error "Invalid phase: $PHASE (must be preflight, post-task, or all)"
    exit 1
fi

# ─── Task-to-check mapping ───────────────────────────
should_run() {
    local check_name="$1"
    case "$TASK_TYPE" in
        all)
            return 0
            ;;
        css|ui)
            case "$check_name" in
                typescript|stale_imports|env_vars) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        api_new)
            case "$check_name" in
                typescript|stale_imports|env_vars|docs_exist|middleware_whitelist) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        api_modify)
            case "$check_name" in
                typescript|stale_imports|env_vars|docs_exist|api_config) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        tbo)
            case "$check_name" in
                typescript|stale_imports|env_vars|docs_exist|dual_db|api_config|tbo_endpoint_routing) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        schema)
            case "$check_name" in
                typescript|stale_imports|env_vars|docs_exist|prisma_provider|dual_db|schema_cluster_reminder) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        db_seed)
            case "$check_name" in
                typescript|stale_imports|env_vars|docs_exist|prisma_provider|dual_db|airport_count) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        flight_ui)
            case "$check_name" in
                typescript|stale_imports|env_vars|city_mode_flight|airport_count) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        hotel_ui)
            case "$check_name" in
                typescript|stale_imports|env_vars|city_mode_hotel) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        config)
            case "$check_name" in
                typescript|stale_imports|env_vars|docs_exist|api_config|config_sync) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        middleware)
            case "$check_name" in
                typescript|stale_imports|env_vars|middleware_whitelist) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        email)
            case "$check_name" in
                typescript|stale_imports|env_vars|currency_check) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        payment)
            case "$check_name" in
                typescript|stale_imports|env_vars|docs_exist|webhook_check) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        governance)
            case "$check_name" in
                docs_exist) return 0 ;;
                *) return 1 ;;
            esac
            ;;
        deploy)
            case "$check_name" in
                typescript|stale_imports|env_vars|docs_exist|git_status|git_email|vercel_json|dual_db|build) return 0 ;;
                *) return 1 ;;
            esac
            ;;
    esac
    return 1
}

# ─── Check execution ─────────────────────────────────
ERRORS=0
CHECKS_RUN=0
CHECKS_SKIPPED=0

run_check() {
    local name="$1"
    local label="$2"
    local is_gating="$3"  # "gate" or "info"
    shift 3

    if ! should_run "$name"; then
        if [[ "$QUICK" == false ]]; then
            print_skip "$label"
        fi
        CHECKS_SKIPPED=$((CHECKS_SKIPPED + 1))
        return 0
    fi

    if [[ "$QUICK" == true && "$is_gating" == "info" ]]; then
        CHECKS_SKIPPED=$((CHECKS_SKIPPED + 1))
        return 0
    fi

    CHECKS_RUN=$((CHECKS_RUN + 1))
    print_check "$label" "Running..."

    "$@"
    return $?
}

# ═══════════════════════════════════════════════════════
# CHECK FUNCTIONS
# ═══════════════════════════════════════════════════════

check_docs_exist() {
    local missing=0
    for doc in \
        "$DOCS_DIR/Cckr-SESSION-LOG.md" \
        "$DOCS_DIR/Cckr-CONFIG-REFERENCE.md" \
        "$DOCS_DIR/CHANGE-LOG.md" \
        "$DOCS_DIR/DB-CHANGES.md" \
        "$DOCS_DIR/VERSION.md"; do
        if [[ ! -f "$doc" ]]; then
            print_fail "$(basename "$doc") MISSING"
            missing=$((missing + 1))
        fi
    done
    if [[ $missing -eq 0 ]]; then
        print_pass "All 5 governance docs present"
        return 0
    else
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_env_vars() {
    if [[ ! -f "$REPO_ROOT/.env.local" ]]; then
        print_fail ".env.local MISSING"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    print_pass ".env.local exists"

    for var in DATABASE_URL DIRECT_URL BETTER_AUTH_SECRET; do
        if ! grep -q "^${var}=" "$REPO_ROOT/.env.local" 2>/dev/null; then
            print_warn "$var not found"
        fi
    done

    if grep -q "^NEXT_PUBLIC_SUPABASE\|^SUPABASE_SERVICE" "$REPO_ROOT/.env.local" 2>/dev/null; then
        print_fail "Stale Supabase env vars found in .env.local"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    print_pass "No stale Supabase env vars"
    return 0
}

check_typescript() {
    if ! command -v npx >/dev/null 2>&1; then
        print_warn "npx not available, skipping"
        return 0
    fi
    local ts_errors
    ts_errors=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
    if [[ "$ts_errors" -eq 0 ]]; then
        print_pass "TypeScript compilation successful"
        return 0
    else
        print_fail "TypeScript FAILED ($ts_errors errors)"
        npx tsc --noEmit 2>&1 | grep "error TS" | head -5 | while read -r line; do
            print_fail "  $line"
        done
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_stale_imports() {
    local stale
    stale=$(grep -rn "@supabase/supabase-js\|@supabase/ssr\|@/lib/supabase-admin\|@/lib/supabase-server\|@/lib/supabase" src/ 2>/dev/null || true)
    if [[ -z "$stale" ]]; then
        print_pass "No stale Supabase imports"
        return 0
    else
        print_fail "Stale Supabase imports found:"
        echo "$stale" | while read -r line; do
            print_fail "  $line"
        done
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_git_status() {
    if ! git status >/dev/null 2>&1; then
        print_fail "Not a git repository"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    local branch
    branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    print_pass "Branch: $branch"

    local unstaged staged
    unstaged=$(git diff --name-only 2>/dev/null | wc -l)
    staged=$(git diff --cached --name-only 2>/dev/null | wc -l)

    [[ "$unstaged" -gt 0 ]] && print_warn "$unstaged unstaged changes"
    [[ "$staged" -gt 0 ]] && print_warn "$staged staged changes"
    return 0
}

check_git_email() {
    local git_email
    git_email=$(git config user.email 2>/dev/null || echo "")
    local blocked=("nikhil@cryptomite.win" "noreply@github.com")

    for b in "${blocked[@]}"; do
        if [[ "$git_email" == "$b" ]]; then
            print_fail "Git email '$git_email' is blocked by Vercel"
            ERRORS=$((ERRORS + 1))
            return 1
        fi
    done

    if [[ -n "$git_email" ]]; then
        print_pass "Git email: $git_email"
    else
        print_warn "No git email configured"
    fi
    return 0
}

check_prisma_provider() {
    local schema="$REPO_ROOT/prisma/schema.prisma"
    if [[ ! -f "$schema" ]]; then
        print_warn "prisma/schema.prisma not found"
        return 0
    fi
    if grep -q 'provider.*=.*"postgresql"' "$schema" 2>/dev/null; then
        print_pass "Prisma provider is postgresql"
        return 0
    elif grep -q 'provider.*=.*"cockroachdb"' "$schema" 2>/dev/null; then
        print_fail "Prisma provider is cockroachdb — must be postgresql"
        ERRORS=$((ERRORS + 1))
        return 1
    else
        print_warn "Could not determine Prisma provider"
        return 0
    fi
}

check_vercel_json() {
    local vjson="$REPO_ROOT/vercel.json"
    if [[ ! -f "$vjson" ]]; then
        print_warn "vercel.json not found"
        return 0
    fi
    if grep -q "prisma db push" "$vjson" 2>/dev/null; then
        print_fail "vercel.json contains 'prisma db push' — WILL FAIL on CockroachDB"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    print_pass "vercel.json build command is safe"
    return 0
}

check_dual_db() {
    local dev="$REPO_ROOT/.env.local"
    local prod="$REPO_ROOT/.env.production"

    if [[ ! -f "$dev" ]] || [[ ! -f "$prod" ]]; then
        print_warn "Missing .env.local or .env.production"
        return 0
    fi
    print_pass "Both .env.local and .env.production exist"

    local dev_val prod_val
    dev_val=$(grep "^DATABASE_URL=" "$dev" | cut -d= -f2-)
    prod_val=$(grep "^DATABASE_URL=" "$prod" | cut -d= -f2-)

    if [[ -z "$dev_val" ]] || [[ -z "$prod_val" ]]; then
        print_warn "DATABASE_URL is empty in one or both env files"
        return 0
    fi

    local dev_hash prod_hash
    dev_hash=$(echo "$dev_val" | sha256sum | cut -d' ' -f1)
    prod_hash=$(echo "$prod_val" | sha256sum | cut -d' ' -f1)

    if [[ "$dev_hash" != "$prod_hash" ]]; then
        print_pass "DEV and PROD have different DATABASE_URL (isolated)"
    else
        print_warn "DEV and PROD may share the same DATABASE_URL"
    fi
    return 0
}

check_api_config() {
    local script="$GOVERNANCE_ROOT/scripts/Cckr-api-config-check.sh"
    if [[ ! -f "$script" ]]; then
        print_warn "API config check script not found"
        return 0
    fi
    if bash "$script" >/dev/null 2>&1; then
        print_pass "API configuration valid (6/6 sub-checks)"
        return 0
    else
        print_fail "API configuration check FAILED"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_airport_count() {
    local min=2000
    if [[ ! -f "$REPO_ROOT/.env.local" ]]; then
        print_warn ".env.local not found, skipping airport count"
        return 0
    fi
    set +e
    local count
    count=$(cd "$REPO_ROOT" && set -a && source .env.local 2>/dev/null && set +a && node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.city.count({ where: { isactive: true, iata_code: { not: null }, airport_name: { not: null } } })
  .then(c => { console.log(c); return p.\$disconnect(); })
  .catch(() => { console.log('0'); return p.\$disconnect(); });
" 2>/dev/null)
    set -e

    if [[ "$count" -ge "$min" ]]; then
        print_pass "$count airports in DB (minimum: $min)"
        return 0
    elif [[ "$count" -gt 0 ]]; then
        print_warn "Only $count airports (minimum: $min) — run: npx tsx scripts/seed-airports.ts"
        return 0
    else
        print_warn "Could not count airports — DB may be unreachable"
        return 0
    fi
}

check_build() {
    if npm run build >/dev/null 2>&1; then
        print_pass "Next.js build successful"
        return 0
    else
        print_fail "Build FAILED"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# ═══════════════════════════════════════════════════════
# BEHAVIORAL CHECKS (catch real regression bugs)
# ═══════════════════════════════════════════════════════

check_middleware_whitelist() {
    local middleware="$REPO_ROOT/src/middleware.ts"
    if [[ ! -f "$middleware" ]]; then
        print_warn "middleware.ts not found"
        return 0
    fi

    local routes
    routes=$(find "$REPO_ROOT/src/app/api" -name "route.ts" 2>/dev/null | sed "s|$REPO_ROOT/src/app||;s|/route.ts$||" | sort)

    if [[ -z "$routes" ]]; then
        print_warn "No API routes found"
        return 0
    fi

    local whitelist
    whitelist=$(grep -oP '"/api/[^"]*"' "$middleware" 2>/dev/null | tr -d '"' | sort)

    local missing=0
    while IFS= read -r route; do
        [[ -z "$route" ]] && continue
        if echo "$route" | grep -q "auth"; then
            continue
        fi
        local found=false
        while IFS= read -r wl; do
            [[ -z "$wl" ]] && continue
            if [[ "$route" == "$wl" ]] || [[ "$route" == "$wl/"* ]]; then
                found=true
                break
            fi
        done <<< "$whitelist"

        if [[ "$found" == false ]]; then
            if ! grep -q '\[...all\]' "$middleware" 2>/dev/null || ! echo "$route" | grep -q "auth"; then
                print_warn "Route NOT in middleware whitelist: $route"
                missing=$((missing + 1))
            fi
        fi
    done <<< "$routes"

    if [[ $missing -eq 0 ]]; then
        print_pass "All API routes accounted for in middleware whitelist"
        return 0
    else
        print_warn "$missing route(s) not in PUBLIC_API_ROUTES — add to middleware.ts if public access needed"
        return 0
    fi
}

check_city_mode_flight() {
    local dropdown="$REPO_ROOT/src/components/CitySearchDropdown.tsx"
    if [[ ! -f "$dropdown" ]]; then
        print_warn "CitySearchDropdown.tsx not found"
        return 0
    fi

    local flight_usages
    flight_usages=$(grep -rn "CitySearchDropdown" "$REPO_ROOT/src/app/flights/" "$REPO_ROOT/src/components/Flight" 2>/dev/null || true)

    if [[ -z "$flight_usages" ]]; then
        print_pass "No CitySearchDropdown usage in flight pages (nothing to check)"
        return 0
    fi

    local bad=0
    while IFS= read -r usage; do
        [[ -z "$usage" ]] && continue
        local file
        file=$(echo "$usage" | cut -d: -f1)
        local line_num
        line_num=$(echo "$usage" | cut -d: -f2)
        local line_content
        line_content=$(echo "$usage" | cut -d: -f3-)

        # Skip import statements and type imports
        if echo "$line_content" | grep -qE '^\s*import |from "@/components|from ".*CitySearchDropdown|type \{'; then
            continue
        fi

        # Skip if it's the component definition itself
        if [[ "$file" == *"CitySearchDropdown.tsx" ]]; then
            continue
        fi

        # Look at wider context (15 lines after) to capture full component usage
        local after
        after=$(sed -n "${line_num},$((line_num + 15))p" "$file" 2>/dev/null)

        if echo "$after" | grep -q 'mode.*=.*"flight"'; then
            continue
        fi

        print_warn "CitySearchDropdown in flight page WITHOUT mode=\"flight\": $file:$line_num"
        bad=$((bad + 1))
    done <<< "$flight_usages"

    if [[ $bad -eq 0 ]]; then
        print_pass "All flight pages use mode=\"flight\" on CitySearchDropdown"
        return 0
    else
        print_fail "$bad flight page(s) missing mode=\"flight\" — hotel city codes will be used for flight search"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_city_mode_hotel() {
    local hotel_usages
    hotel_usages=$(grep -rn 'CitySearchDropdown' "$REPO_ROOT/src/app/hotels/" 2>/dev/null || true)

    if [[ -z "$hotel_usages" ]]; then
        print_pass "No CitySearchDropdown usage in hotel pages (nothing to check)"
        return 0
    fi

    local bad=0
    while IFS= read -r usage; do
        [[ -z "$usage" ]] && continue
        local file
        file=$(echo "$usage" | cut -d: -f1)
        local line_num
        line_num=$(echo "$usage" | cut -d: -f2)

        local context
        context=$(sed -n "$((line_num > 5 ? line_num - 5 : 1)),$((line_num + 5))p" "$file" 2>/dev/null)
        if echo "$context" | grep -q 'mode.*=.*"flight"'; then
            print_fail "Hotel page using mode=\"flight\" (should be \"hotel\" or default): $file:$line_num"
            bad=$((bad + 1))
        fi
    done <<< "$hotel_usages"

    if [[ $bad -eq 0 ]]; then
        print_pass "Hotel pages correctly use default/hotel mode"
        return 0
    else
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_tbo_endpoint_routing() {
    local hotel_api="$REPO_ROOT/src/lib/tbo-hotel-api.ts"
    if [[ ! -f "$hotel_api" ]]; then
        print_warn "tbo-hotel-api.ts not found"
        return 0
    fi

    local errors=0

    for func in searchHotels preBook; do
        local ctx
        ctx=$(grep -A3 "export async function $func" "$hotel_api" | grep -c "getSearchContext" 2>/dev/null || echo "0")
        if [[ "$ctx" -ge 1 ]]; then
            print_pass "$func() uses search context (affiliate)"
        else
            print_fail "$func() may NOT use search context"
            errors=$((errors + 1))
        fi
    done

    for func in bookHotel generateVoucher getBookingDetail sendChangeRequest getChangeRequestStatus; do
        local ctx
        ctx=$(grep -A3 "export async function $func" "$hotel_api" | grep -c "getBookingActionContext" 2>/dev/null || echo "0")
        if [[ "$ctx" -ge 1 ]]; then
            print_pass "$func() uses booking context (HotelBE)"
        else
            print_fail "$func() may NOT use booking context"
            errors=$((errors + 1))
        fi
    done

    if [[ $errors -gt 0 ]]; then
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    return 0
}

check_config_sync() {
    local config_service="$REPO_ROOT/src/lib/config-service.ts"
    local hotel_api="$REPO_ROOT/src/lib/tbo-hotel-api.ts"
    local admin_page="$REPO_ROOT/src/app/admin/config/page.tsx"

    local errors=0

    if grep -q "HotelBE.tektravels.com/hotelservice.svc/rest" "$config_service" 2>/dev/null; then
        print_pass "config-service.ts bookingUrl default correct"
    else
        print_fail "config-service.ts bookingUrl default WRONG"
        errors=$((errors + 1))
    fi

    if grep -q "affiliate.tektravels.com/HotelAPI" "$config_service" 2>/dev/null; then
        print_pass "config-service.ts baseUrl default correct"
    else
        print_fail "config-service.ts baseUrl default WRONG"
        errors=$((errors + 1))
    fi

    if grep -q "HotelBE.tektravels.com/hotelservice.svc/rest" "$hotel_api" 2>/dev/null; then
        print_pass "tbo-hotel-api.ts booking endpoint correct"
    else
        print_fail "tbo-hotel-api.ts booking endpoint WRONG"
        errors=$((errors + 1))
    fi

    if [[ -f "$admin_page" ]]; then
        if grep -q "HotelBE.tektravels.com/hotelservice.svc/rest" "$admin_page" 2>/dev/null; then
            print_pass "admin/config/page.tsx bookingUrl default correct"
        else
            print_fail "admin/config/page.tsx bookingUrl default WRONG"
            errors=$((errors + 1))
        fi
    fi

    local wrong_refs
    wrong_refs=$(grep -rn "bookingUrl.*affiliate" "$REPO_ROOT/src/" "$REPO_ROOT/scripts/" 2>/dev/null || true)
    if [[ -z "$wrong_refs" ]]; then
        print_pass "No bookingUrl pointing to affiliate (correct)"
    else
        print_fail "bookingUrl incorrectly points to affiliate:"
        echo "$wrong_refs" | while read -r line; do
            print_fail "  $line"
        done
        errors=$((errors + 1))
    fi

    if [[ $errors -gt 0 ]]; then
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    return 0
}

check_schema_cluster_reminder() {
    print_warn "SCHEMA CHANGE REMINDER: Apply SQL to BOTH .env.local AND .env.production clusters"
    print_warn "  DEV:  source .env.local && node -e \"const {Client}=require('pg');...\""
    print_warn "  PROD: source .env.production && node -e \"const {Client}=require('pg');...\""
    print_warn "  prisma db push does NOT work on CockroachDB"
    return 0
}

check_webhook_check() {
    local webhook_files
    webhook_files=$(find "$REPO_ROOT/src/app/api" -path "*webhook*" -name "route.ts" 2>/dev/null || true)

    if [[ -z "$webhook_files" ]]; then
        print_pass "No webhook routes found (nothing to check)"
        return 0
    fi

    local errors=0
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        if grep -q "validateWebhookSignature\|verify.*signature\|X-Verify\|hmac\|crypto.createHmac" "$file" 2>/dev/null; then
            print_pass "$(basename "$(dirname "$file")")/$(basename "$file"): has signature verification"
        else
            print_fail "$(basename "$(dirname "$file")")/$(basename "$file"): NO signature verification"
            errors=$((errors + 1))
        fi
    done <<< "$webhook_files"

    if [[ $errors -gt 0 ]]; then
        print_warn "Webhook handlers missing signature verification — add validateWebhookSignature()"
    fi
    return 0
}

check_currency_check() {
    local email_files
    email_files=$(find "$REPO_ROOT/src" -name "*email*" -o -name "*mail*" -o -name "*template*" 2>/dev/null | grep -v node_modules | grep -v ".next" || true)

    if [[ -z "$email_files" ]]; then
        print_pass "No email/template files found (nothing to check)"
        return 0
    fi

    local hardcoded=0
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        if grep -q '₹\|"INR"\|INR ' "$file" 2>/dev/null; then
            print_warn "Hardcoded currency in: $(basename "$file")"
            hardcoded=$((hardcoded + 1))
        fi
    done <<< "$email_files"

    if [[ $hardcoded -eq 0 ]]; then
        print_pass "No hardcoded currency symbols in email templates"
    else
        print_warn "$hardcoded file(s) with hardcoded currency — use parameterized currency format"
    fi
    return 0
}

check_modal_pointer_events() {
    # Ensure all modals with fixed inset-0 backdrop have pointer-events-none/auto pattern.
    # This prevents Opera/Vivaldi click target regression (Issue #291, Issue 018).
    # Only checks modals that have a backdrop with onClick (dismissible modals).
    local modal_files
    modal_files=$(grep -rln "fixed inset-0" "$REPO_ROOT/src/components/" 2>/dev/null | grep -v node_modules | grep -v ".next" || true)

    if [[ -z "$modal_files" ]]; then
        print_pass "No modal components found (nothing to check)"
        return 0
    fi

    local bad=0
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        local basename
        basename=$(basename "$file")

        # Skip non-modal overlays (SplashScreen, FilterPanel, etc.)
        # Only check files that have a backdrop with onClick handler
        if ! grep -q "absolute inset-0.*onClick\|onClick.*absolute inset-0" "$file" 2>/dev/null; then
            continue
        fi

        # Check container has pointer-events-none
        if ! grep -q "fixed inset-0.*pointer-events-none\|pointer-events-none.*fixed inset-0" "$file" 2>/dev/null; then
            print_fail "$basename: modal container missing pointer-events-none (Issue #291 regression)"
            bad=$((bad + 1))
            continue
        fi

        # Check backdrop has pointer-events-auto
        if ! grep -q "absolute inset-0.*pointer-events-auto\|pointer-events-auto.*absolute inset-0" "$file" 2>/dev/null; then
            print_fail "$basename: modal backdrop missing pointer-events-auto (Issue #291 regression)"
            bad=$((bad + 1))
            continue
        fi

        # Check content has pointer-events-auto
        if ! grep -q "pointer-events-auto" "$file" 2>/dev/null; then
            print_fail "$basename: modal content missing pointer-events-auto (Issue #291 regression)"
            bad=$((bad + 1))
            continue
        fi
    done <<< "$modal_files"

    if [[ $bad -eq 0 ]]; then
        print_pass "All modals have pointer-events-none/auto pattern (Issue #291 protected)"
        return 0
    else
        print_fail "$bad modal(s) missing pointer-events pattern — Opera/Vivaldi clicks will break"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_epic_issue_tracking() {
    # Enforce Rule 13: EPIC/Issue Tracking Gate
    # No code can be committed without updating EPIC-ISSUE-TRACKER.md
    # Every commit must reference at least one open issue from Section B
    local tracker="$DOCS_DIR/EPIC-ISSUE-TRACKER.md"

    if [[ ! -f "$tracker" ]]; then
        print_fail "EPIC-ISSUE-TRACKER.md not found — create it before committing"
        ERRORS=$((ERRORS + 1))
        return 1
    fi

    # Check that the file has been modified today or has a recent session entry
    local today
    today=$(date +%Y-%m-%d)
    local last_modified
    last_modified=$(stat -c %Y "$tracker" 2>/dev/null || stat -f %m "$tracker" 2>/dev/null || echo 0)
    local now
    now=$(date +%s)
    local age_hours=$(( (now - last_modified) / 3600 ))

    # If the file is more than 24 hours old, warn (but don't block — might be a docs-only commit)
    if [[ $age_hours -gt 24 ]]; then
        print_warn "EPIC-ISSUE-TRACKER.md last modified $age_hours hours ago — verify it's up to date"
    fi

    # Check that Section D checklist items are checked (at least some)
    local checklist_checked
    checklist_checked=$(grep -c '\- \[x\]' "$tracker" 2>/dev/null || echo 0)
    local checklist_total
    checklist_total=$(grep -c '\- \[ \]' "$tracker" 2>/dev/null || echo 0)

    if [[ $checklist_total -gt 0 ]]; then
        print_warn "EPIC-ISSUE-TRACKER.md Section D: $checklist_total unchecked checklist items"
    fi

    # Check that Section E (Session Update Log) has an entry for today
    if grep -q "$today" "$tracker" 2>/dev/null; then
        print_pass "EPIC-ISSUE-TRACKER.md has session entry for $today"
    else
        print_warn "EPIC-ISSUE-TRACKER.md has no session entry for $today — add one before committing"
    fi

    # Check that Section B (Open Issues) has at least some entries
    local open_issues
    open_issues=$(grep -c '^| [0-9]' "$tracker" 2>/dev/null || echo 0)
    if [[ $open_issues -eq 0 ]]; then
        print_fail "EPIC-ISSUE-TRACKER.md Section B has no open issues — this is suspicious"
        ERRORS=$((ERRORS + 1))
        return 1
    fi

    print_pass "EPIC-ISSUE-TRACKER.md exists and has $open_issues tracked issues"
    return 0
}

# ═══════════════════════════════════════════════════════
# PHASE: PREFLIGHT
# ═══════════════════════════════════════════════════════

run_preflight() {
    print_header "GoRASA Context-Aware Governance — PREFLIGHT"
    print_status "Task type: $TASK_TYPE"
    print_status "Mode: $([ "$QUICK" = true ] && echo 'quick (gating only)' || echo 'full')"
    echo ""

    run_check docs_exist          "GOV-01  Docs exist"             gate  check_docs_exist || true
    run_check env_vars            "GOV-02  Environment vars"       gate  check_env_vars || true
    run_check typescript          "GOV-03  TypeScript compile"     gate  check_typescript || true
    run_check stale_imports       "GOV-04  No stale Supabase"      gate  check_stale_imports || true
    run_check prisma_provider     "GOV-05  Prisma provider"        gate  check_prisma_provider || true
    run_check vercel_json         "GOV-06  vercel.json safe"       gate  check_vercel_json || true
    run_check git_email           "GOV-07  Git email valid"        gate  check_git_email || true
    run_check dual_db             "GOV-08  Dual DB isolation"       info  check_dual_db || true
    run_check api_config          "GOV-09  API config guard"       gate  check_api_config || true
    run_check airport_count       "GOV-10  Airport count"          info  check_airport_count || true

    run_check middleware_whitelist "BEH-01  Middleware whitelist"   info  check_middleware_whitelist || true
    run_check city_mode_flight    "BEH-02  Flight city mode"       gate  check_city_mode_flight || true
    run_check city_mode_hotel     "BEH-03  Hotel city mode"        gate  check_city_mode_hotel || true
    run_check tbo_endpoint_routing "BEH-04  TBO endpoint routing"  gate  check_tbo_endpoint_routing || true
    run_check config_sync         "BEH-05  Config multi-source"    gate  check_config_sync || true
    run_check schema_cluster_reminder "BEH-06  Schema reminder"    info  check_schema_cluster_reminder || true
    run_check webhook_check       "BEH-07  Webhook signatures"     info  check_webhook_check || true
    run_check currency_check      "BEH-08  Currency hardcoded"     info  check_currency_check || true
    run_check modal_pointer_events "BEH-09  Modal pointer-events"  gate  check_modal_pointer_events || true
    run_check epic_issue_tracking  "BEH-10  EPIC/Issue tracking"   gate  check_epic_issue_tracking || true
}

# ═══════════════════════════════════════════════════════
# PHASE: POST-TASK
# ═══════════════════════════════════════════════════════

run_post_task() {
    print_header "GoRASA Context-Aware Governance — POST-TASK"
    print_status "Task type: $TASK_TYPE"
    echo ""

    run_check typescript          "POST-01 TypeScript compile"     gate  check_typescript || true
    run_check build               "POST-02 Build passes"           gate  check_build || true
    run_check stale_imports       "POST-03 No stale Supabase"      gate  check_stale_imports || true
    run_check git_status          "POST-04 Git status"             info  check_git_status || true
    run_check dual_db             "POST-05 Dual DB isolation"       info  check_dual_db || true
    run_check api_config          "POST-06 API config guard"       gate  check_api_config || true
    run_check middleware_whitelist "POST-07 Middleware whitelist"  info  check_middleware_whitelist || true
    run_check city_mode_flight    "POST-08 Flight city mode"      gate  check_city_mode_flight || true
    run_check city_mode_hotel     "POST-09 Hotel city mode"       gate  check_city_mode_hotel || true
    run_check tbo_endpoint_routing "POST-10 TBO endpoint routing" gate  check_tbo_endpoint_routing || true
    run_check config_sync         "POST-11 Config multi-source"   gate  check_config_sync || true
    run_check modal_pointer_events "POST-12 Modal pointer-events" gate  check_modal_pointer_events || true
    run_check epic_issue_tracking  "POST-13 EPIC/Issue tracking"  gate  check_epic_issue_tracking || true
}

# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

echo ""
case "$PHASE" in
    preflight)  run_preflight ;;
    post-task)  run_post_task ;;
    all)        run_preflight; echo ""; run_post_task ;;
esac

echo ""
print_header "RESULT"
print_status "Checks run: $CHECKS_RUN | Skipped: $CHECKS_SKIPPED | Task: $TASK_TYPE"

if [[ "$ERRORS" -gt 0 ]]; then
    print_error "FAILED — $ERRORS gating check(s) failed"
    print_error "Fix errors before $([ "$PHASE" = "preflight" ] && echo 'starting work' || echo 'committing')"
    exit 1
else
    print_pass "ALL GATING CHECKS PASSED"
    if [[ "$TASK_TYPE" != "all" ]]; then
        print_status "Context-aware mode: only ran checks relevant to '$TASK_TYPE' tasks"
    fi
    exit 0
fi
