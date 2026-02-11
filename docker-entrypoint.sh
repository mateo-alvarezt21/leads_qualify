#!/bin/sh
echo "Starting LeadQuality..."

# Auto-initialize database: create tables + seed admin
echo "Running Prisma db push..."
npx prisma db push --skip-generate --accept-data-loss 2>&1
echo "Database tables ready."

echo "Running seed..."
node seed.js 2>&1
echo "Seed complete."

# Start Next.js
exec node server.js
