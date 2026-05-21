import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white shadow-neon hover:bg-primary-glow hover:shadow-neon-lg active:scale-95',
        secondary:
          'bg-surface-raised border border-border text-foreground hover:border-border-bright hover:bg-surface-high active:scale-95',
        ghost:
          'text-muted-bright hover:text-foreground hover:bg-surface-raised active:scale-95',
        outline:
          'border border-border text-foreground hover:border-primary hover:text-primary hover:shadow-neon-sm active:scale-95',
        danger:
          'bg-error/10 border border-error/40 text-error hover:bg-error/20 hover:shadow-[0_0_12px_rgba(255,68,102,0.4)] active:scale-95',
        neon:
          'bg-primary/10 border border-primary text-primary-glow shadow-neon-sm hover:bg-primary/20 hover:shadow-neon active:scale-95',
        'neon-cyan':
          'bg-cyan/10 border border-cyan text-cyan shadow-neon-cyan hover:bg-cyan/20 active:scale-95',
        'neon-green':
          'bg-proximity/10 border border-proximity text-proximity shadow-neon-green hover:bg-proximity/20 active:scale-95',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-11 px-5',
        lg: 'h-13 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10 rounded-full',
        'icon-sm': 'h-8 w-8 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
