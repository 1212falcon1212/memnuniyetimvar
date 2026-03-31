#!/bin/bash
set -e

ENV=${1:-production}
echo "=== MemnuniyetimVar Deploy ($ENV) ==="

# Pull latest
echo "[1/6] Git pull..."
git pull origin main

# Backend
echo "[2/6] Backend build..."
cd backend
npm ci --production=false
npm run build
cd ..

# Frontend
echo "[3/6] Frontend build..."
cd frontend
npm ci --production=false
npm run build
cd ..

# Admin
echo "[4/6] Admin build..."
cd admin
npm ci --production=false
npm run build
cd ..

# Migrations
echo "[5/6] Running migrations..."
cd backend
npm run migration:run
cd ..

# PM2 restart
echo "[6/6] Restarting PM2..."
pm2 startOrRestart ecosystem.config.js --env $ENV

echo "=== Deploy tamamlandi! ==="
pm2 status
