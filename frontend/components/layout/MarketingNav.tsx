'use client'

import Link from 'next/link'
import { useAppStore } from '@/lib/store'

export function MarketingNav() {
  const user = useAppStore((s) => s.user)

  return (
    <nav className="flex items-center gap-6">
      <Link href="/#features" className="text-sm text-muted hover:text-foreground transition-colors hidden sm:block">
        Features
      </Link>
      <Link href="/#how-it-works" className="text-sm text-muted hover:text-foreground transition-colors hidden sm:block">
        How it works
      </Link>
      {user ? (
        <Link href="/settings" className="text-sm text-muted hover:text-foreground transition-colors">
          Dashboard
        </Link>
      ) : (
        <Link href="/onboarding" className="text-sm text-muted hover:text-foreground transition-colors">
          Sign in
        </Link>
      )}
      <Link
        href="https://github.com/fuegocoding/locus-app/releases/download/v1.0.0/app-release.apk"
        className="text-sm bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dim transition-all duration-200 font-semibold shadow-sm"
      >
        Get Started
      </Link>
    </nav>
  )
}
