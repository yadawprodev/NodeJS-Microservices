import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const validateToken = (req, res, next) => {
  // Verfiy user token
  try {
    // Get token from header or cookie
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(' ')[1] || req.cookies?.accessToken;

    if (!accessToken) {
      logger.warn('Access attempt with out valid token');
      return res.status(401).json({
        success: false,
        message: 'No token provided !',
      });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.userInfo = decoded;
    next();
  } catch (err) {
    logger.warn('Invalid token !');
    return res.status(401).json({
      success: false,
      message: 'Invalid token !',
    });
  }
};

export default validateToken;
