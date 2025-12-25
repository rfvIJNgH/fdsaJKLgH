import { Router } from 'express';
import { pool } from '../lib/db.js';

export const contactRouter = Router();

// Submit a contact message (public - no auth required)
contactRouter.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required: name, email, subject, message' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const { rows: [contactMessage] } = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message, status)
       VALUES ($1, $2, $3, $4, 'unread')
       RETURNING id, name, email, subject, message, status, created_at`,
      [name, email, subject, message]
    );

    res.status(201).json({
      message: 'Your message has been sent successfully. We will get back to you soon!',
      contact: contactMessage
    });
  } catch (error) {
    console.error('Error submitting contact message:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// Get all contact messages (for admin - no auth for admin panel)
contactRouter.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, email, subject, message, status, created_at, updated_at
      FROM contact_messages
    `;

    const params = [];
    if (status && status !== 'all') {
      params.push(status);
      query += ` WHERE status = $${params.length}`;
    }

    query += `
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const { rows: messages } = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM contact_messages';
    const countParams = [];
    if (status && status !== 'all') {
      countParams.push(status);
      countQuery += ` WHERE status = $1`;
    }
    const { rows: [{ count }] } = await pool.query(countQuery, countParams);

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get a single contact message by ID (for admin)
contactRouter.get('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const { rows: [message] } = await pool.query(
      `SELECT id, name, email, subject, message, status, created_at, updated_at
       FROM contact_messages
       WHERE id = $1`,
      [messageId]
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message });
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Update contact message status (for admin)
contactRouter.patch('/:messageId/status', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!['unread', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: unread, read, replied, or archived' });
    }

    const { rows: [message] } = await pool.query(
      `UPDATE contact_messages 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [status, messageId]
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Status updated', contact: message });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete a contact message (for admin)
contactRouter.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const { rowCount } = await pool.query(
      'DELETE FROM contact_messages WHERE id = $1',
      [messageId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});
