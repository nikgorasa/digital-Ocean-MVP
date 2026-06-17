#!/usr/bin/env bash
# =============================================================================
# GOVERNANCE CHECK — Full CTO-level validation
# =============================================================================
# This script validates the entire project state:
#   1. File integrity (symlinks, required docs, no orphans)
#   2. Security (no secrets in tracked files, no credentials)
#   3. Code quality (TypeScript compiles, no lint errors)
#   4. Deployment safety (protected branches, command guard)
#   5. Governance compliance (SESSION-LOG.md sections, no stale files)
#   6. Branch status (ahead/behind, uncommitted changes)
#   7. Environment (env vars set, secrets files exist)
#   8. Standalone pipeline (cockroach-standalone independent)
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ERRORS=0
WARNINGS=0
PASSED=0

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GOVERNANCE_DIR="$PROJECT_ROOT/docs/governance"
COCKROACH_DIR="$PROJECT_ROOT/cockroach-standalone"

pass() { ((PASSED++)); echo -e "${GREEN}  ✓${NC} $1"; }
fail() { ((ERRORS++)); echo -e "${RED}  ✗${NC} $1"; }
warn() { ((WARNINGS++)); echo -e "${YELLOW}  ⚠${NC} $1"; }
section() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

# =============================================================================
section "1. FILE INTEGRITY"
# =============================================================================

# Required symlinks at root
REQUIRED_SYMLINKS=(
  "SESSION-LOG.md"
  "MEMORY.md"
  "CHANGE-LOG.md"
  "LEARNING-FROM-MISTAKES.md"
  "DEPLOYMENT_LOG.md"
  "Sprint-1.md"
  "DB-CHANGES.md"
  "CONFIG-REFERENCE.md"
  "DEPLOYMENT-REFERENCE.md"
  "DOCS-INDEX.md"
)

for f in "${REQUIRED_SYMLINKS[@]}"; do
  if [ -L "$PROJECT_ROOT/$f" ]; then
    target=$(readlink -f "$PROJECT_ROOT/$f")
    if [ -f "$target" ]; then
      pass "$f → $(basename "$target")"
    else
      fail "$f → BROKEN LINK ($target)"
    fi
  else
    fail "$f — NOT A SYMLINK"
  fi
done

# Required real files at root
for f in README.md PRODUCT.md SETUP-GUIDE.md DEPLOY.md; do
  if [ -f "$PROJECT_ROOT/$f" ] && [ ! -L "$PROJECT_ROOT/$f" ]; then
    pass "$f (real file)"
  else
    fail "$f — missing or is symlink"
  fi
done

# No unexpected loose .md files at root
LOOSE_COUNT=0
for f in "$PROJECT_ROOT"/*.md; do
  fname=$(basename "$f")
  if [ ! -L "$f" ]; then
    case "$fname" in
      README.md|PRODUCT.md|SETUP-GUIDE.md|DEPLOY.md) ;; # expected
      *) warn "Loose file at root: $fname"; ((LOOSE_COUNT++)) ;;
    esac
  fi
done
if [ "$LOOSE_COUNT" -eq 0 ]; then
  pass "No unexpected loose .md files at root"
fi

# Governance folder has all files
for f in SESSION-LOG.md CONFIG-REFERENCE.md DEPLOYMENT-REFERENCE.md DOCS-INDEX.md; do
  if [ -f "$GOVERNANCE_DIR/$f" ]; then
    pass "docs/governance/$f ($(wc -l < "$GOVERNANCE_DIR/$f") lines)"
  else
    fail "docs/governance/$f MISSING"
  fi
done

# Symlinks in governance folder
for f in MEMORY.md CHANGE-LOG.md LEARNING-FROM-MISTAKES.md DEPLOYMENT_LOG.md Sprint-1.md DB-CHANGES.md; do
  if [ -L "$GOVERNANCE_DIR/$f" ]; then
    target=$(readlink -f "$GOVERNANCE_DIR/$f")
    if [ -f "$target" ]; then
      pass "docs/governance/$f → $(basename "$target")"
    else
      fail "docs/governance/$f → BROKEN LINK"
    fi
  else
    fail "docs/governance/$f — NOT A SYMLINK"
  fi
done

# No orphan files in docs/governance (only allowed files)
ALLOWED_IN_GOVERNANCE="SESSION-LOG.md CONFIG-REFERENCE.md DEPLOYMENT-REFERENCE.md DOCS-INDEX.md MEMORY.md CHANGE-LOG.md LEARNING-FROM-MISTAKES.md DEPLOYMENT_LOG.md Sprint-1.md DB-CHANGES.md"
for f in "$GOVERNANCE_DIR"/*.md; do
  fname=$(basename "$f")
  if ! echo "$ALLOWED_IN_GOVERNANCE" | grep -qw "$fname"; then
    warn "Unexpected file in docs/governance/: $fname"
  fi
done

# =============================================================================
section "2. SECURITY"
# =============================================================================

# Check .secrets.local exists and is gitignored
if [ -f "$PROJECT_ROOT/.secrets.local" ]; then
  pass ".secrets.local exists"
  if grep -q ".secrets.local" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    pass ".secrets.local is gitignored"
  else
    fail ".secrets.local NOT in .gitignore — could be committed!"
  fi
else
  warn ".secrets.local not found (may be using env vars)"
fi

# Check .env.local exists and is gitignored
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  pass ".env.local exists"
  if grep -q ".env.local" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    pass ".env.local is gitignored"
  else
    fail ".env.local NOT in .gitignore — could be committed!"
  fi
else
  warn ".env.local not found"
fi

# No secrets in tracked files
SECRET_PATTERNS=(
  'SUPABASE_URL=.*https://.*supabase.*'
  'SUPABASE_ANON_KEY=.*eyJ'
  'SUPABASE_SERVICE_ROLE_KEY=.*eyJ'
  'DATABASE_URL=.*postgresql://.*:.*@.*'
  'STRIPE_SECRET_KEY=.*sk_live'
  'STRIPE_SECRET_KEY=.*sk_test'
)

for pattern in "${SECRET_PATTERNS[@]}"; do
  # Only check tracked files, exclude .env.local and .secrets.local
  matches=$(git -C "$PROJECT_ROOT" grep -l "$pattern" -- ':!.env.local' ':!.secrets.local' ':!*.lock' ':!node_modules/*' 2>/dev/null || true)
  if [ -n "$matches" ]; then
    fail "SECRET FOUND IN TRACKED FILES: $matches"
  fi
done
pass "No secrets found in tracked files"

# Check no .env files in git
if git -C "$PROJECT_ROOT" ls-files | grep -qE '\.env$|\.env\.local$|\.env\.production$'; then
  fail ".env files found in git history"
else
  pass "No .env files in git"
fi

# =============================================================================
section "3. DEPLOYMENT SAFETY"
# =============================================================================

# Command guard blocks protected branches
if [ -f "$PROJECT_ROOT/scripts/command-guard.sh" ]; then
  output=$(bash "$PROJECT_ROOT/scripts/command-guard.sh" "git push origin main" 2>&1 || true)
  if echo "$output" | grep -q "BLOCKED"; then
    pass "Command guard blocks 'git push origin main'"
  else
    fail "Command guard DID NOT block 'git push origin main'"
  fi

  output=$(bash "$PROJECT_ROOT/scripts/command-guard.sh" "git push origin qa" 2>&1 || true)
  if echo "$output" | grep -q "BLOCKED"; then
    pass "Command guard blocks 'git push origin qa'"
  else
    fail "Command guard DID NOT block 'git push origin qa'"
  fi

  output=$(bash "$PROJECT_ROOT/scripts/command-guard.sh" "vercel deploy --prod" 2>&1 || true)
  if echo "$output" | grep -q "BLOCKED"; then
    pass "Command guard blocks 'vercel deploy --prod'"
  else
    fail "Command guard DID NOT block 'vercel deploy --prod'"
  fi

  output=$(bash "$PROJECT_ROOT/scripts/command-guard.sh" "git push --force" 2>&1 || true)
  if echo "$output" | grep -q "BLOCKED"; then
    pass "Command guard blocks 'git push --force'"
  else
    fail "Command guard DID NOT block 'git push --force'"
  fi

  output=$(bash "$PROJECT_ROOT/scripts/command-guard.sh" "cat .secrets.local" 2>&1 || true)
  if echo "$output" | grep -q "BLOCKED"; then
    pass "Command guard blocks 'cat .secrets.local'"
  else
    fail "Command guard DID NOT block 'cat .secrets.local'"
  fi
else
  fail "command-guard.sh MISSING"
fi

# GitHub Actions trigger on PR merge only (not push)
for workflow in deploy-prod.yml deploy-qa.yml; do
  wf="$PROJECT_ROOT/.github/workflows/$workflow"
  if [ -f "$wf" ]; then
    if grep -q "types: \[closed\]" "$wf"; then
      pass "$workflow triggers on PR merge only"
    else
      fail "$workflow does NOT trigger on PR merge — may deploy on push"
    fi
  else
    fail "$workflow MISSING"
  fi
done

# Pre-push hook blocks protected branches
if [ -f "$PROJECT_ROOT/.opencode/hook/hooks.yaml" ]; then
  if grep -q "git push.*main\|git push.*qa" "$PROJECT_ROOT/.opencode/hook/hooks.yaml"; then
    pass "Pre-push hook blocks protected branches"
  else
    fail "Pre-push hook does NOT block protected branches"
  fi
else
  fail "hooks.yaml MISSING"
fi

# =============================================================================
section "4. GOVERNANCE COMPLIANCE"
# =============================================================================

# SESSION-LOG.md has required sections
SESSION_LOG="$GOVERNANCE_DIR/SESSION-LOG.md"
if [ -f "$SESSION_LOG" ]; then
  REQUIRED_SECTIONS=(
    "Known Constraints"
    "Key Files"
    "Architecture Decisions"
    "Sprint"
    "Database"
    "Deployment"
    "Issues"
    "Learnings"
  )
  
  for section_name in "${REQUIRED_SECTIONS[@]}"; do
    if grep -qi "$section_name" "$SESSION_LOG"; then
      pass "SESSION-LOG.md contains: $section_name"
    else
      fail "SESSION-LOG.md MISSING section: $section_name"
    fi
  done
  
  # Check file isn't stale (modified in last 30 days)
  if find "$SESSION_LOG" -mtime -30 -print -quit | grep -q .; then
    pass "SESSION-LOG.md updated within 30 days"
  else
    warn "SESSION-LOG.md not updated in 30+ days"
  fi
fi

# CONFIG-REFERENCE.md has required fields
CONFIG_REF="$GOVERNANCE_DIR/CONFIG-REFERENCE.md"
if [ -f "$CONFIG_REF" ]; then
  REQUIRED_CONFIG=(
    "Supabase"
    "Branch"
    "Project ID"
    "NEON"
  )
  
  for field in "${REQUIRED_CONFIG[@]}"; do
    if grep -qi "$field" "$CONFIG_REF"; then
      pass "CONFIG-REFERENCE.md contains: $field"
    else
      warn "CONFIG-REFERENCE.md missing: $field"
    fi
  done
fi

# AGENTS.md references 2 files only
AGENTS="$PROJECT_ROOT/gorasa-next/AGENTS.md"
if [ -f "$AGENTS" ]; then
  if grep -q "SESSION-LOG.md" "$AGENTS" && grep -q "CONFIG-REFERENCE.md" "$AGENTS"; then
    pass "AGENTS.md references SESSION-LOG.md + CONFIG-REFERENCE.md"
  else
    fail "AGENTS.md does not reference both required files"
  fi
  
  if grep -qi "NEVER PUSH DIRECTLY" "$AGENTS"; then
    pass "AGENTS.md has deployment safety rules"
  else
    fail "AGENTS.md MISSING deployment safety rules"
  fi
fi

# =============================================================================
section "5. CODE QUALITY"
# =============================================================================

# TypeScript compilation
if cd "$PROJECT_ROOT/gorasa-next" && npx tsc --noEmit 2>/dev/null; then
  pass "TypeScript compilation successful"
else
  fail "TypeScript compilation FAILED"
fi

# No lint errors (if eslint exists)
if [ -f "$PROJECT_ROOT/gorasa-next/package.json" ]; then
  if grep -q '"lint"' "$PROJECT_ROOT/gorasa-next/package.json"; then
    if timeout 30 npm run lint --prefix "$PROJECT_ROOT/gorasa-next" 2>/dev/null; then
      pass "ESLint passes"
    else
      warn "ESLint has warnings/errors or timed out"
    fi
  else
    warn "No lint script in package.json"
  fi
fi

# =============================================================================
section "6. BRANCH STATUS"
# =============================================================================

cd "$PROJECT_ROOT"

# Current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
pass "Current branch: $BRANCH"

# Ahead/behind
BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
if [ "$BEHIND" -gt 0 ] || [ "$AHEAD" -gt 0 ]; then
  warn "Branch is $AHEAD ahead, $BEHIND behind upstream"
else
  pass "Branch is in sync with upstream"
fi

# Uncommitted changes
if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
  pass "No uncommitted changes"
else
  warn "Uncommitted changes present"
fi

# Untracked files (excluding expected)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)
if [ "$UNTRACKED" -gt 0 ]; then
  warn "$UNTRACKED untracked files"
else
  pass "No untracked files"
fi

# =============================================================================
section "7. ENVIRONMENT"
# =============================================================================

# Required env vars
REQUIRED_ENV=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "DATABASE_URL"
)

for var in "${REQUIRED_ENV[@]}"; do
  if [ -n "${!var:-}" ]; then
    pass "$var is set"
  elif grep -q "^${var}=" "$PROJECT_ROOT/.env.local" 2>/dev/null; then
    pass "$var is in .env.local"
  else
    fail "$var NOT SET"
  fi
done

# =============================================================================
section "8. STANDALONE PIPELINE"
# =============================================================================

if [ -d "$COCKROACH_DIR" ]; then
  pass "cockroach-standalone/ exists"
  
  # Standalone symlinks
  if [ -L "$COCKROACH_DIR/Cckr-SESSION-LOG.md" ]; then
    target=$(readlink -f "$COCKROACH_DIR/Cckr-SESSION-LOG.md")
    if [ -f "$target" ]; then
      pass "Cckr-SESSION-LOG.md → $(basename "$target")"
    else
      fail "Cckr-SESSION-LOG.md → BROKEN LINK"
    fi
  else
    fail "Cckr-SESSION-LOG.md NOT A SYMLINK"
  fi
  
  # Standalone scripts
  if [ -f "$COCKROACH_DIR/scripts/detect-governance-root.sh" ]; then
    pass "detect-governance-root.sh exists"
  else
    fail "detect-governance-root.sh MISSING"
  fi
  
  # Standalone is independent
  if grep -q "STANDALONE" "$COCKROACH_DIR/scripts/detect-governance-root.sh" 2>/dev/null; then
    pass "Standalone pipeline detects its own governance"
  else
    warn "Standalone pipeline may not be independent"
  fi
else
  fail "cockroach-standalone/ directory MISSING"
fi

# =============================================================================
section "9. PREFLIGHT CHECK"
# =============================================================================

cd "$PROJECT_ROOT/gorasa-next"
if bash scripts/preflight-check.sh 2>&1 | grep -q "PRE-FLIGHT CHECKS PASSED"; then
  pass "preflight-check.sh PASSED"
else
  fail "preflight-check.sh FAILED"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  GOVERNANCE CHECK COMPLETE${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}Passed:${NC}   $PASSED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "  ${RED}Errors:${NC}   $ERRORS"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$ERRORS" -gt 0 ]; then
  echo -e "\n${RED}GOVERNANCE CHECK FAILED — $ERRORS errors found${NC}"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "\n${YELLOW}GOVERNANCE CHECK PASSED with $WARNINGS warnings${NC}"
  exit 0
else
  echo -e "\n${GREEN}GOVERNANCE CHECK PASSED — all clear${NC}"
  exit 0
fi
