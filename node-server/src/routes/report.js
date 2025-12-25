import { Router } from 'express';
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

export const reportRouter = Router();

// Create a new report
reportRouter.post('/', authRequired, async (req, res) => {
  const client = await pool.connect();
  try {
    const { reportedUserId, title, description, imageUrls } = req.body;
    const reporterId = req.user.id;

    if (!reportedUserId || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields: reportedUserId, title, description' });
    }

    await client.query('BEGIN');

    // Insert the report
    const { rows: [report] } = await client.query(
      `INSERT INTO reports (reporter_id, reported_user_id, title, description, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, reporter_id, reported_user_id, title, description, status, created_at`,
      [reporterId, reportedUserId, title, description]
    );

    // Insert report images if provided
    let images = [];
    if (imageUrls && imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        const { rows: [image] } = await client.query(
          `INSERT INTO report_images (report_id, image_url)
           VALUES ($1, $2)
           RETURNING id, image_url`,
          [report.id, imageUrl]
        );
        images.push(image);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Report submitted successfully',
      report: {
        ...report,
        images
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  } finally {
    client.release();
  }
});

// Get all reports (for admin - no auth required for admin panel)
reportRouter.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.status,
        r.created_at,
        r.updated_at,
        reporter.id as reporter_id,
        reporter.username as reporter_username,
        reported.id as reported_user_id,
        reported.username as reported_username,
        COALESCE(
          json_agg(
            json_build_object('id', ri.id, 'image_url', ri.image_url)
          ) FILTER (WHERE ri.id IS NOT NULL),
          '[]'
        ) as images
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN report_images ri ON r.id = ri.report_id
    `;

    const params = [];
    if (status) {
      params.push(status);
      query += ` WHERE r.status = $${params.length}`;
    }

    query += `
      GROUP BY r.id, reporter.id, reporter.username, reported.id, reported.username
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const { rows: reports } = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM reports';
    const countParams = [];
    if (status) {
      countParams.push(status);
      countQuery += ` WHERE status = $1`;
    }
    const { rows: [{ count }] } = await pool.query(countQuery, countParams);

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Update report status (for admin - no auth required for admin panel)
reportRouter.patch('/:reportId/status', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: pending, reviewed, resolved, or dismissed' });
    }

    const { rows: [report] } = await pool.query(
      `UPDATE reports 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [status, reportId]
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report status updated', report });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// Get a single report by ID (for admin - no auth required for admin panel)
reportRouter.get('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    const { rows: [report] } = await pool.query(
      `SELECT 
        r.id,
        r.title,
        r.description,
        r.status,
        r.created_at,
        r.updated_at,
        reporter.id as reporter_id,
        reporter.username as reporter_username,
        reported.id as reported_user_id,
        reported.username as reported_username,
        COALESCE(
          json_agg(
            json_build_object('id', ri.id, 'image_url', ri.image_url)
          ) FILTER (WHERE ri.id IS NOT NULL),
          '[]'
        ) as images
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN report_images ri ON r.id = ri.report_id
      WHERE r.id = $1
      GROUP BY r.id, reporter.id, reporter.username, reported.id, reported.username`,
      [reportId]
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Delete a report (for admin - no auth required for admin panel)
reportRouter.delete('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    const { rowCount } = await pool.query(
      'DELETE FROM reports WHERE id = $1',
      [reportId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});
