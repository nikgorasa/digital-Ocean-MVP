#!/bin/bash
# Deploy to Vercel with proper project linking
# Usage: bash scripts/deploy.sh [dev|prod]

set -e

TARGET="${1:-dev}"

if [ "$TARGET" = "prod" ]; then
  echo "Deploying to PROD (cckr2)..."
  vercel link --yes --project cckr2
  vercel deploy --prod --yes
  echo "Re-linking to DEV (cckr)..."
  vercel link --yes --project cckr
  echo "PROD deploy complete. Re-linked to cckr."
else
  # Verify we're linked to cckr
  LINKED=$(cat .vercel/project.json 2>/dev/null | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
  if [ "$LINKED" != "cckr" ]; then
    echo "WARNING: Linked to '$LINKED' instead of 'cckr'. Re-linking..."
    vercel link --yes --project cckr
  fi
  echo "Deploying to DEV (cckr)..."
  vercel deploy --prod --yes
  echo "DEV deploy complete."
fi
