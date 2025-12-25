import { Router } from "express";
import axios from "axios";
import { pool } from '../lib/db.js';
import { authRequired } from '../middleware/auth.js';

export const paymentRouter = Router();

// NOWPayments API configuration
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_API_URL || 'https://api.nowpayments.io/v1';
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

// Check if API key is configured
if (!NOWPAYMENTS_API_KEY || NOWPAYMENTS_API_KEY === 'PUT_YOUR_API_KEY_HERE') {
  console.error('⚠️  WARNING: NOWPAYMENTS_API_KEY is not configured in .env file!');
  console.error('Please add your NOWPayments API key to the .env file.');
}

// Helper function to make NOWPayments API calls
const nowPaymentsApi = axios.create({
  baseURL: NOWPAYMENTS_API_URL,
  headers: {
    'x-api-key': NOWPAYMENTS_API_KEY,
    'Content-Type': 'application/json',
  },
});

// GET available currencies from NOWPayments
paymentRouter.get('/currencies', async (req, res) => {
  // Check if API key is configured
  if (!NOWPAYMENTS_API_KEY || NOWPAYMENTS_API_KEY === 'PUT_YOUR_API_KEY_HERE') {
    return res.status(500).json({ 
      success: false, 
      message: 'NOWPayments API key is not configured. Please add your API key to the .env file.',
      hint: 'Add NOWPAYMENTS_API_KEY to node-server/.env file'
    });
  }

  try {
    const response = await nowPaymentsApi.get('/currencies');
    res.json({ success: true, currencies: response.data.currencies });
  } catch (error) {
    console.error('Error fetching currencies:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch currencies',
      error: error.response?.data || error.message
    });
  }
});

// GET minimum payment amount for a specific currency
paymentRouter.get('/min-amount', async (req, res) => {
  const { currency_from, currency_to = 'usd' } = req.query;
  
  if (!currency_from) {
    return res.status(400).json({ 
      success: false, 
      message: 'currency_from is required' 
    });
  }

  try {
    const response = await nowPaymentsApi.get('/min-amount', {
      params: { currency_from, currency_to }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error fetching min amount:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch minimum amount',
      error: error.response?.data || error.message
    });
  }
});

// GET estimated price in cryptocurrency
paymentRouter.get('/estimate', async (req, res) => {
  const { amount, currency_from, currency_to = 'usd' } = req.query;
  
  if (!amount || !currency_from) {
    return res.status(400).json({ 
      success: false, 
      message: 'amount and currency_from are required' 
    });
  }

  try {
    const response = await nowPaymentsApi.get('/estimate', {
      params: { 
        amount, 
        currency_from,
        currency_to 
      }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error fetching estimate:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch estimate',
      error: error.response?.data || error.message
    });
  }
});

// POST create payment
paymentRouter.post('/create', authRequired, async (req, res) => {
  // Check if API key is configured
  if (!NOWPAYMENTS_API_KEY || NOWPAYMENTS_API_KEY === 'PUT_YOUR_API_KEY_HERE') {
    return res.status(500).json({ 
      success: false, 
      message: 'NOWPayments API key is not configured. Please add your API key to the .env file.',
      hint: 'Add NOWPAYMENTS_API_KEY to node-server/.env file'
    });
  }

  const { 
    price_amount, 
    price_currency = 'usd', 
    pay_currency,
    order_id,
    order_description,
    ipn_callback_url,
    success_url,
    cancel_url,
    coins_amount // The amount of coins user is purchasing
  } = req.body;

  const userId = req.user.id;

  if (!price_amount || !pay_currency || !coins_amount) {
    return res.status(400).json({ 
      success: false, 
      message: 'price_amount, pay_currency, and coins_amount are required' 
    });
  }

  try {
    // Create invoice with NOWPayments (for checkout page redirect)
    const invoiceData = {
      price_amount: parseFloat(price_amount),
      price_currency: price_currency.toLowerCase(),
      pay_currency: pay_currency.toLowerCase(),
      ipn_callback_url: ipn_callback_url || `${process.env.BACKEND_URL}/api/payment/callback`,
      order_id: order_id || `ORDER_${Date.now()}_${userId}`,
      order_description: order_description || `Purchase ${coins_amount} coins`,
      success_url: success_url || `${process.env.BACKEND_URL}/../coins/success`,
      cancel_url: cancel_url || `${process.env.BACKEND_URL}/../coins/purchase`,
    };

    console.log('Creating invoice with data:', invoiceData);

    const response = await nowPaymentsApi.post('/invoice', invoiceData);
    const paymentInfo = response.data;
    
    console.log('Invoice created successfully:', paymentInfo);
    console.log('Invoice ID:', paymentInfo.id);
    console.log('Invoice URL:', paymentInfo.invoice_url);

    // Store payment info in database
    const dbResult = await pool.query(
      `INSERT INTO payment_transactions 
       (user_id, payment_id, order_id, coins_amount, price_amount, price_currency, pay_currency, payment_status, payment_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        userId,
        paymentInfo.id, // Invoice ID
        invoiceData.order_id,
        coins_amount,
        price_amount,
        price_currency,
        pay_currency,
        'waiting',
        paymentInfo.invoice_url
      ]
    );
    
    console.log('Payment saved to database:', dbResult.rows[0]);

    res.json({ 
      success: true, 
      payment: {
        payment_id: paymentInfo.id,
        invoice_url: paymentInfo.invoice_url,
        order_id: invoiceData.order_id,
        payment_status: 'waiting'
      },
      message: 'Invoice created successfully'
    });
  } catch (error) {
    console.error('Error creating payment:', error.response?.data || error.message);
    
    // Check if invoice API is not enabled
    if (error.response?.status === 403 || error.response?.data?.message?.includes('invoice')) {
      return res.status(500).json({ 
        success: false, 
        message: 'Invoice API not enabled. Please enable it in NOWPayments dashboard: Settings > API',
        error: error.response?.data || error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment',
      error: error.response?.data || error.message
    });
  }
});

// GET payment status
paymentRouter.get('/status/:paymentId', authRequired, async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;

  try {
    // Get payment status from NOWPayments
    let paymentStatus;
    try {
      // Use payment endpoint (sandbox doesn't support invoice endpoint)
      const response = await nowPaymentsApi.get(`/payment/${paymentId}`);
      paymentStatus = response.data;
      console.log('Payment status from NOWPayments:', paymentStatus);
    } catch (paymentError) {
      console.error('Payment endpoint failed:', paymentError.response?.data);
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found in NOWPayments',
        error: paymentError.response?.data
      });
    }

    // Map invoice status to payment status
    const status = paymentStatus.payment_status || paymentStatus.status || 'waiting';
    
    console.log('Final payment status:', status);

    // Check if payment exists in our database (check by invoice ID or order ID)
    const { rows } = await pool.query(
      `SELECT * FROM payment_transactions 
       WHERE payment_id = $1 
       OR order_id = $2`,
      [paymentId, paymentStatus.order_id]
    );

    // If payment exists in database, verify user and update status
    if (rows.length > 0) {
      // Verify it belongs to this user
      if (rows[0].user_id !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }
      
      console.log('Found payment in database by order_id:', rows[0].order_id);
      
      // Update payment status in database
      await pool.query(
        'UPDATE payment_transactions SET payment_status = $1, updated_at = NOW() WHERE id = $2',
        [status, rows[0].id]
      );
      
      // If payment is finished/confirmed, add coins to user
      if ((status === 'finished' || status === 'confirmed') && 
          (rows[0].payment_status !== 'finished' && rows[0].payment_status !== 'confirmed')) {
        
        console.log('Payment confirmed! Adding coins to user:', rows[0].coins_amount);
        
        // Add coins to user
        const { rows: coinRows } = await pool.query(
          'SELECT * FROM coins WHERE user_id = $1',
          [userId]
        );

        if (coinRows.length === 0) {
          await pool.query(
            'INSERT INTO coins (user_id, coins) VALUES ($1, $2)',
            [userId, rows[0].coins_amount]
          );
        } else {
          await pool.query(
            'UPDATE coins SET coins = coins + $1 WHERE user_id = $2',
            [rows[0].coins_amount, userId]
          );
        }

        console.log(`Successfully added ${rows[0].coins_amount} coins to user ${userId}`);
      }
    } else {
      console.warn('Payment not found in database by payment_id or order_id:', paymentId);
    }

    res.json({ 
      success: true, 
      payment: {
        payment_status: status,
        ...paymentStatus
      },
      localData: rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching payment status:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment status',
      error: error.response?.data || error.message
    });
  }
});

// POST IPN callback - NOWPayments will call this endpoint
paymentRouter.post('/callback', async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Verify IPN signature if IPN secret is configured
    if (NOWPAYMENTS_IPN_SECRET) {
      const receivedSignature = req.headers['x-nowpayments-sig'];
      // Implement signature verification here
      // const expectedSignature = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
      //   .update(JSON.stringify(paymentData))
      //   .digest('hex');
      // if (receivedSignature !== expectedSignature) {
      //   return res.status(401).json({ success: false, message: 'Invalid signature' });
      // }
    }

    const { payment_id, payment_status, order_id } = paymentData;

    // Get payment transaction from database
    const { rows } = await pool.query(
      'SELECT * FROM payment_transactions WHERE payment_id = $1',
      [payment_id]
    );

    if (rows.length === 0) {
      console.error('Payment transaction not found:', payment_id);
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const transaction = rows[0];

    // Update payment status
    await pool.query(
      'UPDATE payment_transactions SET payment_status = $1, updated_at = NOW() WHERE payment_id = $2',
      [payment_status, payment_id]
    );

    // If payment is finished/confirmed, add coins to user
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      // Check if coins already added
      if (transaction.payment_status !== 'finished' && transaction.payment_status !== 'confirmed') {
        // Add coins to user
        const { rows: coinRows } = await pool.query(
          'SELECT * FROM coins WHERE user_id = $1',
          [transaction.user_id]
        );

        if (coinRows.length === 0) {
          await pool.query(
            'INSERT INTO coins (user_id, coins) VALUES ($1, $2)',
            [transaction.user_id, transaction.coins_amount]
          );
        } else {
          await pool.query(
            'UPDATE coins SET coins = coins + $1 WHERE user_id = $2',
            [transaction.coins_amount, transaction.user_id]
          );
        }

        console.log(`Added ${transaction.coins_amount} coins to user ${transaction.user_id}`);
      }
    }

    res.json({ success: true, message: 'IPN processed' });
  } catch (error) {
    console.error('Error processing IPN callback:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process callback',
      error: error.message
    });
  }
});

// GET user's payment history
paymentRouter.get('/history', authRequired, async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM payment_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) FROM payment_transactions WHERE user_id = $1',
      [userId]
    );

    res.json({ 
      success: true, 
      payments: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countRows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});

