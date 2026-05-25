# Release Checklist

## ✅ Technical (Blockers) - COMPLETED
- [x] Restore native plugins (currently stripped for web)
  - [x] `livekit_client` + `flutter_webrtc` for real audio
  - [x] `geolocator` for GPS
  - [x] `permission_handler` for mic/location permissions
  - [x] `flutter_background_service` for background tracking
- [ ] Build toolchains (user action needed)
  - [ ] macOS + Xcode for iOS
  - [x] Android SDK + Kotlin toolchain (verified working)
- [x] Real services
  - [x] Phone verification (Twilio Verify)
  - [x] Production Redis (Railway Redis)
  - [x] LiveKit server (LiveKit Cloud)
  - [x] HTTPS backend with Railway domain + SSL

## 🌐 Web App - DEPLOYED
- [x] Marketing landing page at `locus-production-99b7.up.railway.app/` with hero, features, CTA
- [x] Privacy policy at `/privacy`, Terms of Service at `/terms`
- [x] Flutter web build served at `/app`
- [x] Server health check at `/health`
- [x] Next.js frontend (requires Railway dashboard config: Root Directory = `frontend`)

## 📱 App Store Requirements
- [ ] **Apple Developer account** ($99/yr)
- [ ] **Google Play Console** ($25 one-time)
- [x] App icons (generated from SVG — Android adaptive + iOS all sizes)
- [x] Privacy policy URL, terms of service, support URL (`/privacy`, `/terms`)
- [ ] App Store description, keywords, promotional text
- [ ] Content rating questionnaire, data safety form (Google)
- [ ] TestFlight beta testing (iOS) / Internal testing track (Android)

## 🛡️ Compliance & Legal
- [x] GDPR/CCPA privacy policy (hosted at `/privacy`)
- [x] Terms of Service (hosted at `/terms`)
- [ ] COPPA compliance if under-13 users possible
- [ ] Age rating justification
- [ ] Data safety disclosures (location, microphone, contacts)
- [ ] In-app purchase setup if premium features exist
- [x] Account deletion flow (required by Apple)

##  Testing
- [ ] Real device testing (iPhone + Android, multiple OS versions)
- [ ] Background location/audio behavior
- [ ] Network resilience (offline, poor signal, airplane mode)
- [ ] Battery drain testing
- [ ] Crash reporting (Firebase Crashlytics / Sentry)
- [ ] Analytics integration
- [ ] Accessibility (VoiceOver, TalkBack)

## 🏗️ Infrastructure - DEPLOYED
- [x] Production backend deployment on Railway
- [x] Redis (Railway Redis)
- [x] LiveKit Cloud for WebRTC audio
- [x] Twilio Verify for phone auth
- [x] PostgreSQL database for user profiles, convoys, tasks, social features
- [ ] CDN for assets
- [ ] Monitoring/alerting (logs, metrics, uptime)
- [ ] CI/CD pipeline for automated builds

## ✨ Missing Features
- [ ] Real-time audio quality optimization (echo cancellation, noise suppression)
- [ ] Localization (i18n)
- [ ] StreetPass encounter journal
- [ ] Tasks/rewards system backend
- [ ] Premium subscription flow

## ✅ Social Features - DEPLOYED
- [x] Friend system: follow/unfollow users, friend list (mutual follows)
- [x] Quick convoy invitation from friend list
- [x] Search users by display name
- [x] Push notifications for new followers and convoy invites
- [x] Convoy invite accept/decline with Socket.io real-time updates
- [x] Realtime invite banners in-app
- [x] Friends sheet with DraggableScrollableSheet (swipe to expand)
- [x] "Find People" search with auto-focus keyboard

## 🎨 UI Polish - COMPLETED
- [x] Removed all `Colors.blue` references from codebase, replaced with purple theme (`0xFF6C63FF`, `0xFFC4B5FD`)
- [x] Converted GestureDetector-based buttons to Material InkWell for proper ripple/splash effects
- [x] Applied purple theme to convoy panel, video grid, home screen mode indicator and Live badge

## 🧹 Backlog
- [ ] **Map profile pictures** — Show other users as their profile picture on the map (only within radius). Friends visible anytime, anywhere. Clicking a user's pfp shows a popup with their address and a Directions button that opens the default maps app.
  - Update `PresenceUpdate` types (frontend + Redis) to include `displayName`, `avatar`, `anonymousMode`
  - Store/retrieve avatar in Redis presence data
  - Socket handler: include avatar in presence broadcasts and `friends:location` events
  - Frontend store: track `friendLocations` with `friends:location` socket listener
  - `MapView` component: render profile pics, friend markers (always visible, distinct style), click handler
  - New `UserPopup` component: reverse geocode address, Directions → open default maps app via `maps:` / Google Maps URL
- [x] Onboarding validation errors (phone, username) should only appear after the user clicks Continue, not while typing. Prevent submission instead of interrupting with live errors.
- [x] See friends on map with distinct green markers
- [x] Reciprocal pin notification (banner when someone pins you, with Pin back button)
- [x] Relocate button — recenter map on user's location when they've panned away
- [x] Build a marketing landing page at `/` with hero, features grid, CTA links
- [ ] Implement link sharing and referral flow (earn points for invites)
- [ ] Android overlay feature (pop-up/bubble like Messenger) for quick voice access while using other apps
- [ ] QR code friends — scan personal QR to add friends
  - [ ] Personal QR code on profile/settings (others scan to add you)
  - [ ] QR code reader in Find People screen (share + scan buttons below search bar)
  - [ ] Also accessible from the existing Share button in the top bar

## 🚀 Future Roadmap
### Profile & Identity
- [ ] User profile customization with flairs and banners (RL-style)
- [ ] Car make/model selection with cutout image on map
- [ ] Custom vehicle tags / license plates

### Social & Friends
- [ ] Friend system: add/remove friends, friend list
- [ ] Quick convoy invitation from friend list
- [ ] Nearby user actions: pin, block, add friend
- [ ] Reciprocal pin notification (popup to pin back or remove)
- [ ] See friends on map with distinct markers

### Audio & Channels
- [ ] Spatial audio (directional sound based on position)
- [ ] Group chats for convoys (text + voice)
- [ ] Community channels (persistent, larger-scale voice rooms)

### Exploration & Gamification
- [ ] % of map explored tracking
- [ ] Exploration achievements/badges
- [ ] Shop for cosmetics, flairs, vehicle customizations
