const buckets = new Map();

/**
 * Best-effort serverless throttle. Authentication remains the security boundary;
 * this limits accidental or deliberate repeated paid-model requests per instance.
 */
export function allowRequest(key, { limit, windowMs }) {
  const now = Date.now();
  const previous = buckets.get(key) || [];
  const active = previous.filter((timestamp) => now - timestamp < windowMs);

  if (active.length >= limit) {
    buckets.set(key, active);
    return false;
  }

  active.push(now);
  buckets.set(key, active);
  return true;
}

