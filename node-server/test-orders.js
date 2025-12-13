import { pool } from './src/lib/db.js';

async function createTestOrders() {
  const client = await pool.connect();
  try {
    console.log('Creating test orders...');
    await client.query('BEGIN');

    // First, let's check if we have users
    const { rows: users } = await client.query('SELECT id, username FROM users LIMIT 2');
    
    if (users.length < 2) {
      console.log('Need at least 2 users to create test orders');
      return;
    }

    const [user1, user2] = users;
    console.log(`Using users: ${user1.username} and ${user2.username}`);

    // Create test orders
    const testOrders = [
      {
        order_title: 'Productivity-boosting Chrome Extension Development',
        provider_id: user1.id,
        client_id: user2.id,
        awarded_price: 100.00,
        deadline: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        status: 'pending',
        description: 'Create a Chrome extension to boost productivity',
        requirements: 'Must work on Chrome 90+, include productivity features'
      },
      {
        order_title: 'Productivity-boosting Chrome Extension Development',
        provider_id: user1.id,
        client_id: user2.id,
        awarded_price: 100.00,
        deadline: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        status: 'closed',
        description: 'Create a Chrome extension to boost productivity',
        requirements: 'Must work on Chrome 90+, include productivity features'
      },
      {
        order_title: 'Productivity-boosting Chrome Extension Development',
        provider_id: user1.id,
        client_id: user2.id,
        awarded_price: 100.00,
        deadline: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        status: 'approved',
        description: 'Create a Chrome extension to boost productivity',
        requirements: 'Must work on Chrome 90+, include productivity features'
      },
      {
        order_title: 'E-commerce Website Design',
        provider_id: user2.id,
        client_id: user1.id,
        awarded_price: 500.00,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'in_progress',
        description: 'Design and develop a modern e-commerce website',
        requirements: 'Responsive design, payment integration, admin panel'
      },
      {
        order_title: 'Mobile App UI/UX Design',
        provider_id: user1.id,
        client_id: user2.id,
        awarded_price: 300.00,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'pending',
        description: 'Design user interface for a fitness tracking app',
        requirements: 'Modern design, intuitive navigation, accessibility features'
      }
    ];

    for (const order of testOrders) {
      const { rows } = await client.query(`
        INSERT INTO orders (order_title, provider_id, client_id, awarded_price, deadline, status, description, requirements)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [order.order_title, order.provider_id, order.client_id, order.awarded_price, order.deadline, order.status, order.description, order.requirements]);
      
      console.log(`Created order: ${order.order_title} with ID: ${rows[0].id}`);
    }

    await client.query('COMMIT');
    console.log('Test orders created successfully!');
  } catch (error) {
    console.error('Error creating test orders:', error);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
}

createTestOrders();
