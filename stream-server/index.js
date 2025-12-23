import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { streamRouter } from "./routes/streams.js";

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://arouzyfr.onrender.com'
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
      'https://arouzyfr.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8081;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/streams", streamRouter);

/* ===========================
   SOCKET.IO
=========================== */

const rooms = new Map();

io.on("connection", (socket) => {
//   socket.emit("me", socket.id);

  socket.on("joinRoom", ({ roomId, name, isStreamer }) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: new Map(), streamer: null });
    }

    const room = rooms.get(roomId);
    room.users.set(socket.id, { name, socket, isStreamer });

    // Set streamer if this user is the streamer
    if (isStreamer) {
      room.streamer = socket.id;
    }

    // For one-way streaming:
    // - If joining as viewer, get the streamer info
    // - If joining as streamer, get list of viewers
    if (isStreamer) {
      // Streamer joins - notify all viewers
      const viewers = Array.from(room.users.entries())
        .filter(([id, user]) => id !== socket.id && !user.isStreamer)
        .map(([id, user]) => ({ id, name: user.name, isStreamer: false }));

      socket.emit("peers-in-room", { peers: viewers });
      
      // Notify viewers that streamer is here
      socket.to(roomId).emit("peer-joined", {
        peerId: socket.id,
        name: name || "Streamer",
        isStreamer: true,
      });
    } else {
      // Viewer joins - only connect to streamer
      if (room.streamer) {
        const streamerUser = room.users.get(room.streamer);
        socket.emit("peers-in-room", { 
          peers: [{ id: room.streamer, name: streamerUser?.name || "Streamer", isStreamer: true }] 
        });
        
        // Notify streamer about new viewer (optional, for viewer count)
        io.to(room.streamer).emit("peer-joined", {
          peerId: socket.id,
          name: name || "Viewer",
          isStreamer: false,
        });
      }
    }
  });

  socket.on("leaveRoom", ({ roomId }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      const user = room.users.get(socket.id);
      
      // If streamer is leaving, clear streamer reference
      if (room.streamer === socket.id) {
        room.streamer = null;
      }
      
      room.users.delete(socket.id);

      if (room.users.size === 0) {
        rooms.delete(roomId);
      } else {
        socket.to(roomId).emit("peer-left", { 
          peerId: socket.id,
          isStreamer: user?.isStreamer || false,
        });
      }
    }

    socket.leave(roomId);
  });

  socket.on("signal", ({ targetId, data }) => {
    io.to(targetId).emit("signal", { from: socket.id, data });
  });

  // Chat message handling
  socket.on("sendMessage", ({ roomId, message }) => {
    console.log('📨 Received sendMessage:', { roomId, message, socketId: socket.id });
    
    // Broadcast message to everyone in the room (including sender)
    const fullMessage = {
      id: Date.now().toString() + Math.random(),
      user: message.user,
      text: message.text,
      timestamp: new Date(),
      isOwner: message.isOwner || false,
      isGift: message.isGift || false,
      giftType: message.giftType || null,
    };
    
    console.log('📤 Broadcasting message to room:', { roomId, fullMessage });
    io.to(roomId).emit("receiveMessage", fullMessage);
  });

  socket.on("disconnect", () => {
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        const user = room.users.get(socket.id);
        const wasStreamer = room.streamer === socket.id;
        
        // If streamer disconnects, clear streamer reference
        if (wasStreamer) {
          room.streamer = null;
        }
        
        room.users.delete(socket.id);
        socket.to(roomId).emit("peer-left", { 
          peerId: socket.id,
          isStreamer: wasStreamer,
        });

        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
