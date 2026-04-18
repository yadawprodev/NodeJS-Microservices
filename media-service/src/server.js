import dotenv from 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

import errorHandler from './middlewares/error-handler.js';
import logger from './utils/logger.js';
import mediaRoute from './routes/media-route.js';
import { connectToRabbitMQ, consumeEvent } from './utils/rabbitmq.js';
import handlePostDeleted from './eventHandlers/delete-post-handler.js';

const app = express();
const port = process.env.PORT || 5003;

// connect to database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info(`Connected to mongodb successfully !`))
  .catch((e) => logger.error('error connecting to mongo database', e.message));

// middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info('Request body', { body: req.body });
  next();
});

// Route
app.use('/api/media', mediaRoute);

// error handler middleware
app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    consumeEvent('post.deleted', handlePostDeleted);

    app.listen(port, () => {
      logger.info(`Media-service running on port ${port}`);
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

// unhandledRejection → a global Node event triggered when a Promise fails without .catch()
process.on('unhandledRejection', (reason) => {
  logger.error(' ERROR:', reason);
});
