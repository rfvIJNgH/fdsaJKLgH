import { Router } from 'express';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';
import { createFollowNotification } from '../lib/notifications.js';

export const userRouter = Router();

// Public
userRouter.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, username, email, created_at, updated_at FROM users');
    res.json(rows);
  } catch (e) {
    res.status(500).send('Database error');
  }
});

userRouter.get('/:id(\\d+)', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).send('User not found');
    res.json(rows[0]);
  } catch {
    res.status(500).send('Internal server error');
  }
});

userRouter.get('/:username/profile', async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: userRows } = await client.query('SELECT id, username, email, profile_image FROM users WHERE username = $1', [req.params.username]);
    if (userRows.length === 0) return res.status(404).send('User not found');
    const user = userRows[0];
    const { rows: stats } = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as follower_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*) FROM upvotes WHERE user_id = $1) as upvotes_given
    `, [user.id]);
    res.json({ user, followerCount: Number(stats[0].follower_count), followingCount: Number(stats[0].following_count), upvotesGiven: Number(stats[0].upvotes_given) });
  } catch {
    res.status(500).send('Database error');
  } finally {
    client.release();
  }
});

// Follow
userRouter.post('/:username/follow', authRequired, async (req, res) => {
  if (req.params.username === req.user.username) return res.status(400).send('Cannot follow yourself');
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
    if (rows.length === 0) return res.status(404).send('User not found');
    const targetId = rows[0].id;
    const result = await client.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, targetId]);
    if (result.rowCount > 0) await createFollowNotification(targetId, req.user.username);
    res.status(204).end();
  } catch {
    res.status(500).send('Error following user');
  } finally { client.release(); }
});

userRouter.delete('/:username/follow', authRequired, async (req, res) => {
  if (req.params.username === req.user.username) return res.status(400).send('Cannot unfollow yourself');
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
    if (rows.length === 0) return res.status(404).send('User not found');
    const targetId = rows[0].id;
    await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.id, targetId]);
    res.status(204).end();
  } catch {
    res.status(500).send('Error unfollowing user');
  }
});

userRouter.get('/:username/follow/status', authRequired, async (req, res) => {
  try {
    const { rows: t } = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
    if (t.length === 0) return res.status(404).send('User not found');
    const targetId = t[0].id;
    const { rows } = await pool.query('SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2) as exists', [req.user.id, targetId]);
    res.json({ isFollowing: rows[0].exists });
  } catch {
    res.status(500).send('Error checking follow status');
  }
});

userRouter.get('/:username/followers', async (req, res) => {
  try {
    const { rows: u } = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
    if (u.length === 0) return res.status(404).send('User not found');
    const { rows } = await pool.query(`
      SELECT u.id, u.username, u.email
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = $1
    `, [u[0].id]);
    res.json(rows);
  } catch { res.status(500).send('Database error'); }
});

userRouter.get('/:username/following', async (req, res) => {
  try {
    const { rows: u } = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
    if (u.length === 0) return res.status(404).send('User not found');
    const { rows } = await pool.query(`
      SELECT u.id, u.username, u.email
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = $1
    `, [u[0].id]);
    res.json(rows);
  } catch { res.status(500).send('Database error'); }
});

// Delete user account
userRouter.delete('/account', authRequired, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userId = req.user.id;
    
    // Delete user's follows
    await client.query('DELETE FROM follows WHERE follower_id = $1 OR following_id = $1', [userId]);
    
    // Delete user's upvotes
    await client.query('DELETE FROM upvotes WHERE user_id = $1', [userId]);
    
    // Delete user's notifications (only user_id column exists)
    await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    
    // Delete user's coins
    await client.query('DELETE FROM coins WHERE user_id = $1', [userId]);
    
    // Delete user's transactions (if table exists)
    try {
      await client.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
    } catch (e) {
      console.log('transactions table may not exist');
    }
    
    // Delete user's collection content first, then collections
    await client.query(`
      DELETE FROM collection_content 
      WHERE collection_id IN (SELECT id FROM collections WHERE user_id = $1)
    `, [userId]);
    await client.query('DELETE FROM collections WHERE user_id = $1', [userId]);
    
    // Delete user's trade requests (correct column names: from_user_id, to_user_id)
    await client.query('DELETE FROM trade_requests WHERE from_user_id = $1 OR to_user_id = $1', [userId]);
    
    // Delete user's trading content
    await client.query('DELETE FROM trading_content WHERE user_id = $1', [userId]);
    
    // Delete upvotes on user's content first
    await client.query(`
      DELETE FROM upvotes 
      WHERE content_id IN (SELECT id FROM content WHERE user_id = $1)
    `, [userId]);
    
    // Delete collection_content referencing user's content
    await client.query(`
      DELETE FROM collection_content 
      WHERE content_id IN (SELECT id FROM content WHERE user_id = $1)
    `, [userId]);
    
    // Delete purchases related to user's content
    await client.query(`
      DELETE FROM purchases 
      WHERE content_id IN (SELECT id FROM content WHERE user_id = $1)
    `, [userId]);
    
    // Delete content files and tags first, then content
    await client.query(`
      DELETE FROM content_files 
      WHERE content_id IN (SELECT id FROM content WHERE user_id = $1)
    `, [userId]);
    await client.query(`
      DELETE FROM content_tags 
      WHERE content_id IN (SELECT id FROM content WHERE user_id = $1)
    `, [userId]);
    await client.query('DELETE FROM content WHERE user_id = $1', [userId]);
    
    // Delete report images first, then reports
    try {
      await client.query(`
        DELETE FROM report_images 
        WHERE report_id IN (SELECT id FROM reports WHERE reporter_id = $1 OR reported_user_id = $1)
      `, [userId]);
      await client.query('DELETE FROM reports WHERE reporter_id = $1 OR reported_user_id = $1', [userId]);
    } catch (e) {
      console.log('reports tables may not exist');
    }
    
    // Delete messages
    await client.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [userId]);
    
    // Delete subscriptions
    await client.query('DELETE FROM subscriptions WHERE subscriber_id = $1 OR creator_id = $1', [userId]);
    
    // Delete purchases where user is buyer (purchases only has buyer_id, not seller_id)
    await client.query('DELETE FROM purchases WHERE buyer_id = $1', [userId]);
    
    // Finally delete the user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await client.query('COMMIT');
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account: ' + error.message });
  } finally {
    client.release();
  }
});

