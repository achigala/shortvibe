/**
 * Simple in-memory cache for API responses and database queries.
 * This is a server-side cache that lives in the Node.js process memory.
 * 
 * Features:
 * - TTL-based expiration
 * - Stale-while-revalidate pattern
 * - Type-safe
 * - Memory-bounded (max entries)
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  staleAt: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private readonly maxEntries: number

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries
  }

  /**
   * Get a cached value. Returns undefined if not found or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return undefined

    const now = Date.now()

    // Fully expired - remove and return undefined
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data
  }

  /**
   * Check if a cached value is stale (past staleTime but not yet expired).
   * Useful for stale-while-revalidate pattern.
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return true
    return Date.now() > entry.staleAt
  }

  /**
   * Set a cached value with TTL (in seconds).
   * @param key Cache key
   * @param data Data to cache
   * @param ttlSeconds Time to live in seconds (default 60)
   * @param staleTtlSeconds Time until stale in seconds (default half of ttl)
   */
  set<T>(key: string, data: T, ttlSeconds = 60, staleTtlSeconds?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    const now = Date.now()
    this.cache.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
      staleAt: now + (staleTtlSeconds ?? Math.floor(ttlSeconds / 2)) * 1000,
    })
  }

  /**
   * Invalidate a specific cache key or all keys matching a prefix.
   */
  invalidate(keyOrPrefix: string): void {
    if (this.cache.has(keyOrPrefix)) {
      this.cache.delete(keyOrPrefix)
      return
    }

    // Prefix-based invalidation
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 60,
    staleTtlSeconds?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined && !this.isStale(key)) {
      return cached
    }

    // If stale but not expired, return stale data and refresh in background
    if (cached !== undefined) {
      // Fire and forget revalidation
      fetcher().then((freshData) => {
        this.set(key, freshData, ttlSeconds, staleTtlSeconds)
      }).catch(() => {
        // Keep stale data on error
      })
      return cached
    }

    // No cache at all - fetch synchronously
    const data = await fetcher()
    this.set(key, data, ttlSeconds, staleTtlSeconds)
    return data
  }

  get size(): number {
    return this.cache.size
  }
}

// Singleton instance - persists across requests in the same Node.js process
const globalForCache = globalThis as unknown as { serverCache: MemoryCache }

export const serverCache = globalForCache.serverCache ?? new MemoryCache(500)

if (process.env.NODE_ENV !== "production") {
  globalForCache.serverCache = serverCache
}

// Pre-defined cache key builders
export const CacheKeys = {
  dashboard: (userId: string) => `dashboard:${userId}`,
  dashboardCounts: () => `dashboard:counts`,
  projectList: () => `projects:list`,
  projectDetail: (id: string) => `projects:${id}`,
  teamList: () => `team:list`,
  clientList: () => `clients:list`,
  masterData: (category: string) => `master:${category}`,
  userTheme: (userId: string) => `theme:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  rewards: () => `rewards:list`,
  myRewards: (userId: string) => `rewards:${userId}`,
  revenue: (projectId?: string) => projectId ? `revenue:${projectId}` : `revenue:all`,
} as const

// Cache TTLs in seconds
export const CacheTTL = {
  SHORT: 15,        // 15 seconds - for frequently changing data
  MEDIUM: 60,       // 1 minute - for moderate data
  LONG: 300,        // 5 minutes - for relatively static data
  VERY_LONG: 900,   // 15 minutes - for mostly static data like master data
  THEME: 3600,      // 1 hour - theme rarely changes
} as const
