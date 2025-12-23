import { useContext, useEffect, useState, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Send,
  Settings,
  Share2,
  Heart,
  Eye,
  X,
  Crown,
  MessageCircle,
  MessageCircleOff,
  Copy,
  Check,
  Globe,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import VideoPlayer from "../../components/Streaming/VideoPlayer";
import { StreamContext } from "../../contexts/StreamContext";
import { streamService } from "../../services/stream_api";
import toast from "react-hot-toast";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date | string;
  isOwner?: boolean;
}

interface Viewer {
  id: string;
  username: string;
  isOnline: boolean;
  joinedAt: Date;
}

const StreamingRoom: React.FC = () => {
  const { roomId, name, title, streamType, price, peers, stream, leaveRoom, setIsStreamer, setRoomId, setName, setTitle, setStreamType, setPrice, joinRoom, socket } = useContext(StreamContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const [hasJoined, setHasJoined] = useState(false);

  // Stream states
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [streamTitle, setStreamTitle] = useState("My Live Stream");

  // Set as streamer and room ID from URL when component mounts
  useEffect(() => {
    console.log('🎥 StreamingRoom mounted with roomId:', urlRoomId);
    setIsStreamer(true);
    if (urlRoomId) {
      setRoomId(urlRoomId);
    }
    
    // Set stream data from navigation state
    const streamData = location.state as any;
    if (streamData) {
      console.log('📊 Setting stream data from navigation state:', streamData);
      setName(streamData.name);
      setTitle(streamData.title);
      setStreamType(streamData.streamType);
      setPrice(streamData.price);
    }
    
    return () => setIsStreamer(false);
  }, [setIsStreamer, urlRoomId, setRoomId, setName, setTitle, setStreamType, setPrice, location.state]);

  // Join room after stream is ready
  useEffect(() => {
    if (stream && urlRoomId && !hasJoined) {
      console.log('🚪 Streamer joining room:', urlRoomId);
      joinRoom(urlRoomId);
      setHasJoined(true);
    }
  }, [stream, urlRoomId, hasJoined, joinRoom]);

  // Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatVisible, setIsChatVisible] = useState(true);

  // Modal states
  const [showViewersList, setShowViewersList] = useState(false);
  const [showEndStreamModal, setShowEndStreamModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Stats
  const [likes, setLikes] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add test message to verify UI rendering works
  useEffect(() => {
    const testMessage: Message = {
      id: 'test-1',
      user: 'System',
      text: 'Chat is ready! Send your first message.',
      timestamp: new Date(),
      isOwner: false,
    };
    setMessages([testMessage]);
    console.log('🧪 Test message added to verify UI rendering');
  }, []);

  // Viewers based on connected peers + self
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

  // Save stream to backend
  useEffect(() => {
    if (!roomId) return;

    console.log('💾 Saving stream to backend with roomId:', roomId);
    const saveStream = async () => {
      try {
        await streamService.createStream({
          roomId,
          streamerName: name || "Anonymous",
          title: title,
          streamType: streamType,
          price: price,
        });
        console.log('streamerName',name);
        console.log('title',title);
        console.log('streamType',streamType);
        console.log('price',price);
        console.log('✅ Stream saved to backend:', roomId);
      } catch (err) {
        console.error('❌ Error saving stream:', err);
      }
    };

    saveStream();
  }, [roomId, name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomId) {
        streamService.endStream(roomId).catch(() => {});
      }
    };
  }, [roomId]);

  // Setup message listeners after joining room
  useEffect(() => {
    if (!socket || !roomId || !hasJoined) {
      console.warn('⚠️ Not ready for messages:', { hasSocket: !!socket, roomId, hasJoined });
      return;
    }

    console.log('📨 Setting up message listener in StreamingRoom for room:', roomId);

    const handleReceiveMessage = (message: Message) => {
      console.log('📥 Received message in StreamingRoom:', message);
      setMessages((prev) => {
        const newMessages = [...prev, message];
        console.log('💬 Updated messages:', newMessages);
        return newMessages;
      });
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      console.log('🧹 Cleaning up message listener in StreamingRoom');
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, roomId, hasJoined]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    console.log('💬 Messages state updated, count:', messages.length, messages);
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Toggle camera
  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (newMessage.trim() && roomId && socket) {
      const message = {
        user: name || "Me",
        text: newMessage,
        isOwner: true,
      };
      console.log('📤 Sending message from StreamingRoom:', { roomId, message });
      socket.emit('sendMessage', { roomId, message });
      setNewMessage("");
    } else {
      console.warn('⚠️ Cannot send message:', { hasMessage: !!newMessage.trim(), roomId, hasSocket: !!socket });
    }
  };

  // Handle Enter key in chat
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Share room link
  const handleShare = () => {
    const link = `${window.location.origin}/streaming/joinstreaming/${roomId}`;
    console.log('📋 Sharing room link:', link, 'RoomID:', roomId);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Room link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // End stream
  const endStream = () => {
    setShowEndStreamModal(true);
  };

  const confirmEndStream = async () => {
    try {
      if (roomId) {
        await streamService.endStream(roomId);
      }
      leaveRoom();
      setShowEndStreamModal(false);
      navigate("/streaming");
    } catch (err) {
      console.error("Error ending stream:", err);
      toast.error("Failed to end stream");
    }
  };

  const cancelEndStream = () => {
    setShowEndStreamModal(false);
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  // Debug current state
  console.log('🔍 StreamingRoom render:', {
    roomId, 
    socketConnected: socket?.connected, 
    messagesCount: messages.length,
    messages: messages,
    hasJoined,
    isChatVisible
  });

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
            <h1 className="text-xl font-bold">{streamTitle}</h1>
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
              className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              {copiedLink ? (
                <Check className="h-4 w-4" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span>{copiedLink ? "Copied" : "Share"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)] relative">
        {/* Chat Toggle Button - Always Visible */}
        <button
          onClick={toggleChat}
          className={`fixed top-1/2 -translate-y-1/2 z-20 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 ${
            isChatVisible ? "right-[320px]" : "right-4"
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

            {/* Stream Stats Overlay */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-60 px-4 py-2 rounded-lg backdrop-blur-sm">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{viewerCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stream Controls */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition-colors ${
                  isMicOn
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                title={isMicOn ? "Mute" : "Unmute"}
              >
                {isMicOn ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full transition-colors ${
                  isCameraOn
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                title={isCameraOn ? "Turn off camera" : "Turn on camera"}
              >
                {isCameraOn ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </button>

              {/* <button
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button> */}

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
        <div
          className={`${
            isChatVisible ? "w-80" : "w-0"
          } bg-gray-800 border-l border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}
        >
          {/* Chat Header */}
          <div
            className={`p-4 border-b border-gray-700 ${
              isChatVisible ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300`}
          >
            <h3 className="font-semibold text-lg">Live Chat</h3>
            <p className="text-sm text-gray-400">{viewerCount} viewers active</p>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className={`flex-1 overflow-y-auto p-4 space-y-3 ${
              isChatVisible ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300`}
          >
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8">
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">
                    {message.user[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-semibold ${
                        message.isOwner ? "text-yellow-400" : "text-primary-400"
                      }`}
                    >
                      {message.user}
                      {message.isOwner && (
                        <Crown className="h-3 w-3 inline ml-1" />
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 break-words">
                    {message.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div
            className={`p-4 border-t border-gray-700 ${
              isChatVisible ? "opacity-100" : "opacity-0"
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

      {/* Viewers List Modal */}
      {showViewersList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-primary-400" />
                <h2 className="text-xl font-bold">
                  Viewers ({viewerCount})
                </h2>
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
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                            viewer.isOnline ? "bg-green-500" : "bg-gray-600"
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
                      className={`px-2 py-1 rounded-full text-xs ${
                        viewer.isOnline
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

      {/* End Stream Confirmation Modal */}
      {showEndStreamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center">
                  <VideoOff className="h-8 w-8 text-red-400" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-center mb-2">
                End Stream?
              </h2>
              <p className="text-gray-400 text-center mb-6">
                Are you sure you want to end your live stream? This action
                cannot be undone and all viewers will be disconnected.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={cancelEndStream}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
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