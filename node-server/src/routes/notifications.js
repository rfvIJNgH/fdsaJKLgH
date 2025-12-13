import { Router } from 'express';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.get('/counts', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN type = 'message' THEN 1 END) as messages,
        COUNT(CASE WHEN type = 'follow' THEN 1 END) as follows,
        COUNT(CASE WHEN type = 'friend_request' THEN 1 END) as friend_requests,
        COUNT(CASE WHEN type = 'trade_request' THEN 1 END) as trade_requests,
        COUNT(CASE WHEN type = 'new_post' THEN 1 END) as new_posts,
        COUNT(CASE WHEN type = 'upvote' THEN 1 END) as upvotes
      FROM notifications WHERE user_id = $1 AND is_read = false
    `, [req.user.id]);
    const c = rows[0];
    res.json({ total: Number(c.total), messages: Number(c.messages), follows: Number(c.follows), friendRequests: Number(c.friend_requests), tradeRequests: Number(c.trade_requests), newPosts: Number(c.new_posts), upvotes: Number(c.upvotes) });
  } catch { res.status(500).send('Failed to get notification counts'); }
});

notificationsRouter.get('', authRequired, async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 50);
  const offset = (page - 1) * limit;
  try {
    const { rows } = await pool.query('SELECT id, user_id, type, title, message, data, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [req.user.id, limit, offset]);
    res.json({ notifications: rows.map(n => ({ ...n, createdAt: n.created_at })), page, limit });
  } catch { res.status(500).send('Failed to get notifications'); }
});

notificationsRouter.post('/:id/read', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).send('Invalid notification ID');
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
    res.sendStatus(200);
  } catch { res.status(500).send('Failed to mark as read'); }
});

notificationsRouter.post('/:type/read', authRequired, async (req, res) => {
  const type = String(req.params.type);
  const valid = new Set(['message','follow','friend_request','trade_request','new_post']);
  if (!valid.has(type)) return res.status(400).send('Invalid notification type');
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND type = $2', [req.user.id, type]);
    res.sendStatus(200);
  } catch { res.status(500).send('Failed to mark notifications as read'); }
});

notificationsRouter.delete('/delete/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).send('Invalid notification ID');
  try {
    const r = await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (r.rowCount === 0) return res.status(404).send('Notification not found or not authorized');
    res.sendStatus(200);
  } catch { res.status(500).send('Failed to delete notification'); }
});

notificationsRouter.delete('/delete-type/:type', authRequired, async (req, res) => {
  const type = String(req.params.type);
  const valid = new Set(['message','follow','friend_request','trade_request','new_post','upvote']);
  if (!valid.has(type)) return res.status(400).send('Invalid notification type');
  try {
    await pool.query('DELETE FROM notifications WHERE user_id = $1 AND type = $2', [req.user.id, type]);
    res.sendStatus(200);
  } catch { res.status(500).send('Failed to delete notifications'); }
});


