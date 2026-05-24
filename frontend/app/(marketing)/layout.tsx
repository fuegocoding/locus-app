import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { MarketingNav } from '@/components/layout/MarketingNav'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 h-14">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="w-7 h-7 text-primary transition-transform duration-200 group-hover:scale-105" />
            <span className="text-lg font-bold text-foreground tracking-tight">Locus</span>
          </Link>
          <MarketingNav />
        </div>
      </header>
      {children}
    </div>
  )
}
