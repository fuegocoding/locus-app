import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/20 text-primary-glow border border-primary/30',
        proximity: 'bg-proximity/15 text-proximity border border-proximity/30',
        convoy: 'bg-convoy/15 text-convoy border border-convoy/30',
        cyan: 'bg-cyan/15 text-cyan border border-cyan/30',
        muted: 'bg-surface-raised text-muted border border-border',
        error: 'bg-error/15 text-error border border-error/30',
        success: 'bg-proximity/15 text-proximity border border-proximity/30',
        live: 'bg-proximity/20 text-proximity border border-proximity/40 animate-pulse',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
