import Link from 'next/link'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary shadow-neon flex items-center justify-center">
              <span className="text-white text-xs font-black">L</span>
            </div>
            <span className="text-lg font-bold gradient-text">Locus</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted hover:text-foreground transition-colors hidden sm:block">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted hover:text-foreground transition-colors hidden sm:block">
              How it works
            </Link>
            <Link href="/onboarding" className="text-sm text-muted hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="text-sm bg-primary text-white px-4 py-2 rounded-xl shadow-neon hover:shadow-neon-lg hover:bg-primary-glow transition-all duration-200 font-semibold"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
