import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB');
  } catch (e) {
    logger.error('error while connecting to database', {
      message: e.message,
      stack: e.stack,
    });
    process.exit(1); // stop running server if connection fails
  }
};

export default connectToDb;
