# Release Checklist

## ✅ Technical (Blockers) - COMPLETED
- [x] Restore native plugins (currently stripped for web)
  - [x] `livekit_client` + `flutter_webrtc` for real audio
  - [x] `geolocator` for GPS
  - [x] `permission_handler` for mic/location permissions
  - [x] `flutter_background_service` for background tracking
- [ ] Build toolchains
  - [ ] macOS + Xcode for iOS
  - [ ] Android SDK + Java/Kotlin toolchain for Android
- [x] Real services
  - [x] Phone verification (Twilio Verify)
  - [x] Production Redis (Railway Redis)
  - [x] LiveKit server (LiveKit Cloud)
  - [x] HTTPS backend with Railway domain + SSL

## 🌐 Web App - DEPLOYED
- [x] Flutter web build served at https://locus-production-99b7.up.railway.app
- [x] Next.js frontend (requires Railway dashboard config: Root Directory = `frontend`)
- [x] Server health check: https://locus-production-99b7.up.railway.app/health

## 📱 App Store Requirements
- [ ] **Apple Developer account** ($99/yr)
- [ ] **Google Play Console** ($25 one-time)
- [ ] App icons (1024x1024), launch screens, screenshots for all device sizes
- [ ] Privacy policy URL, terms of service, support URL
- [ ] App Store description, keywords, promotional text
- [ ] Content rating questionnaire, data safety form (Google)
- [ ] TestFlight beta testing (iOS) / Internal testing track (Android)

## 🛡️ Compliance & Legal
- [ ] GDPR/CCPA privacy policy (data collection, retention, deletion)
- [ ] COPPA compliance if under-13 users possible
- [ ] Age rating justification
- [ ] Data safety disclosures (location, microphone, contacts)
- [ ] In-app purchase setup if premium features exist
- [ ] Account deletion flow (required by Apple)

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
- [ ] Onboarding validation errors (phone, username) should only appear after the user clicks Continue, not while typing. Prevent submission instead of interrupting with live errors.
- [ ] See friends on map with distinct markers
- [ ] Reciprocal pin notification (popup to pin back or remove)
- [ ] Relocate button — recenter map on user's location when they've panned away
- [ ] Build a marketing landing page (replace the current minimal one)
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
