import { Suspense } from 'react'
import Link from 'next/link'
import { Users, ArrowRight, Download, UserPlus } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { QRCodeSVG } from 'qrcode.react'

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

async function getPublicUser(username: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/user/public/${username}`,
      { next: { revalidate: 10 } }
    )
    if (!res.ok) return null
    return res.json() as Promise<{ id: string; displayName: string; points: number; premium: boolean }>
  } catch {
    return null
  }
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = params
  
  const convoy = await getConvoy(code)
  const publicUser = !convoy ? await getPublicUser(code) : null

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4 relative">
      <div className="relative w-full max-w-sm text-center space-y-8">
        <Link href="/" className="flex items-center justify-center gap-2 mb-2 group">
          <Logo className="w-8 h-8 text-primary transition-transform duration-200 group-hover:scale-105" />
          <span className="text-xl font-black text-foreground tracking-tight">Locus</span>
        </Link>

        {convoy ? (
          <>
            <div className="bg-surface-raised border border-border rounded-panel p-6">
              <div className="w-14 h-14 rounded-full bg-convoy/20 border-2 border-convoy/40 flex items-center justify-center mx-auto mb-4">
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

            <div className="space-y-3">
              <p className="text-sm text-muted">
                Open Locus on your phone to join this convoy.
              </p>
              <a
                href={`locus://convoy/${code}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-convoy text-white rounded-xl font-bold text-sm hover:bg-convoy/90 transition-all"
              >
                Open in Locus App <ArrowRight className="w-4 h-4" />
              </a>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl shadow-lg inline-block">
                  <QRCodeSVG
                    value={`locus://convoy/${code}`}
                    size={140}
                    level="M"
                    fgColor="#0D1117"
                  />
                </div>
              </div>
              <p className="text-xs text-muted">Scan to open in the app</p>
              <Link
                href="/app/download"
                className="flex items-center justify-center gap-2 w-full py-3 bg-surface border border-border text-foreground rounded-xl font-bold text-sm hover:bg-surface-raised transition-all"
              >
                Download Locus <Download className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : publicUser ? (
          <>
            <div className="bg-surface-raised border border-border rounded-panel p-6">
              <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-6 h-6 text-primary-light" />
              </div>
              <h1 className="text-2xl font-black text-foreground mb-1">@{publicUser.displayName}</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                {publicUser.premium && (
                  <span className="px-2 py-0.5 rounded bg-primary/20 border border-primary/40 text-[10px] font-semibold text-primary-light tracking-wide uppercase">
                    Premium Driver
                  </span>
                )}
                <span className="text-muted text-sm">
                  {publicUser.points} points
                </span>
              </div>
              <p className="mt-4 text-sm text-muted leading-relaxed max-w-[260px] mx-auto">
                invited you to join Locus, the proximity radar voice chat app for drivers.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted">
                Download Locus on your phone to get started.
              </p>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl shadow-lg inline-block">
                  <QRCodeSVG
                    value="https://locus.wtf/app/download"
                    size={140}
                    level="M"
                    fgColor="#0D1117"
                  />
                </div>
              </div>
              <p className="text-xs text-muted">Scan to download on your phone</p>
              <Link
                href="/app/download"
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dim transition-all"
              >
                Download Locus <Download className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="glass rounded-panel p-8 space-y-4">
              <div className="text-5xl">🔍</div>
              <h1 className="text-xl font-bold text-foreground">Invite not found</h1>
              <p className="text-sm text-muted">
                The invite link or username <span className="font-mono text-foreground">{code}</span> doesn&apos;t match any active convoy or user profile.
              </p>
              <p className="text-xs text-muted">
                Make sure you typed the link correctly, or ask the organiser/friend for a fresh invite link.
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
