import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Coins, Lock, Loader2 } from 'lucide-react';
import { contentService } from '../../services/api';
import { useCoin } from '../../contexts/CoinContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: {
        id: number;
        title: string;
        contentPrice?: number;
        thumbnail: string;
        user?: {
            username: string;
        };
    };
    onPurchase: () => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
    isOpen,
    onClose,
    content,
    onPurchase
}) => {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const { coinData, fetchCoinData } = useCoin();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handlePurchase = async () => {
        if (!user || !content.contentPrice) return;

        // Check if user has enough coins
        if (!coinData || coinData.coins < content.contentPrice) {
            toast.error('Insufficient coins to purchase this content');
            return;
        }

        setIsPurchasing(true);
        try {
            const response = await contentService.purchaseContent(content.id);

            // Refresh coin data after successful purchase
            await fetchCoinData(user.id);

            toast.success(`Successfully purchased "${content.title}"!`);
            onPurchase();
            onClose();
        } catch (error: any) {
            console.error('Purchase error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to purchase content';
            toast.error(errorMessage);
        } finally {
            setIsPurchasing(false);
        }
    };

    const hasEnoughCoins = coinData && coinData.coins >= (content.contentPrice || 0);

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
                        <Lock className="h-5 w-5 text-orange-500" />
                        <h2 className="text-xl font-bold text-white">Purchase Content</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isPurchasing}
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

                    {/* Price and User Balance */}
                    <div className="bg-dark-700 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-center space-x-2 mb-3">
                            <Coins className="h-6 w-6 text-yellow-500" />
                            <span className="text-2xl font-bold text-white">
                                {content.contentPrice}
                            </span>
                            <span className="text-gray-400">coins</span>
                        </div>

                        {/* User's coin balance */}
                        <div className="text-center">
                            <p className="text-sm text-gray-400 mb-1">Your balance:</p>
                            <div className="flex items-center justify-center space-x-1">
                                <Coins className="h-4 w-4 text-yellow-500" />
                                <span className={`font-medium ${hasEnoughCoins ? 'text-green-400' : 'text-red-400'}`}>
                                    {coinData?.coins || 0} coins
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Warning if insufficient coins */}
                    {!hasEnoughCoins && (
                        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-4">
                            <p className="text-red-400 text-sm text-center">
                                Insufficient coins. You need {(content.contentPrice || 0) - (coinData?.coins || 0)} more coins.
                            </p>
                        </div>
                    )}

                    {/* Description */}
                    <div className="mb-6">
                        <p className="text-gray-300 text-sm text-center">
                            This is premium content that requires a one-time purchase to access.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isPurchasing}
                            className="flex-1 px-4 py-3 bg-dark-600 hover:bg-dark-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        {!hasEnoughCoins ? (
                            <button
                                onClick={handleAddCoins}
                                disabled={isPurchasing}
                                className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Coins className="h-4 w-4" />
                                <span>Add Coins</span>
                            </button>
                        ) : (
                            <button
                                onClick={handlePurchase}
                                disabled={isPurchasing || !hasEnoughCoins}
                                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPurchasing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Coins className="h-4 w-4" />
                                        <span>Purchase</span>
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

export default PurchaseModal;