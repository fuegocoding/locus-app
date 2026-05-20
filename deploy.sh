#!/bin/bash
set -e

echo "=== Locus Production Deployment ==="
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "Error: Railway CLI not installed. Run: npm i -g @railway/cli"
    exit 1
fi

# Check login
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway first:"
    echo "  railway login"
    exit 1
fi

echo "1. Creating Railway project..."
railway init --name locus-server 2>/dev/null || echo "Project may already exist"

echo ""
echo "2. Linking project..."
railway link 2>/dev/null || true

echo ""
echo "3. Adding Upstash Redis..."
railway add upstash-redis 2>/dev/null || echo "Redis may already be added"

echo ""
echo "4. Deploying server..."
cd server
railway up

echo ""
echo "5. Getting Railway URL..."
RAILWAY_URL=$(railway domain 2>/dev/null || echo "")
echo "Server URL: $RAILWAY_URL"

echo ""
echo "6. Set these environment variables in Railway dashboard:"
echo "   NODE_ENV=production"
echo "   JWT_SECRET=<generate-with-openssl-rand-hex-32>"
echo "   REDIS_URL=<from-upstash>"
echo "   LIVEKIT_URL=<from-livekit-cloud>"
echo "   LIVEKIT_API_KEY=<from-livekit>"
echo "   LIVEKIT_API_SECRET=<from-livekit>"
echo "   TWILIO_ACCOUNT_SID=<from-twilio>"
echo "   TWILIO_AUTH_TOKEN=<from-twilio>"
echo "   TWILIO_VERIFY_SERVICE_SID=<from-twilio>"
echo "   ALLOWED_ORIGINS=$RAILWAY_URL"

echo ""
echo "=== Deployment Complete ==="
echo "Update app/lib/providers/app_state.dart with your Railway URL"
echo "Then build Flutter: flutter build web --release && flutter build apk --release"
