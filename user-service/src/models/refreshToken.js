import mongoose, { Schema, model } from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// MongoDB automatically delete this document when expiresAt time is reached.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
