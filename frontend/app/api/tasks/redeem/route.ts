import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/security'

async function getTokenFromRequest(req: NextRequest): Promise<string | null> {
  return req.cookies.get('locus_token')?.value ?? null
}

const schema = z.object({
  featureId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  // Rate limit: 10 redemptions per hour per IP
  if (!checkRateLimit(`task-redeem:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const token = await getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(parsed.data),
  }).catch(() => null)

  if (!backendRes?.ok) {
    const err = await backendRes?.json().catch(() => ({}))
    return NextResponse.json({ error: err.error || 'Redemption failed' }, { status: backendRes?.status ?? 500 })
  }

  return NextResponse.json(await backendRes.json())
}
