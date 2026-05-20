'use client'

import { useState } from 'react'
import { Volume2, VolumeX, Pin, ShieldOff, Flag, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { socketActions } from '@/lib/socket'
import { cn, getInitials } from '@/lib/utils'

export function ProximityOverlay() {
  const [expanded, setExpanded] = useState(false)
  const { nearbyUsers, speaking, volumes } = useAppStore()

  if (nearbyUsers.length === 0) {
    return (
      <div className="absolute top-16 left-4 right-4">
        <div className="glass rounded-card px-4 py-3 flex items-center gap-3">
          <div className="live-dot" />
          <span className="text-sm text-muted">No one nearby — you&apos;re the first here</span>
        </div>
      </div>
    )
  }

  const displayed = expanded ? nearbyUsers : nearbyUsers.slice(0, 3)

  return (
    <div className="absolute top-16 left-4 right-4 space-y-2 animate-slide-up">
      {displayed.map((u) => {
        const vol = volumes[u.userId] ?? 1
        const isSpeaking = speaking[u.userId] ?? false
        const label = `User ${u.userId.slice(0, 6)}`

        return (
          <div
            key={u.userId}
            className={cn(
              'glass rounded-card px-3 py-2.5 flex items-center gap-3 transition-all duration-300',
              isSpeaking && 'border-proximity/40 shadow-neon-green'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-background flex-shrink-0',
                isSpeaking ? 'bg-proximity shadow-neon-green' : 'bg-surface-high text-muted-bright'
              )}
            >
              {getInitials(label)}
            </div>

            {/* Name + speaking indicator */}
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
              {/* Volume bar */}
              <div className="mt-1 h-1 rounded-full bg-border overflow-hidden w-20">
                <div
                  className="h-full rounded-full bg-proximity transition-all duration-300"
                  style={{ width: `${vol * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <ActionBtn
                icon={<Pin className="w-3.5 h-3.5" />}
                label="Pin"
                onClick={() => socketActions.pinUser(u.userId)}
                neon
              />
              <ActionBtn
                icon={<VolumeX className="w-3.5 h-3.5" />}
                label="Mute"
                onClick={() => socketActions.muteUser(u.userId)}
              />
              <ActionBtn
                icon={<ShieldOff className="w-3.5 h-3.5" />}
                label="Block"
                onClick={() => socketActions.blockUser(u.userId)}
                danger
              />
            </div>
          </div>
        )
      })}

      {nearbyUsers.length > 3 && (
        <button
          className="w-full glass rounded-card py-2 text-xs text-muted hover:text-foreground flex items-center justify-center gap-1 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> {nearbyUsers.length - 3} more nearby</>
          )}
        </button>
      )}
    </div>
  )
}

function ActionBtn({
  icon, label, onClick, neon, danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  neon?: boolean
  danger?: boolean
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
