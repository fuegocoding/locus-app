interface AdSlotProps {
  variant?: 'sidebar' | 'banner'
  className?: string
}

export function AdSlot({ variant = 'sidebar', className = '' }: AdSlotProps) {
  if (variant === 'banner') {
    return (
      <div
        className={`w-full h-[90px] rounded-xl border border-dashed border-border flex items-center justify-center ${className}`}
      >
        <span className="text-[10px] text-muted/40 uppercase tracking-widest font-medium">Advertisement</span>
      </div>
    )
  }

  return (
    <div
      className={`w-full flex-1 rounded-xl border border-dashed border-border flex items-center justify-center min-h-[250px] ${className}`}
    >
      <span
        className="text-[10px] text-muted/40 uppercase tracking-widest font-medium"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        Advertisement
      </span>
    </div>
  )
}
