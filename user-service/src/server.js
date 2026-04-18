import dotenv from 'dotenv/config';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectToDb from './database/db.js';
import logger from './utils/logger.js';
import { rateLimiterMiddleware } from './middleware/rate-limiter.js';
import { sensitiveEndpointsLimiter } from './middleware/rate-limiter.js';

import errorHandler from './middleware/error-handler.js';

import userServiceRoutes from './routes/user-service-route.js';

const app = express();
const port = process.env.PORT;

// connect to db
connectToDb();

// middlewares
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Rate limiter middleware
app.use(rateLimiterMiddleware); // applied globally

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info('Request body', { body: req.body });
  next();
});

// Routes
app.use('/api/auth', sensitiveEndpointsLimiter, userServiceRoutes);

// Use error handler
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`User service running on port ${port}`);
});

// unhandledRejection → a global Node event triggered when a Promise fails without .catch()
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at: ', promise, 'reason: ', reason);
});
