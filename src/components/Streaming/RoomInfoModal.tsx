import React from "react";
import { X, Users, Video, Calendar, Clock, Globe, Lock, Swords } from "lucide-react";

interface Stream {
    id: string;
    streamer: {
        username: string;
        avatar: string;
    };
    thumbnail: string;
    joiners: number;
    type: "public" | "private" | "battle";
}

interface RoomInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    stream: Stream | null;
    onJoinRoom: (streamId: string) => void;
}

const RoomInfoModal: React.FC<RoomInfoModalProps> = ({
    isOpen,
    onClose,
    stream,
    onJoinRoom
}) => {
    if (!isOpen || !stream) return null;

    const formatJoiners = (count: number): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'public':
                return <Globe className="h-5 w-5" />;
            case 'private':
                return <Lock className="h-5 w-5" />;
            case 'battle':
                return <Swords className="h-5 w-5" />;
            default:
                return <Video className="h-5 w-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'public':
                return 'text-green-400 bg-green-900/30 border-green-500/50';
            case 'private':
                return 'text-red-400 bg-red-900/30 border-red-500/50';
            case 'battle':
                return 'text-orange-400 bg-orange-900/30 border-orange-500/50';
            default:
                return 'text-blue-400 bg-blue-900/30 border-blue-500/50';
        }
    };

    const handleJoin = () => {
        onJoinRoom(stream.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-dark-800 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="relative">
                    <img
                        src={stream.thumbnail}
                        alt={stream.streamer.username}
                        className="w-full h-48 object-cover rounded-t-2xl"
                    />
                    
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Live indicator */}
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                    </div>

                    {/* Viewers count overlay */}
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold">{formatJoiners(stream.joiners)} viewers</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Streamer info */}
                    <div className="flex items-center space-x-4 mb-6">
                        <img
                            src={stream.streamer.avatar}
                            alt={stream.streamer.username}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                        />
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white mb-1">
                                {stream.streamer.username}
                            </h2>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getTypeColor(stream.type)}`}>
                                {getTypeIcon(stream.type)}
                                <span className="capitalize">{stream.type} Stream</span>
                            </div>
                        </div>
                    </div>

                    {/* Stream details */}
                    <div className="space-y-4 mb-6">
                        <div className="bg-dark-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-white mb-3">Stream Details</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400 flex items-center space-x-2">
                                        <Users className="h-4 w-4" />
                                        <span>Current Viewers</span>
                                    </span>
                                    <span className="text-white font-semibold">{formatJoiners(stream.joiners)}</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400 flex items-center space-x-2">
                                        <Clock className="h-4 w-4" />
                                        <span>Started</span>
                                    </span>
                                    <span className="text-white font-semibold">2 hours ago</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400 flex items-center space-x-2">
                                        <Video className="h-4 w-4" />
                                        <span>Quality</span>
                                    </span>
                                    <span className="text-white font-semibold">1080p HD</span>
                                </div>
                            </div>
                        </div>

                        {/* Stream description */}
                        <div className="bg-dark-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-white mb-2">About this stream</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {stream.type === 'battle' 
                                    ? "Join this epic battle stream where streamers compete in real-time challenges!"
                                    : stream.type === 'private'
                                    ? "This is an exclusive private stream. Join to experience unique content."
                                    : "Welcome to this public stream! Join the community and enjoy the live content."
                                }
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={handleJoin}
                            className="flex-1 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <Video className="h-5 w-5" />
                            <span>Join Stream</span>
                        </button>
                        
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-dark-600 hover:bg-dark-500 text-gray-300 hover:text-white rounded-xl border border-gray-600 hover:border-gray-500 font-medium transition-all duration-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomInfoModal;