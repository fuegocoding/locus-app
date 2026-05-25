import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sanitizeString, validateCsrf } from '@/lib/security'

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
  avatar: z.string()
    .max(400_000)
    .refine((val) => {
      if (!val) return true
      return val.startsWith('data:image/jpeg;base64,') || val.startsWith('data:image/png;base64,')
    }, { message: 'Avatar must be a base64 JPEG or PNG' })
    .optional(),
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

  // Sanitize string fields
  const clean: Record<string, string> = {}
  if (parsed.data.displayName) clean.displayName = sanitizeString(parsed.data.displayName, 30)
  if (parsed.data.privacyMode) clean.privacyMode = parsed.data.privacyMode
  if (parsed.data.vehicleTag) clean.vehicleTag = sanitizeString(parsed.data.vehicleTag, 20)
  if (parsed.data.avatar) clean.avatar = parsed.data.avatar

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
