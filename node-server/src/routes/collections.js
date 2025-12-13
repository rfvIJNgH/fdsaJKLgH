import { Router } from 'express';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

export const collectionsRouter = Router();

collectionsRouter.post('', authRequired, async (req, res) => {
  const { name, description, isPublic } = req.body || {};
  if (!name) return res.status(400).send('Collection name is required');
  try {
    const createdAt = new Date();
    const { rows: [{ id }] } = await pool.query(
      'INSERT INTO collections (user_id, name, description, is_public, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$5) RETURNING id',
      [req.user.id, name, description || null, !!isPublic, createdAt]
    );
    res.status(201).json({ id, userId: req.user.id, name, description, isPublic: !!isPublic, contentCount: 0, createdAt: createdAt.toISOString(), updatedAt: createdAt.toISOString() });
  } catch { res.status(500).send('Error creating collection'); }
});

collectionsRouter.get('/my', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.user_id, c.name, c.description, c.is_public, c.created_at, c.updated_at, COUNT(cc.content_id) as content_count
      FROM collections c LEFT JOIN collection_content cc ON c.id = cc.collection_id
      WHERE c.user_id = $1 GROUP BY c.id ORDER BY c.updated_at DESC
    `, [req.user.id]);
    res.json(rows.map(r => ({ id: r.id, userId: r.user_id, name: r.name, description: r.description || undefined, isPublic: r.is_public, createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString(), contentCount: Number(r.content_count) })));
  } catch { res.status(500).send('Database error'); }
});

collectionsRouter.get('/public', async (req, res) => {
  const username = String(req.query.username || '');
  if (!username) return res.status(400).send('Username parameter is required');
  try {
    const { rows: u } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (u.length === 0) return res.status(404).send('User not found');
    const { rows } = await pool.query(`
      SELECT c.id, c.user_id, c.name, c.description, c.is_public, c.created_at, c.updated_at, COUNT(cc.content_id) as content_count
      FROM collections c LEFT JOIN collection_content cc ON c.id = cc.collection_id
      WHERE c.user_id = $1 AND c.is_public = true GROUP BY c.id ORDER BY c.updated_at DESC
    `, [u[0].id]);
    res.json(rows.map(r => ({ id: r.id, userId: r.user_id, name: r.name, description: r.description || undefined, isPublic: r.is_public, createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString(), contentCount: Number(r.content_count) })));
  } catch { res.status(500).send('Database error'); }
});

collectionsRouter.get('/content', authRequired, async (req, res) => {
  const collectionId = Number(req.query.collectionId);
  if (!collectionId) return res.status(400).send('Collection ID is required');
  try {
    const { rows: cr } = await pool.query('SELECT user_id, is_public FROM collections WHERE id = $1', [collectionId]);
    if (cr.length === 0) return res.status(404).send('Collection not found');
    const { user_id, is_public } = cr[0];
    const isOwner = req.user && req.user.id === user_id;
    if (!is_public && !isOwner) return res.status(404).send('Collection not found');
    const { rows } = await pool.query(`
      SELECT c.id, c.user_id, c.title, c.description, c.image_count, c.video_count, c.thumbnail_url, c.created_at, cc.added_at, u.username, (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) as upvotes
      FROM collection_content cc JOIN content c ON cc.content_id = c.id JOIN users u ON c.user_id = u.id
      WHERE cc.collection_id = $1 ORDER BY cc.added_at DESC
    `, [collectionId]);
    res.json(rows.map(r => ({ id: r.id, user: { id: r.user_id, username: r.username }, title: r.title, description: r.description || undefined, imageCount: r.image_count, videoCount: r.video_count, thumbnail: r.thumbnail_url, createdAt: r.created_at.toISOString(), upvotes: Number(r.upvotes) })));
  } catch { res.status(500).send('Database error'); }
});

collectionsRouter.get('/detail/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).send('Collection ID is required');
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.user_id, c.name, c.description, c.is_public, c.created_at, c.updated_at,
             COUNT(cc.content_id) as content_count
      FROM collections c LEFT JOIN collection_content cc ON c.id = cc.collection_id
      WHERE c.id = $1 GROUP BY c.id
    `, [id]);
    if (rows.length === 0) return res.status(404).send('Collection not found');
    const r = rows[0];
    // Access control similar to Go OptionalAuthMiddleware logic
    const isOwner = req.user && req.user.id === r.user_id;
    if (!r.is_public && !isOwner) return res.status(404).send('Collection not found');
    res.json({ id: r.id, userId: r.user_id, name: r.name, description: r.description || undefined, isPublic: r.is_public, createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString(), contentCount: Number(r.content_count) });
  } catch { res.status(500).send('Database error'); }
});

collectionsRouter.post('/save', authRequired, async (req, res) => {
  const { collectionId, contentId } = req.body || {};
  if (!collectionId || !contentId) return res.status(400).send('Collection ID and Content ID are required');
  try {
    const { rows: col } = await pool.query('SELECT user_id FROM collections WHERE id = $1', [collectionId]);
    if (col.length === 0) return res.status(404).send('Collection not found');
    if (col[0].user_id !== req.user.id) return res.status(403).send('Unauthorized');
    const { rows: exists } = await pool.query('SELECT EXISTS(SELECT 1 FROM content WHERE id = $1) as e', [contentId]);
    if (!exists[0].e) return res.status(404).send('Content not found');
    await pool.query('INSERT INTO collection_content (collection_id, content_id, added_at) VALUES ($1, $2, NOW()) ON CONFLICT (collection_id, content_id) DO NOTHING', [collectionId, contentId]);
    await pool.query('UPDATE collections SET updated_at = NOW() WHERE id = $1', [collectionId]);
    res.status(201).json({ message: 'Content saved to collection' });
  } catch { res.status(500).send('Error saving to collection'); }
});

collectionsRouter.delete('/remove', authRequired, async (req, res) => {
  const collectionId = Number(req.query.collectionId);
  const contentId = Number(req.query.contentId);
  if (!collectionId || !contentId) return res.status(400).send('Collection ID and Content ID are required');
  try {
    const { rows: col } = await pool.query('SELECT user_id FROM collections WHERE id = $1', [collectionId]);
    if (col.length === 0) return res.status(404).send('Collection not found');
    if (col[0].user_id !== req.user.id) return res.status(403).send('Unauthorized');
    const r = await pool.query('DELETE FROM collection_content WHERE collection_id = $1 AND content_id = $2', [collectionId, contentId]);
    if (r.rowCount === 0) return res.status(404).send('Content not found in collection');
    await pool.query('UPDATE collections SET updated_at = NOW() WHERE id = $1', [collectionId]);
    res.json({ message: 'Content removed from collection' });
  } catch { res.status(500).send('Error removing from collection'); }
});

collectionsRouter.put('/update', authRequired, async (req, res) => {
  const collectionId = Number(req.query.collectionId);
  const { name, description, isPublic } = req.body || {};
  if (!collectionId) return res.status(400).send('Collection ID is required');
  if (!name) return res.status(400).send('Collection name is required');
  try {
    const { rows: col } = await pool.query('SELECT user_id FROM collections WHERE id = $1', [collectionId]);
    if (col.length === 0) return res.status(404).send('Collection not found');
    if (col[0].user_id !== req.user.id) return res.status(403).send('Unauthorized');
    const r = await pool.query('UPDATE collections SET name = $1, description = $2, is_public = $3, updated_at = NOW() WHERE id = $4', [name, description || null, !!isPublic, collectionId]);
    if (r.rowCount === 0) return res.status(404).send('Collection not found');
    res.json({ message: 'Collection updated successfully' });
  } catch { res.status(500).send('Error updating collection'); }
});

collectionsRouter.delete('/delete', authRequired, async (req, res) => {
  const collectionId = Number(req.query.collectionId);
  if (!collectionId) return res.status(400).send('Collection ID is required');
  try {
    const { rows: col } = await pool.query('SELECT user_id FROM collections WHERE id = $1', [collectionId]);
    if (col.length === 0) return res.status(404).send('Collection not found');
    if (col[0].user_id !== req.user.id) return res.status(403).send('Unauthorized');
    const r = await pool.query('DELETE FROM collections WHERE id = $1', [collectionId]);
    if (r.rowCount === 0) return res.status(404).send('Collection not found');
    res.json({ message: 'Collection deleted successfully' });
  } catch { res.status(500).send('Error deleting collection'); }
});


