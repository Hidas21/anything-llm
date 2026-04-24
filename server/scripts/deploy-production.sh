#!/bin/bash
# =============================================================================
# Production deploy script — PostgreSQL
# =============================================================================
# Futtatás az éles szerveren branch csere után:
#   bash server/scripts/deploy-production.sh
#
# Feltételek:
#   - DATABASE_URL be van állítva a .env-ben PostgreSQL connection string-re
#   - yarn install már lefutott
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"
SCHEMA="$SERVER_DIR/prisma/schema.prisma"

echo "============================================="
echo " Production deploy — PostgreSQL"
echo "============================================="

# 1. Átírjuk a schema provider-t postgresql-re
echo "[1] schema.prisma: provider -> postgresql"
sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA"
sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SERVER_DIR/prisma/migrations/migration_lock.toml"

# 2. Prisma client újragenerálás
echo "[2] Prisma client generálás..."
cd "$SERVER_DIR"
npx prisma generate

# 3. Migrációk lefuttatása
echo "[3] Prisma migrate deploy..."
npx prisma migrate deploy

# 4. Fájl-workspace migráció (első deploy-nál szükséges)
echo "[4] Fájl-workspace migráció..."
node scripts/migrate-file-ownership.js

echo ""
echo "============================================="
echo " Kész! Indítsd el a szervert: yarn start"
echo "============================================="
