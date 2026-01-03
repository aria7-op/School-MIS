import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

const RATE_LIMIT_REDIS_URL =
  process.env.RATE_LIMIT_REDIS_URL ||
  process.env.REDIS_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  null;

const RATE_LIMIT_REDIS_TLS =
  String(process.env.RATE_LIMIT_REDIS_TLS || '').toLowerCase() === 'true';

const ENABLE_REDIS_RATE_LIMIT =
  String(process.env.RATE_LIMIT_USE_REDIS || 'true').toLowerCase() !== 'false';

let redisClient = null;
let redisReady = false;

if (RATE_LIMIT_REDIS_URL && ENABLE_REDIS_RATE_LIMIT) {
  try {
    redisClient = new Redis(RATE_LIMIT_REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      tls: RATE_LIMIT_REDIS_TLS ? {} : undefined,
    });

    redisClient.on('error', (error) => {
      redisReady = false;
      logger.warn('rate-limit:redis-error', { message: error.message });
    });

    redisClient.on('ready', () => {
      redisReady = true;
      logger.info('rate-limit:redis-ready', {
        url: RATE_LIMIT_REDIS_URL.replace(/:\/\/.*@/, '://***:***@'),
      });
    });

    // Trigger connection (ignore errors, handled via event listeners)
    redisClient.connect().catch(() => {});
  } catch (error) {
    redisClient = null;
    logger.warn('rate-limit:redis-init-failed', { message: error.message });
  }
}

const isRedisAvailable = () => Boolean(redisClient) && redisReady;

class HybridRateLimitStore {
  constructor({ windowMs, prefix }) {
    this.windowMs = windowMs;
    this.prefix = prefix;
    this.hits = new Map();
    this.timeouts = new Map();
  }

  get redis() {
    return isRedisAvailable() ? redisClient : null;
  }

  getRedisKey(key) {
    return `${this.prefix}:${key}`;
  }

  memoryIncrement(key) {
    const current = this.hits.get(key) || { totalHits: 0, resetTime: null };
    current.totalHits += 1;
    current.resetTime = new Date(Date.now() + this.windowMs);
    this.hits.set(key, current);

    if (!this.timeouts.has(key)) {
      const timeout = setTimeout(() => {
        this.hits.delete(key);
        this.timeouts.delete(key);
      }, this.windowMs);
      timeout.unref?.();
      this.timeouts.set(key, timeout);
    }

    return {
      totalHits: current.totalHits,
      resetTime: current.resetTime,
    };
  }

  async increment(key) {
    const client = this.redis;
    if (client) {
      const redisKey = this.getRedisKey(key);
      try {
        const totalHits = await client.incr(redisKey);
        if (totalHits === 1) {
          await client.pexpire(redisKey, this.windowMs);
        }
        let ttl = await client.pttl(redisKey);
        if (ttl < 0) {
          ttl = this.windowMs;
          await client.pexpire(redisKey, ttl);
        }
        return {
          totalHits,
          resetTime: new Date(Date.now() + ttl),
        };
      } catch (error) {
        logger.warn('rate-limit:redis-increment-failed', { message: error.message });
      }
    }

    return this.memoryIncrement(key);
  }

  async decrement(key) {
    const client = this.redis;
    if (client) {
      try {
        const redisKey = this.getRedisKey(key);
        const hits = await client.decr(redisKey);
        if (hits <= 0) {
          await client.del(redisKey);
        }
        return;
      } catch (error) {
        logger.warn('rate-limit:redis-decrement-failed', { message: error.message });
      }
    }

    const current = this.hits.get(key);
    if (!current) {
      return;
    }
    current.totalHits = Math.max(current.totalHits - 1, 0);
    if (current.totalHits === 0) {
      this.hits.delete(key);
      const timeout = this.timeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
        this.timeouts.delete(key);
      }
    } else {
      this.hits.set(key, current);
    }
  }

  async resetKey(key) {
    const client = this.redis;
    if (client) {
      try {
        await client.del(this.getRedisKey(key));
      } catch (error) {
        logger.warn('rate-limit:redis-reset-key-failed', { message: error.message });
      }
    }

    this.hits.delete(key);
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  async resetAll() {
    const client = this.redis;
    if (client) {
      try {
        const pattern = `${this.prefix}:*`;
        const stream = client.scanStream({ match: pattern });
        stream.on('data', (keys = []) => {
          if (keys.length) {
            client.del(keys).catch(() => {});
          }
        });
        stream.on('error', (error) => {
          logger.warn('rate-limit:redis-reset-all-error', { message: error.message });
        });
      } catch (error) {
        logger.warn('rate-limit:redis-reset-all-failed', { message: error.message });
      }
    }

    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.hits.clear();
  }
}

export const createRateLimitStore = ({ windowMs, prefix }) =>
  new HybridRateLimitStore({ windowMs, prefix });

export const isRedisRateLimitEnabled = () => isRedisAvailable();

