import React, { useState, useEffect, useCallback } from "react";
import { Search, FileX, RefreshCw } from "lucide-react";
import ContentGrid from "../components/Content/ContentGrid";
import FilterBar from "../components/Content/FilterBar";
import Pagination from "../components/Content/Pagination";
import { contentService } from "../services/api";
import { useSearch } from "../contexts/SearchContext";
import { ContentItem } from "../interface/interface";

// Sort types
type SortOption = "hot" | "top" | "new" | "shuffle";

// Filter types
interface Filters {
  tags?: string[];
  minUpvotes?: number;
  fromDate?: string;
}

const Home: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeSort, setActiveSort] = useState<SortOption>("hot");
  const [filters, setFilters] = useState<Filters>({});
  const { searchQuery, searchResults, isSearching } = useSearch();

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await contentService.getContent({
        page: currentPage,
        sort: activeSort,
        ...filters,
      });
      console.log("Content;", response.data.content);
      setContent(response.data.content);
      setTotalPages(response.data.pagination.totalPages);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching content:", error);
      // Fallback to mock data if API fails

      setTotalPages(5);
      setIsLoading(false);
    }
  }, [currentPage, activeSort, filters]);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Use search results when there's a search query
      setContent(searchResults);
      setTotalPages(1); // Search results don't have pagination for now
    } else {
      // Fetch regular content when no search query
      fetchContent();
    }
  }, [searchQuery, searchResults, fetchContent]);

  const handleSortChange = (sort: SortOption) => {
    setActiveSort(sort);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = () => {
    if (isSearching) {
      // If searching, you might want to trigger a new search
      // This would depend on your search context implementation
      return;
    }
    fetchContent();
  };

  const clearFiltersAndSearch = () => {
    setFilters({});
    // Clear search would depend on your search context
    // searchContext.clearSearch();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <FilterBar
        activeSort={activeSort}
        onSortChange={handleSortChange}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Search Results Indicator */}
      {isSearching && (
        <div className="mt-4 mb-6 p-4 bg-dark-800 rounded-lg border border-dark-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary-400" />
              <span className="text-white font-medium">
                Search results for "{searchQuery}"
              </span>
              <span className="text-gray-400">
                ({content.length} {content.length === 1 ? "result" : "results"})
              </span>
            </div>
            {content.length === 0 && (
              <span className="text-gray-400 text-sm">
                No content found matching your search
              </span>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : content.length === 0 ? (
        /* Empty State */
        <div className="mt-12 mb-16 text-center">
          <div className="max-w-md mx-auto">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-dark-800 rounded-full flex items-center justify-center border-2 border-dark-600">
                <FileX className="w-12 h-12 text-gray-500" />
              </div>
            </div>

            {/* Title and Description */}
            <h3 className="text-2xl font-bold text-white mb-3">
              {isSearching ? "No Results Found" : "No Content Available"}
            </h3>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              {isSearching
                ? `We couldn't find any content matching "${searchQuery}". Try adjusting your search terms or filters.`
                : "There's no content to display right now. Check back later or try adjusting your filters."}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isSearching ? (
                <button
                  onClick={clearFiltersAndSearch}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Clear Search</span>
                </button>
              ) : (
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              )}

              {(isSearching || Object.keys(filters).length > 0) && (
                <button
                  onClick={clearFiltersAndSearch}
                  className="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-gray-300 font-medium rounded-lg transition-colors duration-200 border border-dark-600"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Additional Help Text */}
            {!isSearching && (
              <div className="mt-8 p-4 bg-dark-800 rounded-lg border border-dark-600">
                <p className="text-sm text-gray-400">
                  <strong className="text-gray-300">Tip:</strong> Content may be loading or there might be network issues.
                  Try refreshing the page or check your internet connection.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <ContentGrid content={content} />
          {!isSearching && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Home;