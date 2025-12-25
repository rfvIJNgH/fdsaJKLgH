import { Router } from 'express';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

export const reviewRouter = Router();

// Create a review
reviewRouter.post('/', authRequired, async (req, res) => {
  const { contentId, rating, reviewText } = req.body;
  const userId = req.user.id;

  if (!contentId) {
    return res.status(400).json({ success: false, message: 'Content ID is required' });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if content exists
    const contentCheck = await pool.query('SELECT id FROM content WHERE id = $1', [contentId]);
    if (contentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Check if user already reviewed this content
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND content_id = $2',
      [userId, contentId]
    );

    if (existingReview.rows.length > 0) {
      // Update existing review
      const result = await pool.query(
        `UPDATE reviews 
         SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $3 AND content_id = $4 
         RETURNING *`,
        [rating.toFixed(1), reviewText || '', userId, contentId]
      );
      return res.json({
        success: true,
        message: 'Review updated successfully',
        data: result.rows[0]
      });
    }

    // Create new review
    const result = await pool.query(
      `INSERT INTO reviews (user_id, content_id, rating, review_text)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, contentId, rating.toFixed(1), reviewText || '']
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get reviews for a content
reviewRouter.get('/content/:contentId', async (req, res) => {
  const { contentId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT r.*, u.username, u.profile_image
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.content_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [contentId, limit, offset]
    );

    // Get average rating
    const avgResult = await pool.query(
      `SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
       FROM reviews WHERE content_id = $1`,
      [contentId]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM reviews WHERE content_id = $1',
      [contentId]
    );

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        averageRating: avgResult.rows[0].average_rating 
          ? parseFloat(avgResult.rows[0].average_rating).toFixed(1) 
          : null,
        totalReviews: parseInt(avgResult.rows[0].total_reviews),
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's review for a content
reviewRouter.get('/user/:contentId', authRequired, async (req, res) => {
  const { contentId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM reviews WHERE user_id = $1 AND content_id = $2`,
      [userId, contentId]
    );

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching user review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a review
reviewRouter.delete('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found or unauthorized' });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get all reviews
reviewRouter.get('/all', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT r.*, u.username, u.email, c.title as content_title
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN content c ON r.content_id = c.id
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM reviews');

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
