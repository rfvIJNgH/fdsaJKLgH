import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { tradingService, tradingReviewService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { getThumbnailUrl, isVideoUrl } from "../../utils/imageUtils";
import SkeletonLoader from "../../components/Content/SkeletonLoader";
import MediaModal from "../Contents/MediaModal";
import { Star, X } from "lucide-react";

interface TradingContent {
  id: number;
  userId: number;
  title: string;
  description: string;
  fileUrl: string;
  createdAt: string;
  isTraded: boolean;
  hasAccess?: boolean;
}

const TradingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tradingContent, setTradingContent] = useState<TradingContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTradingId, setSelectedTradingId] = useState<number | null>(null);
  const [myTradingContent, setMyTradingContent] = useState<TradingContent[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [modalContentLoading, setModalContentLoading] = useState(false);

  // Media modal state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedMediaContent, setSelectedMediaContent] = useState<TradingContent | null>(null);

  // Review modal state
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    tradingContentId: number | null;
    tradingContentTitle: string;
    rating: number;
    reviewText: string;
    loading: boolean;
    existingReview: boolean;
  }>({
    isOpen: false,
    tradingContentId: null,
    tradingContentTitle: "",
    rating: 0,
    reviewText: "",
    loading: false,
    existingReview: false,
  });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Content ratings state
  const [contentRatings, setContentRatings] = useState<Map<number, { averageRating: string | null; totalReviews: number }>>(new Map());
  
  // Reviews view modal state (for viewing all reviews)
  const [reviewsViewModal, setReviewsViewModal] = useState<{
    isOpen: boolean;
    tradingContentId: number | null;
    tradingContentTitle: string;
    reviews: any[];
    averageRating: string | null;
    totalReviews: number;
    loading: boolean;
  }>({
    isOpen: false,
    tradingContentId: null,
    tradingContentTitle: "",
    reviews: [],
    averageRating: null,
    totalReviews: 0,
    loading: false,
  });

  useEffect(() => {
    const fetchTradingContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await tradingService.listTradingContent();
        setTradingContent(response.data);
      } catch (err) {
        console.log(err);
        setError("Failed to load trading content.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTradingContent();
  }, []);

  // Fetch ratings for all trading content
  useEffect(() => {
    const fetchContentRatings = async () => {
      const ratingPromises = tradingContent.map(async (item) => {
        try {
          const response = await tradingReviewService.getReviews(item.id);
          return {
            contentId: item.id,
            averageRating: response.data.data.averageRating,
            totalReviews: response.data.data.totalReviews,
          };
        } catch {
          return { contentId: item.id, averageRating: null, totalReviews: 0 };
        }
      });

      const ratings = await Promise.all(ratingPromises);
      const ratingsMap = new Map<number, { averageRating: string | null; totalReviews: number }>();
      ratings.forEach((r) => {
        ratingsMap.set(r.contentId, { averageRating: r.averageRating, totalReviews: r.totalReviews });
      });
      setContentRatings(ratingsMap);
    };

    if (tradingContent.length > 0) {
      fetchContentRatings();
    }
  }, [tradingContent]);

  // Fetch pending trade requests count
  useEffect(() => {
    const fetchPendingRequestsCount = async () => {
      try {
        const response = await tradingService.listTradeRequests();
        setPendingRequestsCount(response.data.length);
      } catch (err) {
        console.log(err);
        // Don't show error for this, just set count to 0
        setPendingRequestsCount(0);
      }
    };
    fetchPendingRequestsCount();
  }, []);

  // Fetch my trading content for modal
  const fetchMyTradingContent = async () => {
    setModalContentLoading(true);
    try {
      const response = await tradingService.listMyTradingContent();
      setMyTradingContent(response.data || []);
    } catch (err) {
      console.log(err);
      setMyTradingContent([]);
    } finally {
      setModalContentLoading(false);
    }
  };

  // Open modal and fetch user's own trading content
  const handleTradeClick = (tradingId: number) => {
    setSelectedTradingId(tradingId);
    setShowModal(true);
    setModalError(null);
    setModalSuccess(false);
    setSelectedOfferId(null);
    fetchMyTradingContent();
  };

  // Handle trade request submission
  const handleTradeSubmit = async () => {
    if (!selectedTradingId || !selectedOfferId) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await tradingService.sendTradeRequest(selectedTradingId, selectedOfferId);
      setModalSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        // Refresh the trading content to update hasAccess
        const fetchTradingContent = async () => {
          try {
            const response = await tradingService.listTradingContent();
            setTradingContent(response.data);
          } catch (err) {
            console.log(err);
          }
        };
        fetchTradingContent();
      }, 1200);
    } catch (err) {
      console.log(err);
      setModalError("Failed to send trade request.");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle media click to open media modal
  const handleMediaClick = (item: TradingContent) => {
    const isOwner = user && Number(user.id) === Number(item.userId);
    const canView = isOwner || item.hasAccess;
    
    if (!canView) {
      // If user can't view, open trade modal instead
      handleTradeClick(item.id);
      return;
    }

    setSelectedMediaContent(item);
    setIsMediaModalOpen(true);
  };

  // Close media modal
  const closeMediaModal = () => {
    setIsMediaModalOpen(false);
    setSelectedMediaContent(null);
  };

  // Open review modal
  const handleReviewClick = async (item: TradingContent) => {
    setReviewModal({
      isOpen: true,
      tradingContentId: item.id,
      tradingContentTitle: item.title,
      rating: 0,
      reviewText: "",
      loading: true,
      existingReview: false,
    });
    setReviewSubmitStatus(null);
    setHoveredStar(0);

    // Fetch existing review if any
    try {
      const response = await tradingReviewService.getUserReview(item.id);
      if (response.data.data) {
        setReviewModal((prev) => ({
          ...prev,
          rating: parseFloat(response.data.data.rating),
          reviewText: response.data.data.review_text || "",
          existingReview: true,
          loading: false,
        }));
      } else {
        setReviewModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.log(err);
      setReviewModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Close review modal
  const closeReviewModal = () => {
    setReviewModal({
      isOpen: false,
      tradingContentId: null,
      tradingContentTitle: "",
      rating: 0,
      reviewText: "",
      loading: false,
      existingReview: false,
    });
    setReviewSubmitStatus(null);
    setHoveredStar(0);
  };

  // Submit review
  const handleReviewSubmit = async () => {
    if (!reviewModal.tradingContentId || reviewModal.rating === 0) return;

    setReviewModal((prev) => ({ ...prev, loading: true }));
    try {
      await tradingReviewService.createReview({
        tradingContentId: reviewModal.tradingContentId,
        rating: reviewModal.rating,
        reviewText: reviewModal.reviewText,
      });
      setReviewSubmitStatus({
        success: true,
        message: reviewModal.existingReview ? "Review updated!" : "Review submitted!",
      });
      setTimeout(() => {
        closeReviewModal();
      }, 1200);
    } catch (err) {
      console.log(err);
      setReviewSubmitStatus({ success: false, message: "Failed to submit review." });
      setReviewModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Open reviews view modal (to see all reviews)
  const handleViewReviews = async (e: React.MouseEvent, item: TradingContent) => {
    e.preventDefault();
    e.stopPropagation();

    setReviewsViewModal({
      isOpen: true,
      tradingContentId: item.id,
      tradingContentTitle: item.title,
      reviews: [],
      averageRating: contentRatings.get(item.id)?.averageRating || null,
      totalReviews: contentRatings.get(item.id)?.totalReviews || 0,
      loading: true,
    });

    try {
      const response = await tradingReviewService.getReviews(item.id);
      setReviewsViewModal((prev) => ({
        ...prev,
        reviews: response.data.data.reviews,
        averageRating: response.data.data.averageRating,
        totalReviews: response.data.data.totalReviews,
        loading: false,
      }));
    } catch (err) {
      console.log(err);
      setReviewsViewModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Close reviews view modal
  const closeReviewsViewModal = () => {
    setReviewsViewModal({
      isOpen: false,
      tradingContentId: null,
      tradingContentTitle: "",
      reviews: [],
      averageRating: null,
      totalReviews: 0,
      loading: false,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary-500">Trading Content</h1>
        <div className="flex space-x-3">
          <Link
            to="/trading/requests"
            className="px-4 py-2 bg-dark-700 text-white rounded-full font-semibold hover:bg-dark-600 transition-colors relative"
          >
            Trade Requests
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </Link>
          <Link
            to="/trading/upload"
            className="px-4 py-2 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors"
          >
            + Upload
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div>Loading trading content...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : tradingContent?.length === 0 ? (
        <div className="text-gray-400">No trading content found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {tradingContent?.map((item) => {
            const isOwner = user && Number(user.id) === Number(item.userId);
            const canView = isOwner || item.hasAccess;
            const isVideo = isVideoUrl(item.fileUrl);
            
            return (
              <div
                key={item.id}
                className="bg-dark-800 rounded-lg shadow-lg overflow-hidden flex flex-col"
              >
                <div 
                  className="relative h-56 w-full flex items-center justify-center bg-dark-700 cursor-pointer group"
                  onClick={() => handleMediaClick(item)}
                >
                  {/* Media preview - show actual content only if user has access */}
                  {canView ? (
                    isVideo ? (
                      <div className="relative w-full h-full">
                        <video
                          src={getThumbnailUrl(item.fileUrl)}
                          className="w-full h-full object-cover transition-all duration-300"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                          <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center group-hover:bg-white/90 transition-colors">
                            <svg className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full group">
                        <img
                          src={getThumbnailUrl(item.fileUrl)}
                          alt={item.title}
                          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    )
                  ) : (
                    /* Default blurred placeholder for restricted content */
                    <div className="relative w-full h-full bg-gradient-to-br from-dark-600 via-dark-500 to-dark-600">
                      <div className="absolute inset-0 backdrop-blur-xl bg-dark-500/50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-dark-400/50 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Private (Trade to View)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Owner badge */}
                  {isOwner && (
                    <span className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                      My Content
                    </span>
                  )}

                  {/* Video indicator */}
                  {isVideo && canView && (
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
                      </svg>
                      Video
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-lg font-semibold text-white line-clamp-1 flex-1">
                      {item.title}
                    </h2>
                    {/* Rating Display */}
                    {contentRatings.get(item.id)?.totalReviews ? (
                      <button
                        onClick={(e) => handleViewReviews(e, item)}
                        className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors shrink-0"
                      >
                        <Star className="h-3.5 w-3.5 fill-yellow-400" />
                        <span className="font-medium">
                          {contentRatings.get(item.id)?.averageRating || "0"}
                        </span>
                        <span className="text-gray-400">
                          ({contentRatings.get(item.id)?.totalReviews})
                        </span>
                      </button>
                    ) : null}
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {!isOwner && (
                      <div className="flex items-center gap-2">
                        {item.hasAccess ? (
                          <>
                            <span className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-full font-medium text-sm border border-green-500/30">
                              Traded
                            </span>
                            <button
                              className="px-3 py-1.5 bg-yellow-500 text-black rounded-full font-medium hover:bg-yellow-400 transition-colors flex items-center gap-1 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReviewClick(item);
                              }}
                            >
                              <Star className="h-3.5 w-3.5" />
                              Review
                            </button>
                          </>
                        ) : (
                          <button
                            className="px-4 py-1.5 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTradeClick(item.id);
                            }}
                          >
                            Trade
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-dark-900 rounded-lg shadow-xl w-full max-w-md mx-2 p-6 relative animate-fadeIn">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
              onClick={() => setShowModal(false)}
              disabled={modalLoading}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-primary-500 mb-4">
              Offer Your Content for Trade
            </h2>
            {modalError && (
              <div className="text-red-500 mb-2">{modalError}</div>
            )}
            {modalSuccess && (
              <div className="text-green-500 mb-2">Trade request sent!</div>
            )}
            <div className="mb-4 max-h-48 overflow-y-auto">
              {modalContentLoading ? (
                <SkeletonLoader count={3} />
              ) : myTradingContent?.length === 0 ? (
                <div className="text-gray-400 text-sm">
                  You have no trading content to offer.{" "}
                  <Link
                    to="/trading/upload"
                    className="underline text-primary-500"
                  >
                    Upload now
                  </Link>
                  .
                </div>
              ) : (
                <ul>
                  {myTradingContent?.map((content) => (
                    <li key={content.id} className="flex items-center mb-2">
                      <input
                        type="radio"
                        id={`offer-${content.id}`}
                        name="offer"
                        value={content.id}
                        checked={selectedOfferId === content.id}
                        onChange={() => setSelectedOfferId(content.id)}
                        disabled={modalLoading}
                        className="mr-2 accent-primary-500"
                      />
                      <img
                        src={getThumbnailUrl(content.fileUrl)}
                        alt={content.title}
                        className="w-12 h-12 object-cover rounded mr-2 border border-dark-700"
                      />
                      <label
                        htmlFor={`offer-${content.id}`}
                        className="text-white cursor-pointer"
                      >
                        {content.title}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              className="w-full py-2 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
              onClick={handleTradeSubmit}
              disabled={
                modalLoading ||
                !selectedOfferId ||
                modalSuccess ||
                modalContentLoading
              }
            >
              {modalLoading ? "Sending..." : "Send Trade Request"}
            </button>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {selectedMediaContent && (
        <MediaModal
          isOpen={isMediaModalOpen}
          onClose={closeMediaModal}
          files={[{
            id: selectedMediaContent.id,
            fileUrl: selectedMediaContent.fileUrl,
            createdAt: selectedMediaContent.createdAt
          }]}
          currentIndex={0}
          contentTitle={selectedMediaContent.title}
        />
      )}

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-600 rounded-xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-dark-400 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {reviewModal.existingReview ? "Update Your Review" : "Write a Review"}
                </h3>
                <p className="text-sm text-gray-400 truncate">{reviewModal.tradingContentTitle}</p>
              </div>
              <button
                onClick={closeReviewModal}
                className="p-2 hover:bg-dark-500 rounded-lg transition-colors"
                disabled={reviewModal.loading}
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {reviewModal.loading && !reviewSubmitStatus ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <>
                  {/* Star Rating */}
                  <div className="mb-4">
                    <p className="text-gray-300 mb-2 text-sm">Rating</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewModal((prev) => ({ ...prev, rating: star }))}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          className="p-1 transition-transform hover:scale-110"
                          disabled={reviewModal.loading}
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              (hoveredStar || reviewModal.rating) >= star
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-500"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {reviewModal.rating > 0 && (
                      <p className="text-yellow-400 text-sm mt-1">{reviewModal.rating}.0 / 5.0</p>
                    )}
                  </div>

                  {/* Review Text */}
                  <div className="mb-4">
                    <p className="text-gray-300 mb-2 text-sm">Review (optional)</p>
                    <textarea
                      value={reviewModal.reviewText}
                      onChange={(e) => setReviewModal((prev) => ({ ...prev, reviewText: e.target.value }))}
                      placeholder="Share your experience with this trading content..."
                      className="w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                      rows={4}
                      disabled={reviewModal.loading}
                    />
                  </div>

                  {/* Status Message */}
                  {reviewSubmitStatus && (
                    <div
                      className={`mb-4 p-3 rounded-lg text-sm ${
                        reviewSubmitStatus.success
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {reviewSubmitStatus.message}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewModal.rating === 0 || reviewModal.loading}
                    className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reviewModal.loading
                      ? "Submitting..."
                      : reviewModal.existingReview
                      ? "Update Review"
                      : "Submit Review"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reviews View Modal */}
      {reviewsViewModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-600 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-dark-400 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Reviews</h3>
                <p className="text-sm text-gray-400 truncate">{reviewsViewModal.tradingContentTitle}</p>
              </div>
              <button
                onClick={closeReviewsViewModal}
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
                      parseFloat(reviewsViewModal.averageRating || "0") >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : parseFloat(reviewsViewModal.averageRating || "0") >= star - 0.5
                        ? "fill-yellow-400/50 text-yellow-400"
                        : "text-gray-500"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white font-medium">
                {reviewsViewModal.averageRating || "0"} / 5.0
              </span>
              <span className="text-gray-400 text-sm">
                ({reviewsViewModal.totalReviews} {reviewsViewModal.totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>

            {/* Reviews List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {reviewsViewModal.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : reviewsViewModal.reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No reviews yet
                </div>
              ) : (
                reviewsViewModal.reviews.map((review: any) => (
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
                            closeReviewsViewModal();
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

export default TradingPage;