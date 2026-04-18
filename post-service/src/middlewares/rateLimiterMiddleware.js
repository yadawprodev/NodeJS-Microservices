import Redis from 'ioredis';
import logger from '../utils/logger.js';

import { RateLimiterRedis } from 'rate-limiter-flexible';

const redisClient = new Redis(process.env.REDIS_URL);

const createPostLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'create_post',
  points: 5, // max 5 requests
  duration: 60, // per 60 seconds
});

const getPostsLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'get_posts',
  points: 20, // max 20 requests
  duration: 60, // per 60 seconds
});

const createPostLimiterMiddleware = async (req, res, next) => {
  try {
    await createPostLimiter.consume(req.ip);
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

const PostLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.user?.userId || req.ip;
    await getPostsLimiter.consume(key);
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

export { PostLimiterMiddleware, createPostLimiterMiddleware };
