import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { pool } from '../lib/db.js';
import { signJwt, authRequired } from '../middleware/auth.js';
import { getUploadsDir } from '../lib/uploads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const authRouter = Router();

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

authRouter.post('/signup', upload.single('profileImage'), async (req, res) => {
  const { username, email, password } = req.body || {};
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email and password are required' });
  }

  const client = await pool.connect();
  
  try {
    // Check if username or email already exists
    const { rows: [{ count }] } = await client.query(
      'SELECT COUNT(*)::int as count FROM users WHERE username = $1 OR email = $2', 
      [username, email]
    );
    
    if (count > 0) {
      // Delete uploaded file if it exists
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }
      return res.status(409).json({ message: 'Username or email already in use' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);
    
    // Determine profile image URL
    let profileImage;
    if (req.file) {
      // Use uploaded image
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.BASE_URL || 'https://arouzy-production.up.railway.app'
        : `http://localhost:${process.env.PORT || 8080}`;
      profileImage = `${baseUrl}/uploads/profiles/${req.file.filename}`;
    } else {
      // Use default generated avatar
      profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=200&background=6366f1&color=ffffff`;
    }
    
    // Create user in database
    const { rows: [{ id }] } = await client.query(
      'INSERT INTO users (username, email, password_hash, profile_image) VALUES ($1, $2, $3, $4) RETURNING id', 
      [username, email, hash, profileImage]
    );
    
    const user = { id, username, email, profile_image: profileImage };
    const token = signJwt(user);
    
    res.status(201).json({ token, user });
  
  } catch (error) {
    console.error('Signup error:', error);
    
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
    
    res.status(500).json({ message: 'Error creating user' });
  
  } finally {
    client.release();
  }
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      'SELECT id, username, email, password_hash, profile_image FROM users WHERE email = $1', 
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const row = rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = { 
      id: row.id, 
      username: row.username, 
      email: row.email,
      profile_image: row.profile_image 
    };
    const token = signJwt(user);
    
    res.json({ token, user });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: 'Error logging in' });
  } finally {
    client.release();
  }
});

authRouter.get('/user', authRequired, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      'SELECT id, username, email, profile_image FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = rows[0];
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  } finally {
    client.release();
  }
});