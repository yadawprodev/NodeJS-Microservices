import Post from '../models/Post.js';
import logger from '../utils/logger.js';
import validatePost from '../utils/validation.js';
import { publishEvent } from '../utils/rabbitmq.js';

// delete all cached post data because it's now outdated
async function invalidatePostCache(redisClient, postId) {
  // delete single post cache
  const cachedKey = `post:${postId}`;
  await redisClient.del(cachedKey);

  // delete paginated posts cache
  const keys = await redisClient.keys('posts:*');

  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  try {
    const { content, mediaIds } = req.body;

    // Validate user credentials
    const { error } = validatePost(req.body);

    if (error) {
      logger.warn('Validation error while creating post: ', {
        message: error.details[0].message,
      });

      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.details[0].message,
      });
    }

    const createNewPost = await Post.create({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    // publish new post creation event to rabbitmq
    await publishEvent('post.created', {
      postId: createNewPost._id.toString(),
      userId: createNewPost.user.toString(),
      content: createNewPost.content,
      createdAt: createNewPost.createdAt,
    });

    // delete all cached post data because it's now outdated
    await invalidatePostCache(req.redisClient, createNewPost._id.toString());

    logger.info('Post created successfully', {
      postId: createNewPost._id.toString(),
    });
    res.status(201).json({
      success: true,
      message: 'Post created successfully !',
      postId: createNewPost._id,
    });
  } catch (e) {
    logger.error('Error during creating post', {
      message: e.message,
      stack: e.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosted = await req.redisClient.get(cacheKey);

    if (cachedPosted) {
      return res.json({ source: 'cache', result: JSON.parse(cachedPosted) });
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    if (posts.length === 0) {
      return res.json({ message: 'No posts yet' });
    }

    const totalNoOfPosts = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
    };

    // save your posts in redis cache
    await req.redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300); // Expires in 5 min

    res.json({ source: 'db', result });
  } catch (e) {
    logger.error('Error fetching posts', {
      message: e.message,
      stack: e.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      return res.json({ source: 'cache', post: JSON.parse(cachedPost) });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post with id: ${postId} not found !`,
      });
    }

    const result = {
      success: true,
      data: post,
    };

    // save your cache to redis
    await req.redisClient.set(
      cacheKey,
      JSON.stringify(result),
      'EX',
      3600, // 'expires in 1hr'
    );

    res.json({ source: 'db', result });
  } catch (e) {
    logger.error('Error fetching post', {
      message: e.message,
      stack: e.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      logger.info(`Post not found !`);
      return res.status(404).json({
        success: false,
        message: 'Post not found !',
      });
    }

    if (post.user.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You're not authorized to delete this post!",
      });
    }

    await post.deleteOne();
    logger.info('Post deleted successfully !');

    // publish post deletion event to rabbitmq
    await publishEvent('post.deleted', {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });

    // Invalidate cache for deleted posts
    await invalidatePostCache(req.redisClient, req.params.id);

    res.json({ message: 'Post deleted successfully !' });
  } catch (e) {
    logger.error('Error deleting post', {
      message: e.message,
      stack: e.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, mediaIds } = req.body;

    let updateFields = {};

    // only update fields if they exist
    if (content !== undefined) updateFields.content = content;
    if (mediaIds !== undefined) updateFields.mediaIds = mediaIds;

    // Fields can not be empty
    if (Object.keys(updateFields).length === 0) {
      logger.info('No fields to update');

      return res.status(400).json({
        success: false,
        message: 'Please add fields to update',
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, updateFields, {
      new: true,
    });

    if (!updatedPost) {
      logger.info('Post to update not found !');

      return res.status(404).json({
        success: false,
        message: 'Post not found !',
      });
    }

    logger.info('Post updated successfully !');

    // publish post update event to rabbitmq
    await publishEvent('post.updated', {
      postId: updatedPost._id.toString(),
      content: updatedPost.content,
      mediaIds: updatedPost.mediaIds,
      createdAt: updatedPost.createdAt,
      userId: updatedPost.user.toString(),
    });

    // Invalidate cache for updated posts
    await invalidatePostCache(req.redisClient, postId);

    res.status(200).json({
      success: true,
      message: 'Post updated successfully !',
      post: updatedPost,
    });
  } catch (e) {
    logger.error('Error updating post', {
      message: e.message,
      stack: e.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { createPost, getAllPosts, getPost, deletePost, updatePost };
