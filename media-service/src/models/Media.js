import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

const Media = mongoose.model('Media', mediaSchema);

export default Media;
