import express from 'express';
import multer from 'multer';

import authenticateUser from '../middlewares/authMiddleware.js';
import { uploadMedia, getAllMedia } from '../controllers/media-controller.js';
import logger from '../utils/logger.js';
import { uploadLimiter } from '../middlewares/uploadLimiter.js';

const router = express.Router();

// configure multer for file upload
const fileFilter = (req, file, cb) => {
  // allow only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // accept file
  } else {
    cb(new Error('Only image files are allowed!'), false); // reject
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('file');

// get all medias
router.get('/all', authenticateUser, getAllMedia);

// upload media
router.post(
  '/upload',
  authenticateUser,
  uploadLimiter, // Redis-backed limiter
  (req, res, next) => {
    // custom error handler
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error while uploading: ', err);
        return res.status(400).json({
          message: 'Multer error while uploading: ',
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error('Unknown error occured while uploading: ', err);
        return res.status(500).json({
          message: 'Unknown error occured while uploading: ',
          error: err.message,
          stack: err.stack,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'No file found ',
        });
      }

      next();
    });
  },
  uploadMedia,
);

export default router;
