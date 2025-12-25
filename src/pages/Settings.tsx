import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Trash2,
  AlertTriangle,
  CircleDollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Loader2,
} from "lucide-react";
import {
  contentService,
  collectionService,
  userService,
  vipService,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useCoin } from "../contexts/CoinContext";
import PurchaseCoins from "./Coins/PurchaseCoins";
import WithdrawCoins from "./Coins/WithdrawCoins";

interface SettingsMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

interface DashboardCard {
  title: string;
  value: string | number;
  description?: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const settingsMenuItems: SettingsMenuItem[] = [
    {
      id: "account",
      label: "Account details",
      icon: <Star size={16} />,
      active: true,
    },
    {
      id: "payment",
      label: "Payment Management",
      icon: <CircleDollarSign size={16} />,
    },
    { id: "delete", label: "Delete your account", icon: <Trash2 size={16} /> },
  ];

  const {
    user: currentUser,
    logout,
    isVip,
    refreshVipStatus,
    updateUserProfile: updateAuthUserProfile,
  } = useAuth();
  const { coinData, fetchCoinData } = useCoin();
  const coins = coinData?.coins ?? 0;
  const [activeMenuItem, setActiveMenuItem] = useState("account");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userContent, setuserContent] = useState("");
  const [userCollection, setuserCollection] = useState("");
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // Account form state
  const [username, setUsername] = useState(currentUser?.username || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Payment state
  const [paymentTab, setPaymentTab] = useState<"deposit" | "withdraw" | null>(
    null
  );

  const dashboardCards: DashboardCard[] = [
    { title: "Your content", value: userContent },
    { title: "Your collections", value: userCollection },
    { title: "Your email address", value: currentUser?.email ?? "" },
    { title: "Your account status", value: isVip ? "VIP" : "Free" },
  ];

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmationText.toLowerCase() === "delete my account") {
      setDeletingAccount(true);
      try {
        await userService.deleteAccount();
        logout();
        navigate("/");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Failed to delete account. Please try again.");
      } finally {
        setDeletingAccount(false);
        setShowDeleteModal(false);
        setConfirmationText("");
      }
    }
  };

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    setAccountMessage(null);
    try {
      await userService.updateUserProfile({ username, email });
      // Update the auth context with the new username so profile navigation works
      updateAuthUserProfile({ username });
      // Also refresh VIP status to ensure it's still correct
      await refreshVipStatus();
      setAccountMessage({
        type: "success",
        text: "Account information updated successfully!",
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setAccountMessage({
        type: "error",
        text:
          err.response?.data?.message || "Failed to update account information",
      });
    } finally {
      setSavingAccount(false);
    }
  };


  useEffect(() => {
    const fetchUserContent = async () => {
      try {
        const res = await contentService.getContentByUser(
          currentUser!.username
        );
        setuserContent(res.data.content.length);
      } catch (error) {
        console.log(error);
      }
    };
    if (currentUser) fetchUserContent();
  }, [currentUser]);

  useEffect(() => {
    const fetchUserCollections = async () => {
      try {
        const res = await collectionService.listMyCollections();
        setuserCollection(res.data.length);
      } catch (error) {
        console.log(error);
      }
    };
    fetchUserCollections();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
    }
  }, [currentUser]);


  return (
    <div className="min-h-screen bg-dark-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div
            className={`lg:w-80 ${sidebarOpen ? "block" : "hidden lg:block"}`}
          >
            <div className="bg-black/60 rounded-lg p-6">
              <nav className="space-y-2">
                {settingsMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveMenuItem(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeMenuItem === item.id
                        ? "bg-primary-600/20 text-primary-400 border border-primary-600/30"
                        : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Account Details Form */}
            {activeMenuItem === "account" && (
              <div className="bg-black/60 backdrop-blur-sm rounded-xl p-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {currentUser?.username || "Username"}
                  </h2>
                  <p className="text-gray-400">
                    Manage your account information and preferences
                  </p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {dashboardCards.map((card, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:border-gray-600/50 hover:shadow-lg hover:shadow-gray-900/20 transition-all duration-200"
                    >
                      <h3 className="text-sm text-gray-400 mb-3 font-medium">
                        {card.title}
                      </h3>
                      <div className="text-3xl font-bold text-white">
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-700/50 pt-8">
                  <h3 className="text-xl font-semibold text-white mb-6">
                    Account Information
                  </h3>

                  {accountMessage && (
                    <div
                      className={`mb-6 p-4 rounded-lg ${
                        accountMessage.type === "success"
                          ? "bg-green-600/20 text-green-400 border border-green-600/30"
                          : "bg-red-600/20 text-red-400 border border-red-600/30"
                      }`}
                    >
                      {accountMessage.text}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Account Status
                      </label>
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-2 rounded-full text-sm border font-medium ${
                          isVip 
                            ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/30" 
                            : "bg-green-600/20 text-green-400 border-green-600/30"
                        }`}>
                          {isVip ? "VIP" : "Free"}
                        </span>
                        {isVip ? (
                          <button 
                            onClick={async () => {
                              if (confirm("Are you sure you want to cancel your VIP subscription?")) {
                                setCancellingSubscription(true);
                                try {
                                  await vipService.cancelVip();
                                  await refreshVipStatus();
                                  setAccountMessage({
                                    type: "success",
                                    text: "VIP subscription cancelled successfully",
                                  });
                                } catch (error) {
                                  setAccountMessage({
                                    type: "error",
                                    text: "Failed to cancel subscription",
                                  });
                                } finally {
                                  setCancellingSubscription(false);
                                }
                              }
                            }}
                            disabled={cancellingSubscription}
                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors duration-200 hover:underline flex items-center gap-1"
                          >
                            {cancellingSubscription && <Loader2 size={14} className="animate-spin" />}
                            Cancel Subscription
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigate("/upgradeplan")}
                            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-200 hover:underline"
                          >
                            Upgrade to Premium
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={handleSaveAccount}
                      disabled={savingAccount}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 flex items-center gap-2"
                    >
                      {savingAccount && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setUsername(currentUser?.username || "");
                        setEmail(currentUser?.email || "");
                        setAccountMessage(null);
                      }}
                      className="bg-gray-700/50 hover:bg-gray-600/50 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-gray-600/30"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Management */}
            {activeMenuItem === "payment" && (
              <div className="space-y-6">

                {/* Deposit/Withdraw Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setPaymentTab("deposit")}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all ${
                      paymentTab === "deposit"
                        ? "bg-green-600 text-white shadow-lg shadow-green-600/30"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/30"
                    }`}
                  >
                    <ArrowDownCircle size={20} />
                    Deposit Coins
                  </button>
                  <button
                    onClick={() => setPaymentTab("withdraw")}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all ${
                      paymentTab === "withdraw"
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/30"
                    }`}
                  >
                    <ArrowUpCircle size={20} />
                    Withdraw TRX
                  </button>
                </div>

                {/* Initial Explanation Section */}
                {!paymentTab && (
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-3">
                        Manage Your Coins
                      </h3>
                      <p className="text-gray-400">
                        Choose an option above to deposit or withdraw your coins
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Deposit Info Card */}
                      <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-6 hover:border-green-600/50 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                            <ArrowDownCircle size={24} className="text-green-400" />
                          </div>
                          <h4 className="text-xl font-semibold text-white">
                            Deposit Coins
                          </h4>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">
                          Add coins to your account balance to purchase premium content, subscribe to creators, and unlock exclusive features.
                        </p>
                        <ul className="text-gray-400 text-sm space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>Multiple cryptocurrency payment options</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>Instant coin credit after payment</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>Secure payment processing via NOWPayments</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>1 Coin = $1 USD value</span>
                          </li>
                        </ul>
                      </div>

                      {/* Withdraw Info Card */}
                      <div className="bg-orange-600/10 border border-orange-600/30 rounded-lg p-6 hover:border-orange-600/50 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center">
                            <ArrowUpCircle size={24} className="text-orange-400" />
                          </div>
                          <h4 className="text-xl font-semibold text-white">
                            Withdraw to TRX
                          </h4>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">
                          Convert your coins to TRX and receive them instantly to your TRON wallet.
                        </p>
                        <ul className="text-gray-400 text-sm space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-orange-400 mt-1">•</span>
                            <span>Instant withdrawal to TRON wallet</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-400 mt-1">•</span>
                            <span>Automatic processing - no waiting</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-400 mt-1">•</span>
                            <span>Minimum withdrawal: 1 coin</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-400 mt-1">•</span>
                            <span>1 Coin = 1 TRX conversion rate</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                      <p className="text-gray-300 text-sm text-center">
                        <span className="text-purple-400 font-medium">💡 Tip:</span> Keep some coins in your balance to quickly purchase content and support your favorite creators!
                      </p>
                    </div>
                  </div>
                )}

                {/* Deposit Section - Show PurchaseCoins Component */}
                {paymentTab === "deposit" && (
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6">
                    <PurchaseCoins />
                  </div>
                )}

                {/* Withdraw Section - Show WithdrawCoins Component */}
                {paymentTab === "withdraw" && (
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6">
                    <WithdrawCoins />
                  </div>
                )}
              </div>
            )}

            {/* Delete Account */}
            {activeMenuItem === "delete" && (
              <div className="bg-black/60 rounded-lg border border-red-600/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="text-red-400" size={24} />
                  <h3 className="text-xl font-semibold text-red-400">
                    Delete Your Account
                  </h3>
                </div>

                <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 mb-6">
                  <h4 className="text-red-400 font-medium mb-2">
                    Warning: This action cannot be undone
                  </h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• All your content will be permanently deleted</li>
                    <li>• Your collections and saved items will be removed</li>
                    <li>• Your account data cannot be recovered</li>
                    <li>• You will lose access immediately</li>
                    <li>• Your coin balance will be forfeited</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      If you're sure you want to delete your account, please
                      note:
                    </label>
                    <p className="text-gray-400 text-sm mb-4">
                      This will permanently delete your account and all
                      associated data. Consider downloading your content before
                      proceeding.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete My Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-500 border border-red-600/30 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-400" size={24} />
              <h3 className="text-xl font-semibold text-red-400">
                Confirm Account Deletion
              </h3>
            </div>

            <p className="text-gray-300 mb-6">
              Are you absolutely sure you want to delete your account? This
              action cannot be undone.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type "delete my account" to confirm:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-4 py-3 bg-dark-600 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Type confirmation text here..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={
                  confirmationText.toLowerCase() !== "delete my account" ||
                  deletingAccount
                }
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  confirmationText.toLowerCase() === "delete my account" &&
                  !deletingAccount
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {deletingAccount && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                <Trash2 size={16} />
                Delete Account
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmationText("");
                }}
                disabled={deletingAccount}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;