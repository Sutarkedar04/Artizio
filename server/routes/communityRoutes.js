import express from 'express';
import Artwork from '../models/Artwork.js';
import Artist from '../models/Artist.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Attaches each artwork's Artist-profile _id (as artistProfileId), derived from
// its artist (User) id. The frontend needs this for follow/profile-navigation
// calls, which key off the Artist document — not the User document that
// Artwork.artist actually references.
async function attachArtistProfileIds(artworks) {
  const plain = artworks.map(a => (a.toObject ? a.toObject() : a));

  const userIds = [...new Set(
    plain
      .map(a => (a.artist && a.artist._id ? a.artist._id : a.artist))
      .filter(Boolean)
      .map(id => id.toString())
  )];

  if (userIds.length === 0) return plain;

  const artistDocs = await Artist.find({ user: { $in: userIds } }).select('user');
  const map = new Map(artistDocs.map(doc => [doc.user.toString(), doc._id.toString()]));

  return plain.map(a => {
    const userId = (a.artist && a.artist._id ? a.artist._id : a.artist)?.toString();
    return { ...a, artistProfileId: map.get(userId) || null };
  });
}

// @desc    Get personalized feed (followed artists + popular)
// @route   GET /api/community/feed
router.get('/feed', protect, async (req, res) => {
  try {
    const userArtist = await Artist.findOne({ user: req.user._id });
    const following = userArtist?.following || [];

    const followedArtworks = await Artwork.find({
      artist: { $in: following },
      isPublic: true
    })
      .populate('artist', 'name profilePicture')
      .populate('comments.user', 'name profilePicture')
      .sort('-createdAt')
      .limit(30);

    const popularArtworks = await Artwork.find({
      isPublic: true,
      artist: { $nin: following }
    })
      .populate('artist', 'name profilePicture')
      .populate('comments.user', 'name profilePicture')
      .sort('-likes')
      .limit(20);

    // Tag each artwork with whether the current user already follows its artist,
    // so the frontend can render the right Follow/Following state without an
    // extra round trip per post.
    const feed = [
      ...followedArtworks.map(a => ({ ...(a.toObject ? a.toObject() : a), isFollowing: true })),
      ...popularArtworks.map(a => ({ ...(a.toObject ? a.toObject() : a), isFollowing: false }))
    ];

    const uniqueFeed = feed.filter((artwork, index, self) =>
      index === self.findIndex(a => a._id.toString() === artwork._id.toString())
    );

    const withProfileIds = await attachArtistProfileIds(uniqueFeed.slice(0, 50));

    res.json({
      success: true,
      data: withProfileIds
    });
  } catch (error) {
    console.error('GET /community/feed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get trending artworks
// @route   GET /api/community/trending
router.get('/trending', async (req, res) => {
  try {
    const trending = await Artwork.aggregate([
      { $match: { isPublic: true } },
      { $addFields: { likesCount: { $size: '$likes' } } },
      { $sort: { likesCount: -1, views: -1, createdAt: -1 } },
      { $limit: 20 }
    ]);

    // GET /trending — uses aggregate, so populate happens after
await Artwork.populate(trending, [
  { path: 'artist', select: 'name profilePicture' },
  { path: 'comments.user', select: 'name profilePicture' }
]);

    const withProfileIds = await attachArtistProfileIds(trending);

    res.json({ success: true, data: withProfileIds });
  } catch (error) {
    console.error('GET /community/trending error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Like/unlike an artwork
// @route   POST /api/community/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    const userId = req.user._id;
    const likedIndex = artwork.likes.indexOf(userId);

    if (likedIndex === -1) {
      artwork.likes.push(userId);
    } else {
      artwork.likes.splice(likedIndex, 1);
    }

    await artwork.save();

    res.json({
      success: true,
      liked: likedIndex === -1,
      likesCount: artwork.likes.length
    });
  } catch (error) {
    console.error('POST /community/:id/like error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add comment to artwork
// @route   POST /api/community/:id/comments
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    artwork.comments.push(comment);
    await artwork.save();

    // Populate the user info for the new comment
    await artwork.populate('comments.user', 'name profilePicture');

    const newComment = artwork.comments[artwork.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: newComment,
      comments: artwork.comments
    });
  } catch (error) {
    console.error('POST /community/:id/comments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete comment from artwork
// @route   DELETE /api/community/:id/comments/:commentId
router.delete('/:id/comments/:commentId', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    const commentIndex = artwork.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const comment = artwork.comments[commentIndex];

    // Only the comment owner or artwork owner can delete
    if (
      comment.user.toString() !== req.user._id.toString() &&
      artwork.artist.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    artwork.comments.splice(commentIndex, 1);
    await artwork.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      comments: artwork.comments
    });
  } catch (error) {
    console.error('DELETE /community/:id/comments/:commentId error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get artwork details
// @route   GET /api/community/:id
router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('artist', 'name profilePicture')
      .populate('comments.user', 'name profilePicture');

    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    // Increment views
    artwork.views = (artwork.views || 0) + 1;
    await artwork.save();

    const withProfileIds = await attachArtistProfileIds([artwork]);

    res.json({
      success: true,
      data: withProfileIds[0]
    });
  } catch (error) {
    console.error('GET /community/:id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Search artworks
// @route   GET /api/community/search
router.get('/search', async (req, res) => {
  try {
    const { q, category, medium, sort = 'recent' } = req.query;

    const filter = { isPublic: true };

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (medium) {
      filter.medium = { $regex: medium, $options: 'i' };
    }

    let sortOption = {};
    switch (sort) {
      case 'recent':
        sortOption = { createdAt: -1 };
        break;
      case 'popular':
        sortOption = { likes: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // GET /search
const artworks = await Artwork.find(filter)
  .populate('artist', 'name profilePicture')
  .populate('comments.user', 'name profilePicture')
  .sort(sortOption)
  .limit(50);

    const withProfileIds = await attachArtistProfileIds(artworks);

    res.json({
      success: true,
      count: withProfileIds.length,
      data: withProfileIds
    });
  } catch (error) {
    console.error('GET /community/search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;