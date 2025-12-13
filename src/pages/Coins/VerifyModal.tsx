import React, { useState } from 'react';
import { X, Shield, CheckCircle2 } from 'lucide-react';

interface VerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  purchaseDetails: {
    coins: number;
    price: string;
    packTitle?: string;
  };
}

const VerifyModal: React.FC<VerifyModalProps> = ({ isOpen, onClose, onConfirm, purchaseDetails }) => {
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsVerifying(true);

    // Simulate processing
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      onConfirm();
      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-700 border border-gray-700/50 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600/20 p-2 rounded-lg">
              <Shield className="text-primary-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Confirm Purchase</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Purchase Summary */}
          <div className="bg-gray-800/40 rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-3">Purchase Details</h3>
            <div className="space-y-2">
              {purchaseDetails.packTitle && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Package:</span>
                  <span className="text-white font-medium">{purchaseDetails.packTitle}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Coins:</span>
                <span className="text-yellow-400 font-bold">{purchaseDetails.coins.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Amount:</span>
                <span className="text-white font-bold">${purchaseDetails.price}</span>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="text-center mb-8">
            <p className="text-gray-300 text-lg">
              Are you sure you want to proceed with this purchase?
            </p>
            <p className="text-gray-400 text-sm mt-2">
              This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isVerifying}
              className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isVerifying}
              className="flex-1 bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  OK
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyModal;