import { Router } from "express";
import { pool } from '../lib/db.js';

export const coinRouter = Router();

// GET /coins/:userId -> return coin data for a single user
coinRouter.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Query from the coins table
    const result = await pool.query(
      `SELECT user_id AS "userId", coins
       FROM coins 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
       return res.json({ success: true, data: { userId, coins: 0 } });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching coins:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /coins/:userId/add -> add coins
coinRouter.post("/:userId/add", async (req, res) => {
  const { userId } = req.params;
  const { coins } = req.body; // coins to add

  if (!coins || coins <= 0) {
    return res.status(400).json({ success: false, message: "Invalid coin amount" });
  }

  try {
    // Check if user has a coin row
    const result = await pool.query(
      "SELECT * FROM coins WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      // Insert new row
      await pool.query(
        "INSERT INTO coins (user_id, coins) VALUES ($1, $2)",
        [userId, coins]
      );
    } else {
      // Update existing row
      await pool.query(
        "UPDATE coins SET coins = coins + $1 WHERE user_id = $2",
        [coins, userId]
      );
    }

    const updated = await pool.query(
      "SELECT user_id AS \"userId\", coins FROM coins WHERE user_id = $1",
      [userId]
    );

    res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    console.error("Error adding coins:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /coins/:userId/deduct -> deduct coins
coinRouter.post("/:userId/deduct", async (req, res) => {
  const { userId } = req.params;
  const { coins } = req.body; // coins to deduct

  if (!coins || coins <= 0) {
    return res.status(400).json({ success: false, message: "Invalid coin amount" });
  }

  try {
    // Check if user has enough coins
    const result = await pool.query(
      "SELECT * FROM coins WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentCoins = result.rows[0].coins;
    if (currentCoins < coins) {
      return res.status(400).json({ success: false, message: "Insufficient coins" });
    }

    // Deduct coins
    await pool.query(
      "UPDATE coins SET coins = coins - $1 WHERE user_id = $2",
      [coins, userId]
    );

    const updated = await pool.query(
      "SELECT user_id AS \"userId\", coins FROM coins WHERE user_id = $1",
      [userId]
    );

    res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    console.error("Error deducting coins:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
