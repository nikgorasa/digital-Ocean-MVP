#!/bin/bash

# GoRASA CockroachDB Standalone — Pre-Flight Check Script
# MUST be run before starting ANY significant work on the CRDB standalone deployment

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[PRE-FLIGHT]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${CYAN}════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}════════════════════════════════════════════════════${NC}"; }

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOVERNANCE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$GOVERNANCE_ROOT/.." && pwd)"
DOCS_DIR="$GOVERNANCE_ROOT/docs/governance"

cd "$REPO_ROOT"

print_header "GoRASA Pre-Flight — Standalone CockroachDB"
print_status "Repo root: $REPO_ROOT"
print_status "Governance: $GOVERNANCE_ROOT"
echo ""

ERRORS=0

# ═══════════════════════════════════════════════════════
# Check 1: Documentation Files Exist
# ═══════════════════════════════════════════════════════
print_status "CHECK 1/12: Required documentation files..."

REQUIRED_DOCS=(
    "$DOCS_DIR/Cckr-SESSION-LOG.md"
    "$DOCS_DIR/Cckr-CONFIG-REFERENCE.md"
    "$DOCS_DIR/CHANGE-LOG.md"
    "$DOCS_DIR/DB-CHANGES.md"
    "$DOCS_DIR/VERSION.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [[ -f "$doc" ]]; then
        print_status "  ✓ $(basename "$doc")"
    else
        print_error "  ✗ $(basename "$doc") MISSING"
        ERRORS=$((ERRORS + 1))
    fi
done

# ═══════════════════════════════════════════════════════
# Check 2: Read SESSION-LOG.md
# ═══════════════════════════════════════════════════════
print_status "CHECK 2/12: Last session context..."

SESSION="$DOCS_DIR/Cckr-SESSION-LOG.md"
if [[ -f "$SESSION" ]]; then
    ISSUE_COUNT=$(grep -c "^### Issue\|^### Session" "$SESSION" 2>/dev/null || echo "0")
    print_status "  ✓ $ISSUE_COUNT entries documented"
else
    print_error "  ✗ Cckr-SESSION-LOG.md MISSING"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 3: Config Reference
# ═══════════════════════════════════════════════════════
print_status "CHECK 3/12: Configuration..."

if [[ -f "$DOCS_DIR/Cckr-CONFIG-REFERENCE.md" ]]; then
    print_status "  ✓ Cckr-CONFIG-REFERENCE.md loaded"
else
    print_error "  ✗ Cckr-CONFIG-REFERENCE.md MISSING"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 4: Environment Variables
# ═══════════════════════════════════════════════════════
print_status "CHECK 4/12: Environment variables..."

ENV_FILE="$REPO_ROOT/.env.local"
if [[ -f "$ENV_FILE" ]]; then
    print_status "  ✓ .env.local exists"

    REQUIRED_VARS=(
        "DATABASE_URL"
        "DIRECT_URL"
        "BETTER_AUTH_SECRET"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
            print_status "  ✓ $var set"
        else
            print_warning "  ⚠ $var not found"
        fi
    done

    # Check no Supabase vars remain
    if grep -q "^NEXT_PUBLIC_SUPABASE\|^SUPABASE_SERVICE" "$ENV_FILE" 2>/dev/null; then
        print_error "  ✗ Stale Supabase env vars found in .env.local"
        ERRORS=$((ERRORS + 1))
    else
        print_status "  ✓ No Supabase env vars (clean)"
    fi
else
    print_error "  ✗ .env.local MISSING"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 5: TypeScript Compilation
# ═══════════════════════════════════════════════════════
print_status "CHECK 5/12: TypeScript compilation..."

if command -v npx >/dev/null 2>&1; then
    TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
    if [[ "$TS_ERRORS" -eq 0 ]]; then
        print_status "  ✓ TypeScript compilation successful"
    else
        print_error "  ✗ TypeScript compilation FAILED ($TS_ERRORS errors)"
        npx tsc --noEmit 2>&1 | grep "error TS" | head -5 | while read -r line; do
            print_error "    $line"
        done
        ERRORS=$((ERRORS + 1))
    fi
else
    print_warning "  ⚠ npx not available, skipping"
fi

# ═══════════════════════════════════════════════════════
# Check 6: Git Status
# ═══════════════════════════════════════════════════════
print_status "CHECK 6/12: Git status..."

if git status >/dev/null 2>&1; then
    print_status "  ✓ Git repository detected"

    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    print_status "  ✓ Current branch: $BRANCH"

    REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "N/A")
    print_status "  ✓ Remote origin: $REMOTE_URL"

    UNSTAGED=$(git diff --name-only 2>/dev/null | wc -l)
    STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)

    if [[ "$UNSTAGED" -gt 0 ]]; then
        print_warning "  ⚠ $UNSTAGED unstaged changes"
    fi
    if [[ "$STAGED" -gt 0 ]]; then
        print_warning "  ⚠ $STAGED staged changes"
    fi
else
    print_error "  ✗ Not a git repository"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 7: Recent Commits
# ═══════════════════════════════════════════════════════
print_status "CHECK 7/12: Recent commits..."

RECENT_COMMITS=$(git log --oneline -5 2>/dev/null || echo "No commits")
print_status "  ✓ Recent commits:"
echo "$RECENT_COMMITS" | while read -r line; do
    print_status "    $line"
done

# ═══════════════════════════════════════════════════════
# Check 8: No stale Supabase imports
# ═══════════════════════════════════════════════════════
print_status "CHECK 8/12: No stale Supabase imports..."

STALE_IMPORTS=$(grep -rn "@supabase/supabase-js\|@supabase/ssr\|@/lib/supabase-admin\|@/lib/supabase-server\|@/lib/supabase" src/ 2>/dev/null || true)
if [[ -z "$STALE_IMPORTS" ]]; then
    print_status "  ✓ No stale Supabase imports"
else
    print_error "  ✗ Stale Supabase imports found:"
    echo "$STALE_IMPORTS" | while read -r line; do
        print_error "    $line"
    done
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 9: vercel.json build command safety
# ═══════════════════════════════════════════════════════
print_status "CHECK 9/12: vercel.json build command..."

VJSON="$REPO_ROOT/vercel.json"
if [[ -f "$VJSON" ]]; then
    if grep -q "prisma db push" "$VJSON" 2>/dev/null; then
        print_error "  ✗ vercel.json contains 'prisma db push' — WILL FAIL on CockroachDB"
        ERRORS=$((ERRORS + 1))
    else
        print_status "  ✓ vercel.json build command is safe"
    fi
else
    print_warning "  ⚠ vercel.json not found"
fi

# ═══════════════════════════════════════════════════════
# Check 10: Prisma schema provider
# ═══════════════════════════════════════════════════════
print_status "CHECK 10/12: Prisma schema provider..."

PRISMA_SCHEMA="$REPO_ROOT/prisma/schema.prisma"
if [[ -f "$PRISMA_SCHEMA" ]]; then
    if grep -q 'provider.*=.*"postgresql"' "$PRISMA_SCHEMA" 2>/dev/null; then
        print_status "  ✓ Prisma provider is postgresql"
    elif grep -q 'provider.*=.*"cockroachdb"' "$PRISMA_SCHEMA" 2>/dev/null; then
        print_error "  ✗ Prisma provider is cockroachdb — must be postgresql"
        ERRORS=$((ERRORS + 1))
    else
        print_warning "  ⚠ Could not determine Prisma provider"
    fi
fi

# ═══════════════════════════════════════════════════════
# Check 11: Git email for deploy
# ═══════════════════════════════════════════════════════
print_status "CHECK 11/12: Git email..."

GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
BLOCKED_EMAILS=("nikhil@cryptomite.win" "noreply@github.com")
EMAIL_OK=true

for blocked in "${BLOCKED_EMAILS[@]}"; do
    if [[ "$GIT_EMAIL" == "$blocked" ]]; then
        print_error "  ✗ Git email '$GIT_EMAIL' is blocked by Vercel"
        ERRORS=$((ERRORS + 1))
        EMAIL_OK=false
    fi
done

if [[ "$EMAIL_OK" == "true" && -n "$GIT_EMAIL" ]]; then
    print_status "  ✓ Git email: $GIT_EMAIL"
elif [[ -z "$GIT_EMAIL" ]]; then
    print_warning "  ⚠ No git email configured"
fi

# ═══════════════════════════════════════════════════════
# Check 12: Dual DB environment verification
# ═══════════════════════════════════════════════════════
print_status "CHECK 12/12: Dual DB environment..."

DEV_ENV="$REPO_ROOT/.env.local"
PROD_ENV="$REPO_ROOT/.env.production"

if [[ -f "$DEV_ENV" ]] && [[ -f "$PROD_ENV" ]]; then
    print_status "  ✓ Both .env.local and .env.production exist"

    # Check they have different DATABASE_URL (via fingerprint)
    DEV_FINGERPRINT=$(envsitter_fingerprint "$DEV_ENV" DATABASE_URL 2>/dev/null || echo "none")
    PROD_FINGERPRINT=$(envsitter_fingerprint "$PROD_ENV" DATABASE_URL 2>/dev/null || echo "none")

    if [[ "$DEV_FINGERPRINT" != "$PROD_FINGERPRINT" ]]; then
        print_status "  ✓ DEV and PROD have different DATABASE_URL (isolated)"
    else
        print_warning "  ⚠ DEV and PROD may share the same DATABASE_URL"
    fi
else
    print_warning "  ⚠ Missing .env.local or .env.production"
fi

# ═══════════════════════════════════════════════════════
# FINAL RESULT
# ═══════════════════════════════════════════════════════
echo ""
print_header "PRE-FLIGHT CHECK RESULT"

if [[ "$ERRORS" -gt 0 ]]; then
    print_error "FAILED — $ERRORS check(s) failed"
    print_error "Fix all errors before starting work"
    exit 1
else
    print_status "✓ ALL 12 CHECKS PASSED"
    print_status "✓ Pre-flight validation complete"
    print_status ""
    print_status "Ready to start work. Remember:"
    print_status "  1. DEV: .env.local → dev CockroachDB cluster"
    print_status "  2. PROD: .env.production → prod CockroachDB cluster"
    print_status "  3. Schema changes: manual SQL only (no prisma db push)"
    print_status "  4. Deploy: vercel deploy --prod --yes --token=<TOKEN>"
    print_status "  5. Run Governance/scripts/Cckr-post-task-check.sh when done"
    exit 0
fi
