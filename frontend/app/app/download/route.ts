import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  try {
    const backendRes = await fetch(`${apiUrl}/download`, {
      redirect: 'follow',
    })

    if (!backendRes.ok) {
      return NextResponse.json({ error: 'Download not available' }, { status: 502 })
    }

    const blob = await backendRes.blob()

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="locus.apk"',
        'Content-Length': blob.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Download service unavailable' }, { status: 502 })
  }
}
