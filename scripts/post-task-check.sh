#!/bin/bash
# GoRASA Post-Task Check (Standalone)
# Routes to context-aware governance check in post-task phase.
#
# Usage:
#   bash scripts/post-task-check.sh                    # All checks (backward compatible)
#   bash scripts/post-task-check.sh --task tbo          # TBO work — relevant checks only
#   bash scripts/post-task-check.sh --task api_new      # New API route — relevant checks only
#   bash scripts/post-task-check.sh --quick             # Gating checks only
#
# Run with --help for all task types and options.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

exec bash "$REPO_ROOT/Governance/scripts/Cckr-governance-check.sh" --phase post-task "$@"
