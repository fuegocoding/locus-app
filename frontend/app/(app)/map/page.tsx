'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Mic, Touchpad, Users, Radio, ChevronUp, MapPin, VolumeX, Ban, Copy, Check } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { socketActions } from '@/lib/socket'
import { TopBar } from '@/components/layout/TopBar'
import { MicButton } from '@/components/audio/MicButton'
import { ConvoyPanel } from '@/components/convoy/ConvoyPanel'
import { VideoGrid } from '@/components/video/VideoGrid'
import { Button } from '@/components/ui/button'
import type { PresenceUpdate } from '@/types'

// MapView uses browser APIs — load client-side only
const MapView = dynamic(
  () => import('@/components/map/MapView').then((m) => m.MapView),
  { ssr: false, loading: () => <MapSkeleton /> }
)

export default function MapPage() {
  const { mode, setPosition, speed } = useAppStore()
  const [selectedUser, setSelectedUser] = useState<PresenceUpdate | null>(null)
  const [showConvoyModal, setShowConvoyModal] = useState(false)

  // Start geolocation tracking
  useEffect(() => {
    let watchId: number

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed: spd, heading: hdg } = pos.coords
          const kmh = (spd ?? 0) * 3.6
          const heading = hdg ?? 0
          setPosition(latitude, longitude, kmh, heading)
          socketActions.updatePresence(latitude, longitude, kmh, heading)
        },
        (err) => console.warn('Geolocation error:', err.message),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      )
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }
  }, [setPosition])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* ── Map ── */}
      <MapView onUserClick={setSelectedUser} />

      {/* ── Top bar ── */}
      <TopBar />

      {/* ── Mode overlays ── */}
      {mode === 'convoy' && (
        <>
          <ConvoyPanel />
          <VideoGrid />
        </>
      )}

      {/* ── Bottom bar ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-6 z-30">
        {/* Mic button */}
        <MicButton />
      </div>

      {/* ── Bottom action pill ── */}
      <div className="absolute bottom-6 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        {/* Speedometer */}
        <div className="pointer-events-auto glass rounded-xl px-3 py-2 flex flex-col items-center min-w-[60px]">
          <span className="text-xl font-black text-foreground leading-none">
            {Math.round(speed)}
          </span>
          <span className="text-[9px] text-muted font-medium uppercase tracking-wider">km/h</span>
        </div>

        {/* Mode pill */}
        <div className="pointer-events-auto flex items-center">
          {/* spacer for mic */}
          <div className="w-20 h-20" />
        </div>

        {/* Convoy action */}
        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <Button
            variant={mode === 'convoy' ? 'neon-cyan' : 'secondary'}
            size="icon"
            onClick={() => setShowConvoyModal(true)}
            className="w-14 h-14 rounded-xl"
          >
            <Users className="w-5 h-5" />
          </Button>
          <span className="text-[9px] text-muted font-medium uppercase tracking-wider">Convoy</span>
        </div>
      </div>

      {/* ── Convoy quick-action modal ── */}
      {showConvoyModal && (
        <ConvoyQuickModal onClose={() => setShowConvoyModal(false)} />
      )}

      {/* ── User detail sheet ── */}
      {selectedUser && (
        <UserSheet user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="w-full h-full bg-surface-raised grid-bg flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted">Loading map…</p>
      </div>
    </div>
  )
}

function ConvoyQuickModal({ onClose }: { onClose: () => void }) {
  const { mode, currentConvoy, error, clearError } = useAppStore()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (mode === 'convoy') onClose()
  }, [mode, onClose])

  function create() {
    if (!name.trim()) return
    socketActions.createConvoy(name.trim())
  }

  function join() {
    if (!code.trim()) return
    clearError()
    socketActions.joinConvoy(code.trim().toUpperCase())
  }

  function leave() {
    socketActions.leaveConvoy()
    onClose()
  }

  function copyCode() {
    if (!currentConvoy?.inviteCode) return
    navigator.clipboard.writeText(currentConvoy.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function switchTab(t: 'create' | 'join') {
    setTab(t)
    clearError()
  }

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full glass-bright rounded-t-panel p-6 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === 'convoy' ? (
          <>
            <h3 className="text-lg font-bold mb-1">{currentConvoy?.name ?? "You're in a convoy"}</h3>
            <p className="text-xs text-muted mb-4">
              {currentConvoy?.members.length ?? 0} member{(currentConvoy?.members.length ?? 0) !== 1 ? 's' : ''}
            </p>
            {currentConvoy?.inviteCode && (
              <div className="flex items-center gap-2 mb-4 bg-surface rounded-xl px-4 py-3 border border-border">
                <span className="flex-1 font-mono text-lg tracking-widest text-foreground">
                  {currentConvoy.inviteCode}
                </span>
                <button
                  onClick={copyCode}
                  className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-all"
                  title="Copy invite code"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
            <Button variant="danger" className="w-full" onClick={leave}>
              Leave Convoy
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold mb-4">Convoy</h3>
            <div className="flex gap-2 mb-4">
              {(['create', 'join'] as const).map((t) => (
                <button
                  key={t}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    tab === t
                      ? 'bg-primary text-white shadow-neon-sm'
                      : 'bg-surface text-muted hover:text-foreground'
                  }`}
                  onClick={() => switchTab(t)}
                >
                  {t === 'create' ? 'Create' : 'Join with code'}
                </button>
              ))}
            </div>

            {tab === 'create' ? (
              <div className="space-y-3">
                <input
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted outline-none focus:border-primary focus:shadow-neon-sm transition-all"
                  placeholder="Convoy name e.g. Road Trip Crew"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && create()}
                  maxLength={40}
                />
                <Button className="w-full" onClick={create} disabled={!name.trim()}>
                  Create Convoy
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  className={`w-full bg-surface border rounded-xl px-4 py-3 text-foreground placeholder:text-muted outline-none focus:shadow-neon-sm transition-all font-mono text-lg tracking-widest uppercase ${
                    error ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                  }`}
                  placeholder="ABC123"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().slice(0, 6))
                    clearError()
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && join()}
                  maxLength={6}
                />
                {error && <p className="text-sm text-error">{error}</p>}
                <Button className="w-full" onClick={join} disabled={code.length < 6}>
                  Join Convoy
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function UserSheet({ user, onClose }: { user: PresenceUpdate; onClose: () => void }) {
  const { latitude, longitude } = useAppStore()
  const label = `User ${user.userId.slice(0, 6)}`
  const initials = user.userId.slice(0, 2).toUpperCase()

  const dLat = (user.latitude - latitude) * 111320
  const dLng = (user.longitude - longitude) * 111320 * Math.cos(latitude * (Math.PI / 180))
  const distM = Math.sqrt(dLat * dLat + dLng * dLng)
  const distLabel = distM < 1000 ? `${Math.round(distM)}m away` : `${(distM / 1000).toFixed(1)}km away`

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full glass-bright rounded-t-panel p-6 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-proximity/20 border border-proximity/40 flex items-center justify-center text-proximity font-bold">
            {initials}
          </div>
          <div>
            <h3 className="font-bold text-foreground">{label}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted">{user.mode === 'convoy' ? 'In convoy' : 'Proximity'}</p>
              <span className="text-xs text-muted/50">·</span>
              <p className="text-xs text-muted">{distLabel}</p>
              {user.speed > 0 && (
                <>
                  <span className="text-xs text-muted/50">·</span>
                  <p className="text-xs text-muted">{Math.round(user.speed)} km/h</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ActionButton label="Pin" icon={<MapPin className="w-5 h-5" />} onClick={() => { socketActions.pinUser(user.userId); onClose() }} neon />
          <ActionButton label="Mute" icon={<VolumeX className="w-5 h-5" />} onClick={() => { socketActions.muteUser(user.userId); onClose() }} />
          <ActionButton label="Block" icon={<Ban className="w-5 h-5" />} onClick={() => { socketActions.blockUser(user.userId); onClose() }} danger />
        </div>
      </div>
    </div>
  )
}

function ActionButton({ label, icon, onClick, neon, danger }: {
  label: string; icon: React.ReactNode; onClick: () => void; neon?: boolean; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-all border ${
        neon ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20' :
        danger ? 'border-error/30 bg-error/10 text-error hover:bg-error/20' :
        'border-border bg-surface text-muted hover:text-foreground hover:border-border-bright'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
