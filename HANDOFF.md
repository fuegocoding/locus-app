You are continuing development of **Locus**, a proximity-based voice chat and convoy app. The app uses Flutter (mobile + web) and a Node.js/Express backend deployed on Railway with PostgreSQL, Redis, LiveKit Cloud, and Twilio Verify.

## Handoff Context

### Repo
- GitHub: `https://github.com/fuegocoding/locus-app`
- hosted with Railway: `https://locus-production-99b7.up.railway.app` (Flutter web at `/app`)
- Landing page: `/`, Privacy: `/privacy`, Terms: `/terms`, Flutter web: `/app`

### Branch & Status
- Branch: `master` — all recent work committed and pushed
- Latest tag: `v1.0.0` with signed release APK on GitHub Releases
- No uncommitted changes; clean working tree

### Tech Stack
- **Flutter** (app/) — mobile-first Android/iOS/web client
  - Maps: `flutter_map` + OpenStreetMap tiles
  - Voice: `livekit_client` + `flutter_webrtc`
  - State: `provider` (`ChangeNotifierProvider` at root, `ChangeNotifier` subclasses)
  - Socket: `socket_io_client`
  - Background location: `flutter_background_service`
- **Node.js/Express** (server/) — backend
  - TypeScript with `tsx` runner
  - ORM: Prisma (PostgreSQL)
  - Auth: phone OTP via Twilio Verify
  - Real-time: Socket.IO
  - Voice signaling: LiveKit Cloud
  - Session: Redis (connect-redis + express-session)
  - Rate limiting: `express-rate-limit` with Redis store

### Architecture Overview

```
app/
├── lib/
│   ├── main.dart                 # App entry, ChangeNotifierProvider wraps LocusApp
│   ├── screens/
│   │   ├── splash_screen.dart    # Logo + spinner → auto-navigate
│   │   ├── onboarding_screen.dart # Phone auth + code verification
│   │   ├── home_screen.dart      # Main map + Stack (mic, speedometer, relocate btn)
│   │   ├── settings_screen.dart  # Account details, logout, delete account
│   │   ├── social_tab.dart       # Friends list, requests, search
│   │   └── profile_setup_screen.dart # Username + avatar setup
│   ├── providers/
│   │   └── app_state.dart        # Central ChangeNotifier — all app state lives here
│   ├── services/
│   │   ├── api_service.dart      # HTTP client (singleton) — all REST calls
│   │   ├── socket_service.dart   # Socket.IO client — all real-time events
│   │   └── location_service.dart # Geolocator + background location
│   └── widgets/
│       ├── map_widget.dart       # FlutterMap + markers, public MapWidgetState
│       ├── convoy_panel.dart     # Convoy creation & management
│       ├── video_grid.dart       # LiveKit video tiles
│       └── proximity_overlay.dart# Nearby users overlay
│
server/
├── src/
│   ├── index.ts                  # Express app, CORS, sessions, routes
│   ├── routes/
│   │   ├── auth.ts               # Phone send/code verify/session management
│   │   └── social.ts             # Friend requests, accept/reject, locations, account deletion
│   ├── socket/
│   │   └── index.ts              # Socket.IO events (presence, location, pin, convoy)
│   ├── middleware/
│   │   └── auth.ts               # Session auth middleware
│   └── types/
│       └── index.ts              # Socket event type constants
├── prisma/
│   └── schema.prisma             # User, Friendship, FriendRequest models
├── Dockerfile                    # Multi-stage Node build for Railway
└── railway.json                  # Railway deployment config

assets/
└── app_icon.svg                  # Original SVG source for icon
```

### Key Design Decisions & Conventions
- **Purple theme** uses `0xFFC4B5FD` (light lavender) everywhere — NEVER `0xFF6C63FF` or blue
- **Buttons** use Material `InkWell` with ripple — never bare `GestureDetector` for tappables
- **Validation** (phone, username) only shows errors after tapping Continue, not while typing
- **Friend search** opens keyboard automatically; friends sheet is a `DraggableScrollableSheet`
- **MapWidget** exposes `MapWidgetState` via `GlobalKey<MapWidgetState>` for `recenterOnUser()` and `followingUser` flag
- **Relocate button** lives in `home_screen.dart` Stack (not MapWidget), positioned `_floatBottom(bottomSafe) + 80` above speedometer
- **Friend locations** polled every 5s (REST) + real-time socket pushes — both paths update the same map markers
- **Dot syntax** in TS/JS: `const location = (globalThis as any).__LOCATION__` style is used for fragile cross-context values; prefer proper typing when refactoring

### What's Done
- App icon (SVG → 1024×1024 PNG) configured via `flutter_launcher_icons` — Android adaptive + iOS all sizes
- In-app logo in splash screen and onboarding uses the app icon PNG from `assets/icon/app_icon.png`
- Friends on map with green circle markers (REST poll + socket push)
- Reciprocal pin notification ("X pinned you on the map!" banner)
- Privacy / Terms pages at `/privacy` and `/terms`
- Marketing landing page at `/`
- Flutter web served at `/app` (not root)
- CORS allows DELETE method
- Friends list, friend requests, friend search in social tab
- Settings screen fully built (username, phone, logout, delete account)
- Convoy system (create, join via invite link, invite friends)
- Proximity-based voice chat via LiveKit
- Background location service
- Phone auth with Twilio Verify
- Release APK signed and on GitHub Releases (v1.0.0)
- Railway deployment working (server at `https://locus-production-99b7.up.railway.app`)

### What's Next / Blocked
The following items need user-provided accounts or secrets:
- **Apple Developer account** ($99/yr) + macOS + Xcode for iOS builds
- **Google Play Console** ($25 one-time) — need to create store listing, complete content rating form
- **Firebase project** for Crashlytics + Cloud Messaging (push notifications) — need `google-services.json` and `GoogleService-Info.plist`
- **Real device screenshots** for app store listings (all required sizes)
- **App Store / Play Store descriptions**, keywords, promotional text

Other potential work:
- Flutter SDK/package upgrades (many packages have newer versions, see `flutter pub outdated`)
- LiveKit room lifecycle improvements (auto-cleanup idle rooms)
- Push notification integration (when not in app)
- iOS entitlements / capability setup for background audio + location

### Environment
- Flutter SDK: stable channel
- Server runs on Node.js via `tsx` (`npx tsx src/index.ts`)
- TypeScript checking: `npx tsc --noEmit` (passes)
- Railway CLI logged in as `fuegocoding@gmail.com`
- The `.env` file in server/ contains DATABASE_URL, REDIS_URL, TWILIO_*, LIVEKIT_*, SESSION_SECRET — do not log/commit

### Testing
- No test framework set up yet (room for improvement)
- Verification: `flutter build apk --debug` / `flutter build apk --release`
- Server: manual testing via the running Railway instance
