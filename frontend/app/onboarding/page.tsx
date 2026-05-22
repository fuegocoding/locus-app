'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { authApi, ApiError } from '@/lib/api'

const schema = z.object({
  phone: z
    .string()
    .min(7, 'Enter a valid phone number')
    .max(20)
    .regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number'),
})

type FormData = z.infer<typeof schema>

export default function OnboardingPage() {
  const router = useRouter()
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit({ phone }: FormData) {
    setApiError('')
    try {
      await authApi.sendCode(phone.replace(/\s/g, ''))
      router.push(`/onboarding/verify?phone=${encodeURIComponent(phone)}`)
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Failed to send code. Try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4">
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6 group">
            <Logo className="w-9 h-9 text-primary transition-transform duration-200 group-hover:scale-105" />
            <span className="text-2xl font-black text-foreground tracking-tight">Locus</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Enter your number</h1>
          <p className="text-sm text-muted text-center">
            We&apos;ll send a verification code. No passwords, ever.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Phone number"
            type="tel"
            placeholder="+1 555 000 0000"
            autoComplete="tel"
            prefix={<Phone className="w-4 h-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />

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
          >
            Send Code <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-center text-xs text-muted mt-6 leading-relaxed">
          By continuing you agree to our{' '}
          <span className="text-muted-bright hover:text-foreground cursor-pointer underline-offset-2 underline">
            Terms
          </span>{' '}
          and{' '}
          <span className="text-muted-bright hover:text-foreground cursor-pointer underline-offset-2 underline">
            Privacy Policy
          </span>
          .
        </p>
      </div>
    </div>
  )
}
