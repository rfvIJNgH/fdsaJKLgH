import React, { useState, useEffect } from "react";
import { Upload, Search, Filter, Calendar, SortAsc, SortDesc, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContentGrid from "../../components/Content/ContentGrid";
import Pagination from "../../components/Content/Pagination";
import { contentService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface ContentItem {
    id: number;
    title: string;
    imageCount: number;
    videoCount: number;
    thumbnail: string;
    createdAt: string;
    upvotes: number;
    visibility?: "public" | "premium" | "private";
}

const MyContent: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Filter and search states
    const [contentFilter, setContentFilter] = useState<"all" | "public" | "premium" | "private">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState<"date" | "title" | "views">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "year">("all");
    const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "video" | "image" | "document" | "audio">("all");

    // Content states
    const [content, setContent] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    // Fetch content when filters change
    useEffect(() => {
        if (!user) return;
        fetchMyContent();
    }, [user, currentPage, contentFilter, sortBy, sortOrder, searchQuery, dateFilter, fileTypeFilter]);

    const fetchMyContent = async () => {
        if (!user) return;

        setIsLoading(true);
        setError(null);

        try {
            // Build sort parameter
            const sortParam = sortBy === "date" ? "newest" :
                sortBy === "title" ? "title" :
                    sortBy === "views" ? "hot" : "newest";

            // Fetch user's own content
            const response = await contentService.getContentByUser(
                user.username,
                currentPage,
                sortParam
            );

            let filteredContent = response.data.content;

            // Apply visibility filter
            if (contentFilter !== "all") {
                filteredContent = filteredContent.filter((item: ContentItem) => {
                    // Since the API might not return visibility info, we'll need to handle this
                    // For now, we'll show all content for "all" filter
                    // return contentFilter === "all";
                });
            }

            // Apply search filter
            if (searchQuery.trim()) {
                filteredContent = filteredContent.filter((item: ContentItem) =>
                    item.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            // Apply date filter (this would ideally be done on the backend)
            if (dateFilter !== "all") {
                const now = new Date();
                const filterDate = new Date();

                switch (dateFilter) {
                    case "today":
                        filterDate.setHours(0, 0, 0, 0);
                        break;
                    case "week":
                        filterDate.setDate(now.getDate() - 7);
                        break;
                    case "month":
                        filterDate.setMonth(now.getMonth() - 1);
                        break;
                    case "year":
                        filterDate.setFullYear(now.getFullYear() - 1);
                        break;
                }

                // if (dateFilter !== "all") {
                //     filteredContent = filteredContent.filter((item: ContentItem) =>
                //         new Date(item.createdAt) >= filterDate
                //     );
                // }
            }

            // Apply sort order
            if (sortOrder === "asc") {
                filteredContent.reverse();
            }

            setContent(filteredContent);
            setTotalPages(response.data.pagination.totalPages);
        } catch (err) {
            console.error("Error fetching content:", err);
            setError("Failed to load your content. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = () => {
        navigate("/upload");
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleFilterChange = (newFilter: "all" | "public" | "premium" | "private") => {
        setContentFilter(newFilter);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleSortChange = (newSortBy: "date" | "title" | "views") => {
        setSortBy(newSortBy);
        setCurrentPage(1); // Reset to first page when sorting
    };

    const handleSortOrderChange = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        setCurrentPage(1); // Reset to first page when changing sort order
    };

    const handleDateFilterChange = (newDateFilter: "all" | "today" | "week" | "month" | "year") => {
        setDateFilter(newDateFilter);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleFileTypeFilterChange = (newFileType: "all" | "video" | "image" | "document" | "audio") => {
        setFileTypeFilter(newFileType);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const clearFilters = () => {
        setContentFilter("all");
        setSearchQuery("");
        setDateFilter("all");
        setFileTypeFilter("all");
        setSortBy("date");
        setSortOrder("desc");
        setCurrentPage(1);
    };

    const applyFilters = () => {
        setCurrentPage(1);
        fetchMyContent();
    };

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">My Content</h1>
                <button
                    onClick={handleUpload}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                    <Upload className="w-5 h-5" />
                    Upload Content
                </button>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search your content..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-3 bg-dark-600 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${showFilters
                                ? "bg-primary-600 border-primary-500 text-white"
                                : "bg-dark-400 border-dark-200 text-white hover:bg-gray-700"
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>

                    {/* Sort Options */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => handleSortChange(e.target.value as "date" | "title" | "views")}
                            className="px-3 py-2 bg-dark-400 border border-dark-400 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        >
                            <option value="date">Date</option>
                            <option value="title">Title</option>
                            <option value="views">Views</option>
                        </select>
                        <button
                            onClick={handleSortOrderChange}
                            className="p-2 bg-dark-400 border border-dark-200 rounded-lg text-white hover:bg-dark-100 transition-colors duration-200"
                            title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
                        >
                            {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="bg-dark-600 p-4 rounded-lg border border-dark-600">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Date Filter */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Date Range
                                </label>
                                <select
                                    value={dateFilter}
                                    onChange={(e) => handleDateFilterChange(e.target.value as "all" | "today" | "week" | "month" | "year")}
                                    className="w-full px-3 py-2 bg-dark-400 border border-dark-200 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>

                            {/* Content Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Content Visibility</label>
                                <select
                                    value={contentFilter}
                                    onChange={(e) => handleFilterChange(e.target.value as "all" | "public" | "premium" | "private")}
                                    className="w-full px-3 py-2 bg-dark-400 border border-dark-200 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                >
                                    <option value="all">All Contents</option>
                                    <option value="public">Public Contents</option>
                                    <option value="premium">Sale Contents</option>
                                    <option value="private">Private Contents</option>
                                </select>
                            </div>

                            {/* File Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">File Type</label>
                                <select
                                    value={fileTypeFilter}
                                    onChange={(e) => handleFileTypeFilterChange(e.target.value as "all" | "video" | "image" | "document" | "audio")}
                                    className="w-full px-3 py-2 bg-dark-400 border border-dark-200 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                >
                                    <option value="all">All Types</option>
                                    <option value="video">Videos</option>
                                    <option value="image">Images</option>
                                    <option value="document">Documents</option>
                                    <option value="audio">Audio</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
                            >
                                Clear Filters
                            </button>
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors duration-200"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Display */}
            <div className="flex flex-col items-center">
                <div className="mt-8 w-full">
                    {error ? (
                        <div className="text-center text-red-500 py-12">
                            <div className="text-lg mb-2">Error Loading Content</div>
                            <p className="text-sm">{error}</p>
                            <button
                                onClick={fetchMyContent}
                                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center text-white py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                            <div className="text-lg mb-2">Loading your content...</div>
                        </div>
                    ) : content.length === 0 ? (
                        <div className="text-center text-white py-12">
                            {searchQuery || contentFilter !== "all" || dateFilter !== "all" || fileTypeFilter !== "all" ? (
                                <>
                                    <div className="text-lg mb-2">No content found</div>
                                    <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search terms</p>
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-60" />
                                    <div className="text-lg mb-2">No content yet</div>
                                    <p className="text-sm text-gray-500 mb-4">Upload your first piece of content to get started</p>
                                    <button
                                        onClick={handleUpload}
                                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                                    >
                                        Upload Content
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <ContentGrid content={content} />
                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={(page) => {
                                        setCurrentPage(page);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyContent;