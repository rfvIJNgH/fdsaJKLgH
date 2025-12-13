import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Gift, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../contexts/AuthContext';
import { useCoin } from '../../contexts/CoinContext';

interface GiftOption {
  id: string;
  name: string;
  gif: string;
  price: number;
  emoji: string;
}

const GIFT_OPTIONS: GiftOption[] = [
  { id: '1', name: 'Heart', gif: 'https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif', price: 10, emoji: '❤️' },
  { id: '2', name: 'Rose', gif: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', price: 25, emoji: '🌹' },
  { id: '3', name: 'Diamond', gif: 'https://media.giphy.com/media/l0HlQ769jRXQQE54s/giphy.gif', price: 50, emoji: '💎' },
  { id: '4', name: 'Crown', gif: 'https://media.giphy.com/media/l0HlADHMpFjoe0lo4/giphy.gif', price: 100, emoji: '👑' },
  { id: '5', name: 'Fire', gif: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif', price: 75, emoji: '🔥' },
  { id: '6', name: 'Star', gif: 'https://media.giphy.com/media/l0HlQoVLPSkl5cjWE/giphy.gif', price: 35, emoji: '⭐' }
];

const MessageInput: React.FC = () => {
  const { sendMessage, selectedUser } = useChatStore();
  const { coinData, fetchCoinData, deductCoins } = useCoin();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showGiftInterface, setShowGiftInterface] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftOption | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser } = useAuth();

  // Fetch coin data when component mounts or user changes
  React.useEffect(() => {
    if (currentUser?.id) {
      fetchCoinData(currentUser.id);
    }
  }, [currentUser?.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (!selectedUser) return;

    sendMessage({
      currentUserId: currentUser?.id,
      text: text.trim(),
      image: imagePreview || undefined,
      video: imagePreview || undefined,
    });

    setText('');
    setImagePreview(null);
  };

  const handleGiftSend = async () => {
    if (!selectedGift || !selectedUser || !currentUser) return;
    
    // Check if user has enough coins
    if (!coinData || coinData.coins < selectedGift.price) {
      setShowPurchaseModal(true);
      return;
    }

    try {
      // Deduct coins from user's balance
      await deductCoins(currentUser.id, selectedGift.price);
      
      // Send gift message
      sendMessage({
        currentUserId: currentUser.id,
        text: `${selectedGift.emoji} Sent you a ${selectedGift.name}!`,
        image: selectedGift.gif,
      });
      // Close gift interface and reset selection
      setShowGiftInterface(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('Failed to send gift. Please try again.');
    }
  };

  const handlePurchaseCoins = () => {
    setShowPurchaseModal(false);
    setShowGiftInterface(false);
    setSelectedGift(null);
    navigate('/purchase-coins');
  };

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleGiftInterface = () => {
    setShowGiftInterface(!showGiftInterface);
    setSelectedGift(null);
  };

  return (
    <div className="bg-dark-800 border-t border-dark-600 px-6 py-4 relative">
      {/* Purchase Coins Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-900 border border-dark-600 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <Coins className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Insufficient Coins
                </h3>
                <p className="text-gray-400">
                  You need {selectedGift?.price} coins to send this gift, but you only have {coinData?.coins || 0} coins.
                </p>
              </div>
              
              <div className="bg-dark-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-2xl">{selectedGift?.emoji}</div>
                  <div>
                    <div className="text-white font-medium">{selectedGift?.name}</div>
                    <div className="flex items-center justify-center space-x-1 text-yellow-500">
                      <Coins className="w-4 h-4" />
                      <span className="text-sm">{selectedGift?.price} coins</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Would you like to purchase more coins to send this gift?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={closePurchaseModal}
                  className="flex-1 px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchaseCoins}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  Purchase Coins
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gift Interface Modal */}
      {showGiftInterface && (
        <div className="absolute bottom-full left-0 right-0 bg-dark-900 border border-dark-600 rounded-t-lg shadow-2xl p-6 mb-1">
          {/* Header with coin balance */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-500 font-semibold">
                {coinData ? coinData.coins : 0} Coins
              </span>
            </div>
            <button
              onClick={toggleGiftInterface}
              className="p-1 text-gray-400 hover:text-gray-300 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Gift Options Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6 max-h-64 overflow-y-auto">
            {GIFT_OPTIONS.map((gift) => {
              const isSelected = selectedGift?.id === gift.id;
              
              return (
                <div
                  key={gift.id}
                  onClick={() => setSelectedGift(gift)}
                  className={`
                    relative p-3 rounded-lg border cursor-pointer transition-all border-dark-500 hover:border-primary-500 bg-dark-800 hover:bg-dark-700
                    ${isSelected ? 'border-primary-500 bg-dark-700 ring-2 ring-primary-500' : ''}
                  `}
                >
                  {/* Gift GIF */}
                  <div className="aspect-square rounded-lg overflow-hidden mb-2">
                    <img 
                      src={gift.gif} 
                      alt={gift.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Gift Info */}
                  <div className="text-center">
                    <div className="text-lg mb-1">{gift.emoji}</div>
                    <div className="text-sm text-gray-300 font-medium">{gift.name}</div>
                    <div className="flex items-center justify-center space-x-1 mt-1">
                      <Coins className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-yellow-500">
                        {gift.price}
                      </span>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-primary-500 rounded-lg pointer-events-none"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={toggleGiftInterface}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-dark-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGiftSend}
              disabled={!selectedGift}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Send Gift
            </button>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <img src={imagePreview} alt="Preview" className="max-w-32 max-h-32 rounded-lg" />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Message Input Area */}
      <div className="flex items-end space-x-3">
        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={toggleGiftInterface}
            className={`p-2 hover:bg-dark-700 rounded-lg transition-colors ${
              showGiftInterface ? 'text-primary-400 bg-dark-700' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Gift className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-full text-gray-100 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors resize-none max-h-32"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() && !imagePreview}
          className="p-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;