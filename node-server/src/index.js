import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool } from './lib/db.js';
import { ensureUploadsDir, getUploadsDir } from './lib/uploads.js';
import { authRouter } from './routes/auth.js';
import { contentRouter } from './routes/content.js';
import { userRouter } from './routes/user.js';
import { searchRouter } from './routes/search.js';
import { uploadRouter } from './routes/upload.js';
import { tradingRouter } from './routes/trading.js';
import { collectionsRouter } from './routes/collections.js';
import { notificationsRouter } from './routes/notifications.js';
import { dashboardRouter } from './routes/dashboard.js';
import { tagsRouter } from './routes/tags.js';
import { messageRouter } from './routes/message.js';
import { coinRouter} from './routes/coin.js';
import { purchaseRouter } from './routes/purchase.js';
import { subscriptionRouter } from './routes/subscription.js';
import { vipRouter } from './routes/vip.js';
import { createServer } from 'http';
import { Server } from 'socket.io';


dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const server = createServer(app);


app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://arouzy-production.up.railway.app',
    'https://arouzy.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      'https://arouzy-production.up.railway.app',
      'https://arouzy.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});


app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Database pool already created in lib/db


// Ensure uploads dir and static files
await ensureUploadsDir();
const uploadsDir = getUploadsDir();
app.use('/uploads', express.static(uploadsDir));


// Health
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), services: { database: 'ok' } });
  } catch (e) {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), services: { database: 'error' } });
  }
});


// Routers
app.use('/api/auth', authRouter);
app.use('/api/content', contentRouter);
app.use('/api/content', purchaseRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/search', searchRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/user', dashboardRouter);
app.use('/api/users', userRouter);
app.use('/api/trading', tradingRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/messages', messageRouter);
app.use('/api/coins', coinRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/vip', vipRouter);


// Track connected users
let userSockets = new Map();


// Helper function to save message to database
async function saveMessageToDatabase(messageData) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, text, image_url, video_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, sender_id, receiver_id, text, image_url, video_url, created_at, updated_at`,
      [
        messageData.sender_id,
        messageData.receiver_id,
        messageData.text || null,
        messageData.image_url || null,
        messageData.video_url || null
      ]
    );
    return rows[0];
  } catch (error) {
    console.error('Error saving message to database:', error);
    throw error;
  }
}


// Helper function to get user info
async function getUserInfo(userId) {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, profile_image FROM users WHERE id = $1',
      [userId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}


// Socket Connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
 
  socket.on('join', (userId) => {
    userSockets.set(userId.toString(), socket.id);
    console.log(`User ${userId} joined the chat`);
  });


  // Create private chat
  socket.on('create_private_chat', async (data) => {
    const { targetUserId, currentUserId } = data;


    try {
      const currentUser = await getUserInfo(currentUserId);
      const targetUser = await getUserInfo(targetUserId);


      if (currentUser && targetUser) {
        const chatId = [currentUserId.toString(), targetUserId.toString()].sort().join('-');
       
        const newChat = {
          id: chatId,
          participants: [
            { id: currentUserId, username: currentUser.username, profile_image: currentUser.profile_image },
            { id: targetUserId, username: targetUser.username, profile_image: targetUser.profile_image }
          ],
          messages: [],
          unreadCount: 0,
          lastActivity: new Date().toISOString()
        };


        const currentSocketId = userSockets.get(currentUserId.toString());
        const targetSocketId = userSockets.get(targetUserId.toString());


        // Send chat creation to both participants
        if (currentSocketId) io.to(currentSocketId).emit('private_chat_created', newChat);
        if (targetSocketId) io.to(targetSocketId).emit('private_chat_created', newChat);
       
        console.log("ChatID created:", chatId);
      }
    } catch (error) {
      console.error('Error creating private chat:', error);
    }
  });


  // Private messages
  socket.on('send_private_message', async (data) => {
    const { text, image_url, video_url, chatId, currentUserId, receiverId } = data;
   
    try {
      const currentUser = await getUserInfo(currentUserId);
     
      if (!currentUser) {
        console.error('User not found:', currentUserId);
        return;
      }


      // Save message to database first
      const savedMessage = await saveMessageToDatabase({
        sender_id: currentUserId,
        receiver_id: receiverId,
        text: text || null,
        image_url: image_url || null,
        video_url: video_url || null
      });


      // Create formatted message for real-time delivery
      const realtimeMessage = {
        id: savedMessage.id,
        sender_id: savedMessage.sender_id,
        receiver_id: savedMessage.receiver_id,
        text: savedMessage.text,
        image_url: savedMessage.image_url,
        video_url: savedMessage.video_url,
        created_at: savedMessage.created_at,
        updated_at: savedMessage.updated_at,
        sender: {
          username: currentUser.username,
          profile_image: currentUser.profile_image
        }
      };


      // Send to both participants
      const currentSocketId = userSockets.get(currentUserId.toString());
      const receiverSocketId = userSockets.get(receiverId.toString());


      if (currentSocketId) {
        io.to(currentSocketId).emit('private_message', {
          message: realtimeMessage,
          chatId
        });
      }
     
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('private_message', {
          message: realtimeMessage,
          chatId
        });
      }


      console.log('Message sent and saved:', savedMessage.id);


    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });


  socket.on('disconnect', () => {
    for (const [userId, sockId] of userSockets.entries()) {
      if (sockId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected and removed from map`);
        break;
      }
    }
  });
});


const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Node server running on port ${port}`);
});