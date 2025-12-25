import { TronWeb } from 'tronweb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from node-server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * TRC20 USDT Service - Currently configured for TESTNET (Shasta)
 * 
 * Required in .env file:
 * - TRON_WALLET_ADDRESS: Your TRON wallet address (starts with T)
 * - TRON_PRIVATE_KEY: Your wallet's private key
 * - TRON_API_KEY: TronGrid API key from https://www.trongrid.io/ (optional for testnet)
 * 
 * For testnet:
 * - Get test TRX and USDT from: https://www.trongrid.io/faucet
 * - View transactions at: https://shasta.tronscan.org/
 * 
 * To switch to mainnet:
 * - Change TRC20_USDT_CONTRACT to: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
 * - Change TRON_NETWORK to: mainnet
 * - Change MIN_WITHDRAWAL_AMOUNT to: 10
 */

// TRON Configuration
const TRON_WALLET_ADDRESS = process.env.TRON_WALLET_ADDRESS;
const TRON_PRIVATE_KEY = process.env.TRON_PRIVATE_KEY;
const TRON_API_KEY = process.env.TRON_API_KEY || '';
// Shasta testnet USDT contract - change to TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t for mainnet
const TRC20_USDT_CONTRACT = process.env.TRC20_USDT_CONTRACT || 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
const TRON_NETWORK = process.env.TRON_NETWORK || 'shasta';
const MIN_WITHDRAWAL_AMOUNT = parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '1');

// Debug: Log what was loaded (show actual values for debugging)
console.log('🔍 Loading TRC20 Service Configuration:');
console.log('   TRON_WALLET_ADDRESS:', TRON_WALLET_ADDRESS || 'NOT SET');
console.log('   TRON_PRIVATE_KEY:', TRON_PRIVATE_KEY ? `SET (${TRON_PRIVATE_KEY.substring(0, 10)}...)` : 'NOT SET');
console.log('   TRC20_USDT_CONTRACT:', TRC20_USDT_CONTRACT);
console.log('   TRON_NETWORK:', TRON_NETWORK);

if (!TRON_WALLET_ADDRESS || !TRON_PRIVATE_KEY) {
  console.error('❌ CRITICAL: TRON wallet credentials not loaded from .env file!');
  console.error('   Expected .env location:', path.join(__dirname, '../../.env'));
}

// Initialize TronWeb
let tronWeb;

const initTronWeb = () => {
  try {
    console.log('🔧 Initializing TronWeb...');
    
    // Try to get values from both constants and process.env
    const walletAddr = TRON_WALLET_ADDRESS || process.env.TRON_WALLET_ADDRESS;
    const privKey = TRON_PRIVATE_KEY || process.env.TRON_PRIVATE_KEY;
    const network = TRON_NETWORK || process.env.TRON_NETWORK || 'shasta';
    
    console.log('   TRON_WALLET_ADDRESS:', walletAddr ? '✅ Set' : '❌ Not set');
    console.log('   TRON_PRIVATE_KEY:', privKey ? '✅ Set' : '❌ Not set');
    console.log('   TRON_NETWORK:', network);
    
    // Configure based on network
    const fullHost = network === 'mainnet' 
      ? 'https://api.trongrid.io'
      : 'https://api.shasta.trongrid.io';

    console.log('   Full Host:', fullHost);

    // Initialize TronWeb
    tronWeb = new TronWeb({
      fullHost,
      headers: { 
        'TRON-PRO-API-KEY': TRON_API_KEY || process.env.TRON_API_KEY || ''
      },
      privateKey: privKey || '0'.repeat(64) // Dummy key for validation if not provided
    });

    console.log('✅ TronWeb initialized successfully');
    console.log(`📡 Network: ${network.toUpperCase()}`);
    
    if (walletAddr) {
      console.log(`💳 Wallet: ${walletAddr}`);
    } else {
      console.log('⚠️  No wallet configured - address validation will use basic format check');
    }
    
    if (network === 'shasta') {
      console.log('🧪 TESTNET MODE');
      console.log('   Get test tokens: https://www.trongrid.io/faucet');
      console.log('   View transactions: https://shasta.tronscan.org/');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing TronWeb:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
};

// Initialize on module load
initTronWeb();

/**
 * Validate TRC20 address
 * @param {string} address - TRON address to validate
 * @returns {boolean}
 */
export const isValidTronAddress = (address) => {
  try {
    if (!address || typeof address !== 'string') {
      console.log('❌ Address validation failed: not a string or empty');
      return false;
    }
    
    if (!address.startsWith('T')) {
      console.log('❌ Address validation failed: does not start with T');
      return false;
    }
    
    if (address.length !== 34) {
      console.log(`❌ Address validation failed: length is ${address.length}, expected 34`);
      return false;
    }

    // Basic validation passed, try TronWeb validation if available
    if (tronWeb) {
      try {
        const isValid = tronWeb.isAddress(address);
        console.log(`${isValid ? '✅' : '❌'} TronWeb validation: ${isValid}`);
        return isValid;
      } catch (err) {
        console.log('⚠️  TronWeb validation failed, using basic validation');
        // If TronWeb validation fails, accept if basic format is correct
        return true;
      }
    }
    
    // If TronWeb not initialized, accept if basic format is correct
    console.log('⚠️  TronWeb not initialized, using basic validation');
    return true;
    
  } catch (error) {
    console.error('Error validating address:', error.message);
    // On any error, if basic format looks correct, accept it
    return address && address.startsWith('T') && address.length === 34;
  }
};

/**
 * Get USDT balance of wallet
 * @param {string} address - TRON address to check
 * @returns {Promise<number>} Balance in USDT
 */
export const getUSDTBalance = async (address = TRON_WALLET_ADDRESS) => {
  try {
    if (!tronWeb) {
      throw new Error('TronWeb not initialized');
    }

    console.log('📊 Checking balance for contract:', TRC20_USDT_CONTRACT);
    const contract = await tronWeb.contract().at(TRC20_USDT_CONTRACT);
    const balance = await contract.balanceOf(address).call();
    
    // USDT has 6 decimals on TRON
    const usdtBalance = parseFloat(balance.toString()) / 1000000;
    
    return usdtBalance;
  } catch (error) {
    console.error('⚠️  Error getting USDT balance:', error.message);
    console.error('   This is normal on testnet if the contract address is invalid');
    // Return 0 instead of throwing to allow withdrawal to proceed
    return 0;
  }
};

/**
 * Send TRX to address
 * @param {string} toAddress - Recipient TRON address
 * @param {number} amount - Amount in TRX
 * @returns {Promise<object>} Transaction result
 */
export const sendTRC20USDT = async (toAddress, amount) => {
  try {
    if (!tronWeb) {
      throw new Error('TronWeb not initialized. Please check your environment variables.');
    }

    // Check configuration from both constant and process.env
    const walletAddress = TRON_WALLET_ADDRESS || process.env.TRON_WALLET_ADDRESS;
    const privateKey = TRON_PRIVATE_KEY || process.env.TRON_PRIVATE_KEY;
    
    if (!walletAddress || !privateKey) {
      console.error('❌ Missing credentials:');
      console.error('   TRON_WALLET_ADDRESS:', walletAddress || 'NOT FOUND');
      console.error('   TRON_PRIVATE_KEY:', privateKey ? 'FOUND' : 'NOT FOUND');
      throw new Error('TRON wallet configuration missing. Please set TRON_WALLET_ADDRESS and TRON_PRIVATE_KEY in .env file.');
    }
    
    console.log('✅ Using wallet:', walletAddress);

    // Validate recipient address
    if (!isValidTronAddress(toAddress)) {
      throw new Error('Invalid TRC20 address');
    }

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      throw new Error(`Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} USDT`);
    }

    // Check TRX balance
    const trxBalance = await tronWeb.trx.getBalance(walletAddress);
    const trxInTRX = trxBalance / 1000000;
    console.log(`💰 TRX Balance: ${trxInTRX} TRX`);
    
    // Require sufficient balance (amount + 5 TRX for fees)
    const requiredBalance = amount + 5;
    if (trxInTRX < requiredBalance) {
      const network = TRON_NETWORK || 'shasta';
      if (network === 'shasta') {
        throw new Error(
          `Insufficient TRX balance. Required: ${requiredBalance} TRX (${amount} TRX + 5 TRX for fees), Available: ${trxInTRX} TRX. ` +
          `Get test TRX from: https://www.trongrid.io/faucet`
        );
      } else {
        throw new Error(`Insufficient TRX balance. Required: ${requiredBalance} TRX, Available: ${trxInTRX} TRX`);
      }
    }

    // Convert amount to SUN (1 TRX = 1,000,000 SUN)
    const amountInSun = Math.floor(amount * 1000000);

    console.log(`💸 Sending ${amount} TRX (${amountInSun} SUN) to ${toAddress}`);
    console.log('   From wallet:', walletAddress);

    // Execute TRX transfer
    console.log('🔄 Sending TRX transaction...');
    const transaction = await tronWeb.trx.sendTransaction(
      toAddress,
      amountInSun,
      { privateKey: privateKey }
    );

    console.log('✅ Transaction successful!');
    console.log('Transaction ID:', transaction.txid || transaction.transaction?.txID);

    return {
      success: true,
      transactionId: transaction.txid || transaction.transaction?.txID || transaction,
      amount,
      recipient: toAddress,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error sending TRC20 USDT:');
    console.error('   Type:', error.constructor.name);
    console.error('   Message:', error.message);
    console.error('   Full error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send TRC20 USDT';
    
    if (error.message) {
      const msg = error.message.toLowerCase();
      if (msg.includes('balance') || msg.includes('insufficient')) {
        errorMessage = error.message;
      } else if (msg.includes('invalid')) {
        errorMessage = error.message;
      } else if (msg.includes('revert') || msg.includes('overflow') || msg.includes('underflow')) {
        errorMessage = 'Transaction failed: Insufficient balance';
      } else if (msg.includes('bandwidth')) {
        errorMessage = 'Insufficient bandwidth. Your wallet needs more TRX for transaction fees.';
      } else if (msg.includes('energy')) {
        errorMessage = 'Insufficient energy. Your wallet needs more TRX for transaction fees.';
      } else if (msg.includes('account does not exist')) {
        errorMessage = 'Wallet not activated. Send some TRX to your wallet first.';
      } else {
        errorMessage = `Transaction failed: ${error.message}`;
      }
    }

    throw new Error(errorMessage);
  }
};

/**
 * Get transaction details
 * @param {string} txId - Transaction ID
 * @returns {Promise<object>} Transaction details
 */
export const getTransactionInfo = async (txId) => {
  try {
    if (!tronWeb) {
      throw new Error('TronWeb not initialized');
    }

    const transaction = await tronWeb.trx.getTransaction(txId);
    const transactionInfo = await tronWeb.trx.getTransactionInfo(txId);

    return {
      transaction,
      info: transactionInfo
    };
  } catch (error) {
    console.error('Error getting transaction info:', error.message);
    throw error;
  }
};

/**
 * Check if TRC20 service is properly configured
 * @returns {object} Configuration status
 */
export const checkConfiguration = () => {
  const config = {
    tronWebInitialized: !!tronWeb,
    walletConfigured: !!TRON_WALLET_ADDRESS && !!TRON_PRIVATE_KEY,
    network: TRON_NETWORK,
    contractAddress: TRC20_USDT_CONTRACT,
    minWithdrawal: MIN_WITHDRAWAL_AMOUNT
  };

  const isConfigured = config.tronWebInitialized && config.walletConfigured;

  return {
    ...config,
    isConfigured,
    message: isConfigured 
      ? 'TRC20 service is properly configured' 
      : 'TRC20 service configuration incomplete. Check environment variables.'
  };
};

// Export configuration check for health monitoring
export const trc20Config = {
  isConfigured: () => {
    const wallet = process.env.TRON_WALLET_ADDRESS || TRON_WALLET_ADDRESS;
    const key = process.env.TRON_PRIVATE_KEY || TRON_PRIVATE_KEY;
    const configured = !!tronWeb && !!wallet && !!key;
    
    if (!configured) {
      console.log('🔍 TRC20 Config Check:');
      console.log('   TronWeb:', !!tronWeb ? 'OK' : 'NOT INITIALIZED');
      console.log('   Wallet:', !!wallet ? wallet : 'MISSING');
      console.log('   Key:', !!key ? 'SET' : 'MISSING');
    }
    
    return configured;
  },
  getNetwork: () => TRON_NETWORK,
  getMinWithdrawal: () => MIN_WITHDRAWAL_AMOUNT
};

