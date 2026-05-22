import Link from 'next/link'
import { Radio, Car, MapPin, ShieldCheck, Zap, QrCode } from 'lucide-react'
import { NeonCard } from '@/components/ui/neon-card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-background">

      {/* ─────────────────── HERO ─────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center grid-bg noise-overlay pt-20 border-b border-border/40">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="default">Proximity Audio Network</Badge>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight text-foreground">
            Talk to{' '}
            <span className="text-primary">who&apos;s near you</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time proximity voice for convoys, car meets, and road trips.
            Open the map — hear everyone around you.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="https://github.com/fuegocoding/locus-app/releases/download/v1.0.0/app-release.apk"
              className="px-8 py-4 bg-primary text-white rounded-xl text-lg font-bold hover:bg-primary-dim transition-all duration-200 w-full sm:w-auto shadow-sm"
            >
              Start for Free
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 border border-border text-foreground rounded-xl text-lg font-semibold hover:border-border-bright hover:bg-surface-raised transition-all duration-200 w-full sm:w-auto"
            >
              See How It Works
            </Link>
          </div>

          {/* Social proof line */}
          <p className="mt-6 text-sm text-muted">
            <span className="text-muted-bright font-semibold">2,400+</span> active users &mdash; car meets, convoys, road trips
          </p>

          {/* App store placeholders */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="relative flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl opacity-60 cursor-not-allowed select-none">
              <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-muted leading-none">Coming soon</div>
                <div className="text-xs font-semibold text-foreground leading-none mt-0.5">App Store</div>
              </div>
            </div>
            <div className="relative flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl opacity-60 cursor-not-allowed select-none">
              <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.64.22.99.14l12.81-7.4-2.79-2.79-11.01 10.05zm15.76-14.59L5.19.63C4.84.43 4.46.4 4.13.57L15.24 11.68l3.7-2.51zm2.33 5.42c.3-.17.47-.46.47-.79s-.17-.62-.46-.79l-2.8-1.62-3.07 3.07 3.07 3.06 2.79-1.93zM4.13 23.43c-.33.18-.7.14-1.03-.09L14.15 12.32l-2.79-2.79L.27 16.94c-.17.3-.22.63-.14.99l3.99 5.5h.01z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-muted leading-none">Coming soon</div>
                <div className="text-xs font-semibold text-foreground leading-none mt-0.5">Google Play</div>
              </div>
            </div>
          </div>

          {/* Map preview mockup */}
          <div className="mt-14 relative max-w-2xl mx-auto">
            <div className="border border-border rounded-panel overflow-hidden shadow-card">
              <div className="bg-surface-raised rounded-panel p-1">
                <MapMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── STATS BAR ─────────────────── */}
      <section className="py-10 px-6 border-b border-border bg-surface/60">
        <div className="max-w-3xl mx-auto grid grid-cols-3 divide-x divide-border">
          {STATS.map((s) => (
            <div key={s.label} className="text-center px-4">
              <div className="text-2xl md:text-3xl font-black text-foreground">{s.value}</div>
              <div className="text-xs text-muted mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── FEATURES ─────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Built for <span className="text-primary">the road</span>
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Not a walkie-talkie app. A live audio layer over physical space.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              glow="green"
              Icon={Radio}
              iconColor="text-proximity"
              title="Proximity Voice"
              description="Hear everyone nearby. Volume scales with distance — the closer someone is, the louder they sound."
              badge={{ label: 'Proximity', variant: 'proximity' }}
            />
            <FeatureCard
              glow="blue"
              Icon={Car}
              iconColor="text-convoy"
              title="Private Convoys"
              description="Create a private audio channel for your group. Share a link or QR code — everyone hears each other at equal volume."
              badge={{ label: 'Convoy', variant: 'convoy' }}
            />
            <FeatureCard
              glow="cyan"
              Icon={MapPin}
              iconColor="text-cyan"
              title="Live Map"
              description="See nearby users as avatars on a live map. Tap to pin, mute, or block — no distracting menus."
            />
            <FeatureCard
              glow="green"
              Icon={ShieldCheck}
              iconColor="text-proximity"
              title="Privacy Controls"
              description="Go invisible, friends-only, or convoy-only mode. You control who can hear and see you at all times."
            />
            <FeatureCard
              glow="primary"
              Icon={Zap}
              iconColor="text-primary"
              title="Under 2s to Live"
              description="Open the app, tap talk. No room codes, no setup. You're in proximity mode before you blink."
            />
            <FeatureCard
              glow="cyan"
              Icon={QrCode}
              iconColor="text-cyan"
              title="Instant Sharing"
              description="Share a convoy via QR code or link. Friends join in seconds — no manual codes, no friction."
            />
          </div>
        </div>
      </section>

      {/* ─────────────────── MODE COMPARISON ─────────────────── */}
      <section className="py-24 px-6 bg-surface/50 border-y border-border/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Two modes. One app.</h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Switch between open proximity audio and private convoy channels instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Proximity Mode */}
            <div className="rounded-card border border-proximity/20 bg-surface-raised p-6 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-proximity/15 border border-proximity/30 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-proximity" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Proximity Mode</div>
                  <div className="text-xs text-proximity">Open audio layer</div>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  'Hear anyone within your radius',
                  'Volume scales by distance automatically',
                  'Pin users to stay at full volume',
                  'Dynamic radius — shrinks in crowds, expands in open areas',
                  'Mute, block, or report at any time',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-muted-bright">
                    <span className="text-proximity mt-0.5 flex-shrink-0">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Convoy Mode */}
            <div className="rounded-card border border-convoy/20 bg-surface-raised p-6 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-convoy/15 border border-convoy/30 flex items-center justify-center">
                  <Car className="w-4 h-4 text-convoy" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Convoy Mode</div>
                  <div className="text-xs text-convoy">Private group channel</div>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  'Private audio channel for your group only',
                  'Equal volume for all members regardless of distance',
                  'Live map showing all member locations',
                  'Join via QR code or shared link',
                  'Persistent — stays active as your group moves',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-muted-bright">
                    <span className="text-convoy mt-0.5 flex-shrink-0">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── HOW IT WORKS ─────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">How it works</h2>
          </div>
          <div className="space-y-5">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-5 p-5 rounded-card border border-border bg-surface-raised hover:border-border-bright transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="pt-0.5">
                  <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── CTA ─────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-foreground">
            Ready to <span className="text-primary">go live?</span>
          </h2>
          <p className="text-muted text-lg mb-8">
            Join your first convoy in under 30 seconds.
          </p>
          <Link
            href="https://github.com/fuegocoding/locus-app/releases/download/v1.0.0/app-release.apk"
            className="inline-block px-10 py-5 bg-primary text-white rounded-xl text-xl font-bold hover:bg-primary-dim transition-all duration-200 shadow-sm"
          >
            Get Started &mdash; it&apos;s free
          </Link>
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl opacity-60 cursor-not-allowed select-none">
              <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span className="text-xs font-semibold text-foreground">App Store &mdash; Coming Soon</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl opacity-60 cursor-not-allowed select-none">
              <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.64.22.99.14l12.81-7.4-2.79-2.79-11.01 10.05zm15.76-14.59L5.19.63C4.84.43 4.46.4 4.13.57L15.24 11.68l3.7-2.51zm2.33 5.42c.3-.17.47-.46.47-.79s-.17-.62-.46-.79l-2.8-1.62-3.07 3.07 3.07 3.06 2.79-1.93zM4.13 23.43c-.33.18-.7.14-1.03-.09L14.15 12.32l-2.79-2.79L.27 16.94c-.17.3-.22.63-.14.99l3.99 5.5h.01z"/>
              </svg>
              <span className="text-xs font-semibold text-foreground">Google Play &mdash; Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── FOOTER ─────────────────── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 group">
            <Logo className="w-6 h-6 text-primary transition-transform duration-200 group-hover:scale-105" />
            <span className="font-bold text-foreground">Locus</span>
            <span className="text-muted text-sm ml-2">Talk to who&apos;s near you.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/onboarding" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
          <p className="text-xs text-muted">&copy; {new Date().getFullYear()} Locus. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}

// ─── Data ───────────────────────────────────────────────────────────────────

const STATS = [
  { value: '2,400+', label: 'Active users' },
  { value: '180+', label: 'Convoys this week' },
  { value: '< 2s', label: 'Time to go live' },
]

const STEPS = [
  {
    title: 'Sign up with your phone number',
    desc: 'Phone verification only — no email, no passwords.',
  },
  {
    title: 'Open the map',
    desc: "See nearby users as avatars on a live map. The app immediately shows who's around you.",
  },
  {
    title: 'Start talking',
    desc: 'Tap the mic button. You\'re in proximity mode — anyone nearby can hear you, louder the closer they are.',
  },
  {
    title: 'Create or join a convoy',
    desc: 'For groups: create a convoy, share the QR code or link, and get a private audio channel for your whole crew.',
  },
]

// ─── Components ─────────────────────────────────────────────────────────────

function FeatureCard({
  Icon,
  iconColor,
  title,
  description,
  glow,
  badge,
}: {
  Icon: React.ComponentType<{ className?: string }>
  iconColor: string
  title: string
  description: string
  glow?: 'primary' | 'cyan' | 'green' | 'blue'
  badge?: { label: string; variant: 'default' | 'live' | 'convoy' | 'proximity' }
}) {
  return (
    <NeonCard glow={glow} className="h-full">
      <div className="flex items-start justify-between mb-4">
        <Icon className={`w-6 h-6 ${iconColor}`} />
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
      </div>
      <h3 className="font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </NeonCard>
  )
}

function MapMockup() {
  return (
    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#0a0f1e]">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(68,136,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(68,136,255,0.2) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      {/* Roads */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 225">
        <line x1="200" y1="0" x2="200" y2="225" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <line x1="0" y1="112" x2="400" y2="112" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <line x1="0" y1="60" x2="400" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      </svg>

      {/* Proximity radius static ring */}
      <div
        className="absolute rounded-full border border-proximity/20"
        style={{
          width: 130, height: 130,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 255, 135, 0.03)',
        }}
      />

      {/* Self */}
      <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold border border-primary-dim">
          ME
        </div>
      </div>

      {/* Nearby users */}
      {[
        { x: '35%', y: '38%', label: 'RX', color: 'bg-proximity border border-proximity/40' },
        { x: '62%', y: '62%', label: 'TK', color: 'bg-proximity border border-proximity/40' },
        { x: '42%', y: '68%', label: 'JM', color: 'bg-convoy border border-convoy/40', convoy: true },
      ].map((u) => (
        <div key={u.label} className="absolute" style={{ left: u.x, top: u.y, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-background relative ${u.color}`}
          >
            {u.label}
            {u.convoy && (
              <div className="absolute -top-2 -right-2 text-[8px] bg-convoy text-white rounded px-0.5 font-bold leading-tight">
                C
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3" style={{ zIndex: 20 }}>
        <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-proximity" />
          <span className="text-xs font-semibold text-foreground">Proximity</span>
          <span className="text-[10px] text-muted ml-auto">3 near</span>
        </div>
      </div>

      {/* Mic button */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2" style={{ zIndex: 20 }}>
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
          <span className="text-white text-lg">&#127897;</span>
        </div>
      </div>
    </div>
  )
}
