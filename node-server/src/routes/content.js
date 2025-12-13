import { Router } from 'express';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';
import { createUpvoteNotification } from '../lib/notifications.js';


export const contentRouter = Router();


contentRouter.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const sort = req.query.sort || 'hot';


  let where = 'WHERE 1=1';
  const args = [];
  let i = 1;
  if (req.query.username) {
    where += ` AND c.user_id = (SELECT id FROM users WHERE username = $${i++})`;
    args.push(req.query.username);
  }
  if (req.query.collectedBy && Number(req.query.collectedBy)) {
    where += ` AND c.id IN (SELECT content_id FROM upvotes WHERE user_id = $${i++})`;
    args.push(Number(req.query.collectedBy));
  }
  if (req.query.minUpvotes && Number(req.query.minUpvotes) > 0) {
    where += ` AND (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) >= $${i++}`;
    args.push(Number(req.query.minUpvotes));
  }
  if (req.query.fromDate) {
    where += ` AND c.created_at >= $${i++}`;
    args.push(req.query.fromDate);
  }
  if (req.query.tags) {
    const tags = Array.isArray(req.query.tags) ? req.query.tags : String(req.query.tags).split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length) {
      where += ` AND c.id IN (SELECT content_id FROM content_tags ct JOIN tags t ON ct.tag_id = t.id WHERE t.name = ANY($${i++}))`;
      args.push(tags);
    }
  }


  let order = 'ORDER BY c.created_at DESC';
  switch (sort) {
    case 'new':
      order = 'ORDER BY c.created_at DESC';
      break;
    case 'top':
      order = 'ORDER BY (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) DESC, c.created_at DESC';
      break;
    case 'hot':
      order = "ORDER BY (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) * (1.0 / (EXTRACT(EPOCH FROM (NOW() - c.created_at))/86400 + 2)^1.5) DESC";
      break;
    case 'shuffle':
      order = 'ORDER BY RANDOM()';
      break;
  }


  const base = `SELECT c.id, c.title, c.image_count, c.video_count, c.content_type, c.content_price, c.thumbnail_url, c.created_at, c.updated_at,
    (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) AS upvotes,
    u.id AS user_id, u.username AS user_username, u.email AS user_email, u.created_at AS user_created_at, u.updated_at AS user_updated_at
    FROM content c JOIN users u ON c.user_id = u.id`;


  const fullQuery = `${base} ${where} ${order} LIMIT ${limit} OFFSET ${offset}`;
  try {
    const client = await pool.connect();
    const rows = await client.query(fullQuery, args);
    const items = rows.rows.map(r => ({
      id: r.id,
      title: r.title,
      imageCount: r.image_count,
      videoCount: r.video_count,
      contentType: r.content_type,
      contentPrice: r.content_price,
      thumbnail: r.thumbnail_url,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      upvotes: Number(r.upvotes),
      user: {
        id: r.user_id,
        username: r.user_username,
        email: r.user_email,
        created_at: r.user_created_at,
        updated_at: r.user_updated_at
      }
    }));
    const countQuery = `SELECT COUNT(*)::int AS count FROM content c JOIN users u ON c.user_id = u.id ${where}`;
    const { rows: cnt } = await client.query(countQuery, args);
    const totalItems = cnt[0].count;
    const totalPages = Math.floor((totalItems + limit - 1) / limit);
    res.json({ content: items, pagination: { currentPage: page, totalPages, totalItems, itemsPerPage: limit } });
    client.release();
  } catch (e) {
    res.status(500).send('Database error');
  }
});


contentRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).send('Invalid content ID');
  const client = await pool.connect();
  try {
    const q = `SELECT c.id, c.title, c.description, c.image_count, c.video_count, c.content_type, c.content_price, c.thumbnail_url, c.created_at, c.updated_at,
      (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) AS upvotes, u.id as user_id, u.username
      FROM content c JOIN users u ON c.user_id = u.id WHERE c.id = $1`;
    const { rows } = await client.query(q, [id]);
    if (rows.length === 0) return res.status(404).send('Content not found');
    const r = rows[0];
    const tagRows = await client.query(`SELECT t.id, t.name FROM tags t JOIN content_tags ct ON t.id = ct.tag_id WHERE ct.content_id = $1`, [id]);
    const fileRows = await client.query(`SELECT id, file_url, created_at FROM content_files WHERE content_id = $1 ORDER BY created_at ASC, id ASC`, [id]);
    res.json({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      imageCount: r.image_count,
      videoCount: r.video_count,
      contentType: r.content_type,
      contentPrice: r.content_price,
      thumbnail: r.thumbnail_url,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      upvotes: Number(r.upvotes),
      user: { id: r.user_id, username: r.username },
      tags: tagRows.rows.map(t => ({ id: t.id, name: t.name })),
      files: fileRows.rows.map(f => ({ id: f.id, fileUrl: f.file_url, createdAt: f.created_at.toISOString() }))
    });
  } catch {
    res.status(500).send('Database error');
  } finally { client.release(); }
});


contentRouter.post('/', authRequired, async (req, res) => {
  const { title, description, imageCount, videoCount, contentType, contentPrice, thumbnailUrl, fileUrls = [], tags = [] } = req.body || {};


  // Validate required fields
  if (!title) return res.status(400).send('Title is required');
  if (!contentType) return res.status(400).send('Content type is required');


  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [{ id }] } = await client.query(
      `INSERT INTO content (user_id, title, description, image_count, video_count, content_type, content_price, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [req.user.id, title, description || null, imageCount || 0, videoCount || 0, contentType, contentPrice, thumbnailUrl || null]
    );


    for (const tagName of tags) {
      const { rows: [{ id: tagId }] } = await client.query(
        `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [tagName]
      );
      await client.query(`INSERT INTO content_tags (content_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, tagId]);
    }


    // Save all file URLs to content_files table
    for (const fileUrl of fileUrls) {
      await client.query(`INSERT INTO content_files (content_id, file_url) VALUES ($1, $2)`, [id, fileUrl]);
    }


    await client.query('COMMIT');
    res.status(201).json({ id, title, createdAt: new Date().toISOString() });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { }
    res.status(500).send('Error creating content');
  } finally { client.release(); }
});


contentRouter.put('/:id', authRequired, async (req, res) => {
  const contentId = Number(req.params.id);
  if (!contentId) return res.status(400).send('Invalid content ID');
  
  const { title, description, contentType, contentPrice, tags = [] } = req.body || {};

  if (!title) return res.status(400).send('Title is required');
  if (!contentType) return res.status(400).send('Content type is required');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user owns the content
    const { rows: ownerRows } = await client.query('SELECT user_id FROM content WHERE id = $1', [contentId]);
    if (ownerRows.length === 0) return res.status(404).send('Content not found');
    if (ownerRows[0].user_id !== req.user.id) return res.status(403).send('You can only edit your own content');

    // Update content
    await client.query(
      `UPDATE content SET title = $1, description = $2, content_type = $3, content_price = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [title, description || null, contentType, contentPrice || 0, contentId]
    );

    // Update tags - remove old ones and add new ones
    await client.query('DELETE FROM content_tags WHERE content_id = $1', [contentId]);
    
    for (const tagName of tags) {
      if (tagName && tagName.trim()) {
        const { rows: [{ id: tagId }] } = await client.query(
          `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
          [tagName.trim().toLowerCase()]
        );
        await client.query(`INSERT INTO content_tags (content_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [contentId, tagId]);
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Content updated successfully', contentId });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { }
    console.error('Error updating content:', e);
    res.status(500).send('Error updating content');
  } finally { 
    client.release(); 
  }
});


contentRouter.delete('/:id', authRequired, async (req, res) => {
  const contentId = Number(req.params.id);
  if (!contentId) return res.status(400).send('Invalid content ID');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user owns the content
    const { rows: ownerRows } = await client.query('SELECT user_id FROM content WHERE id = $1', [contentId]);
    if (ownerRows.length === 0) return res.status(404).send('Content not found');
    if (ownerRows[0].user_id !== req.user.id) return res.status(403).send('You can only delete your own content');

    // Delete related data
    await client.query('DELETE FROM upvotes WHERE content_id = $1', [contentId]);
    await client.query('DELETE FROM content_tags WHERE content_id = $1', [contentId]);
    await client.query('DELETE FROM content_files WHERE content_id = $1', [contentId]);
    await client.query('DELETE FROM collection_content WHERE content_id = $1', [contentId]);
    await client.query('DELETE FROM purchases WHERE content_id = $1', [contentId]);

    // Delete the content
    const result = await client.query('DELETE FROM content WHERE id = $1', [contentId]);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).send('Content not found');
    }

    await client.query('COMMIT');
    res.json({ message: 'Content deleted successfully', contentId });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { }
    console.error('Error deleting content:', e);
    res.status(500).send('Error deleting content');
  } finally { 
    client.release(); 
  }
});


contentRouter.post('/:id/upvote', authRequired, async (req, res) => {
  const contentId = Number(req.params.id);
  if (!contentId) return res.status(400).send('Invalid content ID');
  const client = await pool.connect();
  try {
    const { rows: ownerRows } = await client.query('SELECT user_id FROM content WHERE id = $1', [contentId]);
    if (ownerRows.length === 0) return res.status(404).send('Content not found');
    const contentOwnerID = ownerRows[0].user_id;
    if (contentOwnerID === req.user.id) return res.status(400).send('Cannot upvote your own content');


    const { rows: existsRows } = await client.query('SELECT EXISTS(SELECT 1 FROM upvotes WHERE user_id = $1 AND content_id = $2) as exists', [req.user.id, contentId]);
    const exists = existsRows[0].exists;


    if (exists) {
      await client.query('DELETE FROM upvotes WHERE user_id = $1 AND content_id = $2', [req.user.id, contentId]);
    } else {
      await client.query('INSERT INTO upvotes (user_id, content_id) VALUES ($1, $2)', [req.user.id, contentId]);
      await createUpvoteNotification(contentOwnerID, req.user.username, contentId);
    }


    const { rows: cnt } = await client.query('SELECT COUNT(*)::int as c FROM upvotes WHERE content_id = $1', [contentId]);
    res.json({ upvoted: !exists, upvotes: cnt[0].c });
  } catch {
    res.status(500).send('Database error');
  } finally { client.release(); }
});


contentRouter.get('/:id/upvote', authRequired, async (req, res) => {
  const contentId = Number(req.params.id);
  if (!contentId) return res.status(400).send('Invalid content ID');
  try {
    const { rows } = await pool.query('SELECT EXISTS(SELECT 1 FROM upvotes WHERE user_id = $1 AND content_id = $2) as upvoted', [req.user.id, contentId]);
    res.json({ upvoted: rows[0].upvoted });
  } catch {
    res.status(500).send('Database error');
  }
});


contentRouter.post('/delete', async (req, res) => {
  const ids = (req.body && req.body.data) || [];
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).send('No content IDs provided');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let deleted = 0;
    for (const id of ids) {
      const { rows: ex } = await client.query('SELECT EXISTS(SELECT 1 FROM content WHERE id = $1) as e', [id]);
      if (!ex[0].e) continue;


      await client.query('DELETE FROM upvotes WHERE content_id = $1', [id]);
      await client.query('DELETE FROM content_tags WHERE content_id = $1', [id]);
      await client.query('DELETE FROM content_files WHERE content_id = $1', [id]);
      await client.query('DELETE FROM collection_content WHERE content_id = $1', [id]);


      const r = await client.query('DELETE FROM content WHERE id = $1', [id]);
      if (r.rowCount > 0) deleted++;
    }
    await client.query('COMMIT');
    res.json({ message: 'Content deletion completed', deletedCount: deleted, requested: ids.length });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).send('Error finalizing deletion');
  } finally { client.release(); }
});