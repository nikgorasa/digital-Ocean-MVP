#!/bin/bash
# GoRASA Pre-Flight Check (Standalone)
# Routes to Governance/scripts/Cckr-preflight-check.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

exec bash "$REPO_ROOT/Governance/scripts/Cckr-preflight-check.sh"
