import logger from '../utils/logger.js';

const authMiddleware = (req, res, next) => {
  // Headers:
  // Content-Type: application/json
  // Authorization: Bearer token123
  // x-user-id: 64a123abc

  const userId = req.headers['x-user-id'];

  if (!userId) {
    logger.warn(`Access attemplted with out user id`);
    return res.status(401).json({
      success: false,
      message: 'Authentication is required ! Please login to procced.',
    });
  }

  req.user = { userId };

  next();
};

export default authMiddleware;
