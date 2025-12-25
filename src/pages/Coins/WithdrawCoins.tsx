import React, { useState } from 'react';
import { Loader2, Wallet } from 'lucide-react';
import { transactionService } from '../../services/api';
import { useCoin } from '../../contexts/CoinContext';
import { useAuth } from '../../contexts/AuthContext';

const WithdrawCoins: React.FC = () => {
  const { coinData, fetchCoinData } = useCoin();
  const { user } = useAuth();
  const coins = coinData?.coins ?? 0;

  const [trc20Address, setTrc20Address] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [processingWithdraw, setProcessingWithdraw] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleWithdrawSubmit = async () => {
    if (!trc20Address.trim()) {
      setWithdrawMessage({
        type: "error",
        text: "Please enter a TRON wallet address",
      });
      return;
    }
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setWithdrawMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }
    if (parseFloat(withdrawAmount) > coins) {
      setWithdrawMessage({
        type: "error",
        text: "Insufficient coins for withdrawal",
      });
      return;
    }

    setProcessingWithdraw(true);
    setWithdrawMessage(null);

    try {
      await transactionService.withdraw({
        amount: parseFloat(withdrawAmount),
        walletAddress: trc20Address.trim(),
      });
      setWithdrawMessage({
        type: "success",
        text: "Withdrawal completed successfully! Your TRX has been sent to your wallet.",
      });
      setTrc20Address("");
      setWithdrawAmount("");
      if (user?.id) {
        fetchCoinData(String(user.id));
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setWithdrawMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to process withdrawal",
      });
    } finally {
      setProcessingWithdraw(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-white mb-2">
          Withdraw to TRX
        </h3>
        <p className="text-gray-400 text-sm">
          Withdraw your coins as TRX directly to your TRON wallet
        </p>
      </div>

      {/* Current Balance Display */}
      <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-sm rounded-xl p-6 border border-orange-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">
              Available for Withdrawal
            </p>
            <p className="text-4xl font-bold text-white">
              {coins.toLocaleString()}{" "}
              <span className="text-lg text-orange-400">Coins</span>
            </p>
            <p className="text-gray-500 text-xs mt-2">
              1 Coin = 1 TRX
            </p>
          </div>
          <Wallet size={48} className="text-orange-400 opacity-50" />
        </div>
      </div>

      {withdrawMessage && (
        <div
          className={`p-4 rounded-lg ${
            withdrawMessage.type === "success"
              ? "bg-green-600/20 text-green-400 border border-green-600/30"
              : "bg-red-600/20 text-red-400 border border-red-600/30"
          }`}
        >
          {withdrawMessage.text}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            TRON Wallet Address
          </label>
          <input
            type="text"
            value={trc20Address}
            onChange={(e) => setTrc20Address(e.target.value)}
            placeholder="Enter your TRON wallet address (T...)"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500/50 transition-all duration-200"
          />
          <p className="text-gray-500 text-xs mt-2">
            Enter your TRON wallet address to receive TRX instantly
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount to Withdraw (Coins)
          </label>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            max={coins}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500/50 transition-all duration-200"
          />
          <p className="text-gray-500 text-xs mt-2">
            Maximum available: {coins.toLocaleString()} coins
          </p>
        </div>

        <div className="bg-orange-600/10 border border-orange-600/20 rounded-lg p-4">
          <h4 className="text-orange-400 font-medium mb-2 text-sm">
            Important Information
          </h4>
          <ul className="text-gray-300 text-xs space-y-1">
            <li>• Only TRON Network addresses are supported</li>
            <li>• Address must start with "T" and be 34 characters long</li>
            <li>• Minimum withdrawal: 1 coin (1 TRX)</li>
            <li>• Instant processing - TRX sent immediately upon submission</li>
            <li>• Double-check your wallet address before submitting</li>
            <li>• Withdrawals are irreversible once processed</li>
          </ul>
        </div>

        <button
          onClick={handleWithdrawSubmit}
          disabled={processingWithdraw || !trc20Address || !withdrawAmount}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30"
        >
          {processingWithdraw && (
            <Loader2 size={16} className="animate-spin" />
          )}
          {processingWithdraw ? 'Processing Withdrawal...' : 'Withdraw TRX Now'}
        </button>
      </div>
    </div>
  );
};

export default WithdrawCoins;

