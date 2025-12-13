import { Router } from "express";
import { pool } from '../lib/db.js';
import { authRequired } from "../middleware/auth.js";

export const messageRouter = Router();

// Send message
messageRouter.post('/', authRequired, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiver_id, text, image_url, video_url, created_at } = req.body;

    const newMessage = await pool.query(
      `
      INSERT INTO messages (sender_id, receiver_id, text, image_url, video_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [senderId, receiver_id, text || null, image_url || null, video_url || null, created_at || new Date()]
    );

    res.status(201).json(newMessage.rows[0]);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});


// Fetch all users except logged-in user
messageRouter.get('/users', authRequired, async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    const filteredUsers = await pool.query(
      `
      SELECT DISTINCT u.id, u.username, u.profile_image, u.email
      FROM messages m
      JOIN users u 
        ON u.id = m.receiver_id OR u.id = m.sender_id
      WHERE u.id != $1 AND (m.sender_id = $1 OR m.receiver_id = $1)
      `,
      [loggedInUserId]
    );

    res.status(200).json(filteredUsers.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch messages between logged-in user and another user
messageRouter.get('/:userId', authRequired, async (req, res) => {
    try {
        const receiverId = parseInt(req.params.userId, 10);
        const senderId = req.user.id;

        const message = await pool.query(`
            SELECT * FROM messages
            WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `, [senderId, receiverId]
        );
        res.status(200).json(message.rows)
    } catch (error) {
        console.log('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send a message to another user
messageRouter.post('/send/:userId', authRequired, async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id;

        let imageUrl;
        if (image) {
            // Upload base64 image to cloud storage and get URL
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;       
        }

        const newMessage = await pool.query(`
            INSERT INTO messages (sender_id, receiver_id, text, image_url)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [senderId, receiverId, text, imageUrl || null]);

        //todo : realtime functinality goes here => socket.io or pusher

        res.status(201).json(newMessage.rows[0]);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }   
});
