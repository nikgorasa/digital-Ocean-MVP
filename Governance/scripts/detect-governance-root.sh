#!/bin/bash
# GoRASA Governance Root Detection
# Determines which governance protocol instance to use based on $PWD.
# Usage: source scripts/detect-governance-root.sh
#        OR eval "$(scripts/detect-governance-root.sh --export)"

set -euo pipefail

ROOT_DIR="/home/nikhil/Downloads/Gorasa/App-1/rasa-zero-app-main"
CCKR_DIR="$ROOT_DIR/cockroach-standalone"

# Detect governance instance from PWD
if echo "$PWD" | grep -q "/cockroach-standalone"; then
  GOVERNANCE_TYPE="cckr"
  GOVERNANCE_ROOT="$CCKR_DIR"
  DOCS_PREFIX="Cckr-"
  GOV_SOURCE_OF_TRUTH="Cckr-GOVERNANCE.md"
  PREFLIGHT_SCRIPT="$CCKR_DIR/scripts/Cckr-preflight-check.sh"
  POSTTASK_SCRIPT="$CCKR_DIR/scripts/Cckr-post-task-check.sh"
  DOCS_MEMORY="Cckr-MEMORY.md"
  DOCS_CHANGELOG="Cckr-CHANGE-LOG.md"
  DOCS_CONFIG="Cckr-CONFIG-REFERENCE.md"
  DOCS_LEARNING="Cckr-LEARNING-FROM-MISTAKES.md"
  DOCS_DEPLOYLOG="Cckr-DEPLOYMENT_LOG.md"
  DOCS_DBCHANGES="Cckr-DB-CHANGES.md"
  DOCS_SPRINT="Cckr-Sprint-1.md"
else
  GOVERNANCE_TYPE="main"
  GOVERNANCE_ROOT="$ROOT_DIR"
  DOCS_PREFIX=""
  GOV_SOURCE_OF_TRUTH="gorasa-next/AGENTS.md"
  PREFLIGHT_SCRIPT="$ROOT_DIR/gorasa-next/scripts/preflight-check.sh"
  POSTTASK_SCRIPT="$ROOT_DIR/gorasa-next/scripts/post-task-check.sh"
  DOCS_MEMORY="MEMORY.md"
  DOCS_CHANGELOG="CHANGE-LOG.md"
  DOCS_CONFIG="CONFIG-REFERENCE.md"
  DOCS_LEARNING="LEARNING-FROM-MISTAKES.md"
  DOCS_DEPLOYLOG="DEPLOYMENT_LOG.md"
  DOCS_DBCHANGES="DB-CHANGES.md"
  DOCS_SPRINT="Sprint-1.md"
fi

# Determine whether we're being sourced or called
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
  # Being sourced — export variables into caller's shell
  export GOVERNANCE_TYPE GOVERNANCE_ROOT DOCS_PREFIX
  export GOV_SOURCE_OF_TRUTH PREFLIGHT_SCRIPT POSTTASK_SCRIPT
  export DOCS_MEMORY DOCS_CHANGELOG DOCS_CONFIG DOCS_LEARNING
  export DOCS_DEPLOYLOG DOCS_DBCHANGES DOCS_SPRINT
else
  # Being called as a script
  if [[ "${1:-}" == "--export" ]]; then
    cat <<EOF
GOVERNANCE_TYPE=$GOVERNANCE_TYPE
GOVERNANCE_ROOT=$GOVERNANCE_ROOT
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
    echo "DOCS_PREFIX=$DOCS_PREFIX"
    echo "ACTIVE_PROTOCOL=$GOV_SOURCE_OF_TRUTH"
    echo "PREFLIGHT=$PREFLIGHT_SCRIPT"
    echo "POSTTASK=$POSTTASK_SCRIPT"
  fi
fi
