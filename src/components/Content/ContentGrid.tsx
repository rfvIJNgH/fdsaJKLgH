import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Masonry from "react-masonry-css";
import { Image, Film, Coins, Lock, Users, Star, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { contentService, subscriptionService, reviewService } from "../../services/api";
import PurchaseModal from "../../pages/Contents/PurchaseModal";
import SubscribeModal from "../../pages/Contents/SubscribeModal";
import {
  getThumbnailUrl,
  isImageUrl,
  isVideoUrl,
} from "../../utils/imageUtils";
import toast from "react-hot-toast";
import { useCoin } from "../../contexts/CoinContext";
import { ContentItem } from "../../interface/interface";

interface ContentGridProps {
  content: ContentItem[];
}

const ContentGrid: React.FC<ContentGridProps> = ({ content }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCoinData } = useCoin();
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    content: ContentItem | null;
  }>({ isOpen: false, content: null });
  const [subscribeModal, setSubscribeModal] = useState<{
    isOpen: boolean;
    content: ContentItem | null;
  }>({ isOpen: false, content: null });
  const [purchasedContent, setPurchasedContent] = useState<Set<number>>(new Set());
  const [subscribedCreators, setSubscribedCreators] = useState<Set<string>>(new Set());
  const [contentRatings, setContentRatings] = useState<Map<number, { averageRating: string | null; totalReviews: number }>>(new Map());
  const [reviewsModal, setReviewsModal] = useState<{
    isOpen: boolean;
    contentId: number | null;
    contentTitle: string;
    reviews: any[];
    averageRating: string | null;
    totalReviews: number;
    loading: boolean;
  }>({ isOpen: false, contentId: null, contentTitle: "", reviews: [], averageRating: null, totalReviews: 0, loading: false });

  const breakpointColumns = {
    default: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1,
  };

  // Check purchase status for all fixed content
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user) return;

      const fixedContent = content.filter(item => 
        item.contentType?.toLowerCase() === 'fixed' && 
        item.user?.id !== user.id
      );

      const purchaseChecks = await Promise.all(
        fixedContent.map(async (item) => {
          try {
            const response = await contentService.checkPurchaseStatus(item.id);
            return { contentId: item.id, purchased: response.data.purchased };
          } catch (error) {
            console.error(`Error checking purchase for content ${item.id}:`, error);
            return { contentId: item.id, purchased: false };
          }
        })
      );

      const purchased = new Set(
        purchaseChecks
          .filter(check => check.purchased)
          .map(check => check.contentId)
      );

      setPurchasedContent(purchased);
    };

    checkPurchaseStatus();
  }, [content, user]);

  // Check subscription status for all fans content
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) return;

      const fansContent = content.filter(item => 
        item.contentType?.toLowerCase() === 'fans' && 
        item.user?.id !== user.id
      );

      const subscriptionChecks = await Promise.all(
        fansContent.map(async (item) => {
          if (!item.user?.id) return { creatorId: null, subscribed: false };
          
          try {
            const response = await subscriptionService.checkSubscriptionStatus(item.user.id);
            return { creatorId: item.user.id, subscribed: response.data.subscribed };
          } catch (error) {
            console.error(`Error checking subscription for creator ${item.user.id}:`, error);
            return { creatorId: item.user.id, subscribed: false };
          }
        })
      );

      const subscribed = new Set(
        subscriptionChecks
          .filter(check => check.subscribed && check.creatorId)
          .map(check => check.creatorId!)
      );

      setSubscribedCreators(subscribed);
    };

    checkSubscriptionStatus();
  }, [content, user]);

  // Fetch ratings for all content
  useEffect(() => {
    const fetchContentRatings = async () => {
      const ratingPromises = content.map(async (item) => {
        try {
          const response = await reviewService.getContentReviews(item.id, { limit: 1 });
          return {
            contentId: item.id,
            averageRating: response.data.data.averageRating,
            totalReviews: response.data.data.totalReviews,
          };
        } catch (error) {
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

    if (content.length > 0) {
      fetchContentRatings();
    }
  }, [content]);

  const handleReviewClick = async (e: React.MouseEvent, item: ContentItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    setReviewsModal({
      isOpen: true,
      contentId: item.id,
      contentTitle: item.title,
      reviews: [],
      averageRating: contentRatings.get(item.id)?.averageRating || null,
      totalReviews: contentRatings.get(item.id)?.totalReviews || 0,
      loading: true,
    });

    try {
      const response = await reviewService.getContentReviews(item.id, { limit: 50 });
      setReviewsModal((prev) => ({
        ...prev,
        reviews: response.data.data.reviews,
        averageRating: response.data.data.averageRating,
        totalReviews: response.data.data.totalReviews,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviewsModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const closeReviewsModal = () => {
    setReviewsModal({ isOpen: false, contentId: null, contentTitle: "", reviews: [], averageRating: null, totalReviews: 0, loading: false });
  };

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'fixed':
        return 'Fixed';
      case 'fans':
        return 'Fans';
      case 'public':
        return 'Public';
      default:
        return contentType;
    }
  };

  const getContentTypeColor = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'fixed':
        return 'bg-orange-500';
      case 'fans':
        return 'bg-pink-500';
      case 'public':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'fixed':
        return <Lock className="h-3 w-3" />;
      case 'fans':
        return <Users className="h-3 w-3" />;
      case 'public':
        return null;
      default:
        return null;
    }
  };

  const shouldShowPrice = (item: ContentItem) => {
    return item.contentType?.toLowerCase() === 'fixed' &&
      item.contentType?.toLowerCase() !== 'public' &&
      item.contentPrice &&
      item.contentPrice > 0;
  };

  const handleUsernameClick = (e: React.MouseEvent, username: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/${username}/profile`);
  };

  const handleContentClick = (e: React.MouseEvent, item: ContentItem) => {
    const contentType = item.contentType?.toLowerCase();
    const isOwner = user && item.user && user.id === item.user.id;
    
    // If user is the owner, allow normal navigation
    if (isOwner) {
      return;
    }

    // If it's fixed content and not purchased, show purchase modal
    if (contentType === 'fixed' && !purchasedContent.has(item.id)) {
      e.preventDefault();
      setPurchaseModal({ isOpen: true, content: item });
      return;
    }

    // If it's fans content and not subscribed, show subscribe modal
    if (contentType === 'fans' && item.user?.id && !subscribedCreators.has(item.user.id)) {
      e.preventDefault();
      setSubscribeModal({ isOpen: true, content: item });
      return;
    }

    // For public content, already purchased fixed content, or subscribed fans content, allow normal navigation
  };

  const handlePurchase = () => {
    if (purchaseModal.content) {
      // Add the purchased content to the set
      setPurchasedContent(prev => new Set([...prev, purchaseModal.content!.id]));
      
      // Refresh coin data
      if (user?.id) {
        fetchCoinData(user.id);
      }
    }
    setPurchaseModal({ isOpen: false, content: null });
  };

  const handleSubscribe = async (coinAmount: number) => {
    if (!subscribeModal.content?.user?.id || !user) {
      toast.error("Invalid subscription request");
      return;
    }

    try {
      const response = await subscriptionService.subscribeToCreator(
        subscribeModal.content.user.id,
        coinAmount
      );

      // Add the creator to subscribed creators set
      setSubscribedCreators(prev => new Set([...prev, subscribeModal.content!.user!.id!]));
      
      // Refresh coin data
      if (user.id) {
        fetchCoinData(user.id);
      }

      toast.success(`Successfully subscribed to @${subscribeModal.content.user.username}!`);
      setSubscribeModal({ isOpen: false, content: null });
      
      // Navigate to the content after successful subscription
      navigate(`/content/${subscribeModal.content.id}`);

    } catch (error: any) {
      console.error('Subscription error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to subscribe';
      toast.error(errorMessage);
    }
  };

  const closePurchaseModal = () => {
    setPurchaseModal({ isOpen: false, content: null });
  };

  const closeSubscribeModal = () => {
    setSubscribeModal({ isOpen: false, content: null });
  };

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid mt-6"
        columnClassName="masonry-grid-column"
      >
        {content.map((item) => {
          const height = 280;
          const thumbnailUrl = getThumbnailUrl(item.thumbnail);
          const isImage = isImageUrl(item.thumbnail);
          const isOwner = user && item.user && user.id === item.user.id;
          const isPurchased = purchasedContent.has(item.id);
          const isSubscribed = item.user?.id ? subscribedCreators.has(item.user.id) : false;

          return (
            <div key={item.id} className="mb-4 animate-fade-in">
              <Link
                to={`/content/${item.id}`}
                onClick={(e) => handleContentClick(e, item)}
              >
                <div className="group content-card overflow-hidden relative">
                  {/* Content Preview */}
                  <div
                    className="w-full relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                    style={{
                      height: `${height}px`,
                      background: isImage ? "none" : item.thumbnail,
                    }}
                  >
                    {isImage ? (
                      <img
                        src={thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : isVideoUrl(item.thumbnail) ? (
                      <video
                        src={thumbnailUrl}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: item.thumbnail }} />
                    )}

                    {/* Blur overlay for unpurchased fixed content */}
                    {item.contentType?.toLowerCase() === 'fixed' && !isOwner && !isPurchased && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="h-8 w-8 text-white mx-auto mb-2" />
                          <p className="text-white text-sm font-medium">Locked Content</p>
                          <p className="text-gray-300 text-xs">Purchase to view</p>
                        </div>
                      </div>
                    )}

                    {/* Blur overlay for non-subscribed fans content */}
                    {item.contentType?.toLowerCase() === 'fans' && !isOwner && !isSubscribed && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Users className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                          <p className="text-white text-sm font-medium">Fans Only</p>
                          <p className="text-gray-300 text-xs">Subscribe to view</p>
                        </div>
                      </div>
                    )}

                    {/* Media Count and Content Type Indicators */}
                    <div className="absolute top-2 left-2 flex space-x-2 text-white">
                      {/* Media counts */}
                      {item.imageCount > 0 && (
                        <div className="flex items-center bg-black/50 px-1.5 py-0.5 rounded-md text-xs">
                          <span>{item.imageCount}</span>
                          <Image className="h-4 w-4 ml-1" />
                        </div>
                      )}
                      {item.videoCount > 0 && (
                        <div className="flex items-center bg-black/50 px-1.5 py-0.5 rounded-md text-xs">
                          <span>{item.videoCount}</span>
                          <Film className="h-4 w-4 ml-1" />
                        </div>
                      )}
                    </div>

                    {/* Content Type and Price/Status (top right) */}
                    <div className="absolute top-2 right-2 flex flex-col space-y-1">
                      {/* Content Type Badge */}
                      {item.contentType && (
                        <div className={`flex items-center px-2 py-1 rounded-md text-xs font-medium text-white ${getContentTypeColor(item.contentType)}`}>
                          {getContentTypeIcon(item.contentType)}
                          <span className="ml-1">{getContentTypeLabel(item.contentType)}</span>
                        </div>
                      )}
                      
                      {/* Price Badge for fixed content */}
                      {shouldShowPrice(item) && !isPurchased && (
                        <div className="flex items-center bg-yellow-500/90 text-black px-2 py-1 rounded-md text-xs font-bold">
                          <Coins className="h-3 w-3 mr-1" />
                          <span>{item.contentPrice}</span>
                        </div>
                      )}

                      {/* Status badges */}
                      {item.contentType?.toLowerCase() === 'fixed' && !isOwner && isPurchased && (
                        <div className="flex items-center bg-green-500/90 text-white px-2 py-1 rounded-md text-xs font-bold">
                          <span>Purchased</span>
                        </div>
                      )}

                      {item.contentType?.toLowerCase() === 'fans' && !isOwner && isSubscribed && (
                        <div className="flex items-center bg-pink-500/90 text-white px-2 py-1 rounded-md text-xs font-bold">
                          <span>Subscribed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-3 bg-dark-600">
                    <div className="mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm line-clamp-2 font-medium text-white flex-1">
                          {item.title}
                        </p>
                        {/* Rating Display */}
                        {contentRatings.get(item.id)?.totalReviews ? (
                          <button
                            onClick={(e) => handleReviewClick(e, item)}
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
                    </div>
                    
                    {/* Username and additional info */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-2">
                        {item.user?.username && (
                          <button
                            onClick={(e) => handleUsernameClick(e, item.user!.username)}
                            className="text-primary-400 font-medium hover:text-primary-300 transition-colors cursor-pointer"
                          >
                            @{item.user.username}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>{item.upvotes || 0} upvotes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </Masonry>

      {/* Purchase Modal */}
      {purchaseModal.content && (
        <PurchaseModal
          isOpen={purchaseModal.isOpen}
          onClose={closePurchaseModal}
          content={purchaseModal.content}
          onPurchase={handlePurchase}
        />
      )}

      {/* Subscribe Modal */}
      {subscribeModal.content && (
        <SubscribeModal
          isOpen={subscribeModal.isOpen}
          onClose={closeSubscribeModal}
          content={subscribeModal.content}
          onSubscribe={handleSubscribe}
        />
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
                          onClick={(e) => {
                            closeReviewsModal();
                            handleUsernameClick(e, review.username);
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
    </>
  );
};

export default ContentGrid;