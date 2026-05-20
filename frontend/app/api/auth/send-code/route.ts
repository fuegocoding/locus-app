import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIp, isValidPhone } from '@/lib/security'

const schema = z.object({
  phone: z.string().min(7).max(20),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  // Rate limit: 5 requests per 10 minutes per IP
  if (!checkRateLimit(`send-code:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const { phone } = parsed.data

  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
  }

  // Forward to backend
  const backendRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify/send`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }
  ).catch(() => null)

  if (!backendRes?.ok) {
    return NextResponse.json({ error: 'Failed to send code' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
