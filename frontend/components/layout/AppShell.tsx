'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ClipboardList, Settings, LogOut, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { disconnectSocket } from '@/lib/socket'
import { AdSlot } from '@/components/ui/AdSlot'
import { Logo } from '@/components/ui/logo'

const APK_URL = 'https://github.com/fuegocoding/locus-app/releases/download/v1.0.0/app-release.apk'

const NAV = [
  { href: '/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { clearAuth } = useAppStore()

  async function handleLogout() {
    await authApi.logout()
    disconnectSocket()
    clearAuth()
    router.push('/')
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ── Header ── */}
      <header className="glass border-b border-border flex items-center justify-between px-4 py-2.5 flex-shrink-0 z-40">
        {/* Logo → back to landing */}
        <Link href="/" className="flex items-center gap-2 group">
          <Logo className="w-7 h-7 text-primary transition-transform duration-200 group-hover:scale-105" />
          <span className="text-lg font-bold text-foreground tracking-tight">Locus</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <a
            href={APK_URL}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Get the app
          </a>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Body: left ad | content | right ad ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left ad sidebar — desktop only */}
        <aside className="hidden xl:flex flex-col gap-4 w-44 flex-shrink-0 p-4">
          <AdSlot />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </main>

        {/* Right ad sidebar — desktop only */}
        <aside className="hidden xl:flex flex-col gap-4 w-44 flex-shrink-0 p-4">
          <AdSlot />
        </aside>
      </div>

      {/* ── Bottom nav ── */}
      <nav className="glass border-t border-border flex items-center justify-around px-6 py-2 safe-area-pb flex-shrink-0">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200',
                active ? 'text-primary' : 'text-muted hover:text-muted-bright'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(124,111,255,0.8)]')} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
