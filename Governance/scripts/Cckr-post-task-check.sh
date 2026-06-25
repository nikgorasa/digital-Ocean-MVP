#!/bin/bash

# GoRASA CockroachDB Standalone — Post-Task Check Script
# MUST be run after completing ANY significant work

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[POST-TASK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${CYAN}════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}════════════════════════════════════════════════════${NC}"; }

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOVERNANCE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$GOVERNANCE_ROOT/.." && pwd)"
DOCS_DIR="$GOVERNANCE_ROOT/docs/governance"

cd "$REPO_ROOT"

print_header "GoRASA Post-Task Check — Standalone CockroachDB"
echo ""

ERRORS=0

# ═══════════════════════════════════════════════════════
# Check 1: TypeScript compiles
# ═══════════════════════════════════════════════════════
print_status "CHECK 1/9: TypeScript compilation..."

if npx tsc --noEmit 2>/dev/null; then
    print_status "  ✓ TypeScript compilation successful"
else
    print_error "  ✗ TypeScript compilation FAILED"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 2: Build passes
# ═══════════════════════════════════════════════════════
print_status "CHECK 2/9: Next.js build..."

if npm run build >/dev/null 2>&1; then
    print_status "  ✓ Build successful"
else
    print_error "  ✗ Build FAILED"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 3: No stale Supabase imports
# ═══════════════════════════════════════════════════════
print_status "CHECK 3/9: No stale Supabase imports..."

STALE=$(grep -rn "@supabase/supabase-js\|@supabase/ssr\|@/lib/supabase" src/ 2>/dev/null || true)
if [[ -z "$STALE" ]]; then
    print_status "  ✓ Clean"
else
    print_error "  ✗ Stale imports found"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 4: Git status
# ═══════════════════════════════════════════════════════
print_status "CHECK 4/9: Git status..."

CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
if [[ "$CHANGES" -gt 0 ]]; then
    print_warning "  ⚠ $CHANGES uncommitted changes"
    git status --short | head -10 | while read -r line; do
        print_warning "    $line"
    done
else
    print_status "  ✓ Working tree clean"
fi

# ═══════════════════════════════════════════════════════
# Check 5: Session log updated
# ═══════════════════════════════════════════════════════
print_status "CHECK 5/9: Session log..."

SESSION_FILE="$DOCS_DIR/Cckr-SESSION-LOG.md"
if [[ -f "$SESSION_FILE" ]]; then
    LAST_UPDATE=$(grep "Last updated" "$SESSION_FILE" | head -1)
    print_status "  ✓ $LAST_UPDATE"
else
    print_warning "  ⚠ Cckr-SESSION-LOG.md not found"
fi

# ═══════════════════════════════════════════════════════
# Check 6: DB changes documented
# ═══════════════════════════════════════════════════════
print_status "CHECK 6/9: DB changes log..."

DB_FILE="$DOCS_DIR/DB-CHANGES.md"
if [[ -f "$DB_FILE" ]]; then
    print_status "  ✓ DB-CHANGES.md exists"
else
    print_warning "  ⚠ DB-CHANGES.md not found"
fi

# ═══════════════════════════════════════════════════════
# Check 7: No Supabase env vars
# ═══════════════════════════════════════════════════════
print_status "CHECK 7/9: No Supabase env vars..."

if grep -q "^NEXT_PUBLIC_SUPABASE\|^SUPABASE_SERVICE" .env.local 2>/dev/null; then
    print_error "  ✗ Supabase env vars still in .env.local"
    ERRORS=$((ERRORS + 1))
else
    print_status "  ✓ Clean"
fi

# ═══════════════════════════════════════════════════════
# Check 8: Dual DB isolation
# ═══════════════════════════════════════════════════════
print_status "CHECK 8/9: Dual DB isolation..."

if [[ -f ".env.local" ]] && [[ -f ".env.production" ]]; then
    print_status "  ✓ Both .env.local and .env.production exist"
else
    print_warning "  ⚠ Missing env file(s)"
fi

# ═══════════════════════════════════════════════════════
# Check 9: API Configuration Guard
# ═══════════════════════════════════════════════════════
print_status "CHECK 9/9: API configuration guard..."

API_CONFIG_SCRIPT="$GOVERNANCE_ROOT/scripts/Cckr-api-config-check.sh"
if [[ -f "$API_CONFIG_SCRIPT" ]]; then
    if bash "$API_CONFIG_SCRIPT"; then
        print_status "  ✓ API configuration valid"
    else
        ERRORS=$((ERRORS + 1))
    fi
else
    print_warning "  ⚠ API config check script not found at $API_CONFIG_SCRIPT"
fi

# ═══════════════════════════════════════════════════════
# FINAL RESULT
# ═══════════════════════════════════════════════════════
echo ""
print_header "POST-TASK CHECK RESULT"

if [[ "$ERRORS" -gt 0 ]]; then
    print_error "FAILED — $ERRORS check(s) failed"
    print_error "Fix errors before committing"
    exit 1
else
    print_status "✓ ALL 9 CHECKS PASSED"
    print_status "✓ Work is complete"
    exit 0
fi
