import Link from 'next/link'
import { NeonCard } from '@/components/ui/neon-card'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      {/* ─────────────────── HERO ─────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center grid-bg noise-overlay pt-20">
        {/* Radial glow blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan/6 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-proximity/6 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Live badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="live-dot" />
            <Badge variant="live">Live proximity audio</Badge>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
            Talk to{' '}
            <span className="gradient-text">who&apos;s near you</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time proximity voice chat for convoys, car meets, and road trips.
            Hear people nearby — louder the closer they are.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="px-8 py-4 bg-primary text-white rounded-xl text-lg font-bold shadow-neon hover:shadow-neon-lg hover:bg-primary-glow transition-all duration-200 w-full sm:w-auto"
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

          {/* Social proof */}
          <p className="mt-8 text-sm text-muted">
            No account required to try proximity mode &mdash; just open and talk
          </p>

          {/* Map preview mockup */}
          <div className="mt-16 relative max-w-2xl mx-auto">
            <div className="gradient-border rounded-panel overflow-hidden shadow-[0_0_80px_rgba(124,111,255,0.2)]">
              <div className="bg-surface-raised rounded-panel p-1">
                <MapMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── FEATURES ─────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Built for{' '}
              <span className="gradient-text-warm">the road</span>
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Not a walkie-talkie app. A live audio layer over physical space.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              glow="green"
              icon="📡"
              title="Proximity Voice"
              description="Hear everyone nearby. Volume scales with distance — the closer someone is, the louder they sound."
              badge={{ label: 'Live', variant: 'live' }}
            />
            <FeatureCard
              glow="blue"
              icon="🚗"
              title="Private Convoys"
              description="Create a private audio channel for your group. Share a link or QR code — everyone hears each other at equal volume."
              badge={{ label: 'Convoy', variant: 'convoy' }}
            />
            <FeatureCard
              glow="primary"
              icon="🎥"
              title="Video Chat"
              description="Opt-in video for convoy members. See who you're driving with without picking up your phone."
              badge={{ label: 'New', variant: 'default' }}
            />
            <FeatureCard
              glow="cyan"
              icon="📍"
              title="Live Map"
              description="See nearby users as avatars on a live map. Tap to pin, mute, or block — no distracting menus."
            />
            <FeatureCard
              glow="green"
              icon="🔒"
              title="Privacy Controls"
              description="Go invisible, friends-only, or convoy-only mode. You control who can hear and see you."
            />
            <FeatureCard
              glow="primary"
              icon="⚡"
              title="Under 2s Join"
              description="Open the app, tap talk. No room codes, no setup. You&apos;re live before you blink."
            />
          </div>
        </div>
      </section>

      {/* ─────────────────── HOW IT WORKS ─────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-surface/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              How it works
            </h2>
          </div>
          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 shadow-neon-sm">
                  {i + 1}
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── CTA ─────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to <span className="neon-text">go live?</span>
          </h2>
          <p className="text-muted text-lg mb-10">
            Join your first convoy in under 30 seconds.
          </p>
          <Link
            href="/onboarding"
            className="inline-block px-10 py-5 bg-primary text-white rounded-xl text-xl font-bold shadow-neon hover:shadow-neon-lg hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Get Started — it&apos;s free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-xs font-black">L</span>
          </div>
          <span className="font-semibold text-foreground">Locus</span>
        </div>
        <p>Talk to who&apos;s near you.</p>
      </footer>
    </main>
  )
}

const STEPS = [
  { title: 'Sign up with your phone number', desc: 'Phone verification only — no email, no passwords, no data harvesting.' },
  { title: 'Open the map', desc: 'See nearby users as avatars on a live map. The app immediately shows who\'s around you.' },
  { title: 'Start talking', desc: 'Tap the mic button. You\'re in proximity mode — anyone nearby can hear you, louder the closer they are.' },
  { title: 'Create or join a convoy', desc: 'For groups: create a convoy, share the QR code or link, and get a private audio channel for your whole group.' },
]

function FeatureCard({
  icon, title, description, glow, badge,
}: {
  icon: string
  title: string
  description: string
  glow?: 'primary' | 'cyan' | 'green' | 'blue'
  badge?: { label: string; variant: 'default' | 'live' | 'convoy' | 'proximity' }
}) {
  return (
    <NeonCard glow={glow} className="h-full">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
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
      {/* Simulated dark map grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(68,136,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(68,136,255,0.2) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      {/* Road lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 225">
        <line x1="200" y1="0" x2="200" y2="225" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <line x1="0" y1="112" x2="400" y2="112" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <line x1="0" y1="60" x2="400" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      </svg>

      {/* Proximity radius */}
      <div
        className="absolute rounded-full border border-proximity/30"
        style={{
          width: 120, height: 120,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 255, 135, 0.04)',
          boxShadow: '0 0 20px rgba(0, 255, 135, 0.15)',
        }}
      />

      {/* Self */}
      <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-neon animate-pulse">
          ME
        </div>
      </div>

      {/* Other users */}
      {[
        { x: '35%', y: '38%', label: 'RX', color: '#00FF87' },
        { x: '62%', y: '62%', label: 'TK', color: '#00FF87' },
        { x: '42%', y: '68%', label: 'JM', color: '#4488FF' },
      ].map((u) => (
        <div key={u.label} className="absolute" style={{ left: u.x, top: u.y, transform: 'translate(-50%, -50%)' }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-background"
            style={{ background: u.color, boxShadow: `0 0 10px ${u.color}66` }}
          >
            {u.label}
          </div>
        </div>
      ))}

      {/* Top bar overlay */}
      <div className="absolute top-3 left-3 right-3">
        <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-proximity animate-pulse" />
          <span className="text-xs font-semibold text-foreground">Proximity</span>
          <span className="text-[10px] text-muted ml-auto">3 near</span>
        </div>
      </div>

      {/* Mic button overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="w-12 h-12 rounded-full bg-primary shadow-neon flex items-center justify-center">
          <span className="text-white text-lg">🎙</span>
        </div>
      </div>
    </div>
  )
}
