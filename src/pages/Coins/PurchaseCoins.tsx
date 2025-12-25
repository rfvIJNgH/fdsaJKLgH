import React, { useState, useEffect } from 'react';
import { Coins, Wallet, Star, Zap, Crown, Gift, ExternalLink, Loader2 } from 'lucide-react';
import { CoinPack } from '../../interface/interface';
import { useCoin } from "../../contexts/CoinContext";
import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/api';
import VerifyModal from './VerifyModal';

const PurchaseCoins: React.FC = () => {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(10);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('usdttrc20');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const { coinData, fetchCoinData } = useCoin();
  const { user } = useAuth();

  // Refresh coin balance when component mounts (in case user returned from payment)
  useEffect(() => {
    if (user?.id) {
      fetchCoinData(String(user.id));
    }
  }, [user, fetchCoinData]);

  // USD per coin rate
  const coinRate = 1.00; // $1.00 per coin

  // Fetch available currencies on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      setLoadingCurrencies(true);
      try {
        const response = await paymentService.getCurrencies();
        if (response.data.success) {
          // Filter for USDT stablecoins (different networks)
          // NOWPayments uses these names for different networks
          const stablecoinVariants = [
            'usdttrc20',   // USDT on Tron (TRC20)
            'usdtbep20',   // USDT on BSC (BEP20)
            'usdtbsc',     // Alternative name for BSC
            'usdterc20',   // USDT on Ethereum (ERC20)
            'usdt',        // Generic USDT
            'usdtmatic',   // USDT on Polygon
            'usdtsol'      // USDT on Solana
          ];
          
          const available = response.data.currencies.filter((curr: string) => 
            stablecoinVariants.includes(curr.toLowerCase())
          );
          
          console.log('Available USDT currencies:', available);
          
          if (available.length > 0) {
            setAvailableCurrencies(available);
            // Set default to first available, preferably TRC20
            if (available.includes('usdttrc20')) {
              setSelectedCurrency('usdttrc20');
            } else {
              setSelectedCurrency(available[0]);
            }
          } else {
            // Fallback to default list if none found
            setAvailableCurrencies(['usdttrc20', 'usdtbep20', 'usdterc20']);
          }
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
        // Set default stablecoins if API fails
        setAvailableCurrencies(['usdttrc20', 'usdtbep20', 'usdterc20']);
      } finally {
        setLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Fetch estimate when currency or amount changes
  useEffect(() => {
    const fetchEstimate = async () => {
      const purchaseDetails = getPurchaseDetails();
      const priceInUSD = parseFloat(purchaseDetails.price);

      if (priceInUSD > 0 && selectedCurrency) {
        setLoadingEstimate(true);
        try {
          const response = await paymentService.getEstimate(
            priceInUSD,
            selectedCurrency,
            'usd'
          );
          if (response.data.success && response.data.data) {
            const estimate = parseFloat(response.data.data.estimated_amount);
            if (!isNaN(estimate)) {
              setEstimatedAmount(estimate);
            } else {
              setEstimatedAmount(null);
            }
          }
        } catch (error) {
          console.error('Error fetching estimate:', error);
          setEstimatedAmount(null);
        } finally {
          setLoadingEstimate(false);
        }
      }
    };

    fetchEstimate();
  }, [selectedCurrency, customAmount, selectedPack]);

  const coinPacks: CoinPack[] = [
    {
      id: 'starter',
      coins: 10,
      price: 10.00,
      title: 'Starter Pack',
      description: 'Perfect for beginners',
      icon: <Star className="text-blue-400" size={24} />
    },
    {
      id: 'popular',
      coins: 50,
      price: 50.00,
      popular: true,
      title: 'Popular Pack',
      description: 'Most chosen by users',
      icon: <Zap className="text-yellow-400" size={24} />
    },
    {
      id: 'value',
      coins: 100,
      price: 100.00,
      title: 'Value Pack',
      description: 'Great value for money',
      icon: <Gift className="text-green-400" size={24} />
    },
    {
      id: 'premium',
      coins: 250,
      price: 250.00,
      title: 'Premium Pack',
      description: 'Maximum savings',
      icon: <Crown className="text-primary-400" size={24} />
    }
  ];

  const handleCustomAmountChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    // Set constraints: minimum 1 coin, maximum 1,000 coins
    if (numValue >= 1 && numValue <= 1000) {
      setCustomAmount(numValue);
    } else if (numValue > 1000) {
      setCustomAmount(1000);
    } else if (numValue < 1 && value !== '') {
      setCustomAmount(1);
    }
  };

  const calculateCustomPrice = (coins: number) => {
    return (coins * coinRate).toFixed(2);
  };

  const getPurchaseDetails = () => {
    if (selectedPack) {
      const pack = coinPacks.find(p => p.id === selectedPack)!;
      return {
        coins: pack.coins + (pack.bonus || 0),
        price: pack.price.toString(),
        packTitle: pack.title
      };
    } else {
      return {
        coins: customAmount,
        price: calculateCustomPrice(customAmount),
        packTitle: undefined
      };
    }
  };

  const handlePurchaseClick = () => {
    // Show verification modal instead of directly purchasing
    setShowVerifyModal(true);
  };

  const handleConfirmPurchase = async () => {
    const purchaseDetails = getPurchaseDetails();
    setProcessingPayment(true);
    
    console.log("Creating payment for:", purchaseDetails.coins, "coins");

    try {
      const response = await paymentService.createPayment({
        price_amount: parseFloat(purchaseDetails.price),
        price_currency: 'usd',
        pay_currency: selectedCurrency,
        coins_amount: purchaseDetails.coins,
        order_description: purchaseDetails.packTitle 
          ? `Purchase ${purchaseDetails.packTitle} - ${purchaseDetails.coins} coins`
          : `Purchase ${purchaseDetails.coins} coins`,
        success_url: `${window.location.origin}/coins/success`,
        cancel_url: `${window.location.origin}/coins/purchase`,
      });

      if (response.data.success) {
        const paymentData = response.data.payment;
        
        console.log("Invoice created:", paymentData);
        
        // Open NOWPayments invoice checkout page in new tab
        if (paymentData.invoice_url) {
          console.log("Opening invoice in new tab:", paymentData.invoice_url);
          window.open(paymentData.invoice_url, '_blank');
        } else {
          console.error("No invoice URL received:", paymentData);
        }
      } else {
        console.error("Payment creation failed:", response.data);
      }
    } catch (error) {
      console.error("Payment creation failed:", error);
    } finally {
      setProcessingPayment(false);
      setShowVerifyModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-700 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Add Coins to Your Wallet
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Purchase coins to unlock premium features, support creators, and enhance your experience
          </p>

          {/* Current Balance */}
          <div className="mt-8 inline-flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-xl px-6 py-4 border border-gray-700/30">
            <Wallet className="text-yellow-400" size={20} />
            <span className="text-gray-400">Current Balance:</span>
            <span className="text-2xl font-bold text-yellow-400">{coinData?.coins}</span>
            <span className="text-gray-400">coins</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coin Packs */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {coinPacks.map((pack) => (
                <div
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`relative bg-black/60 backdrop-blur-sm rounded-xl p-6 border cursor-pointer transition-all duration-300 hover:shadow-2xl ${pack.popular
                    ? 'border-yellow-600/50 shadow-lg shadow-yellow-600/20'
                    : selectedPack === pack.id
                      ? 'border-primary-600/50 shadow-lg shadow-primary-600/20'
                      : 'border-gray-700/30 hover:border-gray-600/50'
                    }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}

                  {selectedPack === pack.id && (
                    <div className="absolute -top-3 right-4">
                      <div className="bg-primary-600 text-white p-2 rounded-full shadow-lg">
                        <Star size={16} fill="currentColor" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    {pack.icon}
                    <div>
                      <h3 className="text-lg font-bold text-white">{pack.title}</h3>
                      <p className="text-gray-400 text-sm">{pack.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl font-bold text-yellow-400">{pack.coins.toLocaleString()}</span>
                      <span className="text-gray-400">coins</span>
                      {pack.bonus && (
                        <span className="text-green-400 text-sm font-medium">
                          +{pack.bonus} bonus
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">${pack.price}</span>
                      {pack.originalPrice && (
                        <span className="text-gray-500 line-through text-lg">${pack.originalPrice}</span>
                      )}
                    </div>

                    <div className="text-gray-400 text-sm mt-1">
                      ${(pack.price / pack.coins).toFixed(4)} per coin
                    </div>
                  </div>

                  {pack.originalPrice && (
                    <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-2 mb-4">
                      <div className="text-green-400 text-sm font-medium text-center">
                        Save ${(pack.originalPrice - pack.price).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
              <h3 className="text-xl font-bold text-white mb-4">Custom Amount</h3>
              <p className="text-gray-400 mb-6">Enter your desired coin amount for maximum flexibility</p>

              <div className="mb-6">
                <label htmlFor="custom-coins" className="block text-sm font-medium text-gray-300 mb-3">
                  Number of Coins (1 - 1,000)
                </label>
                <div className="relative">
                  <input
                    id="custom-coins"
                    type="number"
                    min="1"
                    max="1000"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-lg font-medium placeholder-gray-400 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                    placeholder="Enter amount..."
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Coins size={20} />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                  <span>Minimum: 1 coin</span>
                  <span>Maximum: 1,000 coins</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="bg-gray-800/40 rounded-lg p-4 mb-4">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">
                    {customAmount.toLocaleString()}
                  </div>
                  <div className="text-gray-400 mb-3">coins</div>

                  <div className="border-t border-gray-600/30 pt-3">
                    <div className="text-2xl font-bold text-white mb-1">
                      ${calculateCustomPrice(customAmount)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      ${coinRate.toFixed(4)} per coin
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPack(null)}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${selectedPack === null
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                  : 'bg-gray-700/50 hover:bg-gray-600/50 text-white border border-gray-600/30'
                  }`}
              >
                Select Custom Amount
              </button>
            </div>
          </div>

          {/* Purchase Summary */}
          <div className="lg:col-span-1">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30 sticky top-8">
              <h3 className="text-xl font-bold text-white mb-6">Purchase Summary</h3>

              {selectedPack ? (
                <>
                  {(() => {
                    const pack = coinPacks.find(p => p.id === selectedPack)!;
                    return (
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3">
                          {pack.icon}
                          <div>
                            <div className="text-white font-medium">{pack.title}</div>
                            <div className="text-gray-400 text-sm">{pack.description}</div>
                          </div>
                        </div>

                        <div className="bg-gray-800/40 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Coins:</span>
                            <span className="text-yellow-400 font-bold">{pack.coins.toLocaleString()}</span>
                          </div>
                          {pack.bonus && (
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-400">Bonus:</span>
                              <span className="text-green-400 font-bold">+{pack.bonus}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total:</span>
                            <span className="text-yellow-400 font-bold">
                              {(pack.coins + (pack.bonus || 0)).toLocaleString()} coins
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-gray-700/50 pt-4">
                          <div className="flex justify-between items-center text-lg">
                            <span className="text-white font-medium">Price:</span>
                            <span className="text-white font-bold">${pack.price}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="space-y-4 mb-6">
                  <div className="text-center">
                    <div className="text-white font-medium mb-2">Custom Amount</div>
                    <div className="text-gray-400 text-sm">Pay exactly what you need</div>
                  </div>

                  <div className="bg-gray-800/40 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Coins:</span>
                      <span className="text-yellow-400 font-bold">{customAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Rate:</span>
                      <span className="text-gray-300">${coinRate.toFixed(4)} per coin</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700/50 pt-4">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-white font-medium">Price:</span>
                      <span className="text-white font-bold">${calculateCustomPrice(customAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Select Cryptocurrency</h4>
                {loadingCurrencies ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin text-primary-500" size={24} />
                    <span className="ml-2 text-gray-400">Loading currencies...</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableCurrencies.map((currency) => {
                      // Display names for USDT networks
                      const displayNames: { [key: string]: string } = {
                        'usdttrc20': 'USDT (TRC20)',
                        'usdtbep20': 'USDT (BEP20)',
                        'usdtbsc': 'USDT (BSC/BEP20)',
                        'usdterc20': 'USDT (ERC20)',
                        'usdtmatic': 'USDT (Polygon)',
                        'usdtsol': 'USDT (Solana)',
                        'usdt': 'USDT'
                      };
                      
                      return (
                        <button
                          key={currency}
                          onClick={() => setSelectedCurrency(currency)}
                          className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                            selectedCurrency === currency
                              ? 'bg-primary-600/20 border-primary-600/30 text-primary-400'
                              : 'bg-gray-700/50 border-gray-600/30 text-gray-300 hover:bg-gray-600/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Coins size={20} />
                            <span className="font-medium">
                              {displayNames[currency.toLowerCase()] || currency.toUpperCase()}
                            </span>
                          </div>
                          {selectedCurrency === currency && (
                            <Star size={16} fill="currentColor" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Estimated Amount */}
                {estimatedAmount !== null && typeof estimatedAmount === 'number' && (
                  <div className="mt-4 p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Estimated Amount:</span>
                      {loadingEstimate ? (
                        <Loader2 className="animate-spin text-primary-500" size={16} />
                      ) : (
                        <span className="text-white font-bold">
                          {estimatedAmount.toFixed(8)} {selectedCurrency.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      * Estimate may vary slightly at checkout
                    </p>
                  </div>
                )}
              </div>

              {/* Purchase Button */}
              <button
                onClick={handlePurchaseClick}
                disabled={processingPayment || loadingCurrencies}
                className={`w-full bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white py-4 rounded-lg font-medium text-lg transition-all duration-200 shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 flex items-center justify-center gap-2 ${
                  (processingPayment || loadingCurrencies) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ExternalLink size={18} />
                  </>
                )}
              </button>

              <p className="text-gray-400 text-xs text-center mt-4">
                Secure cryptocurrency payment powered by NOWPayments
              </p>
            </div>
          </div>
        </div>

        {/* Verify Modal */}
        <VerifyModal
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          onConfirm={handleConfirmPurchase}
          purchaseDetails={getPurchaseDetails()}
        />
      </div>
    </div>
  );
};

export default PurchaseCoins;