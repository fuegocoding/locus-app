# Locus — UI Design Document

This document is the single source of truth for Locus's visual design system, component library, screen specifications, and UX patterns. AI agents **must** read and follow this before making UI changes. Keep the Flutter app and Next.js frontend visually consistent.

---

## 1. Design System

### 1.1 Color Palette

```
Background      #0D1117       Page / scaffold background
Surface         #161B22       Cards, nav bars, panels
SurfaceRaised   #21262D       Elevated cards, inputs
Border          #30363D       Dividers, outlines, input borders

Primary         #6C63FF       Buttons, active states, accents
PrimaryLight    #C4B5FD       Mic active, highlights, glow text
PrimaryDim      #5A50CC       Dimmed primary (web only)

Proximity       #22C55E / #00FF87    Proximity mode green
Convoy          #3B82F6 / #4488FF    Convoy mode blue
Success         #10B981       Username available, online dot
Error           #EF4444       Block, report, error states, validation
Warning         #FFAA00       Warnings, offline banner

Muted           #8B949E       Secondary labels, hint text
Foreground      #F0F0FF       Primary text (web only)
```

**Frontend (Next.js) mapping** — colors are adapted but the same visual weight:
| Flutter | Next.js Tailwind |
|---------|-----------------|
| `#0D1117` | `background: #080810` |
| `#161B22` | `surface: #0E0E1A` |
| `#1F1A3A` | `surface-raised: #161626` |
| `#21262D` | `surface-high: #1E1E30` |
| `#30363D` | `border: #252540` |

### 1.2 Typography

| Scale | Flutter | Next.js |
|-------|---------|---------|
| Headline | `headlineLarge` FontWeight.bold | `text-2xl font-bold` |
| Title | `titleMedium` FontWeight.bold | `text-lg font-bold` |
| Body | `bodyMedium` | `text-sm` (14px) |
| Small | `bodySmall` | `text-xs` (12px) |
| Tiny | N/A | `text-[10px]` |
| Mono | `fontFamily: 'monospace'` | `font-mono` (JetBrains Mono) |
| UI weight | `FontWeight.w600` | `font-semibold` |
| UI weight bold | `FontWeight.bold` | `font-bold` |

**Web font stack**: `Inter` for UI, `JetBrains Mono` for mono (invite codes, speedometer).

### 1.3 Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| Page padding | `28px` horizontal, `48px` top, `28px` bottom | Onboarding, profile setup |
| Card padding | `16px` | Inside cards, panels |
| Between sections | `24px` | Spacing between form sections |
| Between elements | `16px`, `12px`, `8px` | Contextual |
| Bottom nav height | `52px` | Home screen bar |
| Bottom nav gap from edge | `6px` | Safe area inset |
| Float gap (bar to widget) | `10px` | Between nav bar and floating elements |

### 1.4 Border Radii

| Token | Value | Usage |
|-------|-------|-------|
| `pill` | `24px` | Large rounded elements |
| `card` | `14px` | Cards, containers, input fields |
| `panel` | `20px` | Bottom sheets, modals |
| `sheet-handle` | `3px` | Bottom sheet drag handle |
| `badge` | `9999px` | Badges, chips |

### 1.5 Shadows (Web Only)

| Token | Definition |
|-------|-----------|
| `neon-sm` | `0 0 10px rgba(124, 111, 255, 0.4)` |
| `neon` | `0 0 20px rgba(124, 111, 255, 0.5)` |
| `neon-lg` | `0 0 40px rgba(124, 111, 255, 0.6)` |
| `neon-green` | `0 0 20px rgba(0, 255, 135, 0.5)` |
| `neon-blue` | `0 0 20px rgba(68, 136, 255, 0.5)` |
| `card` | `0 4px 24px rgba(0, 0, 0, 0.4)` |

Flutter uses equivalent `BoxShadow` with matching colors and blur radii.

### 1.6 Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| Pulse (mic ring) | 1.5s | ease-out | Speaking indicator |
| Speaking bars | 0.6s | ease-in-out | Audio visualization |
| Neon glow pulse | 2s | ease-in-out | Live indicator |
| Slide up | 0.3s | ease-out | Panels, overlays |
| Fade in | 0.4s | ease-out | Content appearance |
| Scale press | 0.15s | ease | Button press feedback |
| Color transitions | 200ms | ease | Theme/state changes |

**Flutter**: `AnimatedContainer` for state transitions (200ms), `AnimatedOpacity` for fades, `AnimatedPositioned` for layout shifts.

---

## 2. Component Library

Every component below exists in **both** Flutter and Next.js. Keep them visually consistent.

### 2.1 Primary Button (`_PrimaryButton` / `<Button variant="default">`)
- Height: `54px` (Flutter) / `h-13` (Next.js)
- Background: `#6C63FF`, disabled: 40% opacity
- Text: white, `fontWeight: FontWeight.bold`, `fontSize: 16`
- Border radius: `14px`
- Elevation: `0` (flat)
- Loading: `CircularProgressIndicator` (white, 2.5px stroke, 22x22)
- States: default, hover (`primary-glow`), active (`scale-95`), disabled, loading

### 2.2 Secondary Button (`OutlinedButton` / `<Button variant="outline">`)
- Height: `48px`
- Border: `1.5px solid #30363D`
- Background: transparent
- Text: `Colors.white60`, `fontWeight: FontWeight.bold`, `fontSize: 15`
- Border radius: `12px`
- States: default, hover (border `#6C63FF`), active

### 2.3 Icon Button / Sheet Icon (`_SheetIconBtn`)
- Size: `32x32`
- Background: `color.withOpacity(0.12)`
- Icon: `16px`, colored
- Border radius: `8px`
- Used inside sheets for secondary actions

### 2.4 Text Input (`TextField` / `<Input>`)
- Background: `#161B22` (filled)
- Border radius: `14px`
- Enabled border: `1.5px solid #30363D`
- Focused border: `2px solid #6C63FF`
- Error border: `2px solid #EF4444`
- Content padding: `EdgeInsets.symmetric(horizontal: 16, vertical: 16)` / `px-4 py-3`
- Text color: `Colors.white` / `text-foreground`
- Hint text: `Colors.white.withOpacity(0.18)` / `text-muted`
- States: default, focused (`#6C63FF` glow), error (`#EF4444` glow), disabled (50% opacity)

### 2.5 Badge (`Badge` component)
- Border radius: `9999px`
- Padding: `px-2.5 py-0.5`
- Font: `text-xs font-semibold`
- Variants:
  - `default`: `#6C63FF` bg 20%, `#C4B5FD` text, `#6C63FF` border 30%
  - `proximity`: green tint
  - `convoy`: blue tint
  - `live`: green with pulse animation
  - `error`: red tint
  - `success`: green tint

### 2.6 Neon Card (`NeonCard` / glass cards)
- Background: `#161B22` with optional blur (`backdrop-filter: blur(12px)`) — `.glass` utility
- Border: `1px solid rgba(37, 37, 64, 0.6)` / `#30363D`
- Border radius: `14px`
- On hover: card shadow + brighter border
- Variants: primary glow, cyan glow, green glow, blue glow, gradient border

### 2.7 Avatar (User marker / Avatar circle)
- Size: `36x36` (markers), `80x80` (profile), `32x32` (compact)
- Background: `#6C63FF` with 20% opacity + initial letter
- Speaking state: `#6C63FF` full with pulsing glow
- Pinned state: `Colors.amber` / `#FFAA00`
- Border: `2px` solid (state-dependent color)
- Online dot: `10x10`, green (`#10B981`) / grey, `border: 1.5px solid` surface color

### 2.8 Mic Button
- Size: `72x72` (circle)
- States:
  - **Muted (not PTT)**: `Colors.grey.shade700` / `bg-surface-high`, `border-error` ring
  - **Active (speaking)**: `#C4B5FD` / `bg-primary`, `shadow-neon-lg`, scale 1.1
  - **Inactive (PTT on, not speaking)**: default surface color
- Icon: `mic` or `mic_off`, `32px`, white
- PTT gesture: swipe up to lock open mic (threshold 80px)
- Speaking animation: concentric expanding rings (1.5s loop)

---

## 3. Screen-by-Screen Specification

### 3.1 Splash Screen
**Route**: `/` (app entry)
**Layout**: Full-screen centered column
- Background icon: `Icons.my_location`, `72px`, primary color
- Title: "Locus" in headline, bold, primary
- Loader: `CircularProgressIndicator`
- Transitions to: onboarding or home (based on stored auth)

### 3.2 Onboarding — Phone Entry
**Route**: `/onboarding` (web), initial auth screen (Flutter)
**Layout**: `SafeArea > ScrollView > Column(stretch)`
**States**: phone entry → code sent → verified

**Phone entry state**:
- Logo (72px circle, purple gradient, location icon)
- "Locus" title + "Proximity voice chat. Talk to people around you." subtitle
- Country picker row (flag + name + code + dropdown arrow)
- Phone number field (with country code prefix)
- "Continue" primary button (disabled until 10+ digits)
- Server error banner (red container, warning icon)

**Code sent state**:
- Same logo + title
- OTP field (6 digits, large monospace, centered, `letterSpacing: 10`)
- "Change number" text button
- Resend option (with timer)
- Same error banner

**Verified state**: Navigate to profile setup (new user) or home (returning).

### 3.3 Profile Setup
**Route**: `/profile-setup`
**Layout**: `SafeArea > ScrollView > Column(stretch)`
- Avatar circle (80px, gradient, person icon)
- "Choose your username" title + "How others see you" subtitle
- Username field with:
  - `@` prefix icon
  - Max 30 chars, alphanumeric + underscore only
  - Real-time validation: untouched → checking → available (green) / taken (red)
  - Status row below with icon + message
- Rules hint box (surface bg, border, 2-30 chars, letters/numbers/underscores)
- Continue button (disabled until valid username selected)

### 3.4 Home Screen — Map
**Route**: `/map` (web), main screen (Flutter)
**Layout**: `Scaffold(body: Stack)`

**Map layer** (full screen):
- CartoDB dark tiles (Flutter: `flutter_map`, Web: MapLibre)
- Initial zoom: 15, min: 3, max: 19
- Self marker: outer translucent circle + inner primary dot (40x40)
- Nearby markers: 44x56 avatar with name label below
  - Speaking: primary full, 3px border, glow shadow
  - Pinned: amber color
  - Default: primary 50%, 1.5px border

**Top bar** (floating, `glass`):
- Mode dot (green for proximity, purple for convoy) + mode name
- Nearby count badge (proximity) / member count + "Live" badge (convoy)
- Tasks + Settings icon buttons (right side)
- Spacing: `top: safeArea + 4px, left/right: 8px`

**Status banners** (stacked below top bar):
- **Offline**: orange background, `wifi_off` icon, "You're offline"
- **Audio error**: dark red background, `volume_off` icon, "Audio disconnected" + Retry button
- **Convoy invite**: purple tinted card, sender avatar + name, convoy name, Accept/Decline buttons

**Proximity overlay** (when in proximity mode):
- Empty state: "No one nearby" message + Share button (earn referral points)
- Active: user chips with avatar, name, speaking indicator, volume bar, action buttons (pin, mute, block)
- Max 3 visible, expandable if more

**Convoy panel** (when in convoy mode):
- Header: group icon + convoy name + member count + Leave button
- Invite code row (monospace, large) + Copy / QR / Share icons
- Video toggle button (start/stop video)
- Video grid: 1-4 tiles, 2-column, LIVE badge on self-tile

**Speedometer** (bottom-right, 72px circle):
- Arc gauge: green → yellow → orange → red by speed
- Speed digits + unit
- Max: 200 km/h or 125 mph (auto-detected by locale)

**Mic button** (bottom-left, 72px circle):
- PTT: hold to speak, release to mute
- Swipe up >80px to lock open mic
- Visual feedback: color change + glow + scale

**Bottom nav bar** (floating, 52px, purple tint glass):
- 4 buttons: PTT/Open Mic, Convoy, Nearby, Friends
- Active icon + bold label, inactive muted
- Badge dots for pending invites

**Sheets** (modal bottom sheets):
- **Nearby sheet**: user list with mute/block actions, empty state if none
- **Convoy sheet**: create convoy (name field) or join with invite code
- **Friends sheet**: draggable, friend rows with online dots + invite buttons, "Find People" search
- **Invite friends sheet**: scrolled list of friends to invite to current convoy

### 3.5 Tasks Screen
**Route**: `/tasks`
**Layout**: `ListView(padding: 16)`
- Points card: current points total, short explanation
- Task tiles: Refer a Friend (100pts), Watch an Ad (25pts), Complete Profile (50pts)
- Each: icon, title, description, points badge (purple, `+N pts`)
- Premium features section: Unlimited Pins (200), Larger Convoys (300), Extended Radius (150), Priority Audio (250), Custom Theme (100)
- Each: feature name, points cost badge (amber)

### 3.6 Settings Screen
**Route**: `/settings`
**Layout**: `ListView` with section headers
- **Profile**: avatar + display name + phone
- **Privacy**: discoverability picker (open / friends-only / convoy-only / invisible)
- **Audio**: Push to Talk toggle
- **Display**: Speed unit picker (Default → auto-detect / km/h / mph)
- **Background**: Background Service toggle
- **Account**: Logout (red)

### 3.7 Social / Find People
**Route**: social sheet / standalone
**Layout**: search field + results
- States: empty (no query: "Type a name to find other drivers"), loading, results, no results
- User tile: avatar, name, friend badge, Follow/Following button
- Empty state with search icon

### 3.8 Convoy Invite Page (Web SSR)
**Route**: `/join/[code]`
**Layout**: SSR page with convoy info
- Shows convoy name, member count
- Download prompt or "Join in browser" option
- QR code for mobile handoff

---

## 4. UX Patterns

### 4.1 Navigation & Auth Flow
```
Splash → [token?]
  ├─ No → Onboarding (phone → OTP) → Profile Setup (if new) → Home (Map)
  └─ Yes → Home (Map)
```

### 4.2 Mode Switching
- User is in **exactly one mode** at all times: `proximity` or `convoy`
- Switching is instant — no loading screen
- Going to convoy: leave proximity audio → join convoy audio + map layer
- Going back to proximity: leave convoy audio → re-enter proximity audio
- Bottom nav reflects current mode

### 4.3 Microphone Interaction
- **PTT mode**: Hold mic button → speak → release → muted
- **Open mic mode**: Tap mic button to toggle mute
- **Swipe-to-lock**: Drag up >80px on mic button while holding → locks open mic (haptic feedback)
- Mic button visually reflects state with color + glow + icon

### 4.4 Proximity Audio UX
- Volume scales **gradually** as users move (not stepwise)
- Pinned users always at full volume regardless of distance
- Users at edge of radius are barely audible
- Speaking indicators (pulsing rings) on map markers and overlay chips

### 4.5 Empty States
Every major section has a thoughtful empty state:
- **Map (no one nearby)**: "No one nearby" + Share referral link for points
- **Friends**: "No friends yet" + "Find People" CTA
- **Search**: "Type a name to find other drivers" (no query) / "No users found" (no results)
- **Tasks**: Points card (always visible even before completion)

### 4.6 Error Handling
- **Network errors**: Offline banner (orange, top of screen)
- **Auth errors**: Red error container below form fields
- **Audio errors**: Red banner with retry button
- **Input validation**: Inline field validation with colored borders + status messages
- All errors dismissable (SnackBar on Flutter, toast on web)

### 4.7 Responsive Behavior

**Flutter**:
- Mobile-first, full screen
- Web build constrained to 430px (phone frame), centered, with border
- iOS: additional bottom sheet styling (`withOpacity(0.9)`, 24px radius)
- Android: standard Material 3

**Next.js Web**:
- Marketing pages: full responsive, centered content
- App pages: desktop layout with sidebar/persistent nav
- Map adapts to viewport size
- Bottom nav: visible on mobile, sidebar on desktop
- Proximity overlay: side panel on wide screens

### 4.8 Dark Mode Exclusivity
- **No light mode** — the app is dark-only by design
- Every color is chosen for a dark background
- High contrast between surfaces (background → surface → raised surface)
- Accent colors (`#6C63FF`, `#C4B5FD`) provide visual hierarchy against dark backgrounds

---

## 5. Cross-Platform Visual Consistency

### 5.1 Shared Values
These must be identical across Flutter and Next.js:
- Primary color: `#6C63FF` / `#7C6FFF`
- Card border radius: `14px`
- Sheet border radius: `20px` (top only)
- Button height: `54px`
- Input border radius: `14px`
- Mic button size: `72x72`
- Bottom nav height: `52px`

### 5.2 Permissible Differences
- **Shadows**: Flutter uses `BoxShadow`, Web uses `box-shadow` with `drop-shadow` for markers
- **Neon glow**: Web has more pronounced glow effects (`shadow-neon` variants)
- **Glass effect**: Web uses `backdrop-filter: blur()`, Flutter uses `withOpacity()`
- **Typography scale**: Font sizes may differ by 1-2px (`text-sm` = 14px web vs Flutter's default)
- **Spacing**: Minor padding differences (<4px) are acceptable

### 5.3 Icon Consistency
- Flutter: Material Icons (`Icons.*`)
- Web: Lucide React icons (same or equivalent name)
- When adding new icons, ensure the visual metaphor matches across platforms

### 5.4 When Changing UI
- Update **both** the Flutter widget and the React component
- If changing a design token, update `tailwind.config.ts` and Flutter's `_buildTheme()`
- Toast/banner patterns should behave identically
- Font weight mappings: `FontWeight.bold` = `font-bold`, `FontWeight.w600` = `font-semibold`

---

## 6. Design Principles

1. **Map-first**: The live map is the home screen. All other screens are secondary.
2. **Dark-only**: No light mode. Every element is designed for a dark canvas.
3. **Glanceable**: Minimal touch interactions, voice-first, large hit targets (72px mic button).
4. **Glassmorphism**: Cards and overlays use translucent backgrounds with blur (web) or opacity (Flutter).
5. **Neon accents**: Purple (`#6C63FF`) is the primary accent. Use it sparingly for active states and CTAs.
6. **Green = proximity, Blue = convoy**: Mode indicators use these colors consistently.
7. **Red = danger**: Error, block, report, mute-all use red tones.
8. **One dominant action**: Each screen has one primary action (talk, join convoy, switch mode).

---

## 7. File Organization

### Flutter Components
```
screens/       → Full-screen pages (SplashScreen, OnboardingScreen, HomeScreen, etc.)
widgets/       → Reusable widgets (MapWidget, ProximityOverlay, ConvoyPanel, Speedometer, VideoGrid)
services/      → Business logic + state (AppState, SocketService, AudioService, etc.)
models/        → Data models with JSON serialization (User, PresenceUpdate, Convoy)
```

### Next.js Components
```
components/ui/         → Design system primitives (Button, Input, Badge, NeonCard)
components/layout/     → App shell, navigation (AppShell, TopBar)
components/map/        → Map-related (MapView, UserMarker, ProximityRadius, ConvoyLayer)
components/audio/      → Audio controls (MicButton, LiveKitProvider, SpeakingIndicator)
components/proximity/  → Proximity overlay (ProximityOverlay, UserChip)
components/convoy/     → Convoy panels (ConvoyPanel, ConvoySheet, InviteCard)
components/video/      → Video grid (VideoGrid)
```

---

## 8. Related Documents

- `PRD.md` — Product requirements, use cases, feature specs
- `plan/frontend-architecture.md` — Next.js architecture, routing, state management
- `app/lib/providers/app_state.dart` — Flutter state management (488 lines)
- `frontend/lib/store.ts` — Zustand store (mirrors Flutter)
- `frontend/tailwind.config.ts` — Web design tokens
- `frontend/app/globals.css` — CSS variables, glass utilities, animations
