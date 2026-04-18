import logger from '../utils/logger.js';
import Search from '../models/Search.js';

async function searchEventHandler(event) {
  try {
    const { postId, userId, content, createdAt } = event;

    const newSearchPost = await Search.create({
      postId,
      userId,
      content,
      createdAt,
    });

    logger.info(
      `Search post created: ${postId}, ${newSearchPost._id.toString()}`,
    );
  } catch (error) {
    logger.error('Error handling pos.created event', {
      message: error.message,
      stack: error.stack,
    });
  }
}

async function handlePostDeleted(event) {
  try {
    await Search.findOneAndDelete({
      postId: event.postId,
    });
    logger.info(`Search post deleted: ${event.postId}`);
  } catch (error) {
    logger.error('Error handling post.deleted event', {
      message: error.message,
      stack: error.stack,
    });
  }
}

async function handlePostUpdated(event) {
  try {
    const { postId, content, userId, mediaIds, createdAt } = event;

    await Search.findOneAndUpdate(
      { postId },
      { content, mediaIds, userId, createdAt },
      { new: true },
    );
    logger.info(`Search post updated: ${postId}`);
  } catch (error) {
    logger.error('Error handling post.updated event', {
      message: error.message,
      stack: error.stack,
    });
  }
}

export { searchEventHandler, handlePostDeleted, handlePostUpdated };
