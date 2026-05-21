import * as React from 'react'
import { cn } from '@/lib/utils'

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'primary' | 'cyan' | 'green' | 'blue' | 'none'
  gradient?: boolean
}

export function NeonCard({
  className,
  glow = 'none',
  gradient = false,
  children,
  ...props
}: NeonCardProps) {
  const glowClasses = {
    primary: 'hover:shadow-card-hover hover:border-primary/60',
    cyan: 'hover:shadow-neon-cyan hover:border-cyan/60',
    green: 'hover:shadow-neon-green hover:border-proximity/60',
    blue: 'hover:shadow-neon-blue hover:border-convoy/60',
    none: 'hover:border-border-bright',
  }

  return (
    <div
      className={cn(
        'relative rounded-card p-5 bg-surface-raised border border-border',
        'transition-all duration-300 shadow-card',
        glowClasses[glow],
        gradient && 'gradient-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
