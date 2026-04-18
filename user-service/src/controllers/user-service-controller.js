import jwt from 'jsonwebtoken';

import logger from '../utils/logger.js';
import { validateRegistration, validateLogin } from '../utils/validation.js';
import User from '../models/User.js';
import generateTokens from '../utils/generateToken.js';
import RefreshToken from '../models/refreshToken.js';

// user registration
const registerUser = async (req, res) => {
  logger.info('Registration endpoint hit ...');

  try {
    // Validate the schema
    const { error } = validateRegistration(req.body);

    if (error) {
      logger.warn('Error while validation', {
        message: error.details[0].message,
      });
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { username, email, password } = req.body;

    let user = await User.findOne({ $or: [{ username }, { email }] });

    if (user) {
      logger.warn('User already exists !', { username: user.username });

      return res.status(400).json({
        success: false,
        message: `User with name ${user.username} already exists !`,
      });
    }

    user = new User({ username, password, email });
    await user.save();

    const { accessToken, refreshToken } = await generateTokens(user);

    logger.info('User registered successfully !', { username: user.username });

    // save token in cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully !',
      accessToken,
      refreshToken,
    });
  } catch (e) {
    logger.error('Error during registration', {
      message: e.message,
      stack: e.stack,
    });

    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// user login
const loginUser = async (req, res) => {
  logger.info('Login endpoint hit ...');

  try {
    // Validate user credential
    const { error } = validateLogin(req.body);

    if (error) {
      logger.warn('Validation error while login', {
        message: error.details[0].message,
      });

      return res.status(400).json({
        success: false,
        message: 'Validation error' + error.details[0].message,
      });
    }

    const { username, password, email } = req.body;

    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: 'Username or email is required',
      });
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
      logger.warn('User not found !');
      return res.status(400).json({
        success: false,
        message: 'User not found !',
      });
    }

    // check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      logger.warn(`User credentials doesn't match. Please try again.`);
      return res.status(400).json({
        success: false,
        message: 'Incorrect password !  Please try again.',
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    logger.info('User loggedIn successfully !');
    res.status(200).json({
      success: true,
      message: 'User loggedIn successfully !',
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (e) {
    logger.error('Error while logging in user', {
      message: e.message,
      stack: e.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

//refresh token
const refreshTokenUser = async (req, res) => {
  logger.info('Refresh token endpoint hit');
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('Refresh token is missing');
      return res.status(400).json({
        success: false,
        message: 'Refresh token is missing',
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn('Invalid or expired Refresh token !');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired Refresh token !',
      });
    }

    const user = await User.findById(storedToken.user);

    if (!user) {
      logger.warn(`User not found !`);
      return res.status(400).json({
        success: false,
        message: 'User not found !',
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);

    // Delete the old refresh token
    await RefreshToken.findByIdAndDelete(storedToken._id);

    res.status(200).json({
      newAccessToken,
      newRefreshToken,
    });
  } catch (e) {
    logger.error('refresh token error occured', {
      message: e.message,
      stack: e.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// logout
const logoutUser = async (req, res) => {
  logger.info('Logout endpoint hit ...');
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('Refresh token is missing');
      return res.status(400).json({
        success: false,
        message: 'Refresh token is missing',
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken) {
      logger.warn('Invalid Refresh token ');
      return res.status(400).json({
        success: false,
        message: 'Invalid Refresh token ',
      });
    }

    // Delete refreshToken from db
    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info(`Refresh Token deleted for logout`);

    res.json({
      success: true,
      message: `User loggedout successfully !`,
    });
  } catch (e) {
    logger.error('logout token error occured', {
      message: e.message,
      stack: e.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { registerUser, loginUser, refreshTokenUser, logoutUser };
