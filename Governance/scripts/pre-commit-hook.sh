#!/bin/bash
# GoRASA Pre-Commit Hook
# Enforces Rule 13: EPIC/Issue Tracking Gate
#
# This hook blocks commits if:
# 1. EPIC-ISSUE-TRACKER.md doesn't exist
# 2. Code files are staged but EPIC-ISSUE-TRACKER.md is NOT staged
# 3. Section B has no open issues
#
# To bypass (emergency only): git commit --no-verify

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REPO_ROOT="$(git rev-parse --show-toplevel)"
TRACKER="$REPO_ROOT/Governance/docs/governance/EPIC-ISSUE-TRACKER.md"

print_fail() { echo -e "${RED}[PRE-COMMIT]${NC} $1"; }
print_pass() { echo -e "${GREEN}[PRE-COMMIT]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[PRE-COMMIT]${NC} $1"; }

# ─── Check 1: EPIC-ISSUE-TRACKER.md exists ─────────────
if [[ ! -f "$TRACKER" ]]; then
    print_fail "BLOCKED: EPIC-ISSUE-TRACKER.md not found"
    print_fail "Create it before committing: Governance/docs/governance/EPIC-ISSUE-TRACKER.md"
    exit 1
fi

# ─── Check 2: Code files staged but tracker NOT staged ──
STAGED_CODE=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' | grep -v node_modules | grep -v '.next' || true)
STAGED_TRACKER=$(git diff --cached --name-only 2>/dev/null | grep 'EPIC-ISSUE-TRACKER.md' || true)

if [[ -n "$STAGED_CODE" && -z "$STAGED_TRACKER" ]]; then
    print_fail "BLOCKED: Code files staged but EPIC-ISSUE-TRACKER.md NOT updated"
    print_fail ""
    print_fail "Staged code files:"
    echo "$STAGED_CODE" | head -5 | while read -r f; do
        print_fail "  - $f"
    done
    print_fail ""
    print_fail "You MUST update EPIC-ISSUE-TRACKER.md before committing:"
    print_fail "  1. Add/update the issue in Section B (Open Issues)"
    print_fail "  2. Complete the checklist in Section D"
    print_fail "  3. Add session entry in Section E"
    print_fail ""
    print_fail "Then: git add Governance/docs/governance/EPIC-ISSUE-TRACKER.md && git commit"
    exit 1
fi

# ─── Check 3: Section B has open issues ──────────────────
OPEN_ISSUES=$(grep -c '^| [0-9]' "$TRACKER" 2>/dev/null || echo 0)
if [[ $OPEN_ISSUES -eq 0 ]]; then
    print_fail "BLOCKED: EPIC-ISSUE-TRACKER.md Section B has no open issues"
    print_fail "This is suspicious — verify the file is correct"
    exit 1
fi

# ─── All checks passed ──────────────────────────────────
print_pass "EPIC/Issue tracking gate passed ($OPEN_ISSUES tracked issues)"

# ─── Check 4: GitHub cross-check (soft warning) ─────────
# Verify Section B issue numbers exist on GitHub and detect duplicates.
# This is a warning, not a block — gh may not be available in all environments.
if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
    GH_ISSUES=$(gh issue list --state all --limit 500 --json number,title --jq '.[] | "\(.number) \(.title)"' 2>/dev/null || echo "")
    if [[ -n "$GH_ISSUES" ]]; then
        # Extract issue numbers from Section B
        TRACKER_NUMS=$(grep -oE '^\| [0-9]+' "$TRACKER" 2>/dev/null | tr -d '| ' | sort -n || echo "")
        GH_NUMS=$(echo "$GH_ISSUES" | awk '{print $1}' | sort -n || echo "")

        # Check for tracker numbers not on GitHub
        MISSING_ON_GH=$(comm -23 <(echo "$TRACKER_NUMS") <(echo "$GH_NUMS") || echo "")
        if [[ -n "$MISSING_ON_GH" ]]; then
            print_warn "Tracker issues not found on GitHub (may be fabricated):"
            echo "$MISSING_ON_GH" | while read -r n; do
                [[ -n "$n" ]] && print_warn "  #$n"
            done
        fi

        # Check for duplicate titles in tracker
        DUP_TITLES=$(grep -oE '^\| [0-9]+ \| [^|]+' "$TRACKER" 2>/dev/null | sed 's/| [0-9]* | //' | sort | uniq -d || echo "")
        if [[ -n "$DUP_TITLES" ]]; then
            print_warn "Duplicate titles found in tracker Section B:"
            echo "$DUP_TITLES" | while read -r t; do
                [[ -n "$t" ]] && print_warn "  $t"
            done
        fi

        [[ -z "$MISSING_ON_GH" && -z "$DUP_TITLES" ]] && print_pass "GitHub cross-check: all tracker issues verified"
    fi
fi

exit 0
