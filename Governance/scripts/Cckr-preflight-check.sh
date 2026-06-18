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

# Detect governance instance
source "$(dirname "$0")/detect-governance-root.sh"

cd "$GOVERNANCE_ROOT/../gorasa-next"

print_header "GoRASA Pre-Flight — Instance: ${GOVERNANCE_TYPE} (via $GOVERNANCE_ROOT)"
print_status "Active protocol: $GOV_SOURCE_OF_TRUTH"
echo ""

# ═══════════════════════════════════════════════════════
# Show Deployment Pipeline (from DEPLOY.md)
# ═══════════════════════════════════════════════════════
if [[ -f "$GOVERNANCE_ROOT/../DEPLOY.md" ]]; then
    echo -e "  ${CYAN}Deployment Pipeline (from DEPLOY.md):${NC}"
    echo ""
    echo -e "    ${CYAN}Branch    │ Trigger          │ Auto-Deploys To${NC}"
    echo -e "    ${CYAN}──────────┼──────────────────┼────────────────────────────────${NC}"
    echo -e "    ${GREEN}dev${NC}       │ git push origin dev │ project-uul0v.vercel.app"
    echo -e "    ${GREEN}qa${NC}        │ PR merge → qa     │ project-sm6gc.vercel.app"
    echo -e "    ${GREEN}main${NC}      │ PR merge → main   │ gorasa-next.vercel.app"
    echo ""
    print_status "  Command Guard: bash $GOVERNANCE_ROOT/../scripts/command-guard.sh \"cmd\""
    echo ""
fi

ERRORS=0

# ═══════════════════════════════════════════════════════
# Check 1: Documentation Files Exist
# ═══════════════════════════════════════════════════════
print_status "CHECK 1/12: Required documentation files..."

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
# Check 2: Read SESSION-LOG.md
# ═══════════════════════════════════════════════════════
print_status "CHECK 2/12: Last session context from SESSION-LOG.md..."

SESSION="../cockroach-standalone/Cckr-SESSION-LOG.md"
if [[ -f "$SESSION" ]]; then
    ISSUE_COUNT=$(grep -c "^### Issue" "$SESSION" 2>/dev/null || echo "0")
    print_status "  ✓ $ISSUE_COUNT issues documented"
else
    print_error "  ✗ Cckr-SESSION-LOG.md MISSING"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 3: Read CONFIG-REFERENCE.md
# ═══════════════════════════════════════════════════════
print_status "CHECK 3/12: Configuration..."

if [[ -f "../cockroach-standalone/Cckr-CONFIG-REFERENCE.md" ]]; then
    print_status "  ✓ Cckr-CONFIG-REFERENCE.md loaded"
else
    print_error "  ✗ Cckr-CONFIG-REFERENCE.md MISSING"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 5: Environment Variables
# ═══════════════════════════════════════════════════════
print_status "CHECK 5/12: Environment variables..."

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
            print_warning "  ⚠ $var not found"
        fi
    done
else
    print_error "  ✗ .env.local MISSING"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# Check 6: TypeScript Compilation
# ═══════════════════════════════════════════════════════
print_status "CHECK 6/12: TypeScript compilation..."

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
# Check 7: Git Status
# ═══════════════════════════════════════════════════════
print_status "CHECK 7/12: Git status..."

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
# Check 8: Recent Commits
# ═══════════════════════════════════════════════════════
print_status "CHECK 8/12: Recent commits..."

RECENT_COMMITS=$(git log --oneline -5 2>/dev/null || echo "No commits")
print_status "  ✓ Recent commits:"
echo "$RECENT_COMMITS" | while read -r line; do
    print_status "    $line"
done

# ═══════════════════════════════════════════════════════
# Check 9: Database connectivity via Prisma
# ═══════════════════════════════════════════════════════
print_status "CHECK 9/12: Database connectivity..."

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
# Check 10: Git email matches GitHub account
# ═══════════════════════════════════════════════════════
print_status "CHECK 10/12: Git email for Vercel deploy..."

GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
BLOCKED_EMAILS=("nikhil@cryptomite.win" "noreply@github.com")
EMAIL_OK=true

for blocked in "${BLOCKED_EMAILS[@]}"; do
    if [[ "$GIT_EMAIL" == "$blocked" ]]; then
        print_error "  ✗ Git email '$GIT_EMAIL' is blocked by Vercel"
        print_error "    Set a valid GitHub account email: git config user.email 'your@email.com'"
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
# Check 11: vercel.json build command safety
# ═══════════════════════════════════════════════════════
print_status "CHECK 11/12: vercel.json build command..."

VJSON="../gorasa-next/vercel.json"
if [[ -f "$VJSON" ]]; then
    if grep -q "prisma db push" "$VJSON" 2>/dev/null; then
        print_error "  ✗ vercel.json contains 'prisma db push' — WILL FAIL on CockroachDB"
        print_error "    Build command must be: npx prisma generate && npx next build"
        ERRORS=$((ERRORS + 1))
    else
        print_status "  ✓ vercel.json build command is safe"
    fi
else
    print_warning "  ⚠ vercel.json not found"
fi

# ═══════════════════════════════════════════════════════
# Check 12: No Supabase client imports in rewritten files
# ═══════════════════════════════════════════════════════
print_status "CHECK 12/12: No stale Supabase client imports..."

STALE_IMPORTS=$(grep -rn "createClient.*@supabase/supabase-js" src/lib/pricing/ src/lib/payment/ src/lib/ticket/serverManager.ts src/app/page.tsx 2>/dev/null || true)
if [[ -z "$STALE_IMPORTS" ]]; then
    print_status "  ✓ No stale createClient imports in rewritten files"
else
    print_warning "  ⚠ Stale createClient imports found:"
    echo "$STALE_IMPORTS" | while read -r line; do
        print_warning "    $line"
    done
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
    print_status "  1. Read project docs (Cckr-SESSION-LOG.md, Cckr-CONFIG-REFERENCE.md)"
    print_status "  2. Check Cckr-CONFIG-REFERENCE.md for deploy instructions"
    print_status "  3. Deploy via CLI: cd gorasa-next && vercel deploy --prod --yes --token=<TOKEN>"
    print_status "  4. Run Cckr-post-task-check.sh when done"
    exit 0
fi
