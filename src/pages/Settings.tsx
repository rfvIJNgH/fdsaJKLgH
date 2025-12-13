import React, { useState, useEffect, useInsertionEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, User, Eye, Bell, FileText, Trash2, Menu, X, AlertTriangle, CircleDollarSign } from 'lucide-react';
import { contentService, collectionService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

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
    const settingsMenuItems: SettingsMenuItem[] = [
        { id: 'account', label: 'Account details', icon: <Star size={16} />, active: true },
        { id: 'notifications', label: 'Notification settings', icon: <Bell size={16} /> },
        { id: 'content', label: 'Manage your content', icon: <FileText size={16} /> },
        { id: 'payment', label: 'Payment Management', icon: <CircleDollarSign size={16} /> },
        { id: 'delete', label: 'Delete your account', icon: <Trash2 size={16} /> },
    ];

    const { user: currentUser } = useAuth();
    const [activeMenuItem, setActiveMenuItem] = useState('account');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userContent, setuserContent] = useState('');
    const [userCollection, setuserCollection] = useState('');

    const dashboardCards: DashboardCard[] = [
        { title: 'Your content', value: userContent },
        { title: 'Your collections', value: userCollection },
        { title: 'Your email address', value: currentUser?.email ?? '' },
        { title: 'Your account status', value: 'Free' },
    ];

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');

    const handleDeleteAccount = () => {
        if (confirmationText.toLowerCase() === 'delete my account') {
            // Here you would call your delete account API
            console.log('Account deletion confirmed');
            // Example: await userService.deleteAccount();
            setShowDeleteModal(false);
            setConfirmationText('');
        }
    };

    useEffect(() => {
        const fetchUserContent = async () => {
            try {
                const res = await contentService.getContentByUser(currentUser!.username);
                setuserContent(res.data.content.length);
            } catch (error) {
                console.log(error);
            }
            finally {

            }
        }
        fetchUserContent();
    }, [currentUser])

    useEffect(() => {
        const fetchUserCollections = async () => {
            try {
                const res = await collectionService.listMyCollections();
                setuserCollection(res.data.length);
            } catch (error) {
                console.log(error);
            }
            finally {

            }
        }
        fetchUserCollections();
    }, [])

    return (
        <div className="min-h-screen bg-dark-500 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className={`lg:w-80 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-black/60 rounded-lg   p-6">
                            <nav className="space-y-2">
                                {settingsMenuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveMenuItem(item.id);
                                            setSidebarOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeMenuItem === item.id
                                            ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
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
                        {activeMenuItem === 'account' && (
                             <div className="bg-black/60 backdrop-blur-sm rounded-xl p-8">
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        {currentUser?.username || 'Username'}
                                    </h2>
                                    <p className="text-gray-400">Manage your account information and preferences</p>
                                </div>

                                {/* Dashboard Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {dashboardCards.map((card, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:border-gray-600/50 hover:shadow-lg hover:shadow-gray-900/20 transition-all duration-200"
                                        >
                                            <h3 className="text-sm text-gray-400 mb-3 font-medium">{card.title}</h3>
                                            <div className="text-3xl font-bold text-white">
                                                {card.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-700/50 pt-8">
                                    <h3 className="text-xl font-semibold text-white mb-6">Account Information</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={currentUser?.username || "Username"}
                                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                defaultValue={currentUser?.email || "test2@gmail.com"}
                                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Account Status
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <span className="px-4 py-2 bg-green-600/20 text-green-400 rounded-full text-sm border border-green-600/30 font-medium">
                                                    Free
                                                </span>
                                                <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-200 hover:underline">
                                                    Upgrade to Premium
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex gap-4">
                                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40">
                                            Save Changes
                                        </button>
                                        <button className="bg-gray-700/50 hover:bg-gray-600/50 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-gray-600/30">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notification Settings */}
                        {activeMenuItem === 'notifications' && (
                            <div className="bg-black/60 rounded-lg   p-6">
                                <h3 className="text-xl font-semibold text-white mb-6">Notification Preferences</h3>
                                <div className="space-y-4">
                                    {[
                                        'Email notifications for new content',
                                        'Push notifications for live streams',
                                        'Weekly summary emails',
                                        'Marketing communications'
                                    ].map((setting, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-gray-300">{setting}</span>
                                            <input
                                                type="checkbox"
                                                defaultChecked={index < 2}
                                                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content Management */}
                        {activeMenuItem === 'content' && (
                            <div className="bg-black/60 rounded-lg   p-6">
                                <h3 className="text-xl font-semibold text-white mb-6">Content Management</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                        <div>
                                            <h4 className="text-white font-medium">Your Uploads</h4>
                                            <p className="text-gray-400 text-sm">Manage your uploaded content</p>
                                        </div>
                                        <Link to={`/profile/${currentUser!.username}`}>
                                            <button className="text-purple-400 hover:text-purple-300 transition-colors">
                                                View All
                                            </button>
                                        </Link>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                        <div>
                                            <h4 className="text-white font-medium">Collections</h4>
                                            <p className="text-gray-400 text-sm">Organize your favorite content</p>
                                        </div>
                                        <Link to="/collections">
                                            <button className="text-purple-400 hover:text-purple-300 transition-colors">
                                                Manage
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Management */}
                        {activeMenuItem === 'payment' && (
                            <div className="bg-black/60 rounded-lg   p-6">
                                Payment Management Page
                            </div>
                        )}

                        {/* Delete Account */}
                        {activeMenuItem === 'delete' && (
                            <div className="bg-black/60 rounded-lg border border-red-600/30 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <AlertTriangle className="text-red-400" size={24} />
                                    <h3 className="text-xl font-semibold text-red-400">Delete Your Account</h3>
                                </div>

                                <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 mb-6">
                                    <h4 className="text-red-400 font-medium mb-2">Warning: This action cannot be undone</h4>
                                    <ul className="text-gray-300 text-sm space-y-1">
                                        <li>• All your content will be permanently deleted</li>
                                        <li>• Your collections and saved items will be removed</li>
                                        <li>• Your account data cannot be recovered</li>
                                        <li>• You will lose access immediately</li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            If you're sure you want to delete your account, please note:
                                        </label>
                                        <p className="text-gray-400 text-sm mb-4">
                                            This will permanently delete your account and all associated data.
                                            Consider downloading your content before proceeding.
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
                            <h3 className="text-xl font-semibold text-red-400">Confirm Account Deletion</h3>
                        </div>

                        <p className="text-gray-300 mb-6">
                            Are you absolutely sure you want to delete your account? This action cannot be undone.
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
                                disabled={confirmationText.toLowerCase() !== 'delete my account'}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${confirmationText.toLowerCase() === 'delete my account'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Trash2 size={16} />
                                Delete Account
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setConfirmationText('');
                                }}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
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