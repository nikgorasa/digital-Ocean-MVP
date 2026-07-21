#!/bin/bash
# GoRASA Pre-Flight Check (Standalone)
# Routes to context-aware governance check in preflight phase.
#
# Usage:
#   bash scripts/preflight-check.sh                    # All checks (backward compatible)
#   bash scripts/preflight-check.sh --task css          # CSS fix — 3 checks
#   bash scripts/preflight-check.sh --task tbo          # TBO work — 8 checks
#   bash scripts/preflight-check.sh --task api_new      # New API route — 7 checks
#   bash scripts/preflight-check.sh --quick             # Gating checks only
#
# Run with --help for all task types and options.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

exec bash "$REPO_ROOT/Governance/scripts/Cckr-governance-check.sh" --phase preflight "$@"
