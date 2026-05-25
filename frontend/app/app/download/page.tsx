'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { Download, CheckCircle2 } from 'lucide-react'

export default function DownloadPage() {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (started) return
    setStarted(true)

    const link = document.createElement('a')
    link.href = '/app/download/file'
    link.download = 'locus.apk'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [started])

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
            <div className="w-20 h-20 mx-auto rounded-full bg-[#10B981]/10 border-2 border-[#10B981]/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Thank you for downloading!
              </h1>
              <p className="mt-2 text-muted text-sm leading-relaxed">
                Your download is starting now.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="pt-4 border-t border-border/40">
              <p className="text-xs text-muted mb-3">
                Download didn&apos;t start?
              </p>
              <a
                href="/app/download/file"
                download="locus.apk"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-white rounded-xl text-base font-bold hover:bg-primary-dim transition-all duration-200 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Now
              </a>
            </div>

            <div className="text-xs text-muted space-y-1">
              <p>
                After installing, open Locus and{' '}
                <Link href="/onboarding" className="underline hover:text-foreground transition-colors">
                  create your account
                </Link>
                .
              </p>
              <p>
                Allow installation from unknown sources if prompted.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted border-t border-border/40">
        <Link href="/" className="hover:text-foreground transition-colors">Locus</Link>
        {' '}&middot;{' '}
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        {' '}&middot;{' '}
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
      </footer>
    </div>
  )
}
