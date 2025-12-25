import { Router } from 'express';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

export const transactionRouter = Router();

// Create a deposit request
transactionRouter.post('/deposit', authRequired, async (req, res) => {
  const { amount, walletAddress } = req.body;
  const userId = req.user.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  if (!walletAddress || walletAddress.trim() === '') {
    return res.status(400).json({ success: false, message: 'Wallet address is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, wallet_address, status)
       VALUES ($1, 'deposit', $2, $3, 'pending')
       RETURNING *`,
      [userId, amount, walletAddress.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating deposit:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a withdrawal request
transactionRouter.post('/withdraw', authRequired, async (req, res) => {
  const { amount, walletAddress } = req.body;
  const userId = req.user.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  if (!walletAddress || walletAddress.trim() === '') {
    return res.status(400).json({ success: false, message: 'Wallet address is required' });
  }

  try {
    // Check if user has enough coins
    const coinsResult = await pool.query(
      'SELECT coins FROM coins WHERE user_id = $1',
      [userId]
    );

    const currentCoins = coinsResult.rows.length > 0 ? coinsResult.rows[0].coins : 0;
    
    if (currentCoins < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, wallet_address, status)
       VALUES ($1, 'withdraw', $2, $3, 'pending')
       RETURNING *`,
      [userId, amount, walletAddress.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's transaction history
transactionRouter.get('/history', authRequired, async (req, res) => {
  const userId = req.user.id;
  const { type, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT * FROM transactions 
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM transactions WHERE user_id = $1';
    const countParams = [userId];
    let countParamIndex = 2;

    if (type) {
      countQuery += ` AND type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get all transactions
transactionRouter.get('/all', async (req, res) => {
  const { type, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT t.*, u.username, u.email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM transactions WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (type) {
      countQuery += ` AND type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Update transaction status
transactionRouter.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current transaction
    const txResult = await client.query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );

    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const transaction = txResult.rows[0];

    // If approving a deposit, add coins to user
    if (status === 'approved' && transaction.type === 'deposit' && transaction.status === 'pending') {
      const coinsResult = await client.query(
        'SELECT * FROM coins WHERE user_id = $1',
        [transaction.user_id]
      );

      if (coinsResult.rows.length === 0) {
        await client.query(
          'INSERT INTO coins (user_id, coins) VALUES ($1, $2)',
          [transaction.user_id, transaction.amount]
        );
      } else {
        await client.query(
          'UPDATE coins SET coins = coins + $1 WHERE user_id = $2',
          [transaction.amount, transaction.user_id]
        );
      }
    }

    // If approving a withdrawal, deduct coins from user
    if (status === 'approved' && transaction.type === 'withdraw' && transaction.status === 'pending') {
      await client.query(
        'UPDATE coins SET coins = coins - $1 WHERE user_id = $2',
        [transaction.amount, transaction.user_id]
      );
    }

    // Update transaction status
    const result = await client.query(
      `UPDATE transactions 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Transaction status updated',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating transaction status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});
