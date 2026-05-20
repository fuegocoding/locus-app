import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/security'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!checkRateLimit(`check-username:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const { username } = await req.json().catch(() => ({}))
  if (!username || typeof username !== 'string') {
    return NextResponse.json({ available: false })
  }

  const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  }).catch(() => null)

  if (!backendRes?.ok) return NextResponse.json({ available: false })
  return NextResponse.json(await backendRes.json())
}
