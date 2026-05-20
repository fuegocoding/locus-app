'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Shield, Volume2, Gauge, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { authApi } from '@/lib/api'
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
  { value: 'default', label: 'Auto (by locale)' },
  { value: 'kmh', label: 'km/h' },
  { value: 'mph', label: 'mph' },
] as const

export default function SettingsPage() {
  const router = useRouter()
  const { user, pushToTalk, setPushToTalk, clearAuth } = useAppStore()
  const [privacyMode, setPrivacyMode] = useState<string>(user?.privacyMode ?? 'open')
  const [speedUnit, setSpeedUnit] = useState('default')
  const [saving, setSaving] = useState(false)

  async function savePrivacy(mode: string) {
    setPrivacyMode(mode)
    setSaving(true)
    try {
      await authApi.updateProfile({ privacyMode: mode as any })
    } catch {
      // fail silently, will retry
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await authApi.logout()
    disconnectSocket()
    clearAuth()
    router.push('/')
  }

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

        {/* Privacy */}
        <section>
          <SectionHeader icon={<Shield className="w-4 h-4" />} label="Privacy" />
          <div className="space-y-2">
            {PRIVACY_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => savePrivacy(m.value)}
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
                {privacyMode === m.value && saving && (
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
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
              <Toggle checked={pushToTalk} onChange={setPushToTalk} />
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
                  onClick={() => setSpeedUnit(u.value)}
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
        checked ? 'bg-primary shadow-neon-sm' : 'bg-surface-high border border-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
