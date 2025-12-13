import React, { useState } from 'react';
import { Coins, CreditCard, Wallet, Star, Zap, Crown, Gift } from 'lucide-react';
import { CoinPack } from '../../interface/interface';
import { useCoin } from "../../contexts/CoinContext";
import { useAuth } from '../../contexts/AuthContext';
import VerifyModal from './VerifyModal';

const PurchaseCoins: React.FC = () => {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const { addCoins, coinData } = useCoin();
  const { user } = useAuth();

  // USD per coin rate
  const coinRate = 0.01; // $0.01 per coin

  const coinPacks: CoinPack[] = [
    {
      id: 'starter',
      coins: 100,
      price: 0.99,
      title: 'Starter Pack',
      description: 'Perfect for beginners',
      icon: <Star className="text-blue-400" size={24} />
    },
    {
      id: 'popular',
      coins: 500,
      price: 4.49,
      originalPrice: 5.00,
      bonus: 50,
      popular: true,
      title: 'Popular Pack',
      description: 'Most chosen by users',
      icon: <Zap className="text-yellow-400" size={24} />
    },
    {
      id: 'value',
      coins: 1000,
      price: 8.99,
      originalPrice: 10.00,
      bonus: 100,
      title: 'Value Pack',
      description: 'Great value for money',
      icon: <Gift className="text-green-400" size={24} />
    },
    {
      id: 'premium',
      coins: 2500,
      price: 19.99,
      originalPrice: 25.00,
      bonus: 500,
      title: 'Premium Pack',
      description: 'Maximum savings',
      icon: <Crown className="text-primary-400" size={24} />
    }
  ];

  const handleCustomAmountChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    // Set constraints: minimum 1 coin, maximum 10,000 coins
    if (numValue >= 1 && numValue <= 10000) {
      setCustomAmount(numValue);
    } else if (numValue > 10000) {
      setCustomAmount(10000);
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
    
    console.log("Purchasing:", purchaseDetails.coins, "coins");

    try {
      await addCoins(user!.id, purchaseDetails.coins);
      // You might want to show a success message here
      console.log("Purchase completed successfully!");
    } catch (error) {
      console.error("Purchase failed:", error);
      // Handle error appropriately
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
                  Number of Coins (1 - 10,000)
                </label>
                <div className="relative">
                  <input
                    id="custom-coins"
                    type="number"
                    min="1"
                    max="10000"
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
                  <span>Maximum: 10,000 coins</span>
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
                <h4 className="text-white font-medium mb-3">Payment Method</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${paymentMethod === 'card'
                      ? 'bg-primary-600/20 border-primary-600/30 text-primary-400'
                      : 'bg-gray-700/50 border-gray-600/30 text-gray-300 hover:bg-gray-600/50'
                      }`}
                  >
                    <CreditCard size={20} />
                    <span>Credit/Debit Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${paymentMethod === 'paypal'
                      ? 'bg-primary-600/20 border-primary-600/30 text-primary-400'
                      : 'bg-gray-700/50 border-gray-600/30 text-gray-300 hover:bg-gray-600/50'
                      }`}
                  >
                    <Wallet size={20} />
                    <span>PayPal</span>
                  </button>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={handlePurchaseClick}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white py-4 rounded-lg font-medium text-lg transition-all duration-200 shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40"
              >
                Complete Purchase
              </button>

              <p className="text-gray-400 text-xs text-center mt-4">
                Secure payment processed with 256-bit SSL encryption
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