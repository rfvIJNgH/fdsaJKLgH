import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Heart, Coins } from 'lucide-react';
import { useCoin } from '../../contexts/CoinContext';
import { useAuth } from '../../contexts/AuthContext';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: number;
    title: string;
    thumbnail: string;
    user?: {
      id?: string;
      username: string;
    };
  };
  onSubscribe: (coinAmount: number) => void;
}

const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
  content,
  onSubscribe
}) => {
  const [coinAmount, setCoinAmount] = useState<number>(100); // Default coin amount
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { coinData } = useCoin();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const hasEnoughCoins = coinData && coinData.coins >= coinAmount;

  const handleSubscribeClick = async () => {
    if (coinAmount <= 0 || !hasEnoughCoins) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubscribe(coinAmount);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCoins = () => {
    onClose();
    navigate('/purchase-coins');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl max-w-md w-full border border-dark-600 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-pink-500" />
            <h2 className="text-xl font-bold text-white">Subscribe to Creator</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white transition-colors p-1 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6">
          <div className="flex space-x-4 mb-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0">
              <img
                src={content.thumbnail}
                alt={content.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                {content.title}
              </h3>
              {content.user?.username && (
                <p className="text-gray-400 text-xs">
                  by @{content.user.username}
                </p>
              )}
            </div>
          </div>

          {/* User's coin balance */}
          <div className="bg-dark-700 rounded-lg p-4 mb-4">
            <div className="text-center mb-3">
              <p className="text-sm text-gray-400 mb-1">Your balance:</p>
              <div className="flex items-center justify-center space-x-1">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className={`font-medium ${hasEnoughCoins ? 'text-green-400' : 'text-red-400'}`}>
                  {coinData?.coins || 0} coins
                </span>
              </div>
            </div>
          </div>

          {/* Coin Amount Input */}
          <div className="mb-4">
            <label className="block text-white font-medium mb-2">
              Subscription Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Coins className="h-5 w-5 text-yellow-400" />
              </div>
              <input
                type="number"
                min="1"
                max="10000"
                value={coinAmount}
                onChange={(e) => setCoinAmount(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full pl-10 pr-3 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 disabled:opacity-50"
                placeholder="Enter coin amount"
              />
            </div>
            <p className="text-gray-400 text-xs mt-1">
              Subscription duration: 5 minutes
            </p>
          </div>

          {/* Warning if insufficient coins */}
          {!hasEnoughCoins && coinAmount > 0 && (
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm text-center">
                Insufficient coins. You need {coinAmount - (coinData?.coins || 0)} more coins to subscribe.
              </p>
            </div>
          )}

          {/* Subscribe Benefits */}
          <div className="bg-dark-700 rounded-lg p-4 mb-6">
            <div className="text-center mb-3">
              <Heart className="h-8 w-8 text-pink-500 mx-auto mb-2" />
              <h3 className="text-white font-medium text-lg">
                Support @{content.user?.username}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-300">
                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                Access to exclusive fans-only content
              </div>
              <div className="flex items-center text-gray-300">
                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                Direct messaging with creator
              </div>
              <div className="flex items-center text-gray-300">
                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                Support your favorite creator
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-300 text-sm text-center">
              Subscribe to access this creator's exclusive fans-only content and support their work.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-dark-600 hover:bg-dark-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {!hasEnoughCoins ? (
              <button
                onClick={handleAddCoins}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Coins className="h-4 w-4" />
                <span>Add Coins</span>
              </button>
            ) : (
              <button
                onClick={handleSubscribeClick}
                disabled={isSubmitting || coinAmount <= 0 || !hasEnoughCoins}
                className="flex-1 px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    <span>Subscribe ({coinAmount} coins)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribeModal;