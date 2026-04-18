import Redis from 'ioredis';
import rateLimit from 'express-rate-limit';
import redisStore from 'rate-limit-redis';

const redisClient = new Redis(process.env.REDIS_URL);

const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 searches per minute
  standardHeaders: true,
  legacyHeaders: false,

  store: new redisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),

  message: {
    success: false,
    message: 'Too many search requests. Try again later.',
  },
});

export default searchRateLimiter;
