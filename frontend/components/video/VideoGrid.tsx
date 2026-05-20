'use client'

import { Video, VideoOff } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function VideoGrid() {
  const { videoEnabled, remoteVideoEnabled, user } = useAppStore()

  const remoteActive = Object.entries(remoteVideoEnabled)
    .filter(([, enabled]) => enabled)
    .map(([userId]) => userId)

  const total = remoteActive.length + (videoEnabled ? 1 : 0)
  if (total === 0) return null

  const cols = total === 1 ? 'grid-cols-1' : 'grid-cols-2'
  const height = total <= 2 ? 'h-40' : total <= 4 ? 'h-72' : 'h-96'

  return (
    <div className="absolute left-4 right-4 animate-fade-in z-30"
      style={{ top: 'calc(env(safe-area-inset-top) + 300px)' }}
    >
      <div
        className={cn(
          'glass-bright rounded-card overflow-hidden border border-convoy/30',
          height
        )}
      >
        <div className={cn('grid gap-1 p-1 h-full', cols)}>
          {videoEnabled && user && (
            <VideoTile userId={user.id} displayName={user.displayName} isSelf />
          )}
          {remoteActive.map((uid) => (
            <VideoTile key={uid} userId={uid} displayName={`User ${uid.slice(0, 6)}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

function VideoTile({
  userId, displayName, isSelf,
}: {
  userId: string
  displayName: string
  isSelf?: boolean
}) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-surface-high flex items-center justify-center">
      {/* Placeholder — replace with LiveKit VideoTrackRenderer when integrating livekit-client */}
      <div className="flex flex-col items-center gap-2 text-muted">
        <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center text-sm font-bold text-muted-bright">
          {getInitials(displayName)}
        </div>
        <Video className="w-5 h-5 opacity-30" />
      </div>

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/60 text-white">
        {isSelf ? 'You' : displayName}
      </div>

      {/* Live badge for self */}
      {isSelf && (
        <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-convoy/80 text-white">
          LIVE
        </div>
      )}
    </div>
  )
}
