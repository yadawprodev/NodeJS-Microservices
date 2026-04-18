import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaIds: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true },
);

// so later we can Post.find({ $text: { $search: "hello world" } });
// It makes searching posts by words (like a search bar) efficient.
postSchema.index({ content: 'text' });

const Post = mongoose.model('Post', postSchema);

export default Post;
