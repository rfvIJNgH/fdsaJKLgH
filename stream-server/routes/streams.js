import { Router } from "express";
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:123123@localhost:5432/postgres';
export const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});
pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});


export const streamRouter = Router();

/* ===========================
   CREATE STREAM
=========================== */
streamRouter.post("/", async (req, res) => {
  const { roomId, streamerName, title, streamType, price } = req.body || {};

  if (!roomId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    const { rowCount } = await client.query(
      `SELECT 1 FROM streams WHERE room_id = $1 AND is_active = true`,
      [roomId]
    );

    if (rowCount === 0) {
      await client.query(
        `
        INSERT INTO streams (
          room_id,
          streamer_name,
          title,
          stream_type,
          price,
          is_active,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, true, NOW())
        `,
        [roomId, streamerName, title, streamType, price]
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Create stream error:", error);
    res.status(500).json({ message: "Failed to create stream" });
  } finally {
    client.release();
  }
});

/* ===========================
   GET STREAM BY ROOM ID
=========================== */
streamRouter.get("/:roomId", async (req, res) => {
  const { roomId } = req.params;
  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `
      SELECT
        room_id,
        streamer_name,
        streamer_socket_id,
        created_at
      FROM streams
      WHERE room_id = $1 AND is_active = true
      `,
      [roomId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Stream not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get stream error:", error);
    res.status(500).json({ message: "Failed to fetch stream" });
  } finally {
    client.release();
  }
});

/* ===========================
   END STREAM
=========================== */
streamRouter.post("/:roomId/end", async (req, res) => {
  const { roomId } = req.params;
  const client = await pool.connect();

  try {
    await client.query(
      `
      UPDATE streams
      SET is_active = false,
          ended_at = NOW()
      WHERE room_id = $1
      `,
      [roomId]
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("End stream error:", error);
    res.status(500).json({ message: "Failed to end stream" });
  } finally {
    client.release();
  }
});

/* ===========================
   GET ALL ACTIVE STREAMS
=========================== */
streamRouter.get("/", async (req, res) => {
  const client = await pool.connect();
  
  // Get the rooms Map from the app (passed via app.set)
  const rooms = req.app.get('rooms');

  try {
    const { rows } = await client.query(`
      SELECT
        room_id AS id,
        streamer_name,
        title,
        stream_type,
        price,
        created_at
      FROM streams
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    // Add viewer count from in-memory rooms Map
    const streamsWithViewers = rows.map(stream => {
      const room = rooms?.get(stream.id);
      const viewerCount = room ? room.users.size : 0;
      return {
        ...stream,
        viewer_count: viewerCount
      };
    });

    res.json(streamsWithViewers);
  } catch (error) {
    console.error("Get streams error:", error);
    res.status(500).json({ message: "Failed to fetch streams" });
  } finally {
    client.release();
  }
});