import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

import logger from '../utils/logger.js';

const redisClient = new Redis(process.env.REDIS_URL);

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10,
  duration: 1,
});

// general DDos protection and rate limiter
const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (e) {
    logger.error(e);
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({
      success: false,
      message: `Too many requests`,
      retryAfter: Math.round(e.msBeforeNext / 1000) || 60,
    });
  }
};

// sensitive endpoints rate limiter
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    // A function called when the limit is exceeded
    logger.warn(`Sensetive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: `Too many requests`,
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },

  // Redis store configuration
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'express_limit:',
  }),
});

export { rateLimiterMiddleware, sensitiveEndpointsLimiter };
