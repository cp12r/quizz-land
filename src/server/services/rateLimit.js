const buckets = new Map();

export function rateLimit(key, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (current.resetAt < now) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }
  current.count += 1;
  buckets.set(key, current);
  return current.count <= limit;
}
