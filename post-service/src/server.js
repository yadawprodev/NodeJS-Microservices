import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Redis from 'ioredis';

import logger from './utils/logger.js';
import errorHandler from './middlewares/error-handler.js';
import postRoutes from './routes/post-service-routes.js';
import connectToDb from './database/db.js';
import { connectToRabbitMQ } from './utils/rabbitmq.js';

const redisClient = new Redis(process.env.REDIS_URL);

const app = express();
const port = process.env.PORT || 5002;

// middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(errorHandler);

// connect to db
connectToDb();

// Routes -> pass redisClient to routes
app.use(
  '/api/posts',
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes,
);

app.use((req, res, next) => {
  logger.info('Request body', { body: req.body });
  next();
});

async function startServer() {
  try {
    await connectToRabbitMQ();
    app.listen(port, () => {
      logger.info(`Post-service running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// start the server and connect to RabbitMQ before accepting requests
startServer();

// unhandledRejection → a global Node event triggered when a Promise fails without .catch()
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at: ', promise, 'reason: ', reason);
});
