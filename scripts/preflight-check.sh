#!/bin/bash
# GoRASA Pre-Flight Check Script
# MUST be run before starting ANY significant work
# ALL checks are COMPULSORY — failure exits immediately

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../scripts/governance-lib.sh"

cd "$(dirname "$0")/.."

gov_set_prefix "PRE-FLIGHT"
gov_init

print_header "GoRASA Pre-Flight Check — COMPULSORY"
echo ""

# ═══════════════════════════════════════════════════════
# Check 1: Documentation Files Exist
# ═══════════════════════════════════════════════════════
gov_check_docs_exist "CHECK 1/16: Required documentation files..." \
    "../DEPLOY.md" "../SESSION-LOG.md" "../CONFIG-REFERENCE.md"

# ═══════════════════════════════════════════════════════
# Check 1.5: Deployment Pipeline Display
# ═══════════════════════════════════════════════════════
if [[ -f "../DEPLOY.md" ]]; then
    echo ""
    print_status "  Deployment Pipeline (from DEPLOY.md):"
    echo ""
    echo -e "    ${CYAN}Branch    │ Trigger          │ Auto-Deploys To${NC}"
    echo -e "    ${CYAN}──────────┼──────────────────┼────────────────────────────────${NC}"
    echo -e "    ${GREEN}dev${NC}       │ git push origin dev │ project-uul0v.vercel.app"
    echo -e "    ${GREEN}qa${NC}        │ PR merge → qa     │ project-sm6gc.vercel.app"
    echo -e "    ${GREEN}main${NC}      │ PR merge → main   │ gorasa-next.vercel.app"
    echo ""
fi

# ═══════════════════════════════════════════════════════
# Check 2: Read SESSION-LOG.md (Last Session Context)
# ═══════════════════════════════════════════════════════
print_status "CHECK 2/16: Last session context from SESSION-LOG.md..."

SESSION_FILE="../SESSION-LOG.md"
if [[ -f "$SESSION_FILE" ]]; then
    LAST_SESSION=$(grep -A 2 "## Session" "$SESSION_FILE" | tail -3)
    print_status "  ✓ Last session context loaded"
else
    print_error "  ✗ SESSION-LOG.md MISSING"
fi

# ═══════════════════════════════════════════════════════
# Check 3: Read Issues & Learnings
# ═══════════════════════════════════════════════════════
print_status "CHECK 3/16: Known issues from LEARNING-FROM-MISTAKES.md..."

LEARNING_FILE="../docs/governance/LEARNING-FROM-MISTAKES.md"
if [[ -f "$LEARNING_FILE" ]]; then
    ISSUE_COUNT=$(grep -c "^### Issue" "$LEARNING_FILE" 2>/dev/null || echo "0")
    print_status "  ✓ $ISSUE_COUNT known issues documented"
else
    print_warning "  ⚠ LEARNING-FROM-MISTAKES.md not found"
fi

# ═══════════════════════════════════════════════════════
# Check 4: Config Reference
# ═══════════════════════════════════════════════════════
print_status "CHECK 4/16: Configuration from CONFIG-REFERENCE.md..."
gov_check_config_ref

# ═══════════════════════════════════════════════════════
# Check 5: Environment Variables
# ═══════════════════════════════════════════════════════
print_status "CHECK 5/16: Environment variables..."
gov_check_env_vars

# Also check .secrets.local
SECRETS_FILE="../.secrets.local"
if [[ -f "$SECRETS_FILE" ]]; then
    print_status "  ✓ .secrets.local exists (repo root)"
    if git check-ignore "$SECRETS_FILE" >/dev/null 2>&1; then
        print_status "  ✓ .secrets.local is gitignored"
    else
        print_error "  ✗ .secrets.local is NOT gitignored — will be committed!"
    fi
else
    print_warning "  ⚠ .secrets.local not found at repo root"
fi

# ═══════════════════════════════════════════════════════
# Check 6: TypeScript Compilation
# ═══════════════════════════════════════════════════════
print_status "CHECK 6/16: TypeScript compilation..."
gov_check_typescript

# ═══════════════════════════════════════════════════════
# Check 7: Git Status
# ═══════════════════════════════════════════════════════
print_status "CHECK 7/16: Git status..."
gov_check_git_status "with-branch"

# ═══════════════════════════════════════════════════════
# Check 8: Recent Commits
# ═══════════════════════════════════════════════════════
print_status "CHECK 8/16: Recent commits..."

RECENT_COMMITS=$(git log --oneline -5 2>/dev/null || echo "No commits")
print_status "  ✓ Recent commits:"
echo "$RECENT_COMMITS" | while read -r line; do
    print_status "    $line"
done

# ═══════════════════════════════════════════════════════
# Check 9: Critical Files Exist
# ═══════════════════════════════════════════════════════
gov_check_file_list "CHECK 9/16: Critical files..." \
    "src/lib/ticket/serverManager.ts" \
    "src/lib/ai/holidayPlanner.ts" \
    "src/lib/support/smartRouter.ts" \
    "src/components/HolidayPlanner.tsx" \
    "src/app/api/tickets/route.ts" \
    "src/app/api/leads/route.ts" \
    "src/app/holidays/page.tsx"

# ═══════════════════════════════════════════════════════
# Check 10: Governance Hooks
# ═══════════════════════════════════════════════════════
gov_check_hooks

# ═══════════════════════════════════════════════════════
# Check 11: Branch-to-DB Mapping (Environment Intent)
# ═══════════════════════════════════════════════════════
gov_verify_db_intent "error"

# ═══════════════════════════════════════════════════════
# Check 12: Production Supabase Shield
# ═══════════════════════════════════════════════════════
gov_check_supabase_shield

# ═══════════════════════════════════════════════════════
# Check 13: Vercel Project Env Var Cross-Ref
# ═══════════════════════════════════════════════════════
gov_check_vercel_crossref

# ═══════════════════════════════════════════════════════
# Check 14: Secret / Credential Exposure Scan
# ═══════════════════════════════════════════════════════
gov_scan_credentials

# ═══════════════════════════════════════════════════════
# Check 15: Deployment Commit Traceability
# ═══════════════════════════════════════════════════════
gov_check_commit_traceability

# ═══════════════════════════════════════════════════════
# Check 16: DB Schema Sync
# ═══════════════════════════════════════════════════════
gov_check_db_schema_sync "auto"

# ═══════════════════════════════════════════════════════
# FINAL RESULT
# ═══════════════════════════════════════════════════════
gov_print_result "PRE-FLIGHT CHECK RESULT" 16 "show-tips"
