'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Shield, Volume2, Gauge, Eye } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { authApi, settingsApi } from '@/lib/api'
import { disconnectSocket } from '@/lib/socket'
import { NeonCard } from '@/components/ui/neon-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'

const PRIVACY_MODES = [
  { value: 'open', label: 'Open', desc: 'Anyone nearby can see and hear you', color: 'proximity' },
  { value: 'friends-only', label: 'Friends only', desc: 'Only mutual followers', color: 'primary' },
  { value: 'convoy-only', label: 'Convoy only', desc: 'Only visible in convoy mode', color: 'cyan' },
  { value: 'invisible', label: 'Invisible', desc: 'Hidden from all users', color: 'muted' },
] as const

const SPEED_UNITS = [
  { value: 'auto', label: 'Auto (by locale)' },
  { value: 'kmh', label: 'km/h' },
  { value: 'mph', label: 'mph' },
] as const

export default function SettingsPage() {
  const router = useRouter()
  const { user, settings, setSettings, updateSettings, pushToTalk, setPushToTalk, clearAuth } = useAppStore()
  const [privacyMode, setPrivacyMode] = useState<string>(user?.privacyMode ?? 'open')
  const [savingField, setSavingField] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch settings on mount
  useEffect(() => {
    let mounted = true
    settingsApi.get()
      .then((s) => { if (mounted) { setSettings(s); setPushToTalk(s.pushToTalk) } })
      .catch(() => { /* silently fail, use defaults */ })
    return () => { mounted = false }
  }, [setSettings, setPushToTalk])

  async function saveSetting(field: string, data: Partial<Parameters<typeof settingsApi.update>[0]>) {
    setSavingField(field)
    setError(null)
    try {
      const updated = await settingsApi.update(data)
      setSettings(updated)
      if (data.pushToTalk !== undefined) setPushToTalk(data.pushToTalk)
    } catch (err: any) {
      setError(err?.message || 'Failed to save')
    } finally {
      setSavingField(null)
    }
  }

  async function savePrivacy(mode: string) {
    setPrivacyMode(mode)
    await saveSetting('privacy', { privacyMode: mode as any })
  }

  async function handlePushToTalkToggle(enabled: boolean) {
    setPushToTalk(enabled)
    await saveSetting('pushToTalk', { pushToTalk: enabled })
  }

  async function handleSpeedUnitChange(unit: string) {
    await saveSetting('speedUnit', { speedUnit: unit as any })
  }

  async function handleAnonymousToggle(enabled: boolean) {
    await saveSetting('anonymousMode', { anonymousMode: enabled })
  }

  async function handleLogout() {
    await authApi.logout()
    disconnectSocket()
    clearAuth()
    router.push('/')
  }

  const speedUnit = settings?.speedUnit ?? 'auto'
  const anonymousMode = settings?.anonymousMode ?? false

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile card */}
        <NeonCard glow="primary" className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-black text-xl shadow-neon flex-shrink-0">
            {user ? getInitials(user.displayName) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground text-lg">{user?.displayName ?? 'Loading…'}</h2>
            <p className="text-xs text-muted">{user?.points ?? 0} points · {user?.premium ? 'Premium' : 'Free'}</p>
          </div>
          {user?.premium && <Badge variant="cyan">Premium</Badge>}
        </NeonCard>

        {error && (
          <div className="rounded-card border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Privacy */}
        <section>
          <SectionHeader icon={<Shield className="w-4 h-4" />} label="Privacy" />
          <div className="space-y-2">
            {PRIVACY_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => savePrivacy(m.value)}
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

        {/* Anonymous mode */}
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
                onChange={handleAnonymousToggle}
                disabled={savingField === 'anonymousMode'}
              />
            </div>
          </NeonCard>
        </section>

        {/* Audio */}
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
                onChange={handlePushToTalkToggle}
                disabled={savingField === 'pushToTalk'}
              />
            </div>
          </NeonCard>
        </section>

        {/* Speed */}
        <section>
          <SectionHeader icon={<Gauge className="w-4 h-4" />} label="Display" />
          <NeonCard>
            <p className="text-sm font-semibold text-foreground mb-3">Speed unit</p>
            <div className="flex gap-2">
              {SPEED_UNITS.map((u) => (
                <button
                  key={u.value}
                  onClick={() => handleSpeedUnitChange(u.value)}
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

        {/* Account */}
        <section className="pt-2">
          <Button
            variant="danger"
            size="lg"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </section>
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
