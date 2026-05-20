'use client'

import Link from 'next/link'
import { Settings, ClipboardList, Radio, Users } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function TopBar() {
  const { mode, nearbyUsers, currentConvoy } = useAppStore()
  const isProximity = mode === 'proximity'

  return (
    <div className="absolute top-0 left-0 right-0 z-40 px-4 pt-4">
      <div className="glass rounded-card px-3 py-2.5 flex items-center gap-3">
        {/* Mode indicator */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              isProximity
                ? 'bg-proximity shadow-neon-green animate-pulse'
                : 'bg-convoy shadow-neon-blue animate-pulse'
            )}
          />

          {isProximity ? (
            <div className="flex items-center gap-2 min-w-0">
              <Radio className="w-3.5 h-3.5 text-proximity flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">Proximity</span>
              <Badge variant="proximity" className="text-[10px]">
                {nearbyUsers.length} near
              </Badge>
            </div>
          ) : currentConvoy ? (
            <div className="flex items-center gap-2 min-w-0">
              <Users className="w-3.5 h-3.5 text-convoy flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground truncate">
                {currentConvoy.name}
              </span>
              <Badge variant="convoy" className="text-[10px]">
                {currentConvoy.members.length}
              </Badge>
            </div>
          ) : null}
        </div>

        {/* Nav actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href="/app/tasks"
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-all duration-200"
            title="Tasks"
          >
            <ClipboardList className="w-4.5 h-4.5" />
          </Link>
          <Link
            href="/app/settings"
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
