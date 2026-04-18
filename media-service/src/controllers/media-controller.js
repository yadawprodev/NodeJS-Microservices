import {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
} from '../utils/cloudinary.js';
import logger from '../utils/logger.js';
import Media from '../models/Media.js';

const uploadMedia = async (req, res) => {
  try {
    logger.info('Starting upload to cloudinary');

    if (!req.file) {
      logger.warn(`No file found ! Please upload a file and try again.`);
      return res.status(400).json({
        success: false,
        message: 'No file found ! Please upload a file and try again.',
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`File details: name= ${originalname}, type= ${mimetype}`);

    const result = await uploadMediaToCloudinary(req.file);
    logger.info(`Uploaded successfully. Public_id:- ${result.public_id} `);

    // save to our db
    const newMedia = await Media.create({
      publicId: result.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: result.secure_url,
      user: userId,
    });

    // send response
    res.status(200).json({
      success: true,
      mediaId: newMedia._id,
      fileName: originalname,
      fileType: mimetype,
      url: result.secure_url,
      message: 'Media uploaded successfully !',
    });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
    });
  }
};

const getAllMedia = async (req, res) => {
  try {
    const results = await Media.find({});

    res.status(200).json({
      success: true,
      medias: results,
    });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching medias',
    });
  }
};

export { uploadMedia, getAllMedia };
