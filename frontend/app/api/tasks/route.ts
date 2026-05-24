import { NextRequest, NextResponse } from 'next/server'

async function getTokenFromRequest(req: NextRequest): Promise<string | null> {
  return req.cookies.get('locus_token')?.value ?? null
}

export async function GET(req: NextRequest) {
  const token = await getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)

  if (!backendRes?.ok) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: backendRes?.status ?? 500 })
  }

  return NextResponse.json(await backendRes.json())
}
