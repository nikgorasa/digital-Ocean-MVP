#!/bin/bash
# GoRASA Governance Root Detection (Standalone)
# Determines which governance protocol instance to use based on $PWD.
# Usage: source scripts/detect-governance-root.sh
#        OR eval "$(scripts/detect-governance-root.sh --export)"

set -euo pipefail

# Resolve repo root from the script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GOVERNANCE_ROOT="$REPO_ROOT/Governance"
DOCS_DIR="$GOVERNANCE_ROOT/docs/governance"

# This is always the standalone instance
GOVERNANCE_TYPE="cckr"
DOCS_PREFIX="Cckr-"
GOV_SOURCE_OF_TRUTH="Cckr-GOVERNANCE.md"
PREFLIGHT_SCRIPT="$GOVERNANCE_ROOT/scripts/Cckr-preflight-check.sh"
POSTTASK_SCRIPT="$GOVERNANCE_ROOT/scripts/Cckr-post-task-check.sh"
DOCS_MEMORY="$DOCS_DIR/Cckr-SESSION-LOG.md"
DOCS_CHANGELOG="$DOCS_DIR/CHANGE-LOG.md"
DOCS_CONFIG="$DOCS_DIR/Cckr-CONFIG-REFERENCE.md"
DOCS_LEARNING="$DOCS_DIR/LEARNING-FROM-MISTAKES.md"
DOCS_DEPLOYLOG="$DOCS_DIR/DEPLOYMENT-LOG.md"
DOCS_DBCHANGES="$DOCS_DIR/DB-CHANGES.md"
DOCS_SPRINT="$DOCS_DIR/VERSION.md"

# Determine whether we're being sourced or called
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
  # Being sourced — export variables into caller's shell
  export GOVERNANCE_TYPE GOVERNANCE_ROOT DOCS_PREFIX DOCS_DIR
  export GOV_SOURCE_OF_TRUTH PREFLIGHT_SCRIPT POSTTASK_SCRIPT
  export DOCS_MEMORY DOCS_CHANGELOG DOCS_CONFIG DOCS_LEARNING
  export DOCS_DEPLOYLOG DOCS_DBCHANGES DOCS_SPRINT
else
  # Being called as a script
  if [[ "${1:-}" == "--export" ]]; then
    cat <<EOF
GOVERNANCE_TYPE=$GOVERNANCE_TYPE
GOVERNANCE_ROOT=$GOVERNANCE_ROOT
DOCS_DIR=$DOCS_DIR
DOCS_PREFIX=$DOCS_PREFIX
GOV_SOURCE_OF_TRUTH=$GOV_SOURCE_OF_TRUTH
PREFLIGHT_SCRIPT=$PREFLIGHT_SCRIPT
POSTTASK_SCRIPT=$POSTTASK_SCRIPT
DOCS_MEMORY=$DOCS_MEMORY
DOCS_CHANGELOG=$DOCS_CHANGELOG
DOCS_CONFIG=$DOCS_CONFIG
DOCS_LEARNING=$DOCS_LEARNING
DOCS_DEPLOYLOG=$DOCS_DEPLOYLOG
DOCS_DBCHANGES=$DOCS_DBCHANGES
DOCS_SPRINT=$DOCS_SPRINT
EOF
  else
    echo "GOVERNANCE_TYPE=$GOVERNANCE_TYPE"
    echo "GOVERNANCE_ROOT=$GOVERNANCE_ROOT"
    echo "DOCS_DIR=$DOCS_DIR"
    echo "DOCS_PREFIX=$DOCS_PREFIX"
    echo "ACTIVE_PROTOCOL=$GOV_SOURCE_OF_TRUTH"
    echo "PREFLIGHT=$PREFLIGHT_SCRIPT"
    echo "POSTTASK=$POSTTASK_SCRIPT"
  fi
fi
