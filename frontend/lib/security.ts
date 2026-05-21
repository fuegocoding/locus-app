/**
 * Security utilities:
 *  - In-memory rate limiter (replace with Redis/Upstash in production)
 *  - CSRF token generation and validation (double-submit cookie pattern)
 *  - IP extraction helper
 */

// ---------- Rate limiter ----------

interface RateLimitEntry {
  count: number
  reset: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Returns true if the request is within the allowed rate.
 * @param key    Unique key (e.g. `send-code:${ip}`)
 * @param limit  Max requests per window
 * @param windowMs  Window in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

/** Periodically purge expired entries to prevent unbounded memory growth */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.reset) store.delete(key)
    }
  }, 60_000)
}

// ---------- IP extraction ----------

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

// ---------- CSRF ----------

/** Generate a cryptographically random CSRF token */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Constant-time string comparison to prevent timing attacks */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Validate CSRF on state-changing API routes.
 * Expects header `x-csrf-token` to match the `locus_csrf` cookie.
 */
export function validateCsrf(req: Request, cookieValue: string | undefined): boolean {
  if (!cookieValue) return false
  const headerToken = req.headers.get('x-csrf-token')
  if (!headerToken) return false
  return safeCompare(headerToken, cookieValue)
}

// ---------- Input sanitization ----------

/** Strip characters that could be used in injection attacks */
export function sanitizeString(value: string, maxLength = 255): string {
  return value.replace(/[<>&"'`]/g, '').trim().slice(0, maxLength)
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{6,14}$/.test(phone.replace(/\s/g, ''))
}

export function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test(code)
}
