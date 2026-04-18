import express from 'express';

const router = express.Router();

import {
  registerUser,
  loginUser,
  refreshTokenUser,
  logoutUser,
} from '../controllers/user-service-controller.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshTokenUser);
router.post('/logout', logoutUser);

export default router;
