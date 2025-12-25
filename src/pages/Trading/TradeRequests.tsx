import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tradingService, tradingReviewService } from "../../services/api";
import { getThumbnailUrl } from "../../utils/imageUtils";
import { Star, X } from "lucide-react";

interface TradeRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  tradingContentId: number;
  offeredContentId: number;
  status: string;
  createdAt: string;
  tradingContentTitle: string;
  tradingContentFileUrl: string;
  offeredContentTitle: string;
  offeredContentFileUrl: string;
  fromUsername: string;
}

const TradeRequests: React.FC = () => {
  const navigate = useNavigate();
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingRequests, setProcessingRequests] = useState<Set<number>>(
    new Set()
  );
  const [contentRatings, setContentRatings] = useState<Map<number, { averageRating: string | null; totalReviews: number }>>(new Map());
  
  // Reviews view modal state
  const [reviewsModal, setReviewsModal] = useState<{
    isOpen: boolean;
    contentId: number | null;
    contentTitle: string;
    reviews: any[];
    averageRating: string | null;
    totalReviews: number;
    loading: boolean;
  }>({
    isOpen: false,
    contentId: null,
    contentTitle: "",
    reviews: [],
    averageRating: null,
    totalReviews: 0,
    loading: false,
  });

  useEffect(() => {
    fetchTradeRequests();
  }, []);

  // Fetch ratings for offered content
  useEffect(() => {
    const fetchContentRatings = async () => {
      const ratingPromises = tradeRequests.map(async (request) => {
        try {
          const response = await tradingReviewService.getReviews(request.offeredContentId);
          return {
            contentId: request.offeredContentId,
            averageRating: response.data.data.averageRating,
            totalReviews: response.data.data.totalReviews,
          };
        } catch {
          return { contentId: request.offeredContentId, averageRating: null, totalReviews: 0 };
        }
      });

      const ratings = await Promise.all(ratingPromises);
      const ratingsMap = new Map<number, { averageRating: string | null; totalReviews: number }>();
      ratings.forEach((r) => {
        ratingsMap.set(r.contentId, { averageRating: r.averageRating, totalReviews: r.totalReviews });
      });
      setContentRatings(ratingsMap);
    };

    if (tradeRequests.length > 0) {
      fetchContentRatings();
    }
  }, [tradeRequests]);

  const fetchTradeRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tradingService.listTradeRequests();
      setTradeRequests(response.data);
    } catch (err) {
      console.log(err);
      setError("Failed to load trade requests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    setProcessingRequests((prev) => new Set(prev).add(requestId));
    try {
      await tradingService.acceptTradeRequest(requestId);
      // Remove the accepted request from the list
      setTradeRequests((prev) => prev.filter((req) => req.id !== requestId));
      setSuccessMessage("Trade request accepted successfully!");
      setError(null);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.log(err);
      setError("Failed to accept trade request.");
      setSuccessMessage(null);
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: number) => {
    setProcessingRequests((prev) => new Set(prev).add(requestId));
    try {
      await tradingService.rejectTradeRequest(requestId);
      // Remove the rejected request from the list
      setTradeRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.log(err);
      setError("Failed to reject trade request.");
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Open reviews modal
  const handleViewReviews = async (contentId: number, contentTitle: string) => {
    setReviewsModal({
      isOpen: true,
      contentId,
      contentTitle,
      reviews: [],
      averageRating: contentRatings.get(contentId)?.averageRating || null,
      totalReviews: contentRatings.get(contentId)?.totalReviews || 0,
      loading: true,
    });

    try {
      const response = await tradingReviewService.getReviews(contentId);
      setReviewsModal((prev) => ({
        ...prev,
        reviews: response.data.data.reviews,
        averageRating: response.data.data.averageRating,
        totalReviews: response.data.data.totalReviews,
        loading: false,
      }));
    } catch (err) {
      console.log(err);
      setReviewsModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Close reviews modal
  const closeReviewsModal = () => {
    setReviewsModal({
      isOpen: false,
      contentId: null,
      contentTitle: "",
      reviews: [],
      averageRating: null,
      totalReviews: 0,
      loading: false,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center">Loading trade requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary-500">Trade Requests</h1>
        <button
          onClick={fetchTradeRequests}
          className="px-4 py-2 bg-dark-700 text-white rounded-full font-semibold hover:bg-dark-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-600 text-white rounded-lg text-center">
          {successMessage}
        </div>
      )}

      {tradeRequests?.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <div className="text-lg mb-2">No pending trade requests</div>
          <div className="text-sm">
            When other users want to trade for your content, their requests will
            appear here.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {tradeRequests?.map((request) => (
            <div
              key={request.id}
              className="bg-dark-800 rounded-lg shadow-lg p-6 border border-dark-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                    {request?.fromUsername?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {request?.fromUsername} wants to trade
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(request?.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Your Content (What they want) */}
                <div className="bg-dark-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">
                    Your Content (What they want)
                  </h3>
                  <div className="flex items-center space-x-3">
                    <img
                      src={getThumbnailUrl(request.tradingContentFileUrl)}
                      alt={request.tradingContentTitle}
                      className="w-16 h-16 object-cover rounded border border-dark-600"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium line-clamp-2">
                        {request.tradingContentTitle}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Their Content (What they're offering) */}
                <div className="bg-dark-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">
                    Their Content (What they're offering)
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 rounded border border-dark-600 bg-gradient-to-br from-dark-600 via-dark-500 to-dark-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium line-clamp-2">
                        {request.offeredContentTitle}
                      </div>
                      {/* Rating Display */}
                      {contentRatings.get(request.offeredContentId)?.totalReviews ? (
                        <button
                          onClick={() => handleViewReviews(request.offeredContentId, request.offeredContentTitle)}
                          className="flex items-center gap-1 mt-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                          <Star className="h-3.5 w-3.5 fill-yellow-400" />
                          <span className="font-medium">
                            {contentRatings.get(request.offeredContentId)?.averageRating || "0"}
                          </span>
                          <span className="text-gray-400 hover:text-gray-300">
                            ({contentRatings.get(request.offeredContentId)?.totalReviews} reviews)
                          </span>
                        </button>
                      ) : (
                        <div className="text-xs text-gray-500 mt-1">No reviews yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleAccept(request.id)}
                  disabled={processingRequests.has(request.id)}
                  className="flex-1 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  {processingRequests.has(request.id)
                    ? "Processing..."
                    : "Accept Trade"}
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={processingRequests.has(request.id)}
                  className="flex-1 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {processingRequests.has(request.id)
                    ? "Processing..."
                    : "Reject Trade"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews Modal */}
      {reviewsModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-600 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-dark-400 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Reviews</h3>
                <p className="text-sm text-gray-400 truncate">{reviewsModal.contentTitle}</p>
              </div>
              <button
                onClick={closeReviewsModal}
                className="p-2 hover:bg-dark-500 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Average Rating */}
            <div className="px-4 py-3 bg-dark-500/50 flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      parseFloat(reviewsModal.averageRating || "0") >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : parseFloat(reviewsModal.averageRating || "0") >= star - 0.5
                        ? "fill-yellow-400/50 text-yellow-400"
                        : "text-gray-500"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white font-medium">
                {reviewsModal.averageRating || "0"} / 5.0
              </span>
              <span className="text-gray-400 text-sm">
                ({reviewsModal.totalReviews} {reviewsModal.totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>

            {/* Reviews List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {reviewsModal.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : reviewsModal.reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No reviews yet
                </div>
              ) : (
                reviewsModal.reviews.map((review: any) => (
                  <div key={review.id} className="bg-dark-500 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                          <span className="text-primary-400 text-sm font-medium">
                            {review.username?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            closeReviewsModal();
                            navigate(`/${review.username}/profile`);
                          }}
                          className="text-primary-400 font-medium hover:text-primary-300 transition-colors"
                        >
                          @{review.username}
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">{review.rating}</span>
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-gray-300 text-sm">{review.review_text}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeRequests;
