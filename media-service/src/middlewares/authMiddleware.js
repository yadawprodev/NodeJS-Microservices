import logger from '../utils/logger.js';

const authenticateUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    logger.warn(`Access attempted with out user ID`);
    return res.status(401).json({
      success: false,
      message: 'Authentication is required please login to continue',
    });
  }

  req.user = { userId };
  next();
};

export default authenticateUser;
