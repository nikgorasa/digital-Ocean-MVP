#!/bin/bash
# Data migration script: Supabase → Neon Dev/QA
# This script exports data from Supabase and imports to both Neon databases

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXPORT_DIR="$PROJECT_DIR/data-export"

mkdir -p "$EXPORT_DIR"

echo "=== Supabase → Neon Data Migration ==="
echo "This will export all data from Supabase and import to Neon Dev + QA"
echo ""

# We'll use psql through the Neon MCP or direct connection
# For now, create the SQL files that can be executed

cat > "$EXPORT_DIR/01-roles.sql" << 'EOSQL'
-- Roles (independent table)
INSERT INTO "Role" (id, name, label, description, permissions, "createdAt", "updatedAt") VALUES
('role_super_admin', 'SUPER_ADMIN', 'Super Admin', 'Full system access', '["all"]', NOW(), NOW()),
('role_admin', 'ADMIN', 'Admin', 'Administrative access', '["manage_users","manage_packages","manage_bookings","manage_leads"]', NOW(), NOW()),
('role_sales', 'SALES', 'Sales', 'Sales team access', '["manage_leads","view_bookings","manage_customers"]', NOW(), NOW()),
('role_customer', 'CUSTOMER', 'Customer', 'Customer access', '["view_packages","create_bookings","view_own_bookings"]', NOW(), NOW()),
('role_corporate', 'CORPORATE_USER', 'Corporate User', 'Corporate customer access', '["view_packages","create_bookings","view_own_bookings","corporate_rates"]', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
EOSQL

echo "Created role migration SQL"
echo "Next: Need to export actual data from Supabase using MCP"
