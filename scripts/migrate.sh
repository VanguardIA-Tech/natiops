#!/bin/sh
set -e

echo "🚀 Rodando Prisma Migrate Deploy..."

export DATABASE_URL="$DATABASE_URL"

npx prisma migrate deploy

echo "✅ Migrations aplicadas com sucesso"
