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

# ---------------------------------------------------------------
# Render (Web Service) settings — not used by this script
# ---------------------------------------------------------------
# Root Directory:    backend
# Runtime:           Node
# Build Command:     npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
# Start Command:     npm start
# Health Check Path: /health
# Instance:          Free (keep 1 instance, live rooms live in memory)
#
# Environment variables (do not set PORT, Render provides it):
#   NODE_ENV=production
#   DATABASE_URL=        Neon pooled URL (host has "-pooler")
#   DIRECT_URL=          Neon direct URL (no "-pooler")
#   GOOGLE_CLIENT_ID=
#   GOOGLE_CLIENT_SECRET=
#   JWT_ACCESS_SECRET=   32+ random chars, different from local
#   JWT_REFRESH_SECRET=  32+ random chars, different from local
#   JAMENDO_CLIENT_ID=
#   CLIENT_URL=http://localhost:5173,https://your-app.vercel.app
#
# After deploy: open https://<service>.onrender.com/health -> {"ok":true}
# Vercel: VITE_API_URL=https://<service>.onrender.com, VITE_GOOGLE_CLIENT_ID=<same as backend>
# Google Console: add the Vercel URL to Authorized JavaScript origins
