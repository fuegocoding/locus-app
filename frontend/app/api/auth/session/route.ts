import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-me-in-production'
)

/**
 * Returns the JWT token for socket.io connection.
 * Reads the httpOnly cookie server-side — the client cannot read it directly.
 * Only returns the token if it's still valid.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('locus_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    await jwtVerify(token, JWT_SECRET)
  } catch {
    const res = NextResponse.json({ error: 'Session expired' }, { status: 401 })
    res.cookies.delete('locus_token')
    return res
  }

  // Return the token so the client can use it for socket auth
  // This is safe: the client is already authenticated (middleware + jwtVerify above)
  return NextResponse.json({ token })
}
