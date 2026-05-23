'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi, ApiError } from '@/lib/api'
import { useAppStore } from '@/lib/store'

const schema = z.object({
  displayName: z
    .string()
    .min(2, 'At least 2 characters')
    .max(30, 'Max 30 characters')
    .regex(/^[a-zA-Z0-9_\- ]+$/, 'Letters, numbers, spaces, _ and - only'),
})

type FormData = z.infer<typeof schema>

export default function ProfileSetupPage() {
  const router = useRouter()
  const { setUser } = useAppStore()
  const [apiError, setApiError] = useState('')
  const [checking, setChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const displayName = watch('displayName', '')

  async function checkAvailability() {
    if (displayName.length < 2) return
    setChecking(true)
    try {
      const { available } = await authApi.checkUsername(displayName)
      setUsernameAvailable(available)
    } catch {
      setUsernameAvailable(null)
    } finally {
      setChecking(false)
    }
  }

  async function onSubmit({ displayName }: FormData) {
    setApiError('')
    try {
      const user = await authApi.updateProfile({ displayName })
      setUser(user as any)
      router.push('/map')
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Failed to save profile.')
    }
  }

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center mb-4 shadow-neon">
            <User className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Choose your name</h1>
          <p className="text-sm text-muted text-center">
            This is how others will see you on the map.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Display name"
            placeholder="e.g. FastLane, RoadKing, MidnightRider"
            autoComplete="nickname"
            error={errors.displayName?.message}
            suffix={
              checking ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : usernameAvailable === true ? (
                <span className="text-proximity text-xs">✓</span>
              ) : usernameAvailable === false ? (
                <span className="text-error text-xs">✗</span>
              ) : null
            }
            {...register('displayName', { onBlur: checkAvailability })}
          />

          {usernameAvailable === false && !errors.displayName && (
            <p className="text-xs text-error">That name is already taken.</p>
          )}

          {apiError && (
            <p className="text-sm text-error bg-error/10 border border-error/30 rounded-xl px-4 py-3">
              {apiError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isSubmitting}
            disabled={usernameAvailable === false}
          >
            Enter Locus <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
