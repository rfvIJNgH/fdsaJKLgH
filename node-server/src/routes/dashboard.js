import { Router } from 'express';
import { pool } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { authRequired } from '../middleware/auth.js';
import { getUploadsDir } from '../lib/uploads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dashboardRouter = Router();

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = getUploadsDir();
    const profilesDir = path.join(uploadsDir, 'profiles');
   
    try {
      await fs.mkdir(profilesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating profiles directory:', error);
    }
   
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
   
    // Check for supported formats
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedFormats.includes(file.mimetype)) {
      return cb(new Error('Supported formats: JPEG, PNG, WebP'));
    }
   
    cb(null, true);
  }
});

// profile
dashboardRouter.get('/profile', authRequired, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: stats } = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as follower_count,
        (SELECT COUNT(*) FROM upvotes WHERE user_id = $1) as upvotes_given
    `, [req.user.id]);
    res.json({ id: req.user.id, username: req.user.username, email: req.user.email, created_at: null, updated_at: null, followerCount: Number(stats[0].follower_count), upvotesGiven: Number(stats[0].upvotes_given) });
  } catch { res.status(500).send('Error fetching user profile'); } finally { client.release(); }
});

dashboardRouter.put('/profile', authRequired, upload.single('profileImage'), async (req, res) => {
  const { username, email, password } = req.body || {};
  const client = await pool.connect();
  
  try {
    const updates = [];
    const args = [];
    let i = 1;
    
    if (username) {
      const { rows: c } = await client.query('SELECT COUNT(*)::int as c FROM users WHERE username = $1 AND id != $2', [username, req.user.id]);
      if (c[0].c > 0) {
        // Delete uploaded file if it exists
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (error) {
            console.error('Error deleting file:', error);
          }
        }
        return res.status(409).json({ message: 'Username already taken' });
      }
      updates.push(`username = $${i++}`); 
      args.push(username);
    }
    
    if (email) {
      const { rows: c } = await client.query('SELECT COUNT(*)::int as c FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
      if (c[0].c > 0) {
        // Delete uploaded file if it exists
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (error) {
            console.error('Error deleting file:', error);
          }
        }
        return res.status(409).json({ message: 'Email already registered' });
      }
      updates.push(`email = $${i++}`); 
      args.push(email);
    }
    
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${i++}`); 
      args.push(hash);
    }
    
    // Handle profile image upload
    if (req.file) {
      const baseUrl = process.env.NODE_ENV === 'production'
        ? process.env.BASE_URL || 'https://arouzy-production.up.railway.app'
        : `http://localhost:${process.env.PORT || 8080}`;
      const profileImageUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;
      
      updates.push(`profile_image = $${i++}`);
      args.push(profileImageUrl);
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, username, email, profile_image`;
      args.push(req.user.id);
      
      const { rows } = await client.query(sql, args);
      const updatedUser = rows[0];
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        profile_image: updatedUser.profile_image
      });
    } else {
      res.json({ 
        id: req.user.id, 
        username: req.user.username, 
        email: req.user.email 
      });
    }
    
  } catch (error) {
    console.error('Profile update error:', error);
    
    // Delete uploaded file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (deleteError) {
        console.error('Error deleting file:', deleteError);
      }
    }
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image size should be less than 5MB' });
      }
      return res.status(400).json({ message: error.message });
    }
    
    if (error.message && error.message.includes('Only image files')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Error updating profile' });
    
  } finally { 
    client.release(); 
  }
});

dashboardRouter.get('/dashboard', authRequired, async (req, res) => {
  const client = await pool.connect();
  try {
    const contentRows = await client.query(`
      SELECT c.id, c.title, c.description, c.image_count, c.video_count, c.thumbnail_url, c.created_at,
             (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) as upvotes
      FROM content c WHERE c.user_id = $1 ORDER BY c.created_at DESC LIMIT 20
    `, [req.user.id]);
    const content = [];
    for (const r of contentRows.rows) {
      const { rows: imgRows } = await client.query('SELECT id, image_url, image_order FROM content_images WHERE content_id = $1 ORDER BY image_order ASC, id ASC LIMIT 4', [r.id]);
      content.push({ id: r.id, title: r.title, description: r.description || undefined, imageCount: r.image_count, videoCount: r.video_count, thumbnail: r.thumbnail_url, createdAt: r.created_at.toISOString(), upvotes: Number(r.upvotes), user: { id: req.user.id, username: req.user.username, email: req.user.email }, images: imgRows.map(i => ({ id: i.id, imageUrl: i.image_url, imageOrder: i.image_order })) });
    }

    const colRows = await client.query(`
      SELECT c.id, c.user_id, c.name, c.description, c.is_public, c.created_at, c.updated_at, COUNT(cc.content_id) as content_count
      FROM collections c LEFT JOIN collection_content cc ON c.id = cc.collection_id
      WHERE c.user_id = $1 GROUP BY c.id ORDER BY c.updated_at DESC
    `, [req.user.id]);
    const collections = colRows.rows.map(r => ({ id: r.id, userId: r.user_id, name: r.name, description: r.description || undefined, isPublic: r.is_public, createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString(), contentCount: Number(r.content_count) }));

    const { rows: s } = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM content WHERE user_id = $1) as content_count,
        (SELECT COUNT(*) FROM collections WHERE user_id = $1) as collection_count,
        (SELECT COUNT(*) FROM upvotes u JOIN content c ON u.content_id = c.id WHERE c.user_id = $1) as total_upvotes,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as follower_count
    `, [req.user.id]);
    const stats = { contentCount: Number(s[0].content_count), collectionCount: Number(s[0].collection_count), totalUpvotes: Number(s[0].total_upvotes), followerCount: Number(s[0].follower_count) };

    res.json({ user: { id: req.user.id, username: req.user.username, email: req.user.email }, content, collections, stats });
  } catch { res.status(500).send('Error fetching dashboard'); } finally { client.release(); }
});