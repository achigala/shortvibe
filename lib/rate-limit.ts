/**
 * In-memory rate limiter
 *
 * NOTE: Vercel Serverless Functions do not share memory across instances,
 * so this limiter works per-instance. It provides meaningful protection
 * against brute-force attacks on the same instance.
 * For global multi-instance protection, upgrade to @upstash/ratelimit + Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Module-level store — persists across requests within the same serverless instance
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given key.
 * @param key     Unique key (e.g. `login:1.2.3.4`)
 * @param limit   Max requests allowed in the window
 * @param windowMs  Time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/**
 * Extract client IP from Next.js request headers.
 * Handles Vercel's x-forwarded-for and x-real-ip headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    // x-forwarded-for may be a comma-separated list; take the first (client) IP
    return forwarded.split(",")[0].trim()
  }
  return headers.get("x-real-ip") || "unknown"
}
