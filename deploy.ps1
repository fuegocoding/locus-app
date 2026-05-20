# Locus Production Deployment Script (PowerShell)
# Run this after: railway login

Write-Host "=== Locus Production Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check Railway CLI
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Railway CLI not installed. Run: npm i -g @railway/cli" -ForegroundColor Red
    exit 1
}

# Check login
try {
    railway whoami 2>&1 | Out-Null
} catch {
    Write-Host "Please login to Railway first:" -ForegroundColor Yellow
    Write-Host "  railway login" -ForegroundColor Yellow
    exit 1
}

Write-Host "1. Creating Railway project..." -ForegroundColor Green
railway init --name locus-server 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "   Project may already exist" -ForegroundColor Yellow }

Write-Host ""
Write-Host "2. Linking project..." -ForegroundColor Green
railway link 2>$null

Write-Host ""
Write-Host "3. Adding Upstash Redis..." -ForegroundColor Green
railway add upstash-redis 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "   Redis may already be added" -ForegroundColor Yellow }

Write-Host ""
Write-Host "4. Deploying server..." -ForegroundColor Green
Set-Location server
railway up

Write-Host ""
Write-Host "5. Getting Railway URL..." -ForegroundColor Green
$RAILWAY_URL = railway domain 2>$null
Write-Host "   Server URL: $RAILWAY_URL" -ForegroundColor Cyan

Write-Host ""
Write-Host "6. Set these environment variables in Railway dashboard:" -ForegroundColor Yellow
Write-Host "   NODE_ENV=production"
Write-Host "   JWT_SECRET=<generate-with-openssl-rand-hex-32>"
Write-Host "   REDIS_URL=<from-upstash>"
Write-Host "   LIVEKIT_URL=<from-livekit-cloud>"
Write-Host "   LIVEKIT_API_KEY=<from-livekit>"
Write-Host "   LIVEKIT_API_SECRET=<from-livekit>"
Write-Host "   TWILIO_ACCOUNT_SID=<from-twilio>"
Write-Host "   TWILIO_AUTH_TOKEN=<from-twilio>"
Write-Host "   TWILIO_VERIFY_SERVICE_SID=<from-twilio>"
Write-Host "   ALLOWED_ORIGINS=$RAILWAY_URL"

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "Update app/lib/providers/app_state.dart with your Railway URL"
Write-Host "Then build Flutter: flutter build web --release && flutter build apk --release"
