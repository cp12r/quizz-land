const buckets = /* @__PURE__ */ new Map();
function rateLimit(key, limit = 30, windowMs = 6e4) {
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

export { rateLimit as r };
//# sourceMappingURL=rateLimit-CsW6Nn7k.js.map
