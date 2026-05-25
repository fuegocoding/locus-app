import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIp, isValidPhone, isValidOtp, generateCsrfToken } from '@/lib/security'

const schema = z.object({
  phone: z.string().min(7).max(20),
  code: z.string().length(6).regex(/^\d+$/),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  // Rate limit: 10 verify attempts per 10 minutes per IP (brute force protection)
  if (!checkRateLimit(`verify:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid phone or code' }, { status: 400 })
  }

  const { phone, code } = parsed.data

  if (!isValidPhone(phone) || !isValidOtp(code)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Forward to backend
  const backendRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify/check`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    }
  ).catch(() => null)

  if (!backendRes) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  if (!backendRes.ok) {
    const err = await backendRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: err.error || 'Verification failed' },
      { status: backendRes.status }
    )
  }

  const data = await backendRes.json() as { token: string; userId: string }

  // Set JWT in httpOnly, SameSite=Strict cookie — never exposed to JS
  const res = NextResponse.json({ userId: data.userId })
  res.cookies.set('locus_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  // Set CSRF token in a readable cookie for double-submit pattern
  const csrfToken = generateCsrfToken()
  res.cookies.set('locus_csrf', csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return res
}
