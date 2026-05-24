'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="glass border-t border-border flex items-center justify-around px-6 py-2 safe-area-pb">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200',
                active
                  ? 'text-primary'
                  : 'text-muted hover:text-muted-bright'
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
