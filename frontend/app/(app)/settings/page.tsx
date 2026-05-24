'use client'

import { useEffect, useState } from 'react'
import { Shield, Volume2, Gauge, Eye, Pencil, Check, X, Smartphone } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { authApi, settingsApi } from '@/lib/api'
import { NeonCard } from '@/components/ui/neon-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'

const APK_URL = 'https://github.com/fuegocoding/locus-app/releases/download/v1.0.0/app-release.apk'

const AVATAR_COLORS = [
  '#7C6FFF', // primary
  '#00E5FF', // cyan
  '#00FF87', // proximity/green
  '#4488FF', // convoy/blue
  '#FF4466', // red
  '#FFAA00', // amber
  '#FF6EC7', // pink
  '#A78BFA', // violet
]

const PRIVACY_MODES = [
  { value: 'open', label: 'Open', desc: 'Anyone nearby can see and hear you' },
  { value: 'friends-only', label: 'Friends only', desc: 'Only mutual followers' },
  { value: 'convoy-only', label: 'Convoy only', desc: 'Only visible in convoy mode' },
  { value: 'invisible', label: 'Invisible', desc: 'Hidden from all users' },
] as const

const SPEED_UNITS = [
  { value: 'auto', label: 'Auto (by locale)' },
  { value: 'kmh', label: 'km/h' },
  { value: 'mph', label: 'mph' },
] as const

const AVATAR_COLOR_KEY = 'locus_avatar_color'

function getAvatarColor(): string {
  if (typeof window === 'undefined') return AVATAR_COLORS[0]
  return localStorage.getItem(AVATAR_COLOR_KEY) ?? AVATAR_COLORS[0]
}

export default function SettingsPage() {
  const { user, setUser, settings, setSettings, pushToTalk, setPushToTalk } = useAppStore()
  const [savingField, setSavingField] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Name editing state
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)

  // Avatar color state
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0])
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    setAvatarColor(getAvatarColor())
  }, [])

  // Fetch settings on mount
  useEffect(() => {
    let mounted = true
    settingsApi.get()
      .then((s) => {
        if (!mounted) return
        setSettings(s)
        setPushToTalk(s.pushToTalk)
        if (s.privacyMode && user && user.privacyMode !== s.privacyMode) {
          setUser({ ...user, privacyMode: s.privacyMode })
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [setSettings, setPushToTalk, setUser, user])

  async function saveSetting(field: string, data: Partial<Parameters<typeof settingsApi.update>[0]>) {
    setSavingField(field)
    setError(null)
    try {
      const updated = await settingsApi.update(data)
      setSettings(updated)
      if (data.pushToTalk !== undefined) setPushToTalk(data.pushToTalk)
      if (data.privacyMode !== undefined && user) {
        setUser({ ...user, privacyMode: data.privacyMode })
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save')
    } finally {
      setSavingField(null)
    }
  }

  function startEditName() {
    setNameInput(user?.displayName ?? '')
    setNameError(null)
    setEditingName(true)
  }

  function cancelEditName() {
    setEditingName(false)
    setNameError(null)
  }

  async function saveNameEdit() {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed.length < 2) { setNameError('At least 2 characters'); return }
    if (trimmed.length > 30) { setNameError('Max 30 characters'); return }
    if (!/^[a-zA-Z0-9_\- ]+$/.test(trimmed)) { setNameError('Letters, numbers, spaces, _ and - only'); return }
    setSavingName(true)
    setNameError(null)
    try {
      const updated = await authApi.updateProfile({ displayName: trimmed })
      setUser({ ...user!, displayName: (updated as any).displayName ?? trimmed })
      setEditingName(false)
    } catch (err: any) {
      setNameError(err?.message || 'Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  function pickAvatarColor(color: string) {
    setAvatarColor(color)
    localStorage.setItem(AVATAR_COLOR_KEY, color)
    setShowColorPicker(false)
  }

  const privacyMode = settings?.privacyMode ?? user?.privacyMode ?? 'open'
  const speedUnit = settings?.speedUnit ?? 'auto'
  const anonymousMode = settings?.anonymousMode ?? false

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Profile card ── */}
        <NeonCard glow="primary">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowColorPicker((v) => !v)}
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xl shadow-neon border-2 border-white/10 hover:border-white/30 transition-all"
                style={{ background: avatarColor }}
                title="Change avatar color"
              >
                {user ? getInitials(user.displayName) : '?'}
              </button>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-surface-raised border border-border flex items-center justify-center pointer-events-none">
                <Pencil className="w-2.5 h-2.5 text-muted" />
              </div>

              {/* Color picker popover */}
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 glass-bright rounded-xl p-3 z-10 shadow-card">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Avatar color</p>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => pickAvatarColor(c)}
                        className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                        style={{
                          background: c,
                          borderColor: c === avatarColor ? 'white' : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Name + edit */}
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveNameEdit(); if (e.key === 'Escape') cancelEditName() }}
                    maxLength={30}
                    className="flex-1 bg-surface border border-primary rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:shadow-neon-sm transition-all min-w-0"
                  />
                  <button onClick={saveNameEdit} disabled={savingName} className="p-1.5 rounded-lg text-proximity hover:bg-proximity/10 transition-colors">
                    {savingName
                      ? <div className="w-4 h-4 rounded-full border-2 border-proximity border-t-transparent animate-spin" />
                      : <Check className="w-4 h-4" />
                    }
                  </button>
                  <button onClick={cancelEditName} className="p-1.5 rounded-lg text-muted hover:bg-surface-high transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-foreground text-lg truncate">{user?.displayName ?? 'Loading…'}</h2>
                  <button onClick={startEditName} className="p-1 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {nameError && <p className="text-xs text-error mt-1">{nameError}</p>}
              <p className="text-xs text-muted mt-0.5">{user?.points ?? 0} pts · {user?.premium ? 'Premium' : 'Free'}</p>
            </div>

            {user?.premium && <Badge variant="cyan" className="flex-shrink-0">Premium</Badge>}
          </div>
        </NeonCard>

        {error && (
          <div className="rounded-card border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* ── Download app card ── */}
        <a
          href={APK_URL}
          className="block glass rounded-card px-4 py-3 border border-primary/20 hover:border-primary/40 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Get the Locus app</p>
              <p className="text-xs text-muted">Map, proximity voice & convoy — Android APK</p>
            </div>
            <span className="text-xs text-primary font-semibold flex-shrink-0 group-hover:underline">Download ↓</span>
          </div>
        </a>

        {/* ── Privacy ── */}
        <section>
          <SectionHeader icon={<Shield className="w-4 h-4" />} label="Privacy" />
          <div className="space-y-2">
            {PRIVACY_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => saveSetting('privacy', { privacyMode: m.value as any })}
                disabled={savingField === 'privacy'}
                className={`w-full flex items-center gap-3 p-4 rounded-card border text-left transition-all duration-200 ${
                  privacyMode === m.value
                    ? 'border-primary bg-primary/10 shadow-neon-sm'
                    : 'border-border bg-surface hover:border-border-bright'
                }`}
              >
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  privacyMode === m.value ? 'bg-primary shadow-neon-sm' : 'bg-border'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{m.label}</p>
                  <p className="text-xs text-muted">{m.desc}</p>
                </div>
                {privacyMode === m.value && savingField === 'privacy' && (
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ── Identity ── */}
        <section>
          <SectionHeader icon={<Eye className="w-4 h-4" />} label="Identity" />
          <NeonCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Anonymous mode</p>
                <p className="text-xs text-muted">Hide your display name from nearby users</p>
              </div>
              <Toggle
                checked={anonymousMode}
                onChange={(v) => saveSetting('anonymousMode', { anonymousMode: v })}
                disabled={savingField === 'anonymousMode'}
              />
            </div>
          </NeonCard>
        </section>

        {/* ── Audio ── */}
        <section>
          <SectionHeader icon={<Volume2 className="w-4 h-4" />} label="Audio" />
          <NeonCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Push to Talk</p>
                <p className="text-xs text-muted">Hold mic button to speak; release to stop</p>
              </div>
              <Toggle
                checked={pushToTalk}
                onChange={(v) => { setPushToTalk(v); saveSetting('pushToTalk', { pushToTalk: v }) }}
                disabled={savingField === 'pushToTalk'}
              />
            </div>
          </NeonCard>
        </section>

        {/* ── Display ── */}
        <section>
          <SectionHeader icon={<Gauge className="w-4 h-4" />} label="Display" />
          <NeonCard>
            <p className="text-sm font-semibold text-foreground mb-3">Speed unit</p>
            <div className="flex gap-2">
              {SPEED_UNITS.map((u) => (
                <button
                  key={u.value}
                  onClick={() => saveSetting('speedUnit', { speedUnit: u.value as any })}
                  disabled={savingField === 'speedUnit'}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    speedUnit === u.value
                      ? 'bg-primary text-white shadow-neon-sm'
                      : 'bg-surface border border-border text-muted hover:text-foreground'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </NeonCard>
        </section>

        {/* bottom padding */}
        <div className="h-2" />
      </div>
    </div>
  )
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-muted">{icon}</span>
      <h3 className="text-sm font-bold text-muted uppercase tracking-wider">{label}</h3>
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
        checked ? 'bg-primary shadow-neon-sm' : 'bg-surface-high border border-border'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
