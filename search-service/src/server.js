import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import Redis from 'ioredis';

import errorHandler from './middlewares/error-handler.js';
import logger from './utils/logger.js';
import { connectToRabbitMQ, consumeEvent } from './utils/rabbitmq.js';
import searchRoute from './routes/search-service-routes.js';
import {
  searchEventHandler,
  handlePostDeleted,
  handlePostUpdated,
} from './event-handler/search-event-handler.js';

const app = express();
const port = process.env.PORT || 5004;

const redisClient = new Redis(process.env.REDIS_URL);

// connect to database
await mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info(`Connected to mongodb`))
  .catch((e) =>
    logger.error(`Error while connecting to mongodb`, { error: e.message }),
  );

// middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info('Request body', { body: req.body });
  next();
});

// Route
app.use(
  '/api/search',
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  searchRoute,
);

// error handler middleware
app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();

    consumeEvent('post.created', searchEventHandler);
    consumeEvent('post.deleted', handlePostDeleted);
    consumeEvent('post.updated', handlePostUpdated);

    app.listen(port, () => {
      logger.info(`Search-service running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// start  our server
startServer();

// unhandledRejection
process.on('unhandledRejection', (reason) => {
  logger.error(' ERROR:', reason);
});
