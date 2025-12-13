import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Masonry from "react-masonry-css";
import { Image, Film, Coins, Lock, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { contentService, subscriptionService } from "../../services/api";
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
                      <p className="text-sm line-clamp-2 font-medium text-white">
                        {item.title}
                      </p>
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
    </>
  );
};

export default ContentGrid;