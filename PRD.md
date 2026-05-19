# PRD — Locus

## Product summary

**Locus** is a map-centric proximity chat app modeled after Waze — a live map where users see nearby avatars and can talk to them based on real-time location. It supports two distinct modes: open proximity voice (hear and talk to anyone nearby, with volume scaling by distance) and private convoys ( persistent group channels for planned movement). The product launches for car convoys, meets, and road trips, but the core system is designed to expand into festivals, campuses, nightlife, and other in-person social contexts.

The name **Locus** signals place, position, and presence without locking the brand into driving. Other category names are already crowded: Vicinity is already a proximity chat app, Nearo is used for local deals, Proximi is used for location technology, NearBeam is used for local Wi-Fi file sharing, and Orbit is used by several social products.

## Problem

Current products split into two weak extremes. One group is push-to-talk for invited convoys only — useful but narrow. The other attempts "nearby chat" in a vague social way, but lacks a real-time voice layer, has poor adoption, or doesn't handle the moving-vehicle case well.

The ideal product is a live audio layer over physical space. The app knows where people are, determines who is nearby and relevant, and lets them communicate with minimal friction. That requires a location engine, real-time room logic, and low-latency voice infrastructure — not a static channel model.

## Vision

Locus should feel like Waze but with proximity chat. Users open the app and see a live map with nearby avatars. They can tap into proximity voice to hear and talk to people around them, with volume scaling naturally by distance — closer people are louder, farther people are quieter. They can pin specific users to keep them at normal volume regardless of distance. They can switch to convoy mode for private group communication.

The long-term vision is a full Waze-like platform: proximity chat and convoys form the core, but the map becomes a social navigation layer with user-submitted alerts, turn-by-turn directions, shared music, and community features. The car use case is the wedge because it has a clear pain point: groups get separated, nearby communication is poor, and existing options are fragmented across convoy trackers, walkie-talkie apps, and niche proximity tools.

## Users

### Primary users
- Drivers in multi-car road trips who want lightweight real-time communication.
- Car meet and cruise participants who want to discover and talk to nearby people.
- Friends moving through the same area who want temporary, location-aware chat.

### Secondary users
- Festival and event attendees.
- Campus users.
- Nightlife and local discovery users.
- Motorcycle and cycling groups.

## Product principles

- **Map-first, not chat-first**: the live map is the home screen and primary interface, not a chat list.
- **Location first**: physical context defines the communication graph.
- **Fast join**: opening the app and entering audio takes seconds, not setup rituals.
- **Safer than texting**: voice-first, minimal-touch interaction for in-motion use.
- **Convoy and proximity are separate modes**: you are either in proximity mode or convoy mode, not both simultaneously. Switching between them is instant.
- **Distance is volume**: proximity chat uses distance-based volume scaling — closer people are louder, farther people are quieter.
- **Privacy by control**: users choose whether they are visible, audible, and discoverable.

## Core use cases

### Use case 1: Open proximity voice

A user opens Locus and sees a live map with nearby user avatars. The app uses live location to determine who is within the dynamic proximity radius. The user can listen and talk to people nearby, with volume scaling by distance — a user one block away sounds louder than someone at the edge of the radius. The user can pin specific people to keep them connected at normal volume regardless of distance. The user can mute, block, or report others.

### Use case 2: Private convoy

A user creates a convoy and shares an invite via link or QR code. The convoy gets its own persistent audio channel and map layer showing all member locations. Members hear each other at equal volume regardless of distance. When in convoy mode, the user is disconnected from open proximity chat. The user can switch to proximity mode at any time, which leaves the convoy audio channel.

### Use case 3: Temporary local communities

At events or meetups, users can join a place-based audio layer tied to a geofence or live crowd area. This uses the same proximity engine but anchored to a location rather than individual movement.

## MVP scope

### Included in MVP
- Account creation with phone verification.
- Real-time location sharing while active.
- Live map with nearby user avatars (Waze-like home screen).
- Open proximity audio mode with distance-based volume scaling.
- Dynamic auto-scaling proximity radius (shrinks in dense areas, expands in sparse areas).
- Pin feature: pin users to stay connected at normal volume regardless of distance (free users limited to 3 pins, premium unlimited).
- Private convoy creation and joining via link or QR code.
- Push-to-talk and open mic mode.
- User mute, block, and report tools.
- Safety settings: invisible mode, friends-only discoverability, convoy-only mode.
- Background operation with active session state.
- Tasks page: refer people or watch ads for points, redeemable for premium features.
- Clean push notifications for convoy joins, nearby friend detection, and other events.
- iOS and Android mobile apps.

### Excluded from MVP
- Full Android Auto / CarPlay integration.
- Positional stereo audio.
- Navigation and turn-by-turn directions.
- User-submitted alerts (Waze-style road reports).
- Rich profiles or feed/social posting.
- Spotify shared listening sessions.
- In-app direct monetization (purchasing points with money).
- Event marketplace or discovery marketplace.
- Offline phone-to-phone Wi-Fi mesh mode.

## Functional requirements

### Identity and onboarding
- Users sign up with phone number verification only.
- Users choose a display name, avatar, and optional vehicle tag or group tag.
- Users explicitly consent to live location and microphone access.
- Users choose default discoverability: open, friends-only, convoy-only, or invisible.

### Presence and location
- Client sends GPS updates every 1–2 seconds while active.
- Throttles to every 10 seconds when stationary or in background.
- Backend maintains a live geospatial index of active users.
- Presence state includes latitude, longitude, speed, heading, timestamp, and privacy mode.
- Presence expires automatically when the app disconnects or location becomes stale.

### Proximity engine
- System computes relevant neighbors using a dynamic radius that auto-scales:
  - Shrinks in dense areas (many users nearby) to keep conversations manageable.
  - Expands in sparse areas (few or no users nearby) to increase discovery range.
- Users can only hear or discover others within their current proximity radius.
- Volume scales with distance: closer users are louder, farther users are quieter, users at the edge of the radius are barely audible.
- Pin feature: users can pin up to 3 other users (free tier) to maintain connection at normal volume regardless of distance. Premium tier allows unlimited pins.
- Proximity rooms are ephemeral and update automatically as users move.
- Hysteresis logic prevents rapid join/leave stuttering: minimum dwell time before adding a user to an audio context, and grace period before removing them.
- Server supports separate rule sets by mode: driving, walking, event, and convoy.

### Voice
- Voice uses WebRTC audio streams with low-latency codecs and server-assisted routing.
- Distance-based volume scaling applied in proximity mode: server sends distance metadata, client applies volume attenuation.
- Convoy mode: all members hear each other at equal volume regardless of distance.
- Push-to-talk and open mic supported.
- Users can mute individual participants.
- Audio stability prioritized over effects.
- Convoy channel remains stable even when members are far apart.

### Convoys
- Users create a convoy, name it, and set access level.
- Invite via shareable link or QR code.
- Convoy view shows live member map and session state.
- Convoy audio is a private channel at equal volume for all members.
- When a user enters convoy mode, they leave proximity chat.
- When a user leaves convoy mode, they return to proximity chat.
- Convoy supports quick controls: mute all, toggle mic, switch to proximity mode.

### Safety and trust
- One-tap block or report.
- Rate-limiting for new and open users to reduce drive-by abuse.
- Temporary speaking restrictions in dense public areas.
- Default UI minimizes interactions while moving.
- Voice-first and glanceable interface per automotive distraction guidelines.
- Phone verification required for all accounts.

### Map and UX
- Home screen is a live map (Waze-like) centered on the user.
- Nearby users appear as avatars on the map.
- Active speaker indicators on avatars.
- Current mode indicator: proximity or convoy.
- Audio controls overlay: talk button, mute, mode switch.
- One dominant action on screen at a time: talk, join convoy, or switch mode.
- No deep menu navigation required to enter audio.
- Tasks page accessible from main screen: complete tasks to earn points for premium features.

### Tasks and rewards
- Tasks page shows available actions: refer friends, watch ads.
- Earning points unlocks premium features.
- Premium features include:
  - **Cosmetic**: themes, avatar customization, convoy nameplates and colors, profile customization.
  - **Functional**: larger convoy size limits, larger maximum proximity radius, unlimited pins, priority audio quality.

### Notifications
- Clear push notifications for: convoy invite received, convoy member joined, nearby friend detected, proximity mode new user entered range.
- Notification design avoids distraction for in-motion users.
- Notifications respect user privacy settings and mode preferences.

## Non-functional requirements

### Performance
- Audio join time under 2 seconds on good connectivity.
- Location updates reflected to nearby users in near real time.
- Graceful degradation on weak cellular connections.
- Voice degrades before map presence does.

### Reliability
- Sessions recover cleanly after network drops.
- Backend handles rapid churn in room membership as users move.
- Hysteresis logic prevents audio stutter from rapid proximity changes.

### Privacy
- No public exact-location history.
- Users control visibility, audibility, and discoverability.
- Location history retention is minimal and clearly disclosed.

### Compliance
- Product respects mobile background execution and communication-app constraints on iOS and Android.
- Designed for eventual car-platform compatibility but does not depend on it at MVP.
- Phone verification for all accounts.

## User flows

### Flow A: First open to first voice session
1. User installs app.
2. User signs up with phone number and verifies.
3. User grants microphone + location permissions.
4. User selects privacy defaults.
5. User lands on live map.
6. App identifies nearby users within dynamic radius.
7. User taps talk button to listen or speak.
8. User enters active proximity audio session with distance-based volume.

### Flow B: Create convoy
1. User taps "Create convoy."
2. User names convoy and sets access.
3. App generates invite link and QR code.
4. User shares link or QR code with members.
5. Members join and appear on convoy map.
6. Audio starts in convoy mode (user leaves proximity chat).
7. User can switch back to proximity mode at any time.

### Flow C: Pin a user
1. User sees a nearby avatar on the map.
2. User taps the avatar.
3. User taps "Pin."
4. Pinned user stays connected at normal volume even if they move beyond the proximity radius.
5. Free users can pin up to 3 people. Premium users can pin unlimited.

### Flow D: Tasks and rewards
1. User opens tasks page from main screen.
2. User sees available tasks: refer a friend, watch an ad.
3. User completes a task and earns points.
4. User browses premium features unlocked by points.
5. User redeems points for cosmetic or functional upgrades.

### Flow E: Abuse control
1. User hears unwanted participant.
2. User opens participant chip on map.
3. User mutes, blocks, or reports.
4. Offender is instantly removed from that user's audio context.

## Success metrics

### North-star metric
- Weekly active users who join at least one live audio session with another nearby user.

### Supporting metrics
- Median time from open to joined audio session.
- Average session length.
- Percentage of sessions with at least 2 active speakers.
- Convoy creation rate.
- Proximity discovery-to-conversation conversion rate.
- Report/block rate per 1,000 sessions.
- 7-day and 30-day retention.
- Pin feature usage rate.
- Task completion rate.

## Risks

### Adoption risk
Open proximity chat depends on density. If nobody nearby uses the app, proximity mode feels empty. The tasks and referral system mitigates this by incentivizing invites. Convoy mode provides a reliable use case even at low network density.

### Abuse risk
Open local voice can attract harassment, spam, or trolling. Phone verification, one-tap block/report, rate-limiting for new users, and conservative defaults are mandatory.

### Technical risk
Distance-based volume scaling and dynamic radius logic add complexity to the proximity engine. Hysteresis logic must prevent audio stuttering from rapid proximity changes. Internet-backed voice plus GPS logic is the practical architecture; offline mesh is not viable for moving vehicles.

### Safety risk
Poor interface design could encourage distracted driving. The app must be voice-first, glanceable, and minimal-touch.
    
### Empty state risk
New users opening the app in areas with no other Locus users will see an empty map. The tasks page provides immediate engagement (refer friends, watch ads) even without other users nearby, and convoy mode gives a deterministic use case that doesn't depend on local density.

## Recommended architecture

### Client
- **Flutter** for cross-platform iOS and Android.
- Native background service plugins for always-on location and audio.
- Map SDK for live user rendering (Mapbox or Google Maps).
- WebRTC client for real-time audio.

### Backend
- Real-time signaling via WebSockets.
- Geospatial presence store using Redis.
- Proximity engine service for dynamic radius, distance-based volume, and hysteresis logic.
- Room assignment service for proximity and convoy audio contexts.
- WebRTC signaling and SFU/media layer for scalable voice (LiveKit or mediasoup).
- Task and rewards service for points tracking and premium feature gating.

### Core data model
- User (phone, display name, avatar, vehicle tag, privacy mode, points balance)
- Session
- Presence update (latitude, longitude, speed, heading, timestamp, privacy mode)
- Proximity room (ephemeral, dynamic radius, mode rules)
- Convoy (name, access level, invite link, QR code)
- Convoy membership
- Pin (user, target user, timestamp)
- StreetPass event (user, encountered user, latitude, longitude, timestamp, encounter count)
- Block/report event
- Audio state
- Task (type, reward points, completion state)
- Premium feature (name, point cost, type: cosmetic or functional)

## Roadmap

### Phase 1 — MVP
- Phone verification and onboarding.
- Live map with nearby user avatars.
- Open proximity voice with distance-based volume scaling.
- Dynamic auto-scaling proximity radius.
- Pin feature (3 free, unlimited premium).
- Private convoy creation, joining via link/QR code.
- Push-to-talk and open mic.
- Mute, block, report.
- Privacy controls.
- Tasks page (referrals, ads → points → premium features).
- Push notifications.
- Background operation and session management.

### Phase 2 — Waze features
- User-submitted alerts: police, hazards, traffic, construction.
- Turn-by-turn navigation integration.
- Event geofences.
- Improved dynamic radius and heading-aware proximity logic.
- Car platform integrations (Android Auto, CarPlay).

### Phase 3 — Social and expansion
- **StreetPass**: passive proximity journal that logs users you've been near, with stats like encounter count, common locations, and time-of-day patterns. Privacy-first — users must opt in to appear in others' StreetPass logs, and no exact location history is exposed.
- Spotify shared listening sessions (sync music across convoy or proximity group).
- Friend graph and trusted circles.
- Smarter filtering by relevance and friend proximity.
- Place-based communities and local discovery.
- Richer profiles and convoy customization.
- Additional premium features and task types.

## Final recommendation

Launch Locus with both proximity mode and convoy mode in MVP. Proximity voice with distance-based volume is the differentiator — it's what makes Locus more than a walkie-talkie app. Convoy mode is the adoption wedge that guarantees utility even at low density. The Waze-like map is the interface paradigm that makes spatial audio intuitive.

The pin feature solves the problem of losing someone in proximity chat as distance grows. The tasks and rewards system gives new users something to do on an empty map and incentivizes growth through referrals. Phone verification keeps abuse manageable.

The long-term play is a Waze-like platform: start with map + voice, then layer in navigation, alerts, shared music, and community features. A narrow walkie-talkie product is easy to build but easy to replace. A location-native audio network with a map-first interface is harder, but meaningfully more defensible.