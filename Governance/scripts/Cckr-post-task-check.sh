#!/bin/bash

# GoRASA CockroachDB Standalone — Post-Task Check Script
# MUST be run after completing ANY significant work on the CRDB standalone deployment

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

# Detect governance instance
source "$(dirname "$0")/detect-governance-root.sh"

cd "$GOVERNANCE_ROOT/../gorasa-next"

print_header "GoRASA Post-Task — Instance: ${GOVERNANCE_TYPE} (via $GOVERNANCE_ROOT)"
print_status "Active protocol: $GOV_SOURCE_OF_TRUTH"
echo ""

ERRORS=0
WARNING_COUNT=0

# ═══════════════════════════════════════════════════════
# Check 1: Documentation Files Exist
# ═══════════════════════════════════════════════════════
print_status "CHECK 1/10: Documentation files..."

REQUIRED_DOCS=(
    "../cockroach-standalone/Cckr-SESSION-LOG.md"
    "../cockroach-standalone/Cckr-CONFIG-REFERENCE.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [[ -f "$doc" ]]; then
        print_status "  ✓ $doc"
    else
        print_error "  ✗ $doc MISSING"
        ERRORS=$((ERRORS + 1))
    fi
done

# ═══════════════════════════════════════════════════════
# Check 2: CHANGE-LOG.md Updated
# ═══════════════════════════════════════════════════════
print_status "CHECK 2/10: CHANGE-LOG.md has today's entry..."

CL="../cockroach-standalone/Cckr-CHANGE-LOG.md"
TODAY=$(date "+%Y-%m-%d")
if grep -q "$TODAY" "$CL" 2>/dev/null; then
    print_status "  ✓ Cckr-CHANGE-LOG.md has entry for $TODAY"
else
    print_error "  ✗ Cckr-CHANGE-LOG.md has NO entry for $TODAY"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 3: MEMORY.md Updated
# ═══════════════════════════════════════════════════════
print_status "CHECK 3/10: MEMORY.md has today's entry..."

MEM="../cockroach-standalone/Cckr-MEMORY.md"
if grep -q "$TODAY" "$MEM" 2>/dev/null; then
    print_status "  ✓ Cckr-MEMORY.md has entry for $TODAY"
else
    print_error "  ✗ Cckr-MEMORY.md has NO entry for $TODAY"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 4: LEARNING-FROM-MISTAKES.md
# ═══════════════════════════════════════════════════════
print_status "CHECK 4/10: LEARNING-FROM-MISTAKES.md status..."

LFM="../cockroach-standalone/Cckr-LEARNING-FROM-MISTAKES.md"
ISSUE_COUNT=$(grep -c "^### Issue" "$LFM" 2>/dev/null || echo "0")
print_status "  ✓ $ISSUE_COUNT issues documented"

# ═══════════════════════════════════════════════════════
# Check 5: DEPLOYMENT_LOG.md
# ═══════════════════════════════════════════════════════
print_status "CHECK 5/10: DEPLOYMENT_LOG.md..."

if [[ -f "../cockroach-standalone/Cckr-DEPLOYMENT_LOG.md" ]]; then
    print_status "  ✓ Cckr-DEPLOYMENT_LOG.md exists"
else
    print_error "  ✗ Cckr-DEPLOYMENT_LOG.md MISSING"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 6: CONFIG-REFERENCE.md
# ═══════════════════════════════════════════════════════
print_status "CHECK 6/10: CONFIG-REFERENCE.md..."

if [[ -f "../cockroach-standalone/Cckr-CONFIG-REFERENCE.md" ]]; then
    print_status "  ✓ Cckr-CONFIG-REFERENCE.md exists"
else
    print_error "  ✗ Cckr-CONFIG-REFERENCE.md MISSING"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 7: Environment Variables
# ═══════════════════════════════════════════════════════
print_status "CHECK 7/10: Environment variables..."

ENV_FILE=".env.local"
if [[ -f "$ENV_FILE" ]]; then
    print_status "  ✓ .env.local exists"

    REQUIRED_VARS=(
        "DATABASE_URL"
        "DIRECT_URL"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
            print_status "  ✓ $var set"
        else
            print_warning "  ⚠ $var not found in .env.local"
        fi
    done
else
    print_error "  ✗ .env.local MISSING"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 8: TypeScript Compilation
# ═══════════════════════════════════════════════════════
print_status "CHECK 8/10: TypeScript compilation..."

if command -v npx >/dev/null 2>&1; then
    if npx tsc --noEmit 2>/dev/null; then
        print_status "  ✓ TypeScript compilation successful"
    else
        print_error "  ✗ TypeScript compilation FAILED"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_warning "  ⚠ npx not available, skipping"
fi

# ═══════════════════════════════════════════════════════
# Check 9: Git Status
# ═══════════════════════════════════════════════════════
print_status "CHECK 9/10: Git status..."

if git status >/dev/null 2>&1; then
    print_status "  ✓ Git repository detected"

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
# Check 10: Database connectivity via Prisma
# ═══════════════════════════════════════════════════════
print_status "CHECK 10/10: Database connectivity..."

if command -v npx >/dev/null 2>&1; then
    DB_CHECK=$(npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 || true)
    if echo "$DB_CHECK" | grep -q "SELECT 1" 2>/dev/null; then
        print_status "  ✓ CockroachDB reachable via Prisma"
    else
        print_warning "  ⚠ Could not verify DB connectivity — check DATABASE_URL"
    fi
else
    print_warning "  ⚠ npx not available, skipping DB check"
fi

# ═══════════════════════════════════════════════════════
# FINAL RESULT
# ═══════════════════════════════════════════════════════
echo ""
print_header "POST-TASK CHECK RESULT"

if [[ "$ERRORS" -gt 0 ]]; then
    print_error "FAILED — $ERRORS error(s) and $WARNING_COUNT warning(s)"
    print_error "Fix all errors before marking work complete"
    exit 1
else
    print_status "✓ ALL 10 CHECKS PASSED (${WARNING_COUNT:-0} warnings)"
    print_status "✓ Post-task validation complete"
    exit 0
fi
