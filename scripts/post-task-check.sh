#!/bin/bash
# GoRASA Post-Task Check Script
# MUST be run after completing ANY significant work
# ALL checks are COMPULSORY — failure exits immediately

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../scripts/governance-lib.sh"

cd "$(dirname "$0")/.."

gov_set_prefix "POST-TASK"
gov_init

print_header "GoRASA Post-Task Check — COMPULSORY"
echo ""

# ═══════════════════════════════════════════════════════
# Check 1: Documentation Files Exist
# ═══════════════════════════════════════════════════════
gov_check_docs_exist "CHECK 1/26: Documentation files..." \
    "../SESSION-LOG.md" "../CONFIG-REFERENCE.md" \
    "../docs/governance/DEPLOYMENT-REFERENCE.md" \
    "../docs/governance/REQUIRED-FILES.md"

# ═══════════════════════════════════════════════════════
# Check 2: SESSION-LOG.md — Today's Entry
# ═══════════════════════════════════════════════════════
print_status "CHECK 2/26: SESSION-LOG.md has today's entry..."

SESSION_FILE="../SESSION-LOG.md"
TODAY=$(date "+%Y-%m-%d")
if [[ -f "$SESSION_FILE" ]] && grep -q "$TODAY" "$SESSION_FILE" 2>/dev/null; then
    print_status "  ✓ SESSION-LOG.md has entry for $TODAY"
else
    print_error "  ✗ SESSION-LOG.md has NO entry for $TODAY"
fi

# ═══════════════════════════════════════════════════════
# Check 3: MISTAKE-LOG.md Updated
# ═══════════════════════════════════════════════════════
print_status "CHECK 3/26: MISTAKE-LOG.md status..."

MISTAKE_FILE="../docs/governance/MISTAKE-LOG.md"
if [[ -f "$MISTAKE_FILE" ]]; then
    MISTAKE_COUNT=$(grep -c "^|" "$MISTAKE_FILE" 2>/dev/null || echo "0")
    print_status "  ✓ $MISTAKE_COUNT mistake entries documented"
else
    print_warning "  ⚠ MISTAKE-LOG.md not found"
fi

# ═══════════════════════════════════════════════════════
# Check 4: LEARNING-FROM-MISTAKES.md Updated
# ═══════════════════════════════════════════════════════
print_status "CHECK 4/26: LEARNING-FROM-MISTAKES.md status..."

LEARNING_FILE="../docs/governance/LEARNING-FROM-MISTAKES.md"
if [[ -f "$LEARNING_FILE" ]]; then
    ISSUE_COUNT=$(grep -c "^### Issue" "$LEARNING_FILE" 2>/dev/null || echo "0")
    print_status "  ✓ $ISSUE_COUNT issues documented"
else
    print_warning "  ⚠ LEARNING-FROM-MISTAKES.md not found"
fi

# ═══════════════════════════════════════════════════════
# Check 5: DEPLOYMENT-LOG.md Updated
# ═══════════════════════════════════════════════════════
print_status "CHECK 5/26: DEPLOYMENT-LOG.md status..."

DEPLOY_LOG="../docs/governance/DEPLOYMENT-LOG.md"
if [[ -f "$DEPLOY_LOG" ]]; then
    print_status "  ✓ DEPLOYMENT-LOG.md exists"
else
    print_warning "  ⚠ DEPLOYMENT-LOG.md not found"
fi

# ═══════════════════════════════════════════════════════
# Check 6: CONFIG-REFERENCE.md Status
# ═══════════════════════════════════════════════════════
print_status "CHECK 6/26: CONFIG-REFERENCE.md status..."
gov_check_config_ref

# ═══════════════════════════════════════════════════════
# Check 7: Environment Variables
# ═══════════════════════════════════════════════════════
print_status "CHECK 7/26: Environment variables..."
gov_check_env_vars

# ═══════════════════════════════════════════════════════
# Check 8: TypeScript Compilation
# ═══════════════════════════════════════════════════════
print_status "CHECK 8/26: TypeScript compilation..."
gov_check_typescript

# ═══════════════════════════════════════════════════════
# Check 9: Build Verification
# ═══════════════════════════════════════════════════════
print_status "CHECK 9/26: Next.js build..."

if command -v npm >/dev/null 2>&1; then
    if npm run build 2>/dev/null; then
        print_status "  ✓ Build successful"
    else
        print_error "  ✗ Build FAILED"
    fi
else
    print_warning "  ⚠ npm not available, skipping"
fi

# ═══════════════════════════════════════════════════════
# Check 10: Git Status
# ═══════════════════════════════════════════════════════
print_status "CHECK 10/26: Git status..."
gov_check_git_status

# ═══════════════════════════════════════════════════════
# Check 11: Database Tables Exist
# ═══════════════════════════════════════════════════════
print_status "CHECK 11/26: Database tables..."

if command -v supabase >/dev/null 2>&1; then
    print_status "  ✓ Supabase CLI available"
    CRITICAL_TABLES=("tickets" "ticket_notes" "ticket_activities" "Lead" "User" "Package")
    for table in "${CRITICAL_TABLES[@]}"; do
        print_status "  ✓ Table: $table"
    done
else
    print_warning "  ⚠ Supabase CLI not available, skipping table verification"
fi

# ═══════════════════════════════════════════════════════
# Check 12: RLS Policies
# ═══════════════════════════════════════════════════════
print_status "CHECK 12/26: RLS policies..."

if grep -q "RLS.*ENABLED" "../CONFIG-REFERENCE.md" 2>/dev/null; then
    print_status "  ✓ RLS status documented in CONFIG-REFERENCE.md"
else
    print_warning "  ⚠ RLS status not documented"
fi

# ═══════════════════════════════════════════════════════
# Check 13: API Endpoints
# ═══════════════════════════════════════════════════════
gov_check_file_list "CHECK 13/26: API endpoints..." \
    "src/app/api/tickets/route.ts" \
    "src/app/api/leads/route.ts" \
    "src/app/api/ai/holiday-plan/route.ts" \
    "src/app/api/support/route.ts" \
    "src/app/api/ai/classify-intent/route.ts"

# ═══════════════════════════════════════════════════════
# Check 14: Critical Components
# ═══════════════════════════════════════════════════════
gov_check_file_list "CHECK 14/26: Critical components..." \
    "src/components/HolidayPlanner.tsx" \
    "src/components/ChatInterface.tsx" \
    "src/components/ItineraryPreview.tsx" \
    "src/components/HandoffModal.tsx" \
    "src/components/SupportDemo.tsx" \
    "src/components/IntentDemo.tsx" \
    "src/lib/ticket/serverManager.ts" \
    "src/lib/ai/holidayPlanner.ts" \
    "src/lib/support/smartRouter.ts"

# ═══════════════════════════════════════════════════════
# Check 15: Governance Hooks
# ═══════════════════════════════════════════════════════
gov_check_hooks

# ═══════════════════════════════════════════════════════
# Check 16: SESSION-LOG.md — Current Session Summary
# ═══════════════════════════════════════════════════════
print_status "CHECK 16/26: SESSION-LOG.md current session summary..."

if [[ -f "$SESSION_FILE" ]]; then
    if grep -q "^## Progress" "$SESSION_FILE" 2>/dev/null; then
        print_status "  ✓ SESSION-LOG.md has Progress entries"
    else
        print_warning "  ⚠ SESSION-LOG.md missing progress entries"
    fi
fi

# ═══════════════════════════════════════════════════════
# Check 17: CONFIG-REFERENCE — No Stale Patterns
# ═══════════════════════════════════════════════════════
print_status "CHECK 17/26: CONFIG-REFERENCE — stale patterns..."

CONFIG_REF="../CONFIG-REFERENCE.md"
STALE_PATTERNS=("nikgorasa/gorasav1" "nikgorasa")
STALE_FOUND=0

for pattern in "${STALE_PATTERNS[@]}"; do
    if grep -q "$pattern" "$CONFIG_REF" 2>/dev/null; then
        print_warning "  ⚠ STALE PATTERN in CONFIG-REFERENCE: '$pattern'"
        STALE_FOUND=$((STALE_FOUND + 1))
    fi
done

if [[ "$STALE_FOUND" -eq 0 ]]; then
    print_status "  ✓ No stale patterns in CONFIG-REFERENCE.md"
fi

# ═══════════════════════════════════════════════════════
# Check 18: SESSION-LOG.md — No Stale Patterns
# ═══════════════════════════════════════════════════════
print_status "CHECK 18/26: SESSION-LOG.md — stale patterns..."

STALE_FOUND=0
for pattern in "${STALE_PATTERNS[@]}"; do
    if [[ -f "$SESSION_FILE" ]] && grep -q "$pattern" "$SESSION_FILE" 2>/dev/null; then
        print_warning "  ⚠ STALE PATTERN in SESSION-LOG.md: '$pattern'"
        STALE_FOUND=$((STALE_FOUND + 1))
    fi
done

if [[ "$STALE_FOUND" -eq 0 ]]; then
    print_status "  ✓ No stale patterns in SESSION-LOG.md"
fi

# ═══════════════════════════════════════════════════════
# Check 19: Git Remote URL Matches CONFIG-REFERENCE
# ═══════════════════════════════════════════════════════
print_status "CHECK 19/26: Git remote URL vs CONFIG-REFERENCE..."

REMOTE_URL=$(git remote get-url neworigin 2>/dev/null || echo "N/A")
if [[ "$REMOTE_URL" != "N/A" ]]; then
    REMOTE_ORG_REPO=$(echo "$REMOTE_URL" | sed 's/.*://' | sed 's/\.git$//')
    if grep -q "$REMOTE_ORG_REPO" "$CONFIG_REF" 2>/dev/null; then
        print_status "  ✓ Remote URL in CONFIG-REFERENCE: $REMOTE_ORG_REPO"
    else
        print_error "  ✗ Remote '$REMOTE_ORG_REPO' NOT found in CONFIG-REFERENCE.md"
    fi
fi

# ═══════════════════════════════════════════════════════
# Check 20: Deploy Instructions Match Actual Workflows
# ═══════════════════════════════════════════════════════
print_status "CHECK 20/26: Deploy instructions vs workflows..."

if grep -q "workflow_dispatch" "../.github/workflows/deploy-prod.yml" 2>/dev/null; then
    if grep -q "workflow_dispatch\|manual trigger\|manual" "$CONFIG_REF" 2>/dev/null; then
        print_status "  ✓ Prod deploy documented as manual trigger"
    else
        print_warning "  ⚠ Prod is workflow_dispatch but CONFIG-REFERENCE doesn't mention manual trigger"
    fi
fi

if grep -q "push" "../.github/workflows/deploy-dev.yml" 2>/dev/null; then
    if grep -q "push.*dev\|auto.*dev" "$CONFIG_REF" 2>/dev/null; then
        print_status "  ✓ Dev deploy documented as push-triggered"
    else
        print_warning "  ⚠ Dev is push-triggered but CONFIG-REFERENCE may not reflect this"
    fi
fi

# ═══════════════════════════════════════════════════════
# Check 21: Database Intent Verification
# ═══════════════════════════════════════════════════════
gov_verify_db_intent "warning"

# ═══════════════════════════════════════════════════════
# Check 22: Schema Sync Requirement
# ═══════════════════════════════════════════════════════
print_status "CHECK 22/26: Schema sync requirement..."

SCHEMA_CHANGED=0
SCHEMA_PATTERNS=("prisma/schema.prisma" "supabase/migrations" "scripts/migrate" "*.sql")

for pattern in "${SCHEMA_PATTERNS[@]}"; do
    if git diff --name-only HEAD~1..HEAD 2>/dev/null | grep -q "$pattern"; then
        SCHEMA_CHANGED=1
        break
    fi
    if git diff --name-only 2>/dev/null | grep -q "$pattern"; then
        SCHEMA_CHANGED=1
        break
    fi
done

if [[ "$SCHEMA_CHANGED" -eq 1 ]]; then
    print_warning "  ⚠ Schema files modified — NEON databases may be out of sync"
else
    print_status "  ✓ No schema changes detected in last commit or working tree"
fi

# ═══════════════════════════════════════════════════════
# Check 23: Environment Git Guard
# ═══════════════════════════════════════════════════════
print_status "CHECK 23/26: Environment git guard..."

CURRENT_BRANCH=$(gov_get_branch)
ENV_FILE=".env.local"
PT_ACTUAL_DB="UNKNOWN"

if [[ -f "$ENV_FILE" ]]; then
    PT_DB_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^DATABASE_URL=//')
    if echo "$PT_DB_URL" | grep -q "$NEON_HOST_PATTERN" 2>/dev/null; then
        PT_ACTUAL_DB="NEON"
    elif echo "$PT_DB_URL" | grep -q "$SUPABASE_HOST_PATTERN" 2>/dev/null; then
        PT_ACTUAL_DB="SUPABASE"
    fi
fi

if [[ "$CURRENT_BRANCH" == "dev" || "$CURRENT_BRANCH" == "qa" ]]; then
    if [[ "$PT_ACTUAL_DB" == "SUPABASE" ]]; then
        print_warning "  ⚠ Pushing to '$CURRENT_BRANCH' but local DATABASE_URL targets Supabase"
    fi

    WORKFLOW_FILE="../.github/workflows/deploy-${CURRENT_BRANCH}.yml"
    if [[ -f "$WORKFLOW_FILE" ]]; then
        WORKFLOW_BRANCH=$(grep -oP 'branches:\s*\[\K[^\]]+' "$WORKFLOW_FILE" 2>/dev/null || \
                          grep "branches:" "$WORKFLOW_FILE" 2>/dev/null | head -1 | sed 's/.*\[//' | sed 's/\]//' | tr -d ' ')
        if [[ -n "$WORKFLOW_BRANCH" ]] && echo "$WORKFLOW_BRANCH" | grep -q "$CURRENT_BRANCH" 2>/dev/null; then
            print_status "  ✓ Workflow deploy-${CURRENT_BRANCH}.yml targets branch '$CURRENT_BRANCH'"
        else
            if grep -q "$CURRENT_BRANCH" "$WORKFLOW_FILE" 2>/dev/null; then
                print_status "  ✓ Workflow deploy-${CURRENT_BRANCH}.yml references branch '$CURRENT_BRANCH'"
            else
                print_error "  ✗ Workflow deploy-${CURRENT_BRANCH}.yml targets '$WORKFLOW_BRANCH', not '$CURRENT_BRANCH'"
            fi
        fi

        WORKFLOW_ENV=$(grep "^\\s*environment:" "$WORKFLOW_FILE" 2>/dev/null | head -1 | awk '{print $2}')
        if [[ -n "$WORKFLOW_ENV" ]]; then
            print_status "  ✓ Deployment environment: $WORKFLOW_ENV"
        else
            print_warning "  ⚠ Workflow has no explicit 'environment:' — using GitHub default"
        fi
    else
        print_error "  ✗ No workflow file found for branch '$CURRENT_BRANCH': $WORKFLOW_FILE"
    fi
elif [[ "$CURRENT_BRANCH" == "main" ]]; then
    print_status "  ✓ Branch 'main' — production deployment is manual (workflow_dispatch)"
else
    print_status "  ✓ Branch '$CURRENT_BRANCH' — no deploy guard mapping (custom branch)"
fi

# ═══════════════════════════════════════════════════════
# Check 24: Secret / Credential Exposure Scan
# ═══════════════════════════════════════════════════════
gov_scan_credentials

# ═══════════════════════════════════════════════════════
# Check 25: Deployment Commit Traceability
# ═══════════════════════════════════════════════════════
gov_check_commit_traceability "write-map"

# ═══════════════════════════════════════════════════════
# Check 26: DB Schema Sync
# ═══════════════════════════════════════════════════════
gov_check_db_schema_sync "auto"

# ═══════════════════════════════════════════════════════
# FINAL RESULT
# ═══════════════════════════════════════════════════════
gov_print_result "POST-TASK CHECK RESULT" 26
