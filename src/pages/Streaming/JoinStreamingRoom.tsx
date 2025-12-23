
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import {
  Users,
  Send,
  Share2,
  Heart,
  Eye,
  X,
  Crown,
  MessageCircle,
  MessageCircleOff,
  Check,
  Gift,
  UserPlus,
  UserCheck,
  Star,
  Coffee,
  Gem,
  Trophy,
  Zap,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { StreamContext } from "../../contexts/StreamContext";
import VideoPlayer from "../../components/Streaming/VideoPlayer";
import toast from "react-hot-toast";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date | string;
  isOwner?: boolean;
  isGift?: boolean;
  giftType?: string;
}

interface Viewer {
  id: string;
  username: string;
  isOnline: boolean;
  joinedAt: Date;
}

interface GiftOption {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  cost: number;
  color: string;
}

interface GiftAnimation {
  id: string;
  type: string;
  color: string;
  icon: React.ComponentType<any>;
  timestamp: number;
}

interface StreamerProfile {
  id: string;
  username: string;
  followers: number;
  following: number;
  giftsReceived: number;
  giftsSent: number;
  joinedDate: Date;
  bio: string;
  isFollowing: boolean;
}

const JoinStreamingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { joinRoom, name, peers, setIsStreamer, socket } = useContext(StreamContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Set as viewer (not streamer) when component mounts
  useEffect(() => {
    console.log('🎬 JoinStreamingRoom mounted, setting as viewer');
    setIsStreamer(false);
  }, [setIsStreamer]);

  // State to track if room is joined
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  // Join room after isStreamer is set
  useEffect(() => {
    if (roomId && !hasJoinedRoom) {
      console.log('🚪 Joining room from JoinStreamingRoom:', roomId);
      // Small delay to ensure isStreamer state is updated
      const timer = setTimeout(() => {
        joinRoom(roomId);
        setHasJoinedRoom(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [roomId, joinRoom, hasJoinedRoom]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatVisible, setIsChatVisible] = useState(true);

  // Modal states
  const [showViewersList, setShowViewersList] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showStreamerProfile, setShowStreamerProfile] = useState(false);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasRequestedToJoin, setHasRequestedToJoin] = useState(false);

  // Stats
  const [isFollowing, setIsFollowing] = useState(false);

  // Gift animations
  const [giftAnimations, setGiftAnimations] = useState<GiftAnimation[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add test message to verify UI rendering works
  useEffect(() => {
    const testMessage: Message = {
      id: 'test-1',
      user: 'System',
      text: 'Welcome! Chat is ready.',
      timestamp: new Date(),
      isOwner: false,
    };
    setMessages([testMessage]);
    console.log('🧪 Test message added to verify UI rendering');
  }, []);

  // Gift options
  const giftOptions: GiftOption[] = [
    { id: "heart", name: "Heart", icon: Heart, cost: 1, color: "text-red-500" },
    { id: "star", name: "Star", icon: Star, cost: 5, color: "text-yellow-500" },
    { id: "coffee", name: "Coffee", icon: Coffee, cost: 10, color: "text-amber-600" },
    { id: "gem", name: "Gem", icon: Gem, cost: 25, color: "text-purple-500" },
    { id: "trophy", name: "Trophy", icon: Trophy, cost: 50, color: "text-orange-500" },
    { id: "zap", name: "Lightning", icon: Zap, cost: 100, color: "text-primary-500" },
  ];
  // Mock streamer profile (in real app, fetch from backend)
  const streamer = location.state as any;
  const streamerProfile: StreamerProfile = {
    id: streamer?.selectedStream.id || "streamer-1",
    username: streamer?.selectedStream.streamer.username || "StreamMaster",
    followers: 15420,
    following: 892,
    giftsReceived: 2847,
    giftsSent: 156,
    joinedDate: new Date(2023, 2, 15),
    bio: "Professional streamer and content creator. I love gaming, music, and connecting with amazing people. Thanks for being part of this community! 🎮🎵",
    isFollowing: isFollowing,
  };

  // Viewers based on connected peers
  const viewers: Viewer[] = [
    {
      id: "me",
      username: name || "Me",
      isOnline: true,
      joinedAt: new Date(),
    },
    ...peers.map((peer) => ({
      id: peer.id,
      username: peer.name || "Anonymous",
      isOnline: true,
      joinedAt: new Date(),
    })),
  ];

  const viewerCount = viewers.filter((v) => v.isOnline).length;

  // Listen for incoming messages after joining room
  useEffect(() => {
    if (!socket || !roomId || !hasJoinedRoom) {
      console.warn('⚠️ Not ready for messages:', { hasSocket: !!socket, roomId, hasJoinedRoom });
      return;
    }

    console.log('📨 Setting up message listener in JoinStreamingRoom for room:', roomId);

    const handleReceiveMessage = (message: Message) => {
      console.log('📥 Received message in JoinStreamingRoom:', message);
      setMessages((prev) => {
        const newMessages = [...prev, message];
        console.log('💬 Updated messages:', newMessages);
        return newMessages;
      });

      // If it's a gift message, add animation
      if (message.isGift && message.giftType) {
        const giftOption = giftOptions.find(g => g.id === message.giftType);
        if (giftOption) {
          const animation: GiftAnimation = {
            id: message.id,
            type: giftOption.id,
            color: giftOption.color,
            icon: giftOption.icon,
            timestamp: Date.now(),
          };
          setGiftAnimations((prev) => [...prev, animation]);
        }
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      console.log('🧹 Cleaning up message listener in JoinStreamingRoom');
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, roomId, hasJoinedRoom]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    console.log('💬 Messages state updated, count:', messages.length, messages);
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Clean up gift animations
  useEffect(() => {
    const timer = setInterval(() => {
      setGiftAnimations((prev) =>
        prev.filter((animation) => Date.now() - animation.timestamp < 3000)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Send message
  const handleSendMessage = () => {
    if (newMessage.trim() && roomId && socket) {
      const message = {
        user: name || "Viewer",
        text: newMessage,
        isOwner: false,
      };
      console.log('📤 Sending message from JoinStreamingRoom:', { roomId, message });
      socket.emit('sendMessage', { roomId, message });
      setNewMessage("");
    } else {
      console.warn('⚠️ Cannot send message:', { hasMessage: !!newMessage.trim(), roomId, hasSocket: !!socket });
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Send gift
  const handleSendGift = (gift: GiftOption) => {
    if (roomId && socket) {
      const giftMessage = {
        user: name || "Viewer",
        text: `Sent a ${gift.name}! 🎁`,
        isGift: true,
        giftType: gift.id,
      };
      socket.emit('sendMessage', { roomId, message: giftMessage });
      setShowGiftModal(false);
      toast.success(`Sent ${gift.name} gift!`);
    }
  };

  // Share stream
  const handleShare = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Stream link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Follow/Unfollow streamer
  const handleFollowStreamer = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? "Unfollowed streamer" : "Following streamer!");
  };

  // Request to join
  const handleJoinRequest = () => {
    if (roomId && socket) {
      setHasRequestedToJoin(true);
      setShowJoinRequestModal(false);
      toast.success("Join request sent to streamer!");

      const requestMessage = {
        user: "System",
        text: `${name || "Viewer"} has requested to join with video`,
      };
      socket.emit('sendMessage', { roomId, message: requestMessage });
    }
  };

  // Toggle chat
  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  // Leave stream
  const leaveStream = () => {
    // Unmute all media before leaving
    const mediaElements = document.querySelectorAll('video, audio');
    mediaElements.forEach((element) => {
      (element as HTMLMediaElement).muted = false;
    });

    navigate("/streaming");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-500 font-semibold">LIVE</span>
            </div>

            {/* Streamer Info */}
            <button
              onClick={() => setShowStreamerProfile(true)}
              className="group flex items-center space-x-3 hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center border-2 border-yellow-500">
                  <span className="text-sm font-bold">
                    {streamerProfile.username[0].toUpperCase()}
                  </span>
                </div>
                <div className="absolute -top-1 -right-1">
                  <Crown className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-lg font-bold group-hover:text-primary-400 transition-colors">
                  {streamerProfile.username}
                </h1>
                <p className="text-xs text-gray-400">
                  {streamerProfile.followers.toLocaleString()} followers
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowViewersList(true)}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              <Users className="h-5 w-5" />
              <span>{viewerCount}</span>
            </button>

            <button
              onClick={handleShare}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              {copiedLink ? (
                <Check className="h-4 w-4" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span>{copiedLink ? "Copied" : "Share"}</span>
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

      <div className="flex h-[calc(100vh-80px)] relative">
        {/* Chat Toggle Button */}
        <button
          onClick={toggleChat}
          className={`fixed top-1/2 -translate-y-1/2 z-20 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 ${isChatVisible ? "right-[320px]" : "right-4"
            }`}
          title={isChatVisible ? "Hide Chat" : "Show Chat"}
        >
          {isChatVisible ? (
            <MessageCircleOff className="h-5 w-5" />
          ) : (
            <MessageCircle className="h-5 w-5" />
          )}
        </button>

        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Container */}
          <div className="flex-1 bg-black relative">
            <VideoPlayer isFullScreen={true} />

            {/* Gift Animations Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {giftAnimations.map((animation) => (
                <div
                  key={animation.id}
                  className="absolute animate-bounce"
                  style={{
                    left: Math.random() * 80 + 10 + "%",
                    top: Math.random() * 60 + 20 + "%",
                    animationDuration: "2s",
                  }}
                >
                  <div className="relative">
                    <animation.icon
                      className={`h-20 w-20 ${animation.color} drop-shadow-lg`}
                    />
                    <div className="absolute -inset-4 bg-white bg-opacity-20 rounded-full animate-ping"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stream Stats Overlay */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-60 px-4 py-2 rounded-lg backdrop-blur-sm z-10">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{viewerCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Viewer Controls */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setShowGiftModal(true)}
                className="bg-primary-600 hover:from-pink-700 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <Gift className="h-5 w-5" />
                <span>Send Gift</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div
          className={`${isChatVisible ? "w-80" : "w-0"
            } bg-gray-800 border-l border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}
        >
          {/* Chat Header */}
          <div
            className={`p-4 border-b border-gray-700 ${isChatVisible ? "opacity-100" : "opacity-0"
              } transition-opacity duration-300`}
          >
            <h3 className="font-semibold text-lg">Live Chat</h3>
            <p className="text-sm text-gray-400">{viewerCount} viewers active</p>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className={`flex-1 overflow-y-auto p-4 space-y-3 ${isChatVisible ? "opacity-100" : "opacity-0"
              } transition-opacity duration-300`}
          >
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8">
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.isGift
                    ? "bg-gradient-to-r from-pink-500 to-purple-500"
                    : message.isOwner
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                      : "bg-gradient-to-r from-primary-500 to-purple-500"
                    }`}
                >
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
                    <span
                      className={`text-sm font-semibold ${message.isGift
                        ? "text-pink-400"
                        : message.isOwner
                          ? "text-yellow-400"
                          : "text-primary-400"
                        }`}
                    >
                      {message.user}
                      {message.isOwner && (
                        <Crown className="h-3 w-3 inline ml-1" />
                      )}
                      {message.isGift && (
                        <Gift className="h-3 w-3 inline ml-1" />
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p
                    className={`text-sm break-words ${message.isGift
                      ? "text-pink-300 font-medium"
                      : "text-gray-300"
                      }`}
                  >
                    {message.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div
            className={`p-4 border-t border-gray-700 ${isChatVisible ? "opacity-100" : "opacity-0"
              } transition-opacity duration-300`}
          >
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
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
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
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
                    className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-all duration-200 transform hover:scale-105 border border-gray-600"
                  >
                    <div className="text-center">
                      <gift.icon className={`h-8 w-8 mx-auto mb-2 ${gift.color}`} />
                      <p className="font-medium text-white">{gift.name}</p>
                      <p className="text-sm text-gray-400">{gift.cost} coins</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-400 text-center">
                  Your balance:{" "}
                  <span className="text-yellow-400 font-semibold">250 coins</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streamer Profile Modal */}
      {showStreamerProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center border-2 border-yellow-500">
                    <span className="text-2xl font-bold">
                      {streamerProfile.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Crown className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {streamerProfile.username}
                  </h2>
                  <p className="text-sm text-gray-400">Content Creator</p>
                  <p className="text-xs text-gray-500">
                    Joined {streamerProfile.joinedDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStreamerProfile(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 text-primary-400 mb-1">
                    <UserPlus className="h-4 w-4" />
                    <p className="text-lg font-bold">
                      {streamerProfile.followers.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">Followers</p>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 text-green-400 mb-1">
                    <Users className="h-4 w-4" />
                    <p className="text-lg font-bold">{streamerProfile.following}</p>
                  </div>
                  <p className="text-sm text-gray-400">Following</p>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 text-pink-400 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <p className="text-lg font-bold">
                      {streamerProfile.giftsReceived.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">Gifts Received</p>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded-lg">
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
                <p className="text-gray-300 text-sm leading-relaxed">
                  {streamerProfile.bio}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleFollowStreamer}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${isFollowing
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-primary-600 hover:bg-primary-700 text-white"
                    }`}
                >
                  {isFollowing ? (
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
                  onClick={() => {
                    setShowStreamerProfile(false);
                    toast.success("DM feature coming soon!");
                  }}
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
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-primary-900 rounded-full flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-primary-400" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-center mb-2">
                Request to Join
              </h2>
              <p className="text-gray-400 text-center mb-6">
                Send a request to join this stream with your video. The streamer
                will be notified and can accept or decline your request.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowJoinRequestModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
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
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
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
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {viewer.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${viewer.isOnline ? "bg-green-500" : "bg-gray-600"
                            }`}
                        ></div>
                      </div>
                      <div>
                        <p className="font-medium">{viewer.username}</p>
                        <p className="text-xs text-gray-400">
                          Joined{" "}
                          {viewer.joinedAt.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs ${viewer.isOnline
                        ? "bg-green-900 text-green-300"
                        : "bg-gray-800 text-gray-400"
                        }`}
                    >
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