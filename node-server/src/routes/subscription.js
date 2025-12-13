import { Router } from 'express';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

export const subscriptionRouter = Router();

// Subscribe to a creator
subscriptionRouter.post('/subscribe', authRequired, async (req, res) => {
  const { creatorId, coinAmount } = req.body;
  const subscriberId = req.user.id;

  if (!creatorId || !coinAmount) {
    return res.status(400).json({ message: 'Creator ID and coin amount are required' });
  }

  if (creatorId === subscriberId) {
    return res.status(400).json({ message: 'Cannot subscribe to yourself' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if creator exists
    const { rows: creatorRows } = await client.query(
      'SELECT id, username FROM users WHERE id = $1',
      [creatorId]
    );

    if (creatorRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Check if already subscribed
    const { rows: existingSubs } = await client.query(
      'SELECT id, expires_at FROM subscriptions WHERE subscriber_id = $1 AND creator_id = $2',
      [subscriberId, creatorId]
    );

    // Check if there's an active subscription
    const activeSubscription = existingSubs.find(sub => new Date(sub.expires_at) > new Date());
    
    if (activeSubscription) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Already subscribed to this creator',
        expiresAt: activeSubscription.expires_at
      });
    }

    // Get subscriber's current coins
    const { rows: coinRows } = await client.query(
      'SELECT coins FROM coins WHERE user_id = $1',
      [subscriberId]
    );

    let currentCoins = 0;
    if (coinRows.length > 0) {
      currentCoins = coinRows[0].coins;
    }

    // Check if user has enough coins
    if (currentCoins < coinAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Insufficient coins',
        required: coinAmount,
        available: currentCoins
      });
    }

    // Deduct coins from subscriber
    if (coinRows.length === 0) {
      // Create coin record if it doesn't exist
      await client.query(
        'INSERT INTO coins (user_id, coins) VALUES ($1, $2)',
        [subscriberId, -coinAmount]
      );
    } else {
      await client.query(
        'UPDATE coins SET coins = coins - $1 WHERE user_id = $2',
        [coinAmount, subscriberId]
      );
    }

    // Add coins to creator
    const { rows: creatorCoinRows } = await client.query(
      'SELECT coins FROM coins WHERE user_id = $1',
      [creatorId]
    );

    if (creatorCoinRows.length === 0) {
      // Create coin record for creator if it doesn't exist
      await client.query(
        'INSERT INTO coins (user_id, coins) VALUES ($1, $2)',
        [creatorId, coinAmount]
      );
    } else {
      // Add coins to creator
      await client.query(
        'UPDATE coins SET coins = coins + $1 WHERE user_id = $2',
        [coinAmount, creatorId]
      );
    }

    // Create subscription with 5-minute expiry
    const expiryDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    let subscriptionResult;
    
    if (existingSubs.length > 0) {
      // Update existing expired subscription
      subscriptionResult = await client.query(
        `UPDATE subscriptions 
         SET coins_paid = $3, started_at = NOW(), expires_at = $4 
         WHERE subscriber_id = $1 AND creator_id = $2
         RETURNING id, started_at, expires_at`,
        [subscriberId, creatorId, coinAmount, expiryDate]
      );
    } else {
      // Create new subscription
      subscriptionResult = await client.query(
        `INSERT INTO subscriptions (subscriber_id, creator_id, coins_paid, started_at, expires_at) 
         VALUES ($1, $2, $3, NOW(), $4) 
         RETURNING id, started_at, expires_at`,
        [subscriberId, creatorId, coinAmount, expiryDate]
      );
    }

    // Check if subscription was created/updated successfully
    if (!subscriptionResult.rows || subscriptionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(500).json({ message: 'Failed to create subscription' });
    }

    const subscription = subscriptionResult.rows[0];
    const creator = creatorRows[0];

    await client.query('COMMIT');

    res.json({
      message: 'Subscription successful',
      subscription: {
        id: subscription.id,
        creatorId: creatorId,
        creatorUsername: creator.username,
        coinsPaid: coinAmount,
        startedAt: subscription.started_at,
        expiresAt: subscription.expires_at
      },
      remainingCoins: currentCoins - coinAmount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Subscription failed', error: error.message });
  } finally {
    client.release();
  }
});

// Check subscription status
subscriptionRouter.get('/:creatorId/status', authRequired, async (req, res) => {
  const creatorId = req.params.creatorId;
  const subscriberId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT id, coins_paid, started_at, expires_at 
       FROM subscriptions 
       WHERE subscriber_id = $1 AND creator_id = $2 AND expires_at > NOW()`,
      [subscriberId, creatorId]
    );

    if (rows.length > 0) {
      res.json({
        subscribed: true,
        subscription: {
          id: rows[0].id,
          coinsPaid: rows[0].coins_paid,
          startedAt: rows[0].started_at,
          expiresAt: rows[0].expires_at
        }
      });
    } else {
      res.json({ subscribed: false });
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ message: 'Error checking subscription status' });
  }
});

// Get user's subscriptions
subscriptionRouter.get('/my', authRequired, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.coins_paid, s.started_at, s.expires_at,
              u.id as creator_id, u.username as creator_username, u.profile_image
       FROM subscriptions s
       JOIN users u ON s.creator_id = u.id
       WHERE s.subscriber_id = $1 AND s.expires_at > NOW()
       ORDER BY s.started_at DESC`,
      [userId]
    );

    res.json({
      subscriptions: rows.map(row => ({
        id: row.id,
        coinsPaid: row.coins_paid,
        startedAt: row.started_at,
        expiresAt: row.expires_at,
        creator: {
          id: row.creator_id,
          username: row.creator_username,
          profileImage: row.profile_image
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
});

// Unsubscribe from creator (for future use)
subscriptionRouter.delete('/:creatorId', authRequired, async (req, res) => {
  const creatorId = req.params.creatorId;
  const subscriberId = req.user.id;

  try {
    const { rows } = await pool.query(
      `UPDATE subscriptions 
       SET expires_at = NOW() 
       WHERE subscriber_id = $1 AND creator_id = $2 AND expires_at > NOW()
       RETURNING id`,
      [subscriberId, creatorId]
    );

    if (rows.length > 0) {
      res.json({ message: 'Successfully unsubscribed' });
    } else {
      res.status(404).json({ message: 'No active subscription found' });
    }

  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: 'Error unsubscribing' });
  }
});