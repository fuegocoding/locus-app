import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sanitizeString } from '@/lib/security'

async function getTokenFromRequest(req: NextRequest): Promise<string | null> {
  return req.cookies.get('locus_token')?.value ?? null
}

export async function GET(req: NextRequest) {
  const token = await getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)

  if (!backendRes?.ok) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const user = await backendRes.json()
  return NextResponse.json(user)
}

const updateSchema = z.object({
  displayName: z.string().min(2).max(30).optional(),
  privacyMode: z.enum(['open', 'friends-only', 'convoy-only', 'invisible']).optional(),
  vehicleTag: z.string().max(20).optional(),
})

export async function PATCH(req: NextRequest) {
  const token = await getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  // Sanitize string fields
  const clean: Record<string, string> = {}
  if (parsed.data.displayName) clean.displayName = sanitizeString(parsed.data.displayName, 30)
  if (parsed.data.privacyMode) clean.privacyMode = parsed.data.privacyMode
  if (parsed.data.vehicleTag) clean.vehicleTag = sanitizeString(parsed.data.vehicleTag, 20)

  const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(clean),
  }).catch(() => null)

  if (!backendRes?.ok) {
    const err = await backendRes?.json().catch(() => ({}))
    return NextResponse.json({ error: err.error || 'Update failed' }, { status: backendRes?.status ?? 500 })
  }

  return NextResponse.json(await backendRes.json())
}
