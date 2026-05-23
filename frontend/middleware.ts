import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PROTECTED_PREFIXES = ['/map', '/settings', '/tasks']
const AUTH_ONLY_PREFIXES = ['/onboarding', '/profile-setup'] // redirect to /map if already authed

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-me-in-production'
)

function setSecurityHeaders(res: NextResponse): void {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)')
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const res = NextResponse.next()
  setSecurityHeaders(res)

  const token = request.cookies.get('locus_token')?.value
  const isAuthed = token ? await verifyToken(token) : false

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !isAuthed) {
    const url = new URL('/onboarding', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthOnly && isAuthed) {
    // Already authenticated — send to app
    return NextResponse.redirect(new URL('/map', request.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static (static files)
     *  - _next/image (image optimization)
     *  - favicon.ico
     *  - public folder files
     *  - api routes (they do their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|images|api).*)',
  ],
}
