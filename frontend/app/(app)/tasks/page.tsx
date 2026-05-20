import { NeonCard } from '@/components/ui/neon-card'
import { Badge } from '@/components/ui/badge'

const TASKS = [
  {
    id: 'referral',
    icon: '👥',
    title: 'Refer a friend',
    description: 'Share your invite link. Earn 100 points when they join their first convoy.',
    points: 100,
    type: 'referral',
    cta: 'Copy invite link',
  },
  {
    id: 'watch-ad',
    icon: '📺',
    title: 'Watch an ad',
    description: 'Support Locus and earn 10 points. Ads are 30 seconds.',
    points: 10,
    type: 'watch-ad',
    cta: 'Watch now',
  },
]

const PREMIUM = [
  { name: 'Unlimited pins', cost: 500, type: 'functional', icon: '📍' },
  { name: 'Custom avatar', cost: 200, type: 'cosmetic', icon: '🎨' },
  { name: 'Convoy nameplate', cost: 300, type: 'cosmetic', icon: '🏷️' },
  { name: 'Priority audio', cost: 750, type: 'functional', icon: '🎙️' },
  { name: 'Larger radius', cost: 600, type: 'functional', icon: '📡' },
  { name: 'Convoy themes', cost: 400, type: 'cosmetic', icon: '🎨' },
]

export default function TasksPage() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Points balance */}
        <div className="gradient-border rounded-panel">
          <div className="bg-surface-raised rounded-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Your balance</p>
              <p className="text-4xl font-black gradient-text">0 pts</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-neon">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary shadow-neon-sm" />
            Earn points
          </h2>
          <div className="space-y-3">
            {TASKS.map((task) => (
              <NeonCard key={task.id} glow="primary" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0">
                  {task.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-foreground">{task.title}</h3>
                    <Badge variant="default">+{task.points} pts</Badge>
                  </div>
                  <p className="text-xs text-muted">{task.description}</p>
                </div>
                <button className="text-sm text-primary hover:text-primary-glow font-semibold whitespace-nowrap transition-colors shrink-0">
                  {task.cta}
                </button>
              </NeonCard>
            ))}
          </div>
        </section>

        {/* Premium features */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-cyan shadow-neon-cyan" />
            Spend points
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {PREMIUM.map((f) => (
              <NeonCard
                key={f.name}
                glow={f.type === 'functional' ? 'cyan' : 'primary'}
                className="flex flex-col gap-2"
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm font-semibold text-foreground">{f.name}</p>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <Badge variant={f.type === 'functional' ? 'cyan' : 'default'}>
                    {f.type}
                  </Badge>
                  <span className="text-xs font-bold text-muted-bright">{f.cost} pts</span>
                </div>
              </NeonCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
