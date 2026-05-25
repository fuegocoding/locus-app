import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { Download, Users, Star } from 'lucide-react'

interface UserProfile {
  id: string
  displayName: string
  points: number
  premium: boolean
  createdAt: string
}

async function getUserProfile(username: string): Promise<UserProfile | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  try {
    const res = await fetch(`${apiUrl}/api/auth/user/public/${encodeURIComponent(username)}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const user = await getUserProfile(username)
  if (!user) return { title: 'User not found | Locus' }

  const title = `${user.displayName} on Locus`
  const description = `Join ${user.displayName} on Locus — proximity voice chat for convoys, meets, and road trips.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://locus.wtf/${user.displayName}`,
    },
  }
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getUserProfile(username)

  if (!user) notFound()

  const githubReleaseUrl = 'https://github.com/fuegocoding/locus-app/releases'
  const latestApkUrl = 'https://github.com/fuegocoding/locus-app/releases/latest/download/app-release.apk'
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 h-14">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="w-7 h-7 text-primary transition-transform duration-200 group-hover:scale-105" />
            <span className="text-lg font-bold text-foreground tracking-tight">Locus</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center pt-14 pb-16 px-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-foreground">{user.displayName}</h1>
              {user.premium && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
                  <Star className="w-3 h-3" /> Premium
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#C4B5FD]" />
                {user.points} pts
              </span>
              <span>Member since {memberSince}</span>
            </div>
          </div>

          <p className="text-muted text-sm leading-relaxed">
            <span className="font-semibold text-foreground">{user.displayName}</span> invited you to
            join Locus — the proximity voice chat app for convoys, car meets, and road trips.
            Talk to who&apos;s near you in real time.
          </p>

          <div className="space-y-4">
            <a
              href={latestApkUrl}
              className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-primary text-white rounded-xl text-lg font-bold hover:bg-primary-dim transition-all duration-200 shadow-sm"
            >
              <Download className="w-5 h-5" />
              Download for Android
            </a>

            <p className="text-xs text-muted">
              Google Play Store coming soon.{' '}
              <a
                href={githubReleaseUrl}
                className="underline hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub releases
              </a>
            </p>

            <div className="flex items-center justify-center gap-3 pt-4">
              <a
                href="https://apps.apple.com/app/placeholder"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/50 text-muted text-sm cursor-not-allowed"
                aria-disabled="true"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.locus.app"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/50 text-muted text-sm cursor-not-allowed"
                aria-disabled="true"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z"/>
                </svg>
                Google Play
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted border-t border-border/40">
        <Link href="/" className="hover:text-foreground transition-colors">
          Locus
        </Link>
        {' '}&middot;{' '}
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
        {' '}&middot;{' '}
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
      </footer>
    </div>
  )
}
