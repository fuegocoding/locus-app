import { Suspense } from 'react'
import Link from 'next/link'
import { Users, ArrowRight, Download } from 'lucide-react'

interface PageProps {
  params: { code: string }
}

async function getConvoy(code: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/convoy/${code}`,
      { next: { revalidate: 10 } }
    )
    if (!res.ok) return null
    return res.json() as Promise<{ id: string; name: string; memberCount: number }>
  } catch {
    return null
  }
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = params
  const convoy = await getConvoy(code)

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4 relative">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-convoy/8 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm text-center space-y-8">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary shadow-neon flex items-center justify-center">
            <span className="text-white font-black">L</span>
          </div>
          <span className="text-xl font-black gradient-text">Locus</span>
        </Link>

        {convoy ? (
          <>
            {/* Convoy card */}
            <div className="gradient-border rounded-panel">
              <div className="bg-surface-raised rounded-panel p-6">
                <div className="w-14 h-14 rounded-full bg-convoy/20 border-2 border-convoy/40 flex items-center justify-center mx-auto mb-4 shadow-neon-blue">
                  <Users className="w-6 h-6 text-convoy" />
                </div>
                <h1 className="text-2xl font-black text-foreground mb-1">{convoy.name}</h1>
                <p className="text-muted text-sm">
                  {convoy.memberCount} member{convoy.memberCount !== 1 ? 's' : ''} · Convoy
                </p>
                <div className="mt-3 px-4 py-2 bg-surface rounded-xl border border-border inline-block">
                  <span className="font-mono text-lg font-bold tracking-widest text-foreground">
                    {code}
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <Link
                href={`/app/map?join=${code}`}
                className="flex items-center justify-center gap-2 w-full py-4 bg-convoy text-white rounded-xl font-bold text-base shadow-neon-blue hover:shadow-[0_0_30px_rgba(68,136,255,0.7)] transition-all"
              >
                Join in browser <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-muted">or</p>
              <div className="glass rounded-xl p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Download className="w-4 h-4 text-primary" />
                  Get the app for the best experience
                </div>
                <div className="flex gap-2">
                  <AppStoreBadge label="App Store" />
                  <AppStoreBadge label="Google Play" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Not found */}
            <div className="glass rounded-panel p-8 space-y-4">
              <div className="text-5xl">🔍</div>
              <h1 className="text-xl font-bold text-foreground">Convoy not found</h1>
              <p className="text-sm text-muted">
                The invite code <span className="font-mono text-foreground">{code}</span> doesn&apos;t match any active convoy.
              </p>
              <p className="text-xs text-muted">
                Convoys expire when all members leave. Ask the organiser for a fresh invite.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-glow transition-colors"
            >
              ← Back to Locus
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

function AppStoreBadge({ label }: { label: string }) {
  return (
    <div className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-center cursor-pointer hover:border-border-bright transition-colors">
      <p className="text-[10px] text-muted">Available on</p>
      <p className="text-xs font-semibold text-foreground">{label}</p>
    </div>
  )
}
