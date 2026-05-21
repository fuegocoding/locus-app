import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const token = req.cookies.get('locus_token')?.value

  const backendRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/convoy/${params.code}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  ).catch(() => null)

  if (!backendRes?.ok) {
    return NextResponse.json({ error: 'Convoy not found' }, { status: 404 })
  }

  return NextResponse.json(await backendRes.json())
}
