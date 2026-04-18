import express from 'express';

import {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
  updatePost,
} from '../controllers/post-service-controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  PostLimiterMiddleware,
  createPostLimiterMiddleware,
} from '../middlewares/rateLimiterMiddleware.js';

const router = express.Router();

// use authMiddleware on every request
router.use(authMiddleware);

router.post('/create-post', createPostLimiterMiddleware, createPost);
router.get('/', PostLimiterMiddleware, getAllPosts);
router.get('/:id', PostLimiterMiddleware, getPost);
router.delete('/:id', PostLimiterMiddleware, deletePost);
router.put('/:id', PostLimiterMiddleware, updatePost);

export default router;
