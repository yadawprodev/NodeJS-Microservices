import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'media-posts',
      },
      (error, result) => {
        if (error) {
          logger.error(
            'Error while uploading media to cloudinary',
            error.message,
          );
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    uploadStream.end(file.buffer); // file.buffer -> actual file data & "Send the file data to Cloudinary"
  });
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
    logger.info(`Media with public ID ${publicId} deleted from Cloudinary`);
    return result;
  } catch (error) {
    logger.error('Error while deleting Media', {
      error: error.message,
    });
    throw error;
  }
};

export { uploadMediaToCloudinary, deleteMediaFromCloudinary };
