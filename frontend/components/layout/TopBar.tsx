'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, ClipboardList, Radio, Users, ChevronDown, ChevronUp, Pin, VolumeX, ShieldOff } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { socketActions } from '@/lib/socket'
import { Badge } from '@/components/ui/badge'
import { cn, getInitials } from '@/lib/utils'

export function TopBar() {
  const { mode, nearbyUsers, currentConvoy, speaking, volumes } = useAppStore()
  const [expanded, setExpanded] = useState(false)
  const isProximity = mode === 'proximity'

  return (
    <div className="absolute top-0 left-0 right-0 z-40 px-4 pt-4">
      <div className="glass rounded-card overflow-hidden">
        {/* ── Main row ── */}
        <div className="px-3 py-2.5 flex items-center gap-3">
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
                {nearbyUsers.length > 0 ? (
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-1"
                  >
                    <Badge variant="proximity" className="text-[10px]">
                      {nearbyUsers.length} near
                    </Badge>
                    {expanded
                      ? <ChevronUp className="w-3 h-3 text-proximity" />
                      : <ChevronDown className="w-3 h-3 text-proximity" />
                    }
                  </button>
                ) : (
                  <Badge variant="proximity" className="text-[10px]">0 near</Badge>
                )}
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
              href="/tasks"
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-all duration-200"
              title="Tasks"
            >
              <ClipboardList className="w-4.5 h-4.5" />
            </Link>
            <Link
              href="/settings"
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-all duration-200"
              title="Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </Link>
          </div>
        </div>

        {/* ── Expandable nearby list ── */}
        {isProximity && expanded && nearbyUsers.length > 0 && (
          <div className="border-t border-border/50 divide-y divide-border/30">
            {nearbyUsers.map((u) => {
              const vol = volumes[u.userId] ?? 1
              const isSpeaking = speaking[u.userId] ?? false
              const label = `User ${u.userId.slice(0, 6)}`

              return (
                <div
                  key={u.userId}
                  className={cn(
                    'px-3 py-2.5 flex items-center gap-3 transition-all duration-300',
                    isSpeaking && 'bg-proximity/5'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-background flex-shrink-0',
                      isSpeaking ? 'bg-proximity shadow-neon-green' : 'bg-surface-high text-muted-bright'
                    )}
                  >
                    {getInitials(label)}
                  </div>

                  {/* Name + volume */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{label}</span>
                      {isSpeaking && (
                        <div className="flex items-end gap-[2px] h-3.5">
                          <span className="speaking-bar h-2" />
                          <span className="speaking-bar h-3.5" />
                          <span className="speaking-bar h-2" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-border overflow-hidden w-16">
                      <div
                        className="h-full rounded-full bg-proximity transition-all duration-300"
                        style={{ width: `${vol * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <NearbyBtn icon={<Pin className="w-3.5 h-3.5" />} label="Pin" onClick={() => socketActions.pinUser(u.userId)} neon />
                    <NearbyBtn icon={<VolumeX className="w-3.5 h-3.5" />} label="Mute" onClick={() => socketActions.muteUser(u.userId)} />
                    <NearbyBtn icon={<ShieldOff className="w-3.5 h-3.5" />} label="Block" onClick={() => socketActions.blockUser(u.userId)} danger />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function NearbyBtn({ icon, label, onClick, neon, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; neon?: boolean; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'p-1.5 rounded-lg transition-all duration-200',
        neon && 'text-muted hover:text-primary hover:bg-primary/10',
        danger && 'text-muted hover:text-error hover:bg-error/10',
        !neon && !danger && 'text-muted hover:text-muted-bright hover:bg-surface-high'
      )}
    >
      {icon}
    </button>
  )
}
