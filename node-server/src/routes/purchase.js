import { Router } from 'express';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

export const purchaseRouter = Router();

// Purchase content
purchaseRouter.post('/:contentId/purchase', authRequired, async (req, res) => {
  const contentId = Number(req.params.contentId);
  const buyerId = req.user.id;

  if (!contentId) {
    return res.status(400).json({ message: 'Invalid content ID' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get content details and check if it exists
    const { rows: contentRows } = await client.query(
      'SELECT id, user_id, title, content_price, content_type FROM content WHERE id = $1',
      [contentId]
    );

    if (contentRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Content not found' });
    }

    const content = contentRows[0];

    // Check if user is trying to purchase their own content
    if (content.user_id === buyerId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cannot purchase your own content' });
    }

    // Check if content is purchasable (fixed type)
    if (content.content_type?.toLowerCase() !== 'fixed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'This content is not available for purchase' });
    }

    // Check if content has a price set
    if (!content.content_price || content.content_price <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Content price not set' });
    }

    // Check if user has already purchased this content
    const { rows: existingPurchase } = await client.query(
      'SELECT id FROM purchases WHERE buyer_id = $1 AND content_id = $2',
      [buyerId, contentId]
    );

    if (existingPurchase.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Content already purchased' });
    }

    // Get user's current coins
    const { rows: coinRows } = await client.query(
      'SELECT coins FROM coins WHERE user_id = $1',
      [buyerId]
    );

    let currentCoins = 0;
    if (coinRows.length > 0) {
      currentCoins = coinRows[0].coins;
    }

    // Check if user has enough coins
    if (currentCoins < content.content_price) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Insufficient coins',
        required: content.content_price,
        available: currentCoins
      });
    }

    // Deduct coins from buyer
    if (coinRows.length === 0) {
      // If no coin record exists, this shouldn't happen but handle it
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No coin account found' });
    } else {
      await client.query(
        'UPDATE coins SET coins = coins - $1 WHERE user_id = $2',
        [content.content_price, buyerId]
      );
    }

    // Add coins to content owner (optional - you might want to implement a revenue share system)
    const { rows: ownerCoinRows } = await client.query(
      'SELECT coins FROM coins WHERE user_id = $1',
      [content.user_id]
    );

    if (ownerCoinRows.length === 0) {
      // Create coin record for content owner if it doesn't exist
      await client.query(
        'INSERT INTO coins (user_id, coins) VALUES ($1, $2)',
        [content.user_id, content.content_price]
      );
    } else {
      // Add coins to content owner
      await client.query(
        'UPDATE coins SET coins = coins + $1 WHERE user_id = $2',
        [content.content_price, content.user_id]
      );
    }

    // Record the purchase
    const { rows: purchaseRows } = await client.query(
      `INSERT INTO purchases (buyer_id, content_id, coins_paid, purchased_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, purchased_at`,
      [buyerId, contentId, content.content_price]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Purchase successful',
      purchase: {
        id: purchaseRows[0].id,
        contentId: contentId,
        contentTitle: content.title,
        coinsPaid: content.content_price,
        purchasedAt: purchaseRows[0].purchased_at
      },
      remainingCoins: currentCoins - content.content_price
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Purchase error:', error);
    res.status(500).json({ message: 'Purchase failed', error: error.message });
  } finally {
    client.release();
  }
});

// Check if user has purchased specific content
purchaseRouter.get('/:contentId/purchase', authRequired, async (req, res) => {
  const contentId = Number(req.params.contentId);
  const userId = req.user.id;

  if (!contentId) {
    return res.status(400).json({ message: 'Invalid content ID' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, coins_paid, purchased_at 
       FROM purchases 
       WHERE buyer_id = $1 AND content_id = $2`,
      [userId, contentId]
    );

    if (rows.length > 0) {
      res.json({
        purchased: true,
        purchase: {
          id: rows[0].id,
          coinsPaid: rows[0].coins_paid,
          purchasedAt: rows[0].purchased_at
        }
      });
    } else {
      res.json({ purchased: false });
    }
  } catch (error) {
    console.error('Error checking purchase status:', error);
    res.status(500).json({ message: 'Error checking purchase status' });
  }
});

// Get user's purchase history
purchaseRouter.get('/my-purchases', authRequired, async (req, res) => {
  const userId = req.user.id;
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.coins_paid, p.purchased_at,
              c.id as content_id, c.title, c.thumbnail_url,
              u.username as creator_username
       FROM purchases p
       JOIN content c ON p.content_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE p.buyer_id = $1
       ORDER BY p.purchased_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*)::int as total FROM purchases WHERE buyer_id = $1',
      [userId]
    );

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      purchases: rows.map(row => ({
        id: row.id,
        coinsPaid: row.coins_paid,
        purchasedAt: row.purchased_at,
        content: {
          id: row.content_id,
          title: row.title,
          thumbnail: row.thumbnail_url,
          creator: row.creator_username
        }
      })),
      pagination: {
        currentPage: page,
        totalPages,
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ message: 'Error fetching purchase history' });
  }
});