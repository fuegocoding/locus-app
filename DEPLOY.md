# Locus Production Deployment Guide

## Prerequisites

1. **Railway Pro account** (you have this)
2. **Railway CLI**: `npm i -g @railway/cli`
3. **Flutter SDK** (for mobile builds): https://docs.flutter.dev/get-started/install
4. **Twilio account** (for phone verification): https://twilio.com
5. **LiveKit Cloud account** (for WebRTC audio): https://livekit.io (free tier: 100 participants)

---

## Step 1: Deploy Backend to Railway

### 1.1 Login to Railway

```bash
railway login
```

### 1.2 Create Project

```bash
cd locus
railway init --name locus-server
```

### 1.3 Add Upstash Redis

In Railway dashboard:
1. Go to your project → **New** → **Database** → **Upstash Redis**
2. Copy the Redis URL from the variables

Or via CLI:
```bash
railway add upstash-redis
```

### 1.4 Deploy Server

```bash
cd server
railway up
```

### 1.5 Set Environment Variables

In Railway dashboard → Variables, set:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Run: `openssl rand -hex 32` |
| `REDIS_URL` | From Upstash Redis service |
| `LIVEKIT_URL` | From LiveKit Cloud (wss://...) |
| `LIVEKIT_API_KEY` | From LiveKit Cloud |
| `LIVEKIT_API_SECRET` | From LiveKit Cloud |
| `TWILIO_ACCOUNT_SID` | From Twilio Console |
| `TWILIO_AUTH_TOKEN` | From Twilio Console |
| `TWILIO_VERIFY_SERVICE_SID` | From Twilio Verify service |
| `ALLOWED_ORIGINS` | Your Railway domain (e.g., `https://locus-server-production.up.railway.app`) |

### 1.6 Verify Deployment

```bash
# Get your Railway domain
railway domain

# Test health endpoint
curl https://YOUR_RAILWAY_DOMAIN.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123.456,
  "environment": "production",
  "services": {
    "redis": "connected",
    "livekit": "unknown"
  }
}
```

---

## Step 2: Setup Twilio Verify

### 2.1 Create Verify Service

1. Go to https://console.twilio.com/
2. Navigate to **Verify** → **Services**
3. Click **Create new service**
4. Name it "Locus"
5. Copy the **Service SID** (starts with `VA...`)

### 2.2 Get Account Credentials

1. Go to https://console.twilio.com/
2. Copy **Account SID** (starts with `AC...`)
3. Copy **Auth Token** (click "Show" to reveal)

### 2.3 Set Variables in Railway

Add these to your Railway project variables (see Step 1.5).

---

## Step 3: Setup LiveKit Cloud

### 3.1 Create Project

1. Go to https://cloud.livekit.io/
2. Sign up and create a new project
3. Copy the **URL** (wss://...)
4. Go to **Settings** → **API Keys**
5. Create a new API key and copy the **Key** and **Secret**

### 3.2 Set Variables in Railway

Add these to your Railway project variables (see Step 1.5).

---

## Step 4: Update Flutter App

### 4.1 Update Production URL

Edit `app/lib/providers/app_state.dart`:

```dart
static const String _prodUrl = 'https://YOUR_RAILWAY_DOMAIN.up.railway.app';
```

### 4.2 Generate Native Platforms

```bash
cd app
flutter create .
```

### 4.3 Install Dependencies

```bash
flutter pub get
```

### 4.4 Build Web App

```bash
flutter build web --release
```

The web build will be served by the Express server at `/build/web`.

### 4.5 Build Android APK

```bash
flutter build apk --release
```

Output: `app/build/app/outputs/flutter-apk/app-release.apk`

### 4.6 Build iOS IPA (macOS + Xcode required)

```bash
flutter build ipa --release
```

Output: `app/build/ios/ipa/locus.ipa`

---

## Step 5: Deploy Web App

The Flutter web build is already served by the Express server. After building:

```bash
cd app
flutter build web --release
```

Then redeploy the server:

```bash
cd ../server
railway up
```

Your web app will be available at: `https://YOUR_RAILWAY_DOMAIN.up.railway.app`

---

## Step 6: App Store Preparation

### 6.1 Generate App Icons

```bash
cd app
# Place your 1024x1024 icon at assets/icon/app_icon.png
flutter pub run flutter_launcher_icons
```

### 6.2 Android App Bundle (for Google Play)

```bash
flutter build appbundle --release
```

Output: `app/build/app/outputs/bundle/release/app-release.aab`

### 6.3 iOS Archive (for App Store Connect)

```bash
flutter build ipa --release
```

Then open `app/build/ios/archive/Runner.xcarchive` in Xcode and upload via App Store Connect.

---

## Step 7: Testing

### 7.1 Test Phone Verification

```bash
# Dev mode (any code works)
curl -X POST https://YOUR_RAILWAY_DOMAIN/api/auth/verify/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+15551234567"}'

# Verify with code 123456 (dev mode)
curl -X POST https://YOUR_RAILWAY_DOMAIN/api/auth/verify/check \
  -H "Content-Type: application/json" \
  -d '{"phone": "+15551234567", "code": "123456"}'
```

### 7.2 Test WebSocket Connection

Use the Flutter app or a WebSocket client to connect to:
```
wss://YOUR_RAILWAY_DOMAIN.up.railway.app
```

---

## Troubleshooting

### Redis Connection Failed

- Check `REDIS_URL` is correct
- Ensure Upstash Redis is in the same Railway project
- Check network settings in Upstash dashboard

### LiveKit Connection Failed

- Verify `LIVEKIT_URL` uses `wss://` for production
- Check API key/secret match LiveKit Cloud
- Ensure LiveKit project is active

### Twilio Verification Failed

- Verify Service SID is correct
- Check account balance (Twilio trial has limits)
- Ensure phone number format is E.164 (+15551234567)

### Flutter Build Fails

- Run `flutter doctor` to check setup
- Ensure Android SDK / Xcode are installed
- Run `flutter pub get` before building

---

## Costs

| Service | Cost |
|---------|------|
| Railway Pro | $20/mo (you have this) |
| Upstash Redis | Free tier (10k commands/day) |
| LiveKit Cloud | Free tier (100 participants, 10GB transfer) |
| Twilio Verify | ~$0.05 per verification |
| Apple Developer | $99/year |
| Google Play | $25 one-time |

---

## Next Steps After Launch

1. **Monitor**: Set up Railway alerts, check logs regularly
2. **Analytics**: Add Firebase Analytics for user metrics
3. **Crash Reporting**: Firebase Crashlytics is already in pubspec.yaml
4. **Push Notifications**: Add Firebase Cloud Messaging when ready
5. **Scale**: Upgrade Redis/LiveKit tiers as user base grows
