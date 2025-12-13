import { Router } from 'express';
import { pool } from '../lib/db.js';

export const searchRouter = Router();

searchRouter.get('/content', async (req, res) => {
  const q = String((req.query.q || '')).trim();
  if (!q) return res.status(400).send('Search query is required');
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const exact = q;
  const partial = `%${q}%`;
  const searchPattern = `%${q}%`;

  const sql = `
    SELECT DISTINCT c.id, c.title, c.description, c.image_count, c.video_count, c.thumbnail_url, c.created_at,
      (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) AS upvotes,
      u.id as user_id, u.username as user_username,
      CASE 
        WHEN c.title ILIKE $1 THEN 100
        WHEN c.title ILIKE $2 THEN 80
        WHEN c.description ILIKE $1 THEN 60
        WHEN c.description ILIKE $2 THEN 40
        WHEN u.username ILIKE $1 THEN 30
        WHEN u.username ILIKE $2 THEN 20
        ELSE 10
      END as relevance_score
    FROM content c JOIN users u ON c.user_id = u.id
    WHERE (
      c.title ILIKE $3 OR c.description ILIKE $3 OR u.username ILIKE $3 OR
      c.id IN (
        SELECT DISTINCT ct.content_id FROM content_tags ct JOIN tags t ON ct.tag_id = t.id WHERE t.name ILIKE $3
      )
    )
    ORDER BY relevance_score DESC, (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) DESC, c.created_at DESC
    LIMIT ${limit} OFFSET ${offset}`;

  try {
    const client = await pool.connect();
    const { rows } = await client.query(sql, [exact, partial, searchPattern]);
    const items = [];
    for (const r of rows) {
      const { rows: tagRows } = await client.query('SELECT t.id, t.name FROM tags t JOIN content_tags ct ON t.id = ct.tag_id WHERE ct.content_id = $1 ORDER BY t.name ASC', [r.id]);
      const { rows: imgRows } = await client.query('SELECT id, image_url, image_order FROM content_images WHERE content_id = $1 ORDER BY image_order ASC, id ASC LIMIT 4', [r.id]);
      items.push({
        id: r.id, title: r.title, description: r.description || undefined,
        imageCount: r.image_count, videoCount: r.video_count, thumbnail: r.thumbnail_url,
        createdAt: r.created_at.toISOString(), upvotes: Number(r.upvotes),
        user: { id: r.user_id, username: r.user_username },
        tags: tagRows.map(t => ({ id: t.id, name: t.name })),
        images: imgRows.map(i => ({ id: i.id, imageUrl: i.image_url, imageOrder: i.image_order }))
      });
    }
    const { rows: cnt } = await client.query(`
      SELECT COUNT(DISTINCT c.id) AS count FROM content c JOIN users u ON c.user_id = u.id WHERE (
        c.title ILIKE $1 OR c.description ILIKE $1 OR u.username ILIKE $1 OR c.id IN (
          SELECT DISTINCT ct.content_id FROM content_tags ct JOIN tags t ON ct.tag_id = t.id WHERE t.name ILIKE $1
        )
      )
    `, [searchPattern]);
    const totalItems = Number(cnt[0].count);
    const totalPages = Math.floor((totalItems + limit - 1) / limit);
    res.json({ content: items, pagination: { currentPage: page, totalPages, totalItems, itemsPerPage: limit } });
    client.release();
  } catch (e) {
    res.status(500).send('Database error');
  }
});

searchRouter.get('/suggestions', async (req, res) => {
  const q = String((req.query.q || '')).trim();
  if (!q) return res.status(400).send('Search query is required');
  const limit = 10;
  const pattern = `%${q}%`;
  const sql = `
    SELECT DISTINCT c.id, c.title, c.description, c.image_count, c.video_count, c.thumbnail_url, c.created_at,
      (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) AS upvotes,
      u.id as user_id, u.username as user_username
    FROM content c JOIN users u ON c.user_id = u.id
    WHERE (
      c.title ILIKE $1 OR c.description ILIKE $1 OR u.username ILIKE $1 OR c.id IN (
        SELECT DISTINCT ct.content_id FROM content_tags ct JOIN tags t ON ct.tag_id = t.id WHERE t.name ILIKE $1
      )
    )
    ORDER BY (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) DESC, c.created_at DESC
    LIMIT $2`;
  try {
    const client = await pool.connect();
    const { rows } = await client.query(sql, [pattern, limit]);
    const items = [];
    for (const r of rows) {
      const { rows: tagRows } = await client.query('SELECT t.id, t.name FROM tags t JOIN content_tags ct ON t.id = ct.tag_id WHERE ct.content_id = $1 ORDER BY t.name ASC', [r.id]);
      items.push({
        id: r.id, title: r.title, description: r.description || undefined,
        imageCount: r.image_count, videoCount: r.video_count, thumbnail: r.thumbnail_url,
        createdAt: r.created_at.toISOString(), upvotes: Number(r.upvotes),
        user: { id: r.user_id, username: r.user_username },
        tags: tagRows.map(t => ({ id: t.id, name: t.name }))
      });
    }
    res.json({ content: items });
    client.release();
  } catch { res.status(500).send('Database error'); }
});


