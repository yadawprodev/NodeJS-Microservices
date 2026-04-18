import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import RefreshToken from '../models/refreshToken.js';

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, userName: user.userName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.NODE_ENV === 'development' ? '60m' : '10m' },
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Refresh token expires in 7 days

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export default generateTokens;
