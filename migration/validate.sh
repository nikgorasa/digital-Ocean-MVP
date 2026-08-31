#!/bin/bash
set -euo pipefail

echo "=== Migration Validation ==="
echo "Checking environment..."

if [ -f .env ]; then
  echo "✓ .env exists"
else
  echo "✗ .env missing - copy from .env.example"
  exit 1
fi

command -v node >/dev/null 2>&1 || { echo "✗ node not found"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "✗ npm not found"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "✗ psql not found"; exit 1; }

echo "✓ All prerequisites met"
echo "Validation complete."