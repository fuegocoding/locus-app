import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateCsrf } from '@/lib/security'

async function getTokenFromRequest(req: NextRequest): Promise<string | null> {
  return req.cookies.get('locus_token')?.value ?? null
}

function requireCsrf(req: NextRequest): NextResponse | null {
  const csrfCookie = req.cookies.get('locus_csrf')?.value
  if (!validateCsrf(req, csrfCookie)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }
  return null
}

export async function GET(req: NextRequest) {
  const token = await getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)

  if (!backendRes?.ok) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: backendRes?.status ?? 500 })
  }

  return NextResponse.json(await backendRes.json())
}

const updateSchema = z.object({
  speedUnit: z.enum(['auto', 'kmh', 'mph']).optional(),
  pushToTalk: z.boolean().optional(),
  anonymousMode: z.boolean().optional(),
  privacyMode: z.enum(['open', 'friends-only', 'convoy-only', 'invisible']).optional(),
})

export async function PATCH(req: NextRequest) {
  const csrfErr = requireCsrf(req)
  if (csrfErr) return csrfErr

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

  const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(parsed.data),
  }).catch(() => null)

  if (!backendRes?.ok) {
    const err = await backendRes?.json().catch(() => ({}))
    return NextResponse.json({ error: err.error || 'Update failed' }, { status: backendRes?.status ?? 500 })
  }

  return NextResponse.json(await backendRes.json())
}
