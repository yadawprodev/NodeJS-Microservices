import express from 'express';

import { searchPostController } from '../controllers/search-service-controller.js';
import searchRateLimiter from '../middlewares/searchRateLimiter.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/posts', authMiddleware, searchRateLimiter, searchPostController);

export default router;
