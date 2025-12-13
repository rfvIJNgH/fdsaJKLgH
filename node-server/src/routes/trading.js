import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';
import { getUploadsDir } from '../lib/uploads.js';
import { createTradeRequestNotification } from '../lib/notifications.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadsDir()),
  filename: (_req, file, cb) => cb(null, `trading_${Date.now()}_${file.originalname}`)
});
const allowed = new Set(['.jpg','.jpeg','.png','.gif','.webp','.mp4','.mov','.avi','.mkv','.webm']);
const upload = multer({ storage, fileFilter: (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.has(ext)) return cb(new Error('Invalid file type'));
  cb(null, true);
}, limits: { fileSize: 50 * 1024 * 1024 } });

export const tradingRouter = Router();

tradingRouter.post('/upload', authRequired, upload.single('file'), async (req, res) => {
  const { title, description } = req.body || {};
  const fileUrl = `/uploads/${req.file.filename}`;
  try {
    const { rows: [{ id }] } = await pool.query(
      `INSERT INTO trading_content (user_id, title, description, file_url, created_at, is_traded) VALUES ($1, $2, $3, $4, NOW(), false) RETURNING id`,
      [req.user.id, title || '', description || '', fileUrl]
    );
    res.json({ id, userId: req.user.id, title: title || '', description: description || '', fileUrl, createdAt: new Date().toISOString(), isTraded: false });
  } catch { res.status(500).send('Error saving trading content'); }
});

tradingRouter.get('/', authRequired, async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows } = await pool.query('SELECT id, user_id, title, description, file_url, created_at, is_traded FROM trading_content ORDER BY created_at DESC');
    const list = [];
    for (const r of rows) {
      let hasAccess = false;
      if (r.user_id === userId) hasAccess = true; else {
        const { rows: cnt } = await pool.query(`
          SELECT COUNT(*)::int as c FROM trade_requests WHERE trading_content_id = $1 AND ((from_user_id = $2 AND status = 'accepted') OR (to_user_id = $2 AND status = 'accepted'))
        `, [r.id, userId]);
        hasAccess = cnt[0].c > 0;
      }
      list.push({ id: r.id, userId: r.user_id, title: r.title, description: r.description || undefined, fileUrl: r.file_url, createdAt: r.created_at.toISOString(), isTraded: r.is_traded, hasAccess });
    }
    res.json(list);
  } catch { res.status(500).send('Database error'); }
});

tradingRouter.get('/mine', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, user_id, title, description, file_url, created_at, is_traded FROM trading_content WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows.map(r => ({ id: r.id, userId: r.user_id, title: r.title, description: r.description || undefined, fileUrl: r.file_url, createdAt: r.created_at.toISOString(), isTraded: r.is_traded })));
  } catch { res.status(500).send('Database error'); }
});

tradingRouter.post('/request', authRequired, async (req, res) => {
  const { tradingContentId, offeredContentId } = req.body || {};
  if (!tradingContentId || !offeredContentId) return res.status(400).send('Missing tradingContentId or offeredContentId');
  try {
    const { rows: owner } = await pool.query('SELECT user_id, title FROM trading_content WHERE id = $1', [tradingContentId]);
    if (owner.length === 0) return res.status(404).send('Trading content not found');
    const toUserId = owner[0].user_id;
    if (toUserId === req.user.id) return res.status(400).send('Cannot trade with yourself');
    await pool.query('INSERT INTO trade_requests (from_user_id, to_user_id, trading_content_id, offered_content_id, status, created_at) VALUES ($1,$2,$3,$4,\'pending\', NOW())', [req.user.id, toUserId, tradingContentId, offeredContentId]);
    await createTradeRequestNotification(toUserId, req.user.username, owner[0].title);
    res.status(201).json({ message: 'Trade request sent' });
  } catch { res.status(500).send('Error creating trade request'); }
});

tradingRouter.get('/requests', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT tr.id, tr.from_user_id, tr.to_user_id, tr.trading_content_id, tr.offered_content_id, tr.status, tr.created_at,
             tc1.title as trading_content_title, tc1.file_url as trading_content_file_url,
             tc2.title as offered_content_title, tc2.file_url as offered_content_file_url,
             u.username as from_username
      FROM trade_requests tr
      LEFT JOIN trading_content tc1 ON tr.trading_content_id = tc1.id
      LEFT JOIN trading_content tc2 ON tr.offered_content_id = tc2.id
      LEFT JOIN users u ON tr.from_user_id = u.id
      WHERE tr.to_user_id = $1 AND tr.status = 'pending'
      ORDER BY tr.created_at DESC
    `, [req.user.id]);
    const list = rows.map(r => ({
      id: r.id, fromUserId: r.from_user_id, toUserID: r.to_user_id, tradingContentId: r.trading_content_id,
      offeredContentId: r.offered_content_id, status: r.status, createdAt: r.created_at.toISOString(),
      tradingContentTitle: r.trading_content_title, tradingContentFileUrl: r.trading_content_file_url,
      offeredContentTitle: r.offered_content_title, offeredContentFileUrl: r.offered_content_file_url,
      fromUsername: r.from_username
    }));
    res.json(list);
  } catch { res.status(500).send('Database error'); }
});

tradingRouter.post('/request/:id/accept', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).send('Invalid request ID');
  try {
    const r = await pool.query('UPDATE trade_requests SET status = \'accepted\' WHERE id = $1 AND to_user_id = $2 AND status = \'pending\'', [id, req.user.id]);
    if (r.rowCount === 0) return res.status(403).send('Trade request not found or not allowed');
    res.json({ message: 'Trade request accepted' });
  } catch { res.status(500).send('Database error'); }
});

tradingRouter.post('/request/:id/reject', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).send('Invalid request ID');
  try {
    const r = await pool.query('UPDATE trade_requests SET status = \'rejected\' WHERE id = $1 AND to_user_id = $2 AND status = \'pending\'', [id, req.user.id]);
    if (r.rowCount === 0) return res.status(403).send('Trade request not found or not allowed');
    res.json({ message: 'Trade request rejected' });
  } catch { res.status(500).send('Database error'); }
});

// Debug listing
tradingRouter.get('/debug/requests', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT tr.id, tr.from_user_id, tr.to_user_id, tr.trading_content_id, tr.offered_content_id, tr.status, tr.created_at,
             tc1.title as trading_content_title, tc2.title as offered_content_title
      FROM trade_requests tr
      LEFT JOIN trading_content tc1 ON tr.trading_content_id = tc1.id
      LEFT JOIN trading_content tc2 ON tr.offered_content_id = tc2.id
      ORDER BY tr.id
    `);
    res.json(rows);
  } catch { res.status(500).send('Database error'); }
});


