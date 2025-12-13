import { Router } from 'express';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

export const vipRouter = Router();

// Upgrade to VIP
vipRouter.post('/upgrade', authRequired, async (req, res) => {
  const { planType, coinAmount } = req.body;
  const userId = req.user.id;
 
  if (!coinAmount || coinAmount <= 0) {
    return res.status(400).json({ message: 'Invalid coin amount' });
  }

  const client = await pool.connect();
 
  try {
    await client.query('BEGIN');

    // Check if user has enough coins
    const { rows: coinRows } = await client.query(
      'SELECT coins FROM coins WHERE user_id = $1',
      [userId]
    );

    if (coinRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User has no coin balance' });
    }

    const currentCoins = coinRows[0].coins;
    if (currentCoins < coinAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Insufficient coins',
        required: coinAmount,
        available: currentCoins
      });
    }

    // Deduct coins
    await client.query(
      'UPDATE coins SET coins = coins - $1 WHERE user_id = $2',
      [coinAmount, userId]
    );

    // For testing purposes, VIP expires in 5 minutes
    const vipStart = new Date();
    const vipExpiration = new Date(vipStart.getTime() + 5 * 60 * 1000); // 5 minutes from now
   
    console.log(`Upgrading user ${userId} to VIP. Plan: ${planType}, Coins: ${coinAmount}`);
    console.log(`VIP Start: ${vipStart.toISOString()}`);
    console.log(`VIP Expiration: ${vipExpiration.toISOString()}`);
   
    // Update user's VIP status
    const { rows } = await client.query(`
      UPDATE users
      SET
        is_vip = TRUE,
        vip_start = $1,
        vip_expiration = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, username, is_vip, vip_start, vip_expiration
    `, [vipStart, vipExpiration, userId]);
   
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }

    await client.query('COMMIT');

    const updatedUser = rows[0];
   
    // Log the upgrade for debugging
    console.log('VIP upgrade successful:', {
      userId: updatedUser.id,
      username: updatedUser.username,
      isVip: updatedUser.is_vip,
      vipStart: updatedUser.vip_start,
      vipExpiration: updatedUser.vip_expiration,
      coinsDeducted: coinAmount
    });
   
    res.json({
      success: true,
      message: `Successfully upgraded to VIP! ${coinAmount} coins deducted.`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        isVip: updatedUser.is_vip,
        vipStart: updatedUser.vip_start,
        vipExpiration: updatedUser.vip_expiration
      },
      coinsDeducted: coinAmount
    });
   
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('VIP upgrade error:', error);
    res.status(500).json({
      message: 'Failed to upgrade to VIP. Please try again.'
    });
  } finally {
    client.release();
  }
});

// Get VIP status
vipRouter.get('/status', authRequired, async (req, res) => {
  const userId = req.user.id;
 
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        username,
        is_vip,
        vip_start,
        vip_expiration,
        CASE
          WHEN is_vip = TRUE AND (vip_expiration IS NULL OR vip_expiration > CURRENT_TIMESTAMP)
          THEN TRUE
          ELSE FALSE
        END as is_currently_vip
      FROM users
      WHERE id = $1
    `, [userId]);
   
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
   
    const user = rows[0];
   
    // If VIP has expired, update the database
    if (user.is_vip && user.vip_expiration && new Date(user.vip_expiration) <= new Date()) {
      await pool.query(`
        UPDATE users
        SET
          is_vip = FALSE,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId]);
     
      user.is_vip = false;
      user.is_currently_vip = false;
    }
   
    res.json({
      isVip: user.is_currently_vip,
      vipStart: user.vip_start,
      vipExpiration: user.vip_expiration,
      timeRemaining: user.vip_expiration ? Math.max(0, new Date(user.vip_expiration).getTime() - Date.now()) : null
    });
   
  } catch (error) {
    console.error('Error fetching VIP status:', error);
    res.status(500).json({ message: 'Error fetching VIP status' });
  }
});

// Cancel VIP (for testing purposes)
vipRouter.post('/cancel', authRequired, async (req, res) => {
  const userId = req.user.id;
 
  try {
    const { rows } = await pool.query(`
      UPDATE users
      SET
        is_vip = FALSE,
        vip_start = NULL,
        vip_expiration = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, is_vip
    `, [userId]);
   
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
   
    res.json({
      success: true,
      message: 'VIP subscription cancelled',
      user: rows[0]
    });
   
  } catch (error) {
    console.error('VIP cancellation error:', error);
    res.status(500).json({ message: 'Error cancelling VIP subscription' });
  }
});