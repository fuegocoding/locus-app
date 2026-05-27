import { NextRequest, NextResponse } from 'next/server'

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

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  setSecurityHeaders(res)
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|api).*)',
  ],
}
