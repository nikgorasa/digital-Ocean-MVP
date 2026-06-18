#!/bin/bash
# GitHub Environments & Secrets Setup for GoRASA
# Run this script with: chmod +x setup-github-env.sh && ./setup-github-env.sh
# Requires: gh auth login (admin token with repo, admin:repo_hook, workflow scopes)

set -e

REPO="Gorasa-In-2026/Gorasa-Cockroach"

echo "🔧 Configuring GitHub Environments for $REPO"

# ============================================
# REPOSITORY SECRETS (Settings → Secrets → Actions)
# ============================================
echo "📝 Setting repository secrets..."

# These need to be provided by you - uncomment and fill in:
# gh secret set VERCEL_TOKEN --body "your-vercel-token" --repo "$REPO"
# gh secret set VERCEL_ORG_ID --body "your-org-id" --repo "$REPO"
# gh secret set VERCEL_PROJECT_ID_CCKR --body "cckr-project-id" --repo "$REPO"
# gh secret set VERCEL_PROJECT_ID_CCKR2 --body "cckr2-project-id" --repo "$REPO"

echo "⚠️  Repository secrets must be set manually in GitHub UI or uncomment lines above"
echo "   Go to: https://github.com/$REPO/settings/secrets/actions"

# ============================================
# ENVIRONMENT: CCKR (Staging)
# ============================================
echo "🌍 Creating CCKR environment..."
gh api --method PUT "repos/$REPO/environments/cckr" \
  -f wait_timer=0 \
  -f prevent_self_review=false \
  -f reviewers='[]' \
  -f deployment_branch_policy='{"protected_branches": false, "custom_branch_policies": true}' \
  2>/dev/null || echo "Environment may already exist"

# Deployment branch rules for CCKR (main, develop)
gh api --method PUT "repos/$REPO/environments/cckr/deployment-branch-policies" \
  -f name="main" \
  -f type="branch" 2>/dev/null || true

gh api --method PUT "repos/$REPO/environments/cckr/deployment-branch-policies" \
  -f name="develop" \
  -f type="branch" 2>/dev/null || true

echo "📝 CCKR environment variables (set in GitHub UI):"
echo "   https://github.com/$REPO/settings/environments/cckr"
echo "   Required: DATABASE_URL, DIRECT_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL,"
echo "             GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TBO_*, NODE_ENV"

# ============================================
# ENVIRONMENT: CCKR2 (Production)
# ============================================
echo "🌍 Creating CCKR2 environment..."
gh api --method PUT "repos/$REPO/environments/cckr2" \
  -f wait_timer=300 \
  -f prevent_self_review=true \
  -f reviewers='[{"type": "User", "id": "'$(gh api user --jq .id)'"}]' \
  -f deployment_branch_policy='{"protected_branches": true, "custom_branch_policies": false}' \
  2>/dev/null || echo "Environment may already exist"

echo "📝 CCKR2 environment variables (set in GitHub UI):"
echo "   https://github.com/$REPO/settings/environments/cckr2"
echo "   Required: DATABASE_URL, DIRECT_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL,"
echo "             GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TBO_*, NODE_ENV"

# ============================================
# VERIFY
# ============================================
echo ""
echo "✅ Verification:"
gh api "repos/$REPO/environments" --jq '.environments[] | {name: .name, wait_timer: .wait_timer, prevent_self_review: .prevent_self_review, deployment_branch_policy: .deployment_branch_policy}'

echo ""
echo "🔗 Quick links:"
echo "   Secrets:     https://github.com/$REPO/settings/secrets/actions"
echo "   CCKR env:    https://github.com/$REPO/settings/environments/cckr"
echo "   CCKR2 env:   https://github.com/$REPO/settings/environments/cckr2"
echo "   Workflows:   https://github.com/$REPO/actions"