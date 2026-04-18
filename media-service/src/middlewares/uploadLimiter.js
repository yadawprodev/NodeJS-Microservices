import Redis from 'ioredis';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

import logger from '../utils/logger.js';

const redisClient = new Redis(process.env.REDIS_URL);

export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,

  handler: (req, res) => {
    logger.warn(`Sensetive endpoint rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({
      success: false,
      message: 'Too many uploads. Please slow down.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },

  standardHeaders: true,
  legacyHeaders: false,

  // Redis store configuration
  store: new RedisStore({
    sendCommand: async (...args) => {
      try {
        return await redisClient.call(...args);
      } catch (err) {
        logger.error('Redis rate limit error:', err);
        return null;
      }
    },
  }),

  // limit per user instead of IP
  keyGenerator: (req) => {
    return req.user?._id?.toString() || ipKeyGenerator(req);
  },
});
