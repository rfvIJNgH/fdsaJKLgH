import React, { useEffect, useRef, useState } from 'react';
import { Search, Users, LogOut, Settings } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { receiverProfile } from '../../interface/interface';

const Sidebar: React.FC = () => {
    const { users, getUsers, isUsersLoading, selectedUser, setSelectedUser, getUnreadCount, getSortedUsers, setIsOnChatPage, clearSelectedUser } = useChatStore();
    const { user: currentUser, ProfileImage, logout } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const receiverProfile = location.state?.receiverProfile ?? null;
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        getUsers();
        // Set that user is on chat page when component mounts
        setIsOnChatPage(true);
        
        // Clean up when component unmounts (user navigates away)
        return () => {
            setIsOnChatPage(false);
            // Clear selected user when navigating away from chat page
            clearSelectedUser();
        };
    }, [setIsOnChatPage, clearSelectedUser]);

    // Initialize receiver profile only once, without resetting unread count
    useEffect(() => {
        if (receiverProfile && currentUser && !hasInitialized) {
            // Set selected user WITHOUT resetting unread count on initial load
            setSelectedUser(receiverProfile, currentUser.id, false);
            setHasInitialized(true);
        }
    }, [receiverProfile, currentUser, hasInitialized, setSelectedUser]);

    // Get sorted users based on recent chat activity
    const sortedUsers = currentUser ? getSortedUsers(currentUser.id) : users;

    const filteredUsers = sortedUsers.filter(user =>
        user.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserSelect = (user: receiverProfile, currentUserId: string) => {
        // Reset unread count when user actively clicks on a user
        setSelectedUser(user, currentUserId, true);
    };

    const hasIncremented = useRef(false);

    useEffect(() => {
        if (!hasIncremented.current) {
            const storedValue = sessionStorage.getItem("reloadCount");
            const reloadCount = (storedValue ? Number(storedValue) : 0) + 1;

            sessionStorage.setItem("reloadCount", String(reloadCount));
            hasIncremented.current = true;

            // Clean up navigation state after first load
            if (reloadCount === 1 && location.state?.receiverProfile) {
                const { receiverProfile, ...rest } = location.state;
                navigate(location.pathname, { state: rest, replace: true });
            } else {
                console.log("This is NOT the first reload");
            }
        }

        const handleBeforeUnload = () => {
            sessionStorage.removeItem("reloadCount");
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [location.pathname, navigate]);

    // Helper function to render unread count badge
    const renderUnreadBadge = (count: number) => {
        if (count === 0) return null;
        
        return (
            <div className="bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 ml-2">
                {count > 99 ? '99+' : count}
            </div>
        );
    };

    // Helper function to get the display order with receiverProfile consideration
    const getDisplayUsers = () => {
        if (!receiverProfile) {
            return filteredUsers;
        }

        // If receiverProfile exists, prioritize it at the top
        const otherUsers = filteredUsers.filter(user => user.user.id !== receiverProfile.user.id);
        const receiverInFiltered = filteredUsers.find(user => user.user.id === receiverProfile.user.id);
        
        if (receiverInFiltered) {
            return [receiverInFiltered, ...otherUsers];
        }
        
        // If receiverProfile is not in filtered users (due to search), still show it at top
        return [receiverProfile, ...otherUsers];
    };

    return (
        <div className="w-80 bg-dark-800 border-r border-dark-600 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-dark-600">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-600">
                            <img
                                src={ProfileImage}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h2 className="text-gray-100 font-semibold text-sm">{currentUser?.username}</h2>
                            <p className="text-gray-400 text-xs">Online</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
                {isUsersLoading ? (
                    <div className="p-4 space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-3 animate-pulse">
                                <div className="w-12 h-12 bg-dark-600 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-dark-600 rounded mb-2"></div>
                                    <div className="h-3 bg-dark-600 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-2">
                        {filteredUsers.length === 0 && !receiverProfile ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-400">No users found</p>
                            </div>
                        ) : (
                            getDisplayUsers().map((user) => {
                                const unreadCount = currentUser ? getUnreadCount(user.user.id.toString(), currentUser.id) : 0;
                                
                                return (
                                    <button
                                        key={user.user.id}
                                        onClick={() => handleUserSelect(user, currentUser!.id)}
                                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${selectedUser?.user.id === user.user.id
                                            ? 'bg-primary-600 shadow-lg'
                                            : 'hover:bg-dark-700'
                                            }`}
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-dark-600">
                                                <img
                                                    src={user.user.profile_image || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'}
                                                    alt={user.user.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {(user.isLive || user.isOnline) && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-800"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-medium ${selectedUser?.user.id === user.user.id ? 'text-gray' : 'text-gray-100'}`}>
                                                    {user.user.username}
                                                </h3>
                                                {renderUnreadBadge(unreadCount)}
                                            </div>
                                            <p className={`text-sm ${selectedUser?.user.id === user.user.id ? 'text-gray-400' : 'text-gray-400'}`}>
                                                {user.status || user.isOnline ? 'Online' : user.isLive ? `Last seen ${new Date(user.status || Date.now()).toLocaleDateString()}` : 'Offline'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;