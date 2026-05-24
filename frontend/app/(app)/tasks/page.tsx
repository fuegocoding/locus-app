'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { tasksApi, type TaskItem, type PremiumFeatureItem } from '@/lib/api'
import { NeonCard } from '@/components/ui/neon-card'
import { Badge } from '@/components/ui/badge'

const TASK_ICONS: Record<string, string> = {
  referral: '👥',
  'watch-ad': '📺',
}

const PREMIUM_ICONS: Record<string, string> = {
  'unlimited-pins': '📍',
  'custom-avatar': '🎨',
  'convoy-nameplate': '🏷️',
  'priority-audio': '🎙️',
  'larger-radius': '📡',
  'convoy-themes': '🎨',
}

export default function TasksPage() {
  const { user, tasks, setTasks, updatePoints } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    tasksApi.get()
      .then((data) => { if (mounted) { setTasks(data); setLoading(false) } })
      .catch(() => { if (mounted) { setLoading(false) } })
    return () => { mounted = false }
  }, [setTasks])

  async function handleComplete(task: TaskItem) {
    if (task.completed && !task.repeatable) return
    setCompleting(task.type)
    setError(null)
    try {
      const result = await tasksApi.complete(task.type)
      updatePoints(result.totalPoints)
      // Refresh tasks state
      const fresh = await tasksApi.get()
      setTasks(fresh)
    } catch (err: any) {
      setError(err?.message || 'Failed to complete task')
    } finally {
      setCompleting(null)
    }
  }

  async function handleRedeem(feature: PremiumFeatureItem) {
    if (feature.redeemed || (user?.points ?? 0) < feature.cost) return
    setRedeeming(feature.id)
    setError(null)
    try {
      const result = await tasksApi.redeem(feature.id)
      updatePoints(result.remainingPoints)
      const fresh = await tasksApi.get()
      setTasks(fresh)
    } catch (err: any) {
      setError(err?.message || 'Failed to redeem')
    } finally {
      setRedeeming(null)
    }
  }

  const taskList = tasks?.tasks ?? []
  const premiumList = tasks?.premiumFeatures ?? []
  const points = tasks?.points ?? user?.points ?? 0

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Points balance */}
        <div className="gradient-border rounded-panel">
          <div className="bg-surface-raised rounded-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Your balance</p>
              <p className="text-4xl font-black gradient-text">{points} pts</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-neon">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-card border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Tasks */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary shadow-neon-sm" />
            Earn points
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {taskList.map((task) => (
                <NeonCard key={task.type} glow="primary" className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0">
                    {TASK_ICONS[task.type] ?? '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-foreground">
                        {task.type === 'referral' ? 'Refer a friend' : 'Watch an ad'}
                      </h3>
                      <Badge variant="default">+{task.pointsReward} pts</Badge>
                    </div>
                    <p className="text-xs text-muted">{task.description}</p>
                  </div>
                  <button
                    onClick={() => handleComplete(task)}
                    disabled={completing === task.type || (task.completed && !task.repeatable)}
                    className={`text-sm font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      task.completed && !task.repeatable
                        ? 'text-muted cursor-default'
                        : 'text-primary hover:text-primary-glow'
                    }`}
                  >
                    {completing === task.type ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : task.completed && !task.repeatable ? (
                      'Completed'
                    ) : task.type === 'referral' ? (
                      'Copy invite link'
                    ) : (
                      'Watch now'
                    )}
                  </button>
                </NeonCard>
              ))}
            </div>
          )}
        </section>

        {/* Premium features */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-cyan shadow-neon-cyan" />
            Spend points
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {premiumList.map((f) => {
              const canAfford = points >= f.cost
              return (
                <NeonCard
                  key={f.id}
                  glow={f.type === 'functional' ? 'cyan' : 'primary'}
                  className={`flex flex-col gap-2 ${f.redeemed ? 'opacity-60' : ''}`}
                >
                  <span className="text-2xl">{PREMIUM_ICONS[f.id] ?? '✨'}</span>
                  <p className="text-sm font-semibold text-foreground">{f.name}</p>
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <Badge variant={f.type === 'functional' ? 'cyan' : 'default'}>
                      {f.type}
                    </Badge>
                    <span className="text-xs font-bold text-muted-bright">
                      {f.redeemed ? 'Owned' : `${f.cost} pts`}
                    </span>
                  </div>
                  {!f.redeemed && (
                    <button
                      onClick={() => handleRedeem(f)}
                      disabled={!canAfford || redeeming === f.id}
                      className={`mt-1 w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        canAfford
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'bg-surface text-muted cursor-not-allowed'
                      }`}
                    >
                      {redeeming === f.id ? (
                        <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                      ) : canAfford ? (
                        'Redeem'
                      ) : (
                        'Not enough'
                      )}
                    </button>
                  )}
                </NeonCard>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
