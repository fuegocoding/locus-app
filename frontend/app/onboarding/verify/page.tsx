'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authApi, ApiError } from '@/lib/api'

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') ?? ''

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  function handleInput(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...code]
    next[i] = val
    setCode(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()

    if (val && i === 5) {
      const full = [...next].join('')
      if (full.length === 6) submit(full)
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      submit(pasted)
    }
    e.preventDefault()
  }

  async function submit(otp: string) {
    setLoading(true)
    setError('')
    try {
      await authApi.verify(phone, otp)
      // Cookie is now set — check if profile is complete
      const user = await authApi.me()
      if (user.displayName.startsWith('User_')) {
        router.push('/profile-setup')
      } else {
        router.push('/map')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid code. Try again.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    if (resendCooldown > 0) return
    try {
      await authApi.sendCode(phone)
      setResendCooldown(60)
    } catch {
      setError('Failed to resend code.')
    }
  }

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-4 shadow-neon-sm">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Enter the code</h1>
          <p className="text-sm text-muted text-center">
            Sent to <span className="text-foreground font-medium">{phone}</span>
          </p>
        </div>

        {/* OTP inputs */}
        <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-surface text-foreground outline-none transition-all duration-200
                ${digit ? 'border-primary shadow-neon-sm' : 'border-border focus:border-primary focus:shadow-neon-sm'}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-error bg-error/10 border border-error/30 rounded-xl px-4 py-3 mb-4 text-center">
            {error}
          </p>
        )}

        {loading && (
          <div className="flex justify-center mb-4">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Resend */}
        <div className="flex items-center justify-between">
          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Change number
          </Link>
          <button
            onClick={resend}
            disabled={resendCooldown > 0}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>

        {/* Dev hint */}
        {process.env.NODE_ENV === 'development' && (
          <p className="text-center text-xs text-muted mt-6 bg-surface-raised border border-border rounded-xl px-4 py-2">
            Dev mode: use code <span className="font-mono text-primary">123456</span>
          </p>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
