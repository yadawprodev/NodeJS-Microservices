import redis from 'ioredis';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

import logger from '../utils/logger.js';

const redisClient = new redis(process.env.REDIS_URL);

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false,
  handler: (req, res) => {
    // A function called when the limit is exceeded
    logger.warn(`Sensetive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: `Too many requests`,
    });
  },
  // Redis store configuration
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'express_limit:',
  }),
});

export default rateLimiter;
