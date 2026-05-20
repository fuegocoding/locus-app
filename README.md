# Locus

Map-centric proximity chat app. Talk to people around you.

## Architecture

- **Client**: Flutter (iOS, Android, Web)
- **Backend**: Express.js + Socket.io
- **Presence**: Redis (geospatial)
- **Voice**: LiveKit (WebRTC SFU)
- **Auth**: Phone verification via Twilio

## Quick Start

### Local Development

```bash
# Start Redis + LiveKit
cd server
docker-compose up -d

# Start server
npm run dev

# Start Flutter app (in another terminal)
cd app
flutter run
```

### Production Deployment (Railway)

1. **Install Railway CLI**: `npm i -g @railway/cli`
2. **Login**: `railway login`
3. **Initialize project**: `railway init`
4. **Add Upstash Redis**: `railway add upstash-redis`
5. **Deploy server**: `railway up`
6. **Set environment variables**:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=$(openssl rand -hex 32)
   railway variables set REDIS_URL=<upstash-redis-url>
   railway variables set LIVEKIT_URL=<livekit-cloud-url>
   railway variables set LIVEKIT_API_KEY=<key>
   railway variables set LIVEKIT_API_SECRET=<secret>
   railway variables set TWILIO_ACCOUNT_SID=<sid>
   railway variables set TWILIO_AUTH_TOKEN=<token>
   railway variables set TWILIO_VERIFY_SERVICE_SID=<sid>
   ```
7. **Deploy LiveKit** (separate Railway service):
   ```bash
   cd server
   railway init --name locus-livekit
   railway up
   ```

### Flutter Build

```bash
# Generate native platforms (first time only)
flutter create .

# Install dependencies
flutter pub get

# Build web
flutter build web --release

# Build Android APK
flutter build apk --release

# Build iOS IPA (macOS + Xcode required)
flutter build ipa --release
```

## Environment Variables

See `server/.env.example` for all required variables.

## Features

- Phone verification (Twilio)
- Real-time GPS location
- Proximity voice chat with distance-based volume
- Dynamic auto-scaling proximity radius
- Pin users (3 free, unlimited premium)
- Private convoys with invite links/QR codes
- Push-to-talk and open mic
- Background operation
- Tasks and rewards system

## License

Private
