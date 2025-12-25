import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { paymentService } from '../../services/api';
import { useCoin } from '../../contexts/CoinContext';
import { useAuth } from '../../contexts/AuthContext';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'pending' | 'failed'>('checking');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [coinsRefreshed, setCoinsRefreshed] = useState(false);
  const { fetchCoinData } = useCoin();
  const { user } = useAuth();
  // NOWPayments sends NP_id in the URL
  const paymentId = searchParams.get('NP_id') || searchParams.get('payment_id');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!paymentId) {
        console.error('No payment ID found in URL');
        setPaymentStatus('failed');
        return;
      }

      console.log('Checking payment status for ID:', paymentId);

      try {
        const response = await paymentService.getPaymentStatus(paymentId);
        console.log('Payment status response:', response.data);
        
        if (response.data.success) {
          const status = response.data.payment.payment_status;
          setPaymentDetails(response.data);
          
          console.log('Payment status:', status);
          
          if (status === 'finished' || status === 'confirmed') {
            setPaymentStatus('success');
            // Refresh coin balance ONLY ONCE when payment is successful
            if (user?.id && !coinsRefreshed) {
              console.log('Refreshing coin balance for user:', user.id);
              await fetchCoinData(String(user.id));
              setCoinsRefreshed(true);
            }
          } else if (status === 'waiting' || status === 'confirming') {
            setPaymentStatus('pending');
          } else {
            setPaymentStatus('failed');
          }
        } else {
          console.error('Payment status check failed:', response.data);
          setPaymentStatus('failed');
        }
      } catch (error: any) {
        console.error('Error checking payment status:', error);
        console.error('Error response:', error.response?.data);
        
        // If payment not found in our database, show pending status
        // (it might have been paid but not recorded yet)
        if (error.response?.status === 404) {
          console.log('Payment not found in database, showing pending...');
          setPaymentStatus('pending');
        } else {
          setPaymentStatus('failed');
        }
      }
    };

    checkPaymentStatus();
    
    // Poll payment status every 5 seconds ONLY if pending or checking
    let interval: NodeJS.Timeout | null = null;
    
    if (paymentStatus === 'pending' || paymentStatus === 'checking') {
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, paymentStatus]); // Removed user, fetchCoinData, coinsRefreshed from deps

  return (
    <div className="min-h-screen bg-dark-700 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl p-8 border border-gray-700/30 text-center">
          {paymentStatus === 'checking' && (
            <>
              <Loader2 className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Checking Payment Status</h1>
              <p className="text-gray-400">Please wait while we verify your payment...</p>
            </>
          )}

          {paymentStatus === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-gray-400 mb-6">
                Your coins have been added to your account.
              </p>
              {paymentDetails?.localData && (
                <div className="bg-gray-800/40 rounded-lg p-4 mb-6 text-left">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Coins Purchased:</span>
                    <span className="text-yellow-400 font-bold">
                      {paymentDetails.localData.coins_amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Amount Paid:</span>
                    <span className="text-white font-bold">
                      ${paymentDetails.localData.price_amount}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={() => navigate('/coins/purchase')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {paymentStatus === 'pending' && (
            <>
              <Loader2 className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Payment Pending</h1>
              <p className="text-gray-400 mb-6">
                We're waiting for your payment to be confirmed on the blockchain.
                This may take a few minutes.
              </p>
              <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-400 text-sm">
                  Your coins will be added automatically once the payment is confirmed.
                  You can safely close this page.
                </p>
              </div>
              <button
                onClick={() => navigate('/coins/purchase')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Back to Purchase Page
              </button>
            </>
          )}

          {paymentStatus === 'failed' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
              <p className="text-gray-400 mb-6">
                Your payment could not be processed. Please try again.
              </p>
              <button
                onClick={() => navigate('/coins/purchase')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

