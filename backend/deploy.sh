#!/usr/bin/env bash
# Run on the server from the backend folder: ./deploy.sh
set -e

git pull
npm install --include=dev
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart syncbeat-api || pm2 start dist/index.js --name syncbeat-api
pm2 save
