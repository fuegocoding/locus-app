import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="w-7 h-7 text-primary transition-transform duration-200 group-hover:scale-105" />
            <span className="text-lg font-bold text-foreground tracking-tight">Locus</span>
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
              className="text-sm bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dim transition-all duration-200 font-semibold shadow-sm"
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
