import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Check, Star, Crown, Shield, Users, CloudLightning, X, Coins } from 'lucide-react';
import { vipService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCoin } from '../contexts/CoinContext';

interface PlanFeature {
  name: string;
  included: boolean;
  premium?: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  coinPrice: number;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: PlanFeature[];
  buttonText: string;
  popular?: boolean;
  current?: boolean;
}

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [showInsufficientCoins, setShowInsufficientCoins] = useState(false);
  const { user, isVip, refreshVipStatus } = useAuth();
  const { coinData, fetchCoinData } = useCoin();

  // Fetch coin data when component mounts
  React.useEffect(() => {
    if (user) {
      fetchCoinData(user.id);
    }
  }, [user]);

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free Plan',
      price: '$0',
      coinPrice: 0,
      period: 'forever',
      description: 'Perfect for getting started with basic features',
      icon: <Star className="text-green-400" size={24} />,
      current: !isVip,
      features: [
        { name: 'Up to 10 content uploads', included: true },
        { name: 'Basic collections (up to 5)', included: true },
        { name: 'Standard support', included: true },
        { name: 'Community access', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Unlimited content uploads', included: false },
        { name: 'Advanced collections', included: false },
        { name: 'Priority support', included: false },
        { name: 'Advanced analytics', included: false },
        { name: 'Custom branding', included: false },
        { name: 'API access', included: false },
        { name: 'Team collaboration', included: false },
      ],
      buttonText: isVip ? 'Downgrade to Free' : 'Current Plan'
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: billingPeriod === 'monthly' ? '$19' : '$190',
      coinPrice: billingPeriod === 'monthly' ? 19 : 190,
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      description: 'Everything you need to scale and grow your content',
      icon: <Crown className="text-yellow-400" size={24} />,
      popular: true,
      current: isVip,
      features: [
        { name: 'Unlimited content uploads', included: true, premium: true },
        { name: 'Advanced collections (unlimited)', included: true, premium: true },
        { name: 'Priority support (24/7)', included: true, premium: true },
        { name: 'Advanced analytics dashboard', included: true, premium: true },
        { name: 'Custom branding & themes', included: true, premium: true },
        { name: 'API access & integrations', included: true, premium: true },
        { name: 'Team collaboration tools', included: true, premium: true },
        { name: 'Export & backup features', included: true, premium: true },
        { name: 'Early access to new features', included: true, premium: true },
        { name: 'Remove platform watermarks', included: true, premium: true },
        { name: 'Advanced security features', included: true, premium: true },
        { name: 'Dedicated account manager', included: true, premium: true },
      ],
      buttonText: isVip ? 'Current Plan' : 'Upgrade to Premium'
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      alert('Please login to upgrade your plan');
      return;
    }

    if (planId === 'premium' && !isVip) {
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      // Check if user has enough coins
      if (!coinData || coinData.coins < plan.coinPrice) {
        setShowInsufficientCoins(true);
        return;
      }

      setIsUpgrading(true);
      try {
        const response = await vipService.upgradeToPremium(billingPeriod, plan.coinPrice);
        
        if (response.status === 200) {
          setUpgradeSuccess(true);
          await refreshVipStatus(); // Refresh VIP status in context
          await fetchCoinData(user.id); // Refresh coin data
          
          // Show success message
          setTimeout(() => {
            setUpgradeSuccess(false);
            // You could redirect to profile or dashboard here
            // navigate('/profile/' + user.username);
          }, 3000);
        }
      } catch (error: any) {
        console.error('Upgrade failed:', error);
        const errorMessage = error.response?.data?.message || 'Upgrade failed. Please try again.';
        alert(errorMessage);
      } finally {
        setIsUpgrading(false);
      }
    } else if (planId === 'premium' && coinData && coinData.coins < plans.find(p => p.id === planId)?.coinPrice!) {
      // If user clicks "Add Coins" button, show insufficient coins modal
      setShowInsufficientCoins(true);
    }
  };

  return (
    <div className="min-h-screen bg-dark-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Upgrade Your Experience
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
            Unlock premium features and take your content to the next level with our advanced tools and priority support
          </p>
          
          {/* Current Coins Display */}
          {user && coinData && (
            <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-6 py-3">
              <Coins className="text-yellow-400" size={24} />
              <span className="text-yellow-400 font-semibold">
                {coinData.coins} Coins Available
              </span>
            </div>
          )}
        </div>

        {/* Success Message */}
        {upgradeSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-700 rounded-xl p-8 max-w-md w-full mx-4 text-center border border-green-500/30">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="text-yellow-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Welcome to VIP!</h3>
              <p className="text-gray-400 mb-4">
                Your premium subscription is now active. Enjoy all the exclusive features!
              </p>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-400 text-sm">
                  ✓ Premium features unlocked<br/>
                  ✓ Priority support activated<br/>
                  ✓ Advanced analytics available<br/>
                  ✓ Coins deducted from your account
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Insufficient Coins Modal */}
        {showInsufficientCoins && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-700 rounded-xl p-8 max-w-md w-full mx-4 text-center border border-red-500/30">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="text-red-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Insufficient Coins</h3>
              <p className="text-gray-400 mb-4">
                You don't have enough coins to upgrade to this plan.
              </p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
                <p className="text-red-400 text-sm">
                  Required: {plans.find(p => p.id === 'premium')?.coinPrice} coins<br/>
                  Available: {coinData?.coins || 0} coins<br/>
                  Need: {(plans.find(p => p.id === 'premium')?.coinPrice || 0) - (coinData?.coins || 0)} more coins
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInsufficientCoins(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowInsufficientCoins(false);
                    navigate("/purchase-coins");
                  }}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  Buy Coins
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-2 border border-gray-700/30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  billingPeriod === 'monthly'
                    ? 'bg-primary-600 text-white shadow-lg shadow-purple-600/25'
                    : 'text-gray-400 hover:text-white'
                }`}
                disabled={isUpgrading}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 relative ${
                  billingPeriod === 'yearly'
                    ? 'bg-primary-600 text-white shadow-lg shadow-purple-600/25'
                    : 'text-gray-400 hover:text-white'
                }`}
                disabled={isUpgrading}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-black/60 backdrop-blur-sm rounded-xl p-8 border transition-all duration-300 hover:shadow-2xl hover:shadow-purple-600/10 ${
                plan.popular
                  ? 'border-purple-600/50 shadow-lg shadow-purple-600/20'
                  : 'border-gray-700/30 hover:border-gray-600/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              {plan.current && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-green-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
                    Current Plan
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  {plan.icon}
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                </div>
                
                <div className="mb-4">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-2">/{plan.period}</span>
                </div>
                
                {plan.coinPrice > 0 && (
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Coins className="text-yellow-400" size={20} />
                    <span className="text-yellow-400 font-semibold">
                      {plan.coinPrice} Coins Required
                    </span>
                  </div>
                )}
                
                <p className="text-gray-400">{plan.description}</p>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        feature.premium ? 'bg-purple-600/20 border border-purple-600/30' : 'bg-green-600/20 border border-green-600/30'
                      }`}>
                        <Check
                          size={12}
                          className={feature.premium ? 'text-purple-400' : 'text-green-400'}
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-gray-700/50 border border-gray-600/30">
                        <X size={12} className="text-gray-500" />
                      </div>
                    )}
                    <span
                      className={`${
                        feature.included
                          ? feature.premium
                            ? 'text-white font-medium'
                            : 'text-gray-300'
                          : 'text-gray-500'
                      }`}
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.current || isUpgrading}
                className={`w-full py-4 rounded-lg font-medium text-lg transition-all duration-200 flex items-center justify-center ${
                  plan.current
                    ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600/30'
                    : plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 disabled:opacity-50'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 disabled:opacity-50'
                }`}
              >
                {isUpgrading && plan.id === 'premium' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Questions about upgrading?
          </h3>
          <p className="text-gray-400 mb-6">
            We're here to help you make the right choice for your needs
          </p>
          <button className="bg-gray-700/50 hover:bg-gray-600/50 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;