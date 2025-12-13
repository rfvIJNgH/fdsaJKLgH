import { pool } from './db.js';

export async function createNotification(userId, type, title, message, data) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
  } catch (e) {
    console.error('Failed to create notification', e);
  }
}

export async function createFollowNotification(toUserId, fromUsername) {
  await createNotification(
    toUserId,
    'follow',
    'New Follower',
    `@${fromUsername} started following you`,
    { fromUsername }
  );
}

export async function createUpvoteNotification(toUserId, upvoterUsername, contentId) {
  await createNotification(
    toUserId,
    'upvote',
    'New Upvote',
    `${upvoterUsername} upvoted your content`,
    { contentId, upvoter: upvoterUsername }
  );
}

export async function createTradeRequestNotification(toUserId, fromUsername, tradingContentTitle) {
  await createNotification(
    toUserId,
    'trade_request',
    'Trade Request',
    `@${fromUsername} sent you a trade request for '${tradingContentTitle}'`,
    { fromUsername, contentTitle: tradingContentTitle }
  );
}


