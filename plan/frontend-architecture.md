# Frontend Architecture — Locus Web

## Overview

The web frontend is a **Next.js 14 (App Router)** application that serves two distinct purposes:

1. **Marketing layer** — public-facing landing page, invite/join pages, and download CTAs
2. **Web app** — a full browser-based client matching the Flutter mobile app's feature set, primarily used for desktop/web access and as a fallback for users who haven't installed the app

The server (`server/`) already serves the Flutter web build from `app/build/web`, but that is a constrained 430px phone frame. The new frontend replaces this with a purpose-built web experience.

---

## Existing codebase context

### Flutter app design tokens
The mobile app uses a consistent dark design language. The web frontend must match it:

| Token | Value | Usage |
|---|---|---|
| Background | `#0D1117` | Page background |
| Surface | `#161B22` | Cards, nav, panels |
| Surface raised | `#21262D` | Elevated cards |
| Border | `#30363D` | Dividers, outlines |
| Primary | `#6C63FF` | Buttons, active states |
| Primary light | `#C4B5FD` | Mic active, highlights |
| Muted text | `#8B949E` | Secondary labels |
| Proximity green | `#22C55E` | Proximity mode indicator |
| Convoy blue | `#3B82F6` | Convoy mode indicator |
| Error | Material red | Block, report, error states |

### Backend integration points
The Express server (`server/src/`) exposes:
- `POST /api/auth/send-code` — send SMS verification
- `POST /api/auth/verify` — verify code, receive JWT
- `GET /api/auth/profile` — get current user
- `PATCH /api/auth/profile` — update display name
- WebSocket (Socket.io) — all real-time events defined in `server/src/types/index.ts`
- LiveKit token via `audio:token` socket event

### Key socket events (already typed)
- **Client → Server**: `presence:update`, `mode:switch`, `convoy:create`, `convoy:join`, `convoy:leave`, `user:pin`, `user:mute`, `user:block`, `audio:push-to-talk`, `audio:toggle-mic`
- **Server → Client**: `presence:neighbors`, `presence:update`, `presence:remove`, `convoy:created`, `convoy:joined`, `convoy:left`, `audio:token`, `audio:speaking`, `audio:volume-update`

---

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR for marketing/join pages, RSC, built-in routing |
| Language | TypeScript | Shared types with server |
| Styling | Tailwind CSS + CSS variables | Design token mapping, dark mode first |
| UI primitives | shadcn/ui | Accessible, unstyled, easy to theme |
| State management | Zustand | Lightweight, no boilerplate, matches Provider pattern from Flutter |
| Real-time | `socket.io-client` | Matches server exactly |
| Audio | LiveKit JS SDK (`@livekit/components-react`) | Server already uses LiveKit |
| Map | `react-map-gl` + Mapbox GL JS | Better web rendering than flutter_map web |
| Forms | React Hook Form + Zod | Validation for onboarding |
| HTTP | native `fetch` with typed wrappers | No extra library needed |

---

## Project structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Route group — no auth required
│   │   ├── page.tsx              # Landing page "/"
│   │   ├── layout.tsx            # Marketing shell (minimal nav)
│   │   └── download/page.tsx     # Download CTA page
│   ├── (app)/                    # Route group — auth required
│   │   ├── layout.tsx            # App shell (sidebar/nav, auth guard)
│   │   ├── map/page.tsx          # Main map view (home screen)
│   │   ├── tasks/page.tsx        # Tasks and rewards
│   │   └── settings/page.tsx     # User settings
│   ├── join/
│   │   └── [code]/page.tsx       # Convoy invite page (SSR, public)
│   ├── onboarding/
│   │   ├── page.tsx              # Phone number entry
│   │   └── verify/page.tsx       # OTP verification
│   ├── profile-setup/page.tsx    # Display name setup (post-auth)
│   ├── layout.tsx                # Root layout (providers, fonts)
│   └── globals.css               # Tailwind base + CSS variables
│
├── components/
│   ├── map/
│   │   ├── MapView.tsx           # react-map-gl wrapper
│   │   ├── UserMarker.tsx        # Avatar pin on map
│   │   ├── ProximityRadius.tsx   # Dynamic radius circle overlay
│   │   └── ConvoyLayer.tsx       # Convoy member lines/markers
│   ├── audio/
│   │   ├── MicButton.tsx         # PTT / open mic toggle (matches Flutter mic circle)
│   │   ├── LiveKitProvider.tsx   # LiveKit room connection wrapper
│   │   └── SpeakingIndicator.tsx # Pulsing ring when user is speaking
│   ├── proximity/
│   │   ├── ProximityOverlay.tsx  # Nearby users panel
│   │   └── UserChip.tsx          # Single nearby user chip (volume, mute, block)
│   ├── convoy/
│   │   ├── ConvoyPanel.tsx       # Convoy member list + controls
│   │   ├── ConvoySheet.tsx       # Create/join modal
│   │   └── InviteCard.tsx        # QR code + share link card
│   ├── ui/                       # shadcn/ui components (button, input, sheet, etc.)
│   └── layout/
│       ├── TopBar.tsx            # Mode indicator + nearby count + nav icons
│       ├── BottomBar.tsx         # PTT / Convoy / Nearby actions
│       └── Speedometer.tsx       # Speed display (matches Flutter widget)
│
├── lib/
│   ├── socket.ts                 # Socket.io singleton with typed event wrappers
│   ├── api.ts                    # Typed fetch wrappers for REST endpoints
│   ├── livekit.ts                # LiveKit connect/disconnect helpers
│   ├── geo.ts                    # Distance, volume attenuation, radius logic
│   └── store/
│       ├── useAppStore.ts        # Zustand root store (mirrors AppState from Flutter)
│       ├── useMapStore.ts        # Map viewport, markers, radius
│       └── useAudioStore.ts      # Mic state, PTT, volumes, speaking map
│
├── types/
│   └── index.ts                  # Re-exports from server types (or symlink)
│
├── hooks/
│   ├── useGeolocation.ts         # Browser Geolocation API wrapper
│   ├── useSocket.ts              # Socket connection lifecycle
│   └── useProximityAudio.ts      # Wires location + LiveKit + volume attenuation
│
├── public/
│   └── ...                       # Static assets
│
├── tailwind.config.ts            # Design token mappings
├── next.config.ts
└── package.json
```

---

## Routes

| Route | Auth | Render | Description |
|---|---|---|---|
| `/` | No | SSG | Marketing landing page |
| `/download` | No | SSG | App store links |
| `/join/[code]` | No | SSR | Convoy invite — shows convoy name, join CTA, download prompt |
| `/onboarding` | No | Client | Phone number entry |
| `/onboarding/verify` | No | Client | OTP code entry |
| `/profile-setup` | Yes | Client | Display name setup |
| `/map` | Yes | Client | Main app — live map + audio |
| `/tasks` | Yes | Client | Tasks and rewards |
| `/settings` | Yes | Client | Privacy, speed unit, profile |

---

## State management

Single Zustand store split into slices, mirroring the Flutter `AppState` provider:

```typescript
// lib/store/useAppStore.ts
interface AppStore {
  // Auth
  user: User | null
  token: string | null
  isAuthenticated: boolean
  hasProfile: boolean

  // Mode
  mode: 'proximity' | 'convoy'
  currentConvoy: Convoy | null

  // Presence
  latitude: number
  longitude: number
  speed: number
  heading: number
  nearbyUsers: PresenceUpdate[]

  // Audio
  micMuted: boolean
  pushToTalk: boolean
  volumes: Record<string, number>
  speaking: Record<string, boolean>

  // Actions
  setMode(mode: 'proximity' | 'convoy'): void
  createConvoy(name: string): void
  joinConvoy(code: string): void
  leaveConvoy(): void
  pinUser(userId: string): void
  muteUser(userId: string): void
  blockUser(userId: string): void
  toggleMic(): void
  setPushToTalk(enabled: boolean): void
}
```

---

## Real-time layer

`lib/socket.ts` exports a singleton Socket.io client that:
- Connects once on auth, persists across route changes
- Attaches to the Zustand store via listeners (not React state)
- Emits typed events matching `ClientToServerEvents` from server types
- Receives and merges `presence:neighbors` into `nearbyUsers` array

```typescript
// Typed wrapper example
export const socket = {
  updatePresence: (lat: number, lng: number, speed: number, heading: number) =>
    io.emit('presence:update', { latitude: lat, longitude: lng, speed, heading }),
  switchMode: (mode: 'proximity' | 'convoy', convoyId?: string) =>
    io.emit('mode:switch', { mode, convoyId }),
  // ...
}
```

---

## Audio layer

LiveKit handles all voice. The flow matches the Flutter `AudioService`:

1. User connects to socket → server assigns to proximity/convoy room
2. Server emits `audio:token` with LiveKit room name + access token
3. Frontend calls `livekitClient.connect(LIVEKIT_URL, token)`
4. For proximity mode: server emits `audio:volume-update` per user; client applies `gain` via Web Audio API
5. For convoy mode: equal volume for all participants
6. PTT: hold mic button → `audio:push-to-talk { speaking: true }` → release → `{ speaking: false }`

```
useProximityAudio hook:
  - subscribes to volumes from socket
  - for each remote LiveKit track, creates GainNode
  - updates gain when volume:update arrives
  - speaking indicators via audio:speaking events
```

---

## Map layer

`react-map-gl` with Mapbox renders the live map:

- **User position**: blue dot, always centered (or follow mode)
- **Nearby users**: `UserMarker` components per `PresenceUpdate` in store
  - Avatar circle with initials
  - Pulsing ring if speaking
  - Tap → bottom sheet with pin/mute/block options
- **Proximity radius**: `circle` layer from GeoJSON, dynamic radius from proximity engine
- **Convoy members**: distinct marker style (blue tint)
- Map style: dark (`mapbox://styles/mapbox/dark-v11`) to match `#0D1117` background

---

## Geolocation

`hooks/useGeolocation.ts` wraps `navigator.geolocation.watchPosition`:
- Updates Zustand store + fires `presence:update` socket event on each position change
- High accuracy mode, 1–2s interval while active
- Falls back gracefully if permissions denied (shows permission prompt overlay)
- On desktop: no speed/heading data — set to 0, speedometer hidden

---

## `/join/[code]` — Convoy invite page

SSR page that:
1. Calls server API to resolve invite code → convoy name + member count
2. If user is authenticated + has app open: deep link into convoy
3. If not authenticated: shows convoy name, member count, "Download Locus" CTA + "Join in browser" option
4. QR code display for mobile handoff

---

## Design system

`tailwind.config.ts` maps the Flutter tokens to CSS variables:

```typescript
theme: {
  extend: {
    colors: {
      background: '#0D1117',
      surface: '#161B22',
      'surface-raised': '#21262D',
      border: '#30363D',
      primary: '#6C63FF',
      'primary-light': '#C4B5FD',
      muted: '#8B949E',
      proximity: '#22C55E',
      convoy: '#3B82F6',
    },
    borderRadius: {
      card: '14px',
      pill: '24px',
    },
  },
}
```

All components default to dark mode. No light mode planned for MVP.

---

## Directory placement

The frontend lives at `frontend/` in the repo root alongside `app/` and `server/`:

```
locus-app/
├── app/          # Flutter mobile
├── server/       # Node.js backend
├── frontend/     # Next.js web frontend  <-- new
└── plan/
```

The server's static file serving for Flutter web (`app/build/web`) can be removed or kept for fallback once the Next.js frontend is deployed separately.

---

## Development setup

```bash
# Install
cd frontend && npm install

# Dev (Next.js on :3000, server on :3001)
npm run dev

# Environment
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_MAPBOX_TOKEN=...
NEXT_PUBLIC_LIVEKIT_URL=...
```

---

## Video chat

Video chat is a **convoy-only** feature. It is opt-in per participant — a camera button in the convoy panel toggles your video on or off.

### How it works

1. User is in an active convoy and taps "Start Video"
2. Client emits `video:start` over the socket
3. Server sets `videoEnabled: true` on the `ConnectedUser` and broadcasts `video:participant-started` to all other convoy members
4. All clients who receive the event show a video tile for that participant
5. The actual video track is published via LiveKit (same room token already grants `canPublish: true`)
6. Tapping "Stop Video" emits `video:stop`, server broadcasts `video:participant-stopped`, tiles are removed

### Frontend implementation

- `VideoGrid` component renders a 1–4 tile grid anchored below the `ConvoyPanel`
- Each tile wraps a LiveKit `VideoTrack` renderer
- Self-tile shows local camera with a "LIVE" badge
- Grid adapts: 1 tile = full width, 2–4 tiles = 2-column grid
- Camera permission requested on first "Start Video" tap via `getUserMedia`

### Socket events added

| Event | Direction | Payload |
|---|---|---|
| `video:start` | Client → Server | (none) |
| `video:stop` | Client → Server | (none) |
| `video:participant-started` | Server → Client | `{ userId }` |
| `video:participant-stopped` | Server → Client | `{ userId }` |

---

## MVP scope for frontend

### Phase 1 — Ship with mobile MVP
- [ ] Landing page (`/`)
- [ ] `/join/[code]` convoy invite page (SSR)
- [ ] Onboarding flow (phone + OTP)
- [ ] Profile setup

### Phase 2 — Full web app
- [ ] Live map with nearby users
- [ ] Proximity audio (LiveKit + volume attenuation)
- [ ] PTT and open mic
- [ ] Convoy create/join/leave
- [ ] Mute/block/report
- [ ] Tasks page
- [ ] Settings page

### Phase 3 — Desktop enhancements
- [ ] Sidebar layout for wide screens
- [ ] Keyboard shortcuts (space for PTT)
- [ ] Convoy invite QR display
- [ ] Browser notification API for nearby friend detection
