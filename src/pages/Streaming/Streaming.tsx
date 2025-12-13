import React, { useState, useEffect } from "react";
import { Search, X, Users, Wifi, Plus, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateStreamModal from "../../components/Streaming/CreateStreamModal";
import RoomInfoModal from "../../components/Streaming/RoomInfoModal";

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

const Streaming: React.FC = () => {
    const [streams, setStreams] = useState<Stream[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedFilter, setSelectedFilter] = useState<string>("all");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isRoomInfoModalOpen, setIsRoomInfoModalOpen] = useState<boolean>(false);
    const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
    const navigate = useNavigate();

    const filters = ["all", "public", "private", "battle"];

    // Mock data - replace with actual API call
    useEffect(() => {
        const mockStreams: Stream[] = [
            {
                id: "1",
                streamer: {
                    username: "GamerPro123",
                    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
                },
                thumbnail: "https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400",
                joiners: 247,
                type: "public",
            },
            {
                id: "2",
                streamer: {
                    username: "MusicLover",
                    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
                },
                thumbnail: "https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=400",
                joiners: 23,
                type: "private",
            },
            {
                id: "3",
                streamer: {
                    username: "ArtistVibe",
                    avatar: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150",
                },
                thumbnail: "https://images.pexels.com/photos/1183992/pexels-photo-1183992.jpeg?auto=compress&cs=tinysrgb&w=400",
                joiners: 892,
                type: "battle",
            },
            {
                id: "4",
                streamer: {
                    username: "YogaGuru",
                    avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
                },
                thumbnail: "https://images.pexels.com/photos/317157/pexels-photo-317157.jpeg?auto=compress&cs=tinysrgb&w=400",
                joiners: 134,
                type: "public",
            },
            {
                id: "5",
                streamer: {
                    username: "ChefMaster",
                    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
                },
                thumbnail: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400",
                joiners: 456,
                type: "battle",
            },
            {
                id: "6",
                streamer: {
                    username: "CodeNinja",
                    avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150",
                },
                thumbnail: "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=400",
                joiners: 78,
                type: "private",
            },
        ];

        setTimeout(() => {
            setStreams(mockStreams);
            setIsLoading(false);
        }, 1000);
    }, []);

    const filteredStreams = streams.filter((stream) => {
        const matchesSearch = stream.streamer.username.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === "all" || stream.type === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    const formatJoiners = (count: number): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const clearSearch = () => setSearchQuery("");

    const handleCreateStream = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleStreamCreation = (streamData: { title: string; type: "public" | "private" | "battle" }) => {
        console.log("Creating stream:", streamData);
        alert(`Stream "${streamData.title}" of type "${streamData.type}" created successfully!`);
    };

    const handleRoomClick = (stream: Stream) => {
        setSelectedStream(stream);
        setIsRoomInfoModalOpen(true);
    };

    const handleCloseRoomInfoModal = () => {
        setIsRoomInfoModalOpen(false);
        setSelectedStream(null);
    };

    const handleJoinRoom = (streamId: string) => {
        console.log("Joining stream:", streamId);
        navigate(`/streaming/joinstreaming/${streamId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading streams...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-700 text-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header with Create Button, Search and Filters */}
                <div className="mb-8">
                    {/* Top Section: Create Button and Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Live Streams</h1>
                            <p className="text-gray-400">Discover and join amazing live streams</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <input
                                type="text"
                                placeholder="Search streams..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-dark-500 rounded-full py-3 px-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-gray-700 focus:border-primary-500 transition-all"
                            />
                            <Search className="absolute left-4 top-3.5 text-gray-400 h-5 w-5" />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-4 top-3.5 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tags */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-wrap gap-3">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setSelectedFilter(filter)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize ${selectedFilter === filter
                                        ? "bg-primary-600 text-white shadow-lg"
                                        : "bg-dark-500 text-gray-300 hover:bg-dark-500 hover:text-white border border-gray-700"
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                        {/* Create Stream Button */}

                        <button
                            onClick={handleCreateStream}
                            className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 group"
                        >
                            <Video className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                            <span>Start Streaming</span>
                        </button>

                    </div>

                    {/* Live Count */}
                    <div className="flex items-center space-x-2 text-gray-300">
                        <Wifi className="h-5 w-5 text-green-500" />
                        <span>
                            <span className="text-white font-semibold">{filteredStreams.length}</span> streamers live now
                        </span>
                    </div>
                </div>

                {/* Streams Grid */}
                {filteredStreams.length === 0 ? (
                    <div className="text-center py-16">
                        <Wifi className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">
                            No streams found
                        </h3>
                        <p className="text-gray-500">
                            Try adjusting your search or filter.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredStreams.map((stream) => (
                            <div
                                key={stream.id}
                                onClick={() => handleRoomClick(stream)}
                                className="bg-dark-500 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-700 hover:border-gray-600"
                            >
                                {/* Thumbnail */}
                                <div className="relative">
                                    <img
                                        src={stream.thumbnail}
                                        alt={stream.streamer.username}
                                        className="w-full h-48 object-cover"
                                    />

                                    {/* Joiners Count */}
                                    <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                                        <Users className="h-3 w-3" />
                                        <span>{formatJoiners(stream.joiners)}</span>
                                    </div>

                                    {/* Live Indicator */}
                                    <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        <span>LIVE</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    {/* Streamer Info */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={stream.streamer.avatar}
                                                alt={stream.streamer.username}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <p className="text-sm font-medium text-gray-300 truncate">
                                                {stream.streamer.username}
                                            </p>
                                        </div>

                                        {/* Meeting Type Badge */}
                                        <div className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${stream.type === 'public' ? 'bg-green-500 text-white' :
                                            stream.type === 'private' ? 'bg-red-500 text-white' :
                                                'bg-orange-500 text-white'
                                            }`}>
                                            {stream.type}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Stream Modal */}
            <CreateStreamModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onCreateStream={handleStreamCreation}
            />

            {/* Room Info Modal */}
            <RoomInfoModal
                isOpen={isRoomInfoModalOpen}
                onClose={handleCloseRoomInfoModal}
                stream={selectedStream}
                onJoinRoom={handleJoinRoom}
            />
        </div>
    );
};

export default Streaming;