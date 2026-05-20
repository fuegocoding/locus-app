import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, suffix, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-muted-bright"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'relative flex items-center rounded-xl border bg-surface transition-all duration-200',
            'border-border focus-within:border-primary focus-within:shadow-neon-sm',
            error && 'border-error focus-within:border-error focus-within:shadow-[0_0_10px_rgba(255,68,102,0.3)]'
          )}
        >
          {prefix && (
            <span className="pl-3 text-muted shrink-0">{prefix}</span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-transparent px-4 py-3 text-foreground placeholder:text-muted',
              'text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
              prefix && 'pl-2',
              suffix && 'pr-2',
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="pr-3 text-muted shrink-0">{suffix}</span>
          )}
        </div>
        {error && (
          <p className="text-xs text-error flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
