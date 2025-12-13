import React, { useState, useRef, useEffect } from "react";
import {
    Video,
    VideoOff,
    Users,
    Send,
    Share,
    Heart,
    Eye,
    X,
    Crown,
    Circle,
    MessageCircle,
    MessageCircleOff,
    Gift,
    Star,
    Zap,
    Coffee,
    Gem,
    Trophy,
    UserPlus,
    Info,
    UserCheck,
    UserX,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
    id: string;
    user: string;
    text: string;
    timestamp: Date;
    isOwner?: boolean;
    isGift?: boolean;
    giftType?: string;
}

interface Viewer {
    id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
    joinedAt: Date;
}

interface GiftOption {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    cost: number;
    color: string;
    animation?: string;
}

interface GiftAnimation {
    id: string;
    type: string;
    color: string;
    icon: React.ComponentType<any>;
    timestamp: number;
}

interface UserProfile {
    id: string;
    username: string;
    avatar: string;
    followers: number;
    following: number;
    giftsReceived: number;
    giftsSent: number;
    joinedDate: Date;
    bio: string;
    isFollowing: boolean;
}

const JoinStreamingRoom: React.FC = () => {
    // Stream states
    const [isStreamLive, setIsStreamLive] = useState(true);

    // Chat states
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            user: "StreamMaster",
            text: "Welcome to my stream! 🎉",
            timestamp: new Date(Date.now() - 300000),
            isOwner: true,
        },
        {
            id: "2",
            user: "GamerGirl23",
            text: "Great stream as always!",
            timestamp: new Date(Date.now() - 240000),
        },
        {
            id: "3",
            user: "TechLover",
            text: "Love the setup! What camera are you using?",
            timestamp: new Date(Date.now() - 180000),
        },
        {
            id: "4",
            user: "StreamFan",
            text: "First time watching, this is amazing!",
            timestamp: new Date(Date.now() - 120000),
        },
        {
            id: "5",
            user: "ViewerUser",
            text: "Thanks for the coffee! ☕",
            timestamp: new Date(Date.now() - 60000),
            isGift: true,
            giftType: "coffee",
        },
    ]);
    const [newMessage, setNewMessage] = useState("");

    // Viewer states
    const [viewers, setViewers] = useState<Viewer[]>([
        {
            id: "1",
            username: "GamerGirl23",
            isOnline: true,
            joinedAt: new Date(Date.now() - 1800000),
        },
        {
            id: "2",
            username: "TechLover",
            isOnline: true,
            joinedAt: new Date(Date.now() - 1200000),
        },
        {
            id: "3",
            username: "StreamFan",
            isOnline: true,
            joinedAt: new Date(Date.now() - 900000),
        },
        {
            id: "4",
            username: "CodeNinja",
            isOnline: false,
            joinedAt: new Date(Date.now() - 600000),
        },
        {
            id: "5",
            username: "PixelArtist",
            isOnline: true,
            joinedAt: new Date(Date.now() - 300000),
        },
    ]);

    // Modal states
    const [showViewersList, setShowViewersList] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [showStreamerInfo, setShowStreamerInfo] = useState(false);
    const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [hasRequestedToJoin, setHasRequestedToJoin] = useState(false);

    // Gift animations
    const [giftAnimations, setGiftAnimations] = useState<GiftAnimation[]>([]);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    const onlineViewers = viewers.filter(v => v.isOnline);
    const viewerCount = onlineViewers.length;

    const navigate = useNavigate();

    // Gift options with animations
    const giftOptions: GiftOption[] = [
        { id: "heart", name: "Heart", icon: Heart, cost: 1, color: "text-red-500", animation: "bounce" },
        { id: "star", name: "Star", icon: Star, cost: 5, color: "text-yellow-500", animation: "spin" },
        { id: "coffee", name: "Coffee", icon: Coffee, cost: 10, color: "text-amber-600", animation: "pulse" },
        { id: "gem", name: "Gem", icon: Gem, cost: 25, color: "text-purple-500", animation: "sparkle" },
        { id: "trophy", name: "Trophy", icon: Trophy, cost: 50, color: "text-orange-500", animation: "zoom" },
        { id: "zap", name: "Lightning", icon: Zap, cost: 100, color: "text-blue-500", animation: "flash" },
    ];

    // Streamer profile (updated with avatar)
    const streamerProfile: UserProfile = {
        id: "streamer1",
        username: "StreamMaster",
        avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1",
        followers: 15420,
        following: 892,
        giftsReceived: 2847,
        giftsSent: 156,
        joinedDate: new Date(2023, 2, 15),
        bio: "Professional streamer and content creator. I love gaming, music, and connecting with amazing people. Thanks for being part of this community! 🎮🎵",
        isFollowing: false,
    };

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Clean up gift animations after they complete
    useEffect(() => {
        const timer = setInterval(() => {
            setGiftAnimations(prev => 
                prev.filter(animation => Date.now() - animation.timestamp < 3000)
            );
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const message: Message = {
                id: Date.now().toString(),
                user: "ViewerUser",
                text: newMessage,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, message]);
            setNewMessage("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendGift = (gift: GiftOption) => {
        const giftMessage: Message = {
            id: Date.now().toString(),
            user: "ViewerUser",
            text: `Sent a ${gift.name}! 🎁`,
            timestamp: new Date(),
            isGift: true,
            giftType: gift.id,
        };
        setMessages(prev => [...prev, giftMessage]);
        setShowGiftModal(false);

        // Add gift animation
        const animation: GiftAnimation = {
            id: Date.now().toString(),
            type: gift.id,
            color: gift.color,
            icon: gift.icon,
            timestamp: Date.now(),
        };
        setGiftAnimations(prev => [...prev, animation]);
        
        console.log(`Sent ${gift.name} gift costing ${gift.cost} coins`);
    };

    const handleFollowStreamer = () => {
        // Toggle follow status
        console.log("Following/Unfollowing streamer");
    };

    const handleSendDirectMessage = () => {
        setShowUserProfile(false);
        // Focus on chat input or open DM interface
        console.log("Opening direct message to streamer");
    };

    const handleJoinRequest = () => {
        setHasRequestedToJoin(true);
        setShowJoinRequestModal(false);
        
        const requestMessage: Message = {
            id: Date.now().toString(),
            user: "System",
            text: "ViewerUser has requested to join with video",
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, requestMessage]);
        
        console.log("Join request sent to streamer");
    };

    const toggleChat = () => {
        setIsChatVisible(!isChatVisible);
    };

    const leaveStream = () => {
        navigate("/streaming");
    };

    const formatStreamDuration = (startTime: Date) => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const getAnimationClass = (animationType: string) => {
        switch (animationType) {
            case "bounce": return "animate-bounce";
            case "spin": return "animate-spin";
            case "pulse": return "animate-pulse";
            case "sparkle": return "animate-ping";
            case "zoom": return "animate-bounce";
            case "flash": return "animate-pulse";
            default: return "animate-bounce";
        }
    };

    return (
        <div className="h-screen bg-dark-700 text-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-dark-600 border-b border-gray-700 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-red-500 font-semibold">LIVE</span>
                        </div>
                        
                        {/* Streamer Avatar and Name */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowUserProfile(true)}
                                className="group flex items-center space-x-3 hover:bg-dark-500 p-2 rounded-lg transition-colors"
                            >
                                <div className="relative">
                                    <img
                                        src={streamerProfile.avatar}
                                        alt={streamerProfile.username}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500 group-hover:border-yellow-400 transition-colors"
                                    />
                                    <div className="absolute -top-1 -right-1">
                                        <Crown className="h-5 w-5 text-yellow-500" />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <h1 className="text-lg font-bold group-hover:text-primary-400 transition-colors">
                                        {streamerProfile.username}
                                    </h1>
                                    <p className="text-xs text-gray-400">{streamerProfile.followers.toLocaleString()} followers</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setShowViewersList(true)}
                            className="flex items-center space-x-2 bg-dark-500 hover:bg-dark-400 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Users className="h-5 w-5" />
                            <span>{viewerCount}</span>
                        </button>

                        <button
                            onClick={() => setShowJoinRequestModal(true)}
                            disabled={hasRequestedToJoin}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                                hasRequestedToJoin 
                                    ? "bg-green-600 text-white cursor-not-allowed" 
                                    : "bg-primary-600 hover:bg-primary-700"
                            }`}
                        >
                            <UserPlus className="h-4 w-4" />
                            <span>{hasRequestedToJoin ? "Requested" : "Join Video"}</span>
                        </button>

                        <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                            <Share className="h-4 w-4" />
                            <span>Share</span>
                        </button>

                        <button
                            onClick={leaveStream}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            Leave
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 relative overflow-hidden">
                {/* Chat Toggle Button - Always Visible */}
                <button
                    onClick={toggleChat}
                    className={`fixed top-1/2 -translate-y-1/2 z-20 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 ${
                        isChatVisible ? 'right-[320px]' : 'right-4'
                    }`}
                    title={isChatVisible ? "Hide Chat" : "Show Chat"}
                >
                    {isChatVisible ? (
                        <MessageCircleOff className="h-6 w-6" />
                    ) : (
                        <MessageCircle className="h-6 w-6" />
                    )}
                </button>

                {/* Main Video Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Video Container */}
                    <div className="flex-1 bg-black relative">
                        {/* Stream video would go here - for demo showing placeholder */}
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
                            <div className="text-center">
                                <Video className="h-24 w-24 text-white mx-auto mb-4 opacity-50" />
                                <p className="text-white text-lg opacity-75">Stream Video</p>
                                <p className="text-gray-300 text-sm">StreamMaster is live</p>
                            </div>
                        </div>

                        {/* Gift Animations Overlay */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {giftAnimations.map((animation) => (
                                <div
                                    key={animation.id}
                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${getAnimationClass("bounce")}`}
                                    style={{
                                        left: Math.random() * 80 + 10 + '%',
                                        top: Math.random() * 60 + 20 + '%',
                                        animationDuration: '2s',
                                    }}
                                >
                                    <div className="relative">
                                        <animation.icon 
                                            className={`h-20 w-20 ${animation.color} drop-shadow-lg`}
                                        />
                                        <div className="absolute -inset-4 bg-white bg-opacity-20 rounded-full animate-ping"></div>
                                        <div className="absolute -inset-2 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stream Stats Overlay */}
                        <div className="absolute top-4 right-4 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center space-x-1">
                                    <Eye className="h-4 w-4" />
                                    <span>{viewerCount}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Heart className="h-4 w-4 text-red-500" />
                                    <span>142</span>
                                </div>
                            </div>
                        </div>

                        {/* Stream Duration */}
                        <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-lg text-sm">
                            {formatStreamDuration(new Date(Date.now() - 7200000))}
                        </div>
                    </div>

                    {/* Viewer Controls */}
                    <div className="bg-dark-600 p-4 flex-shrink-0">
                        <div className="flex items-center justify-center space-x-4">
                            <button
                                onClick={() => setShowGiftModal(true)}
                                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                            >
                                <Gift className="h-5 w-5" />
                                <span>Send Gift</span>
                            </button>

                            <button
                                onClick={() => setShowUserProfile(true)}
                                className="bg-dark-500 hover:bg-dark-400 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                            >
                                <Info className="h-5 w-5" />
                                <span>Streamer Profile</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chat Panel */}
                <div className={`${isChatVisible ? 'w-80' : 'w-0'} bg-dark-600 border-l border-gray-700 flex flex-col transition-all duration-300 overflow-hidden flex-shrink-0`}>
                    {/* Chat Header */}
                    <div className={`p-4 border-b border-gray-700 flex-shrink-0 ${isChatVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                        <h3 className="font-semibold text-lg">Live Chat</h3>
                        <p className="text-sm text-gray-400">{viewerCount} viewers active</p>
                    </div>

                    {/* Messages */}
                    <div
                        ref={chatContainerRef}
                        className={`flex-1 overflow-y-auto p-4 space-y-3 ${isChatVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                    >
                        {messages.map((message) => (
                            <div key={message.id} className="flex space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    message.isGift 
                                        ? "bg-gradient-to-r from-pink-500 to-purple-500" 
                                        : message.isOwner 
                                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                        : "bg-gradient-to-r from-primary-500 to-purple-500"
                                }`}>
                                    {message.isGift ? (
                                        <Gift className="h-4 w-4" />
                                    ) : (
                                        <span className="text-xs font-bold">
                                            {message.user[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-sm font-semibold ${
                                            message.isGift 
                                                ? "text-pink-400"
                                                : message.isOwner 
                                                ? "text-yellow-400" 
                                                : "text-primary-400"
                                        }`}>
                                            {message.user}
                                            {message.isOwner && <Crown className="h-3 w-3 inline ml-1" />}
                                            {message.isGift && <Gift className="h-3 w-3 inline ml-1" />}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={`text-sm break-words ${
                                        message.isGift ? "text-pink-300 font-medium" : "text-gray-300"
                                    }`}>
                                        {message.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className={`p-4 border-t border-gray-700 flex-shrink-0 ${isChatVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1 bg-dark-500 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-400 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gift Modal */}
            {showGiftModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-600 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <div className="flex items-center space-x-3">
                                <Gift className="h-6 w-6 text-pink-400" />
                                <h2 className="text-xl font-bold">Send a Gift</h2>
                            </div>
                            <button
                                onClick={() => setShowGiftModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                {giftOptions.map((gift) => (
                                    <button
                                        key={gift.id}
                                        onClick={() => handleSendGift(gift)}
                                        className="bg-dark-500 hover:bg-dark-400 p-4 rounded-lg transition-all duration-200 transform hover:scale-105 border border-gray-700 hover:border-gray-600"
                                    >
                                        <div className="text-center">
                                            <gift.icon className={`h-8 w-8 mx-auto mb-2 ${gift.color}`} />
                                            <p className="font-medium text-white">{gift.name}</p>
                                            <p className="text-sm text-gray-400">{gift.cost} coins</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="mt-6 p-4 bg-dark-700 rounded-lg">
                                <p className="text-sm text-gray-400 text-center">
                                    Your balance: <span className="text-yellow-400 font-semibold">250 coins</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile Modal */}
            {showUserProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-600 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700">
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <img
                                        src={streamerProfile.avatar}
                                        alt={streamerProfile.username}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500"
                                    />
                                    <div className="absolute -top-1 -right-1">
                                        <Crown className="h-6 w-6 text-yellow-500" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{streamerProfile.username}</h2>
                                    <p className="text-sm text-gray-400">Content Creator</p>
                                    <p className="text-xs text-gray-500">
                                        Joined {streamerProfile.joinedDate.toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowUserProfile(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Profile Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-dark-700 rounded-lg">
                                    <div className="flex items-center justify-center space-x-1 text-primary-400 mb-1">
                                        <UserPlus className="h-4 w-4" />
                                        <p className="text-lg font-bold">{streamerProfile.followers.toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm text-gray-400">Followers</p>
                                </div>
                                <div className="text-center p-3 bg-dark-700 rounded-lg">
                                    <div className="flex items-center justify-center space-x-1 text-green-400 mb-1">
                                        <Users className="h-4 w-4" />
                                        <p className="text-lg font-bold">{streamerProfile.following}</p>
                                    </div>
                                    <p className="text-sm text-gray-400">Following</p>
                                </div>
                                <div className="text-center p-3 bg-dark-700 rounded-lg">
                                    <div className="flex items-center justify-center space-x-1 text-pink-400 mb-1">
                                        <TrendingUp className="h-4 w-4" />
                                        <p className="text-lg font-bold">{streamerProfile.giftsReceived.toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm text-gray-400">Gifts Received</p>
                                </div>
                                <div className="text-center p-3 bg-dark-700 rounded-lg">
                                    <div className="flex items-center justify-center space-x-1 text-purple-400 mb-1">
                                        <TrendingDown className="h-4 w-4" />
                                        <p className="text-lg font-bold">{streamerProfile.giftsSent}</p>
                                    </div>
                                    <p className="text-sm text-gray-400">Gifts Sent</p>
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <h3 className="font-semibold mb-2">About</h3>
                                <p className="text-gray-300 text-sm leading-relaxed">{streamerProfile.bio}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleFollowStreamer}
                                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                                        streamerProfile.isFollowing 
                                            ? "bg-gray-600 hover:bg-gray-500 text-white"
                                            : "bg-primary-600 hover:bg-primary-700 text-white"
                                    }`}
                                >
                                    {streamerProfile.isFollowing ? (
                                        <>
                                            <UserCheck className="h-4 w-4" />
                                            <span>Following</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-4 w-4" />
                                            <span>Follow</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleSendDirectMessage}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span>Message</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Request Modal */}
            {showJoinRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-600 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                    <UserPlus className="h-8 w-8 text-primary-600" />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-center mb-2">Request to Join</h2>
                            <p className="text-gray-400 text-center mb-6">
                                Send a request to join this stream with your video. The streamer will be notified and can accept or decline your request.
                            </p>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowJoinRequestModal(false)}
                                    className="flex-1 bg-dark-400 hover:bg-dark-500 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleJoinRequest}
                                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Send Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Viewers List Modal */}
            {showViewersList && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-600 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <div className="flex items-center space-x-3">
                                <Users className="h-6 w-6 text-primary-400" />
                                <h2 className="text-xl font-bold">Viewers ({viewerCount})</h2>
                            </div>
                            <button
                                onClick={() => setShowViewersList(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 max-h-96 overflow-y-auto">
                            <div className="space-y-3">
                                {viewers.map((viewer) => (
                                    <div
                                        key={viewer.id}
                                        className="flex items-center justify-between p-3 bg-dark-500 rounded-lg"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-bold">
                                                        {viewer.username[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-700 ${
                                                    viewer.isOnline ? "bg-green-500" : "bg-dark-300"
                                                }`}>
                                                    <Circle className="h-2 w-2 text-white m-auto mt-0.5" fill="currentColor" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-medium">{viewer.username}</p>
                                                <p className="text-xs text-gray-400">
                                                    Joined {viewer.joinedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs ${
                                            viewer.isOnline
                                                ? "bg-green-900 text-green-300"
                                                : "bg-dark-700 text-gray-400"
                                        }`}>
                                            {viewer.isOnline ? "Online" : "Away"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JoinStreamingRoom;