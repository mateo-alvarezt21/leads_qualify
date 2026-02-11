const globalForRateLimit = globalThis as unknown as {
    __rateLimitStore: Map<string, { count: number; resetAt: number }>;
};

if (!globalForRateLimit.__rateLimitStore) {
    globalForRateLimit.__rateLimitStore = new Map();
}

const store = globalForRateLimit.__rateLimitStore;

// Clean expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
    }
}, 5 * 60 * 1000);

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

/**
 * Simple in-memory rate limiter.
 * @param key   Unique identifier (e.g. IP + route)
 * @param limit Max requests per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, resetIn: windowMs };
    }

    entry.count++;
    const remaining = Math.max(0, limit - entry.count);
    const resetIn = entry.resetAt - now;

    return { allowed: entry.count <= limit, remaining, resetIn };
}
