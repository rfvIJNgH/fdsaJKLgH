import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { tradingService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { getThumbnailUrl, isVideoUrl } from "../../utils/imageUtils";
import SkeletonLoader from "../../components/Content/SkeletonLoader";
import MediaModal from "../Contents/MediaModal";

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
                  {/* Media preview */}
                  {isVideo ? (
                    <div className="relative w-full h-full">
                      <video
                        src={getThumbnailUrl(item.fileUrl)}
                        className={`w-full h-full object-cover transition-all duration-300 ${
                          canView ? "" : "blur-md brightness-75"
                        }`}
                        muted
                        preload="metadata"
                      />
                      {canView && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                          <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center group-hover:bg-white/90 transition-colors">
                            <svg className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-full group">
                      <img
                        src={getThumbnailUrl(item.fileUrl)}
                        alt={item.title}
                        className={`w-full h-full object-cover transition-all duration-300 ${
                          canView ? "group-hover:scale-105" : "blur-md brightness-75"
                        }`}
                      />
                      {canView && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      )}
                    </div>
                  )}

                  {/* Overlay for restricted content */}
                  {!canView && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Private (Trade to View)
                      </span>
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
                  <h2 className="text-lg font-semibold text-white mb-2 line-clamp-1">
                    {item.title}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {!isOwner && (
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
    </div>
  );
};

export default TradingPage;