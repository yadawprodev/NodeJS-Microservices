import Media from '../models/Media.js';
import logger from '../utils/logger.js';
import { deleteMediaFromCloudinary } from '../utils/cloudinary.js';

async function handlePostDeleted(event) {
  //   console.log(event, 'event event event');

  const { postId, mediaIds } = event;
  try {
    // Find all mediaIds
    const mediasToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediasToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);

      logger.info(
        `Deleted media: ${media._id} associated with this deleted post ${postId} `,
      );
    }
  } catch (e) {
    logger.error(`Error while deleting Media `, {
      error: e.message,
      stack: e.stack,
    });
  }
}

export default handlePostDeleted;
