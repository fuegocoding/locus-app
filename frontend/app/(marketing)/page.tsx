import Link from 'next/link'
import { Radio, Car, MapPin, ShieldCheck, Zap, QrCode } from 'lucide-react'
import { NeonCard } from '@/components/ui/neon-card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { QRCodeSVG } from 'qrcode.react'

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-background">

      {/* ─────────────────── HERO ─────────────────── */}
      <section className="relative flex flex-col items-center justify-center grid-bg noise-overlay pt-[120px] pb-14 border-b border-border/40">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight text-foreground">
            Talk to{' '}
            <span className="text-primary">who&apos;s near you</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time proximity voice for convoys, car meets, and road trips.
            Open the map — hear everyone around you.
          </p>

          {/* CTAs — QR code */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCodeSVG
                value="https://locus.wtf/app/download"
                size={160}
                level="M"
                fgColor="#0D1117"
              />
            </div>
            <p className="text-sm text-muted">Scan to download on your phone</p>
            <Link
              href="/app/download"
              className="text-xs text-muted-bright hover:text-foreground underline underline-offset-2 transition-colors"
            >
              or download directly
            </Link>
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
            Scan the QR code to download Locus on your phone.
          </p>
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg inline-block">
              <QRCodeSVG
                value="https://locus.wtf/app/download"
                size={180}
                level="M"
                fgColor="#0D1117"
              />
            </div>
          </div>
          <p className="text-sm text-muted mb-2">Scan to download on your phone</p>
          <Link
            href="/app/download"
            className="text-xs text-muted-bright hover:text-foreground underline underline-offset-2 transition-colors"
          >
            or download directly
          </Link>
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
    title: 'Download the app',
    desc: 'Scan the QR code or download Locus for iOS or Android — phone verification only, no passwords.',
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
