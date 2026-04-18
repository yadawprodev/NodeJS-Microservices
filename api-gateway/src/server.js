import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import proxy from 'express-http-proxy';
import cookieParser from 'cookie-parser';

import rateLimiter from './middleware/rate-limter.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorhandler.js';
import validateToken from './middleware/authMiddleware.js';

const app = express();
const port = process.env.PORT;

// middlewares
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use(rateLimiter);

app.use((req, res, next) => {
  logger.info('Request body', req.body);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, '/api');
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  },
};

// setting up proxy for our user service
app.use(
  '/v1/auth',
  proxy(process.env.USER_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

// setting up proxy for our post service
app.use(
  '/v1/posts',
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      proxyReqOpts.headers['x-user-id'] = srcReq.userInfo.userId; // modifying the request BEFORE it goes to Post service.
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(
        `Response received from Post service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

// setting up proxy for our media service
app.use(
  '/v1/media',
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['x-user-id'] = srcReq.userInfo.userId;
      if (!srcReq.headers['content-type']?.startsWith('multipart/form-data')) {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
      }

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(
        `Response received from Media service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
    parseReqBody: false,
  }),
);

// setting up proxy for our search service
app.use(
  '/v1/search',
  validateToken,
  proxy(process.env.SEARCH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      proxyReqOpts.headers['x-user-id'] = srcReq.userInfo.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(
        `Response received from search service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

// Error handler middleware
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Api-gateway running on port ${process.env.PORT}`);
  logger.info(`User-service running on ${process.env.USER_SERVICE_URL}`);
  logger.info(`Post-service running on ${process.env.POST_SERVICE_URL}`);
  logger.info(`Media-service running on ${process.env.MEDIA_SERVICE_URL}`);
  logger.info(`Search-service running on ${process.env.SEARCH_SERVICE_URL}`);
});
