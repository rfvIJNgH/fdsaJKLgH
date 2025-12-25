import { pool } from '../lib/db.js';

async function init() {
  const client = await pool.connect();
  try {
    console.log('Initializing database schema...');
    await client.query('BEGIN');

    // users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_image VARCHAR(500),
        is_vip BOOLEAN DEFAULT FALSE,
        vip_start TIMESTAMP WITH TIME ZONE,
        vip_expiration TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // content
    await client.query(`
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_count INTEGER DEFAULT 0,
        video_count INTEGER DEFAULT 0,
        content_type VARCHAR(50) NOT NULL,
        content_price INTEGER,
        thumbnail_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // purchases
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
        coins_paid INTEGER NOT NULL,
        purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (buyer_id, content_id) -- prevent duplicate purchases
      );
    `)

    //subscriptions
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        subscriber_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        coins_paid INTEGER NOT NULL,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE, -- nullable if lifetime
        UNIQUE (subscriber_id, creator_id) -- one active sub per creator
      );
    `)

    // tags
    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      );
    `);

    // content_tags
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_tags (
        content_id INTEGER REFERENCES content(id),
        tag_id INTEGER REFERENCES tags(id),
        PRIMARY KEY (content_id, tag_id)
      );
    `);

    // content_images + indexes
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_files (
        id SERIAL PRIMARY KEY,
        content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
        file_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_content_files_content_id ON content_files(content_id);
    `);

    // upvotes
    await client.query(`
      CREATE TABLE IF NOT EXISTS upvotes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        content_id INTEGER REFERENCES content(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, content_id)
      );
    `);

    // follows
    await client.query(`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id INTEGER REFERENCES users(id),
        following_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id)
      );
    `);

    // trading_content
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_content (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_traded BOOLEAN DEFAULT FALSE
      );
    `);

    // trade_requests
    await client.query(`
      CREATE TABLE IF NOT EXISTS trade_requests (
        id SERIAL PRIMARY KEY,
        from_user_id INTEGER REFERENCES users(id),
        to_user_id INTEGER REFERENCES users(id),
        trading_content_id INTEGER REFERENCES trading_content(id),
        offered_content_id INTEGER REFERENCES trading_content(id),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // collections & collection_content
    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS collection_content (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
        content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(collection_id, content_id)
      );
    `);

    // notifications + indexes
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    `);

    //Messages table schema
    await client.query(
      `CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                image_url VARCHAR(500),
                video_url VARCHAR(500),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );`
    );

    //Coin table schema
    await client.query(
      `CREATE TABLE IF NOT EXISTS coins (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        coins INTEGER
      );`
    )

    //streaminfo table schema
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS streams (
        id SERIAL PRIMARY KEY,
        room_id TEXT UNIQUE NOT NULL,
        streamer_name TEXT,
        title TEXT,
        stream_type TEXT,
        price INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP
      );
      `
    )

    // reports table schema
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reported_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      `
    )

    // report_images table schema
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS report_images (
        id SERIAL PRIMARY KEY,
        report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      `
    )

    // contact_messages table schema
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      `
    )

    // transactions table schema for deposits/withdrawals
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
        amount DECIMAL(18, 8) NOT NULL,
        wallet_address VARCHAR(255) NOT NULL,
        transaction_hash VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      `
    )

    // Create indexes for transactions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash) WHERE transaction_hash IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    `);

    // reviews table schema
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
        rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
        review_text TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, content_id)
      );
      `
    )

    // trading_reviews table schema
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS trading_reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        trading_content_id INTEGER REFERENCES trading_content(id) ON DELETE CASCADE,
        rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
        review_text TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, trading_content_id)
      );
      `
    )

    // payment_transactions table schema (NOWPayments integration)
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        payment_id VARCHAR(255) UNIQUE NOT NULL,
        order_id VARCHAR(255) NOT NULL,
        coins_amount INTEGER NOT NULL,
        price_amount DECIMAL(10, 2) NOT NULL,
        price_currency VARCHAR(10) NOT NULL DEFAULT 'usd',
        pay_currency VARCHAR(10) NOT NULL,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'waiting',
        payment_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      `
    )

    // Create indexes for payment_transactions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
    `);

    await client.query('COMMIT');
    console.log('Database schema initialized.');
  } catch (e) {
    console.error('Schema initialization failed:', e);
    try { await client.query('ROLLBACK'); } catch { }
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

init();


