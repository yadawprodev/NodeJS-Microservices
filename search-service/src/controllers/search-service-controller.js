import Search from '../models/Search.js';
import logger from '../utils/logger.js';

// delete all cached Search data because it's now outdated
// async function invalidateSearchCache(redisClient, postId) {
//   const keys = await redisClient.keys('search:*');
//   if (keys.length > 0) {
//     await redisClient.del(keys);
//   }
// }

const searchPostController = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      logger.warn('Search query is empty');
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const redisClient = req.redisClient;
    const cacheKey = `search:${query.toLowerCase().trim()}`;

    // Check cache first
    const cachedResults = await redisClient.get(cacheKey);

    if (cachedResults) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        results: JSON.parse(cachedResults),
      });
    }

    //  If not in cache → query DB
    const result = await Search.find(
      {
        // This uses our text index on content.
        $text: { $search: query },
      },
      {
        // Adds new file (score) based on how relevant the document is to the search
        score: { $meta: 'textScore' },
      },
    )
      // Sort results by that relevance score (highest first)
      .sort({ score: { $meta: 'textScore' } })
      .limit(10);

    // Save to cache (with expiry)
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300);

    res.json({ success: true, source: 'db', results: result });
  } catch (e) {
    logger.error('Error fetching post', {
      message: e.message,
      stack: e.stack,
    });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { searchPostController };
