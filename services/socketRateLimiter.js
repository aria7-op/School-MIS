const createBucket = (windowMs) => ({
  count: 0,
  resetTime: Date.now() + windowMs,
});

export const createSocketRateLimiter = ({ windowMs = 5000, max = 30 } = {}) => {
  const buckets = new Map();

  const consume = (key) => {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetTime) {
      const newBucket = createBucket(windowMs);
      newBucket.count = 1;
      buckets.set(key, newBucket);
      return { allowed: true, remaining: max - 1, resetTime: newBucket.resetTime };
    }

    if (bucket.count >= max) {
      return { allowed: false, remaining: 0, resetTime: bucket.resetTime };
    }

    bucket.count += 1;
    return { allowed: true, remaining: max - bucket.count, resetTime: bucket.resetTime };
  };

  const getState = (key) => {
    const bucket = buckets.get(key);
    if (!bucket) {
      return { remaining: max, resetTime: Date.now() + windowMs };
    }
    return {
      remaining: Math.max(0, max - bucket.count),
      resetTime: bucket.resetTime,
    };
  };

  return {
    consume,
    getState,
    windowMs,
    max,
  };
};


