#!/bin/sh
set -e

echo "Starting LeadQuality..."

# Auto-initialize database: create tables + seed admin
echo "Running Prisma db push..."
npx prisma db push --skip-generate --accept-data-loss
echo "Database tables ready."

echo "Running seed..."
node seed.js
echo "Seed complete."

# Start Next.js
echo "Starting Next.js..."
exec node server.js
