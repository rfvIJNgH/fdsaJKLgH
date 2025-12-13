import { Router } from 'express';
import { pool } from '../lib/db.js';

export const tagsRouter = Router();

tagsRouter.get('', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM tags ORDER BY name ASC');
    res.json({ tags: rows });
  } catch { res.status(500).send('Database error'); }
});


