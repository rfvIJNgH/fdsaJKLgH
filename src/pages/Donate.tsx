import React, { useState } from 'react';
import { CreditCard, ArrowRight } from 'lucide-react';

interface DonorInfo {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
}



const Donate: React.FC = () => {
    const [recipientUsername, setRecipientUsername] = useState('example');
    const [selectedAmount, setSelectedAmount] = useState(50);
    const [customAmount, setCustomAmount] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [donorInfo, setDonorInfo] = useState<DonorInfo>({
        firstName: '',
        lastName: '',
        email: '',
        message: ''
    });
    const [selectedPayment, setSelectedPayment] = useState('card');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const presetAmounts = [5, 10, 25, 50, 100];

    const handleAmountSelect = (amount: number) => {
        setSelectedAmount(amount);
        setCustomAmount('');
    };

    const handleCustomAmountChange = (value: string) => {
        setCustomAmount(value);
        setSelectedAmount(0);
    };

    const handleInputChange = (field: keyof DonorInfo, value: string) => {
        setDonorInfo(prev => ({ ...prev, [field]: value }));
    };

    const getCurrentAmount = () => {
        return customAmount ? parseFloat(customAmount) || 0 : selectedAmount;
    };

    const handleDonationSubmit = (data: any) => {
        console.log('Donation submitted:', data);
        setIsSubmitting(true);
        // Handle successful donation
    };

    return (
        <div className="max-w-2xl mx-auto">
            <form onSubmit={handleDonationSubmit} className="bg-dark-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                    {recipientUsername ? `Support ${recipientUsername}` : 'Make a Donation'}
                </h2>

                {/* Amount Selection */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Select Amount</h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                        {presetAmounts.map((amount) => (
                            <button
                                key={amount}
                                type="button"
                                onClick={() => handleAmountSelect(amount)}
                                className={`py-3 px-4 rounded-lg font-semibold transition-all ${selectedAmount === amount && !customAmount
                                    ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:shadow-md'
                                    }`}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">$</span>
                        <input
                            type="number"
                            placeholder="Custom amount"
                            value={customAmount}
                            onChange={(e) => handleCustomAmountChange(e.target.value)}
                            className="w-full pl-8 pr-4 py-3 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Donor Information */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Your Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="First name"
                            value={donorInfo.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full py-3 px-4 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Last name"
                            value={donorInfo.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full py-3 px-4 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>
                    <input
                        type="email"
                        placeholder="Email address"
                        value={donorInfo.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full py-3 px-4 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all mb-4"
                        required
                    />
                    <textarea
                        placeholder="Leave a message (optional)"
                        value={donorInfo.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        rows={3}
                        className="w-full py-3 px-4 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    />
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => setSelectedPayment('card')}
                            className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${selectedPayment === 'card'
                                ? 'border-primary-500 bg-primary-500/10'
                                : 'border-gray-600 hover:border-gray-500'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <CreditCard className="w-5 h-5 text-gray-400" />
                                <span className="font-medium text-white">Credit/Debit Card</span>
                            </div>
                            <div className="w-4 h-4 border-2 border-primary-500 rounded-full flex items-center justify-center">
                                {selectedPayment === 'card' && (
                                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Donation Summary */}
                <div className="bg-dark-700 rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Donation amount:</span>
                        <span className="font-semibold text-white">${getCurrentAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Type:</span>
                        <span className="font-semibold text-white">{isRecurring ? 'Monthly' : 'One-time'}</span>
                    </div>
                    <div className="border-t border-gray-600 mt-4 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-white">Total:</span>
                            <span className="text-lg font-bold text-primary-400">${getCurrentAmount().toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={getCurrentAmount() === 0 || !donorInfo.firstName || !donorInfo.lastName || !donorInfo.email || isSubmitting}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Complete Donation</span>
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                    Your donation is secure and encrypted. You will receive a receipt via email.
                </p>
            </form>
        </div>
    );
};

export default Donate;