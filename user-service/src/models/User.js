import { Schema, model } from 'mongoose';
import argon2 from 'argon2';

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

// Pre-save hook to hash password
userSchema.pre('save', async function () {
  // Only hash if password is new or modified
  if (!this.isModified('password')) return;

  try {
    this.password = await argon2.hash(this.password);
  } catch (e) {
    throw e;
  }
});

// method to verify password
userSchema.methods.comparePassword = async function (plainPassword) {
  try {
    return await argon2.verify(this.password, plainPassword);
  } catch (err) {
    throw err;
  }
};

userSchema.index({ username: 'text' });

const User = model('User', userSchema);

export default User;
