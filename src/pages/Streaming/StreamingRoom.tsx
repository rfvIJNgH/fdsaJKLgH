import React, { useState, useRef, useEffect } from "react";
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Users,
    Send,
    Settings,
    Share,
    Heart,
    Eye,
    X,
    Crown,
    Circle,
    MessageCircle,
    MessageCircleOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
    id: string;
    user: string;
    text: string;
    timestamp: Date;
    isOwner?: boolean;
}

interface Viewer {
    id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
    joinedAt: Date;
}

const StreamingRoom: React.FC = () => {
    // Stream states
    const [isStreamLive, setIsStreamLive] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);

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
    const [showViewersList, setShowViewersList] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [showEndStreamModal, setShowEndStreamModal] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const onlineViewers = viewers.filter(v => v.isOnline);
    const viewerCount = onlineViewers.length;

    const navigate = useNavigate();

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Initialize camera
    useEffect(() => {
        if (videoRef.current && isCameraOn) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => console.error("Error accessing camera:", err));
        }
    }, [isCameraOn]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const message: Message = {
                id: Date.now().toString(),
                user: "StreamMaster",
                text: newMessage,
                timestamp: new Date(),
                isOwner: true,
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

    const toggleCamera = () => {
        setIsCameraOn(!isCameraOn);
    };

    const toggleMic = () => {
        setIsMicOn(!isMicOn);
    };

    const endStream = () => {
        setShowEndStreamModal(true);
    };

    const confirmEndStream = () => {
        setIsStreamLive(false);
        setShowEndStreamModal(false);
        navigate("/streaming");
    };

    const cancelEndStream = () => {
        setShowEndStreamModal(false);
    };
    const toggleChat = () => {
        setIsChatVisible(!isChatVisible);
    };

    return (
        <div className="min-h-screen bg-dark-700 text-white">
            {/* Header */}
            <div className="bg-dark-600 border-b border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-red-500 font-semibold">LIVE</span>
                        </div>
                        <h1 className="text-xl font-bold">My Awesome Stream</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setShowViewersList(true)}
                            className="flex items-center space-x-2 bg-dark-500 hover:bg-dark-400 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Users className="h-5 w-5" />
                            <span>{viewerCount}</span>
                        </button>

                        <button className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                            <Share className="h-4 w-4" />
                            <span>Share</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-80px)] relative">
                {/* Chat Toggle Button - Always Visible */}
                <button
                    onClick={toggleChat}
                    className={`fixed top-1/2 -translate-y-1/2 z-20 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 ${isChatVisible ? 'right-[320px]' : 'right-4'
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
                <div className="flex-1 flex flex-col">
                    {/* Video Container */}
                    <div className="flex-1 bg-black relative">
                        {isCameraOn ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-dark-600">
                                <div className="text-center">
                                    <VideoOff className="h-24 w-24 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 text-lg">Camera is off</p>
                                </div>
                            </div>
                        )}

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
                    </div>

                    {/* Stream Controls */}
                    <div className="bg-dark-600 p-4">
                        <div className="flex items-center justify-center space-x-4">
                            <button
                                onClick={toggleMic}
                                className={`p-3 rounded-full transition-colors ${isMicOn
                                    ? "bg-dark-500 hover:bg-dark-400"
                                    : "bg-red-600 hover:bg-red-700"
                                    }`}
                            >
                                {isMicOn ? (
                                    <Mic className="h-5 w-5" />
                                ) : (
                                    <MicOff className="h-5 w-5" />
                                )}
                            </button>

                            <button
                                onClick={toggleCamera}
                                className={`p-3 rounded-full transition-colors ${isCameraOn
                                    ? "bg-dark-500 hover:bg-dark-400"
                                    : "bg-red-600 hover:bg-red-700"
                                    }`}
                            >
                                {isCameraOn ? (
                                    <Video className="h-5 w-5" />
                                ) : (
                                    <VideoOff className="h-5 w-5" />
                                )}
                            </button>

                            <button className="p-3 rounded-full bg-dark-500 hover:bg-dark-400 transition-colors">
                                <Settings className="h-5 w-5" />
                            </button>

                            <button
                                onClick={endStream}
                                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                End Stream
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chat Panel */}
                <div className={`${isChatVisible ? 'w-80' : 'w-0'} bg-dark-600 border-l border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}>
                    {/* Chat Header */}
                    <div className={`p-4 border-b border-gray-700 ${isChatVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
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
                                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold">
                                        {message.user[0].toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-sm font-semibold ${message.isOwner ? "text-yellow-400" : "text-primary-400"
                                            }`}>
                                            {message.user}
                                            {message.isOwner && <Crown className="h-3 w-3 inline ml-1" />}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 break-words">{message.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className={`p-4 border-t border-gray-700 ${isChatVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
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
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-700 ${viewer.isOnline ? "bg-green-500" : "bg-dark-300"
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
                                        <div className={`px-2 py-1 rounded-full text-xs ${viewer.isOnline
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

            {/* End Stream Confirmation Modal */}
            {showEndStreamModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-700 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <VideoOff className="h-8 w-8 text-red-600" />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-center mb-2">End Stream?</h2>
                            <p className="text-gray-400 text-center mb-6">
                                Are you sure you want to end your live stream? This action cannot be undone and all viewers will be disconnected.
                            </p>

                            <div className="flex space-x-3">
                                <button
                                    onClick={cancelEndStream}
                                    className="flex-1 bg-dark-400 hover:bg-dark-500 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmEndStream}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    End Stream
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StreamingRoom;