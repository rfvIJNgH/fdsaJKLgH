import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  Calendar,
  User,
  Tag,
  Image,
  Video,
  Clock,
  Eye,
  MessageCircle,
  LayoutGrid,
  List as ListIcon,
  Play,
  Lock,
  Edit,
  Trash2,
} from "lucide-react";
import { contentService, userService } from "../../services/api";
import {
  getThumbnailUrl,
  isImageUrl,
  isVideoUrl,
} from "../../utils/imageUtils";
import SaveButton from "../../components/Content/SaveButton";
import MediaModal from "./MediaModal";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import PurchaseModal from "./PurchaseModal";
import DeleteConfirmModal from "./DeleteConfirmModal";


interface ContentFile {
  id: number;
  fileUrl: string;
  createdAt: string;
}


interface ContentDetail {
  id: number;
  title: string;
  description: string;
  imageCount: number;
  videoCount: number;
  contentType?: string;
  contentPrice?: number;
  thumbnail: string;
  createdAt: string;
  upvotes: number;
  user: {
    id: string;
    username: string;
    email: string;
  };
  tags: Array<{
    id: number;
    name: string;
  }>;
  files?: ContentFile[];
}


const ContentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpvoted, setIsUpvoted] = useState<boolean>(false);
  const [isUpvoting, setIsUpvoting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFileIndex, setModalFileIndex] = useState(0);
  const [isPurchased, setIsPurchased] = useState<boolean>(false);
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    content: ContentDetail | null;
  }>({ isOpen: false, content: null });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    isDeleting: boolean;
  }>({ isOpen: false, isDeleting: false });


  useEffect(() => {
    if (id) {
      fetchContentDetail();
    }
  }, [id]);


  useEffect(() => {
    if (content && content.files && content.files.length > 1) {
      setViewMode("grid");
    } else {
      setViewMode("list");
    }
  }, [content]);


  useEffect(() => {
    if (isAuthenticated && content) {
      checkUpvoteStatus();
      checkPurchaseStatus();
    }
  }, [isAuthenticated, content]);


  const fetchContentDetail = async () => {
    setIsLoading(true);
    setError(null);


    try {
      const response = await contentService.getContentById(id!);
      setContent(response.data);
    } catch (err) {
      console.error("Error fetching content:", err);
      setError("Content not found or failed to load");
    } finally {
      setIsLoading(false);
    }
  };


  const checkUpvoteStatus = async () => {
    if (!content || !isAuthenticated) return;


    try {
      const response = await contentService.checkUpvoteStatus(content.id);
      setIsUpvoted(response.data.upvoted);
    } catch (error) {
      console.error("Error checking upvote status:", error);
    }
  };


  const checkPurchaseStatus = async () => {
    if (!content || !isAuthenticated || content.contentType?.toLowerCase() !== 'fixed') return;


    try {
      const response = await contentService.checkPurchaseStatus(content.id);
      setIsPurchased(response.data.purchased);
    } catch (error) {
      console.error("Error checking purchase status:", error);
    }
  };


  const handleUpvote = async () => {
    if (!content || !isAuthenticated) {
      toast.error("Please log in to upvote content");
      return;
    }


    if (currentUser?.id && (currentUser.id) === content.user.id) {
      toast.error("You cannot upvote your own content");
      return;
    }


    setIsUpvoting(true);
    try {
      const response = await contentService.upvoteContent(content.id);
      setIsUpvoted(response.data.upvoted);
      setContent((prev) =>
        prev
          ? {
            ...prev,
            upvotes: response.data.upvotes,
          }
          : null
      );


      if (response.data.upvoted) {
        toast.success("Content upvoted!");
      } else {
        toast.success("Upvote removed");
      }
    } catch (error: any) {
      console.error("Error upvoting:", error);
      const errorMessage = error.response?.data || "Failed to upvote content";
      toast.error(errorMessage);
    } finally {
      setIsUpvoting(false);
    }
  };


  const handleEdit = () => {
    if (!content) return;
    navigate(`/content/${content.id}/edit`);
  };


  const handleDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await contentService.deleteContent(content!.id);
      toast.success("Content deleted successfully");
      navigate("/"); // Redirect to home page
    } catch (error: any) {
      console.error("Error deleting content:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete content";
      toast.error(errorMessage);
    } finally {
      setDeleteModal({ isOpen: false, isDeleting: false });
    }
  };

  const handleDeleteClick = () => {
    setDeleteModal({ isOpen: true, isDeleting: false });
  };


  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content?.title,
        text: content?.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };


  const handleMediaClick = (fileIndex: number) => {
    // Check if content needs to be purchased first
    if (content?.contentType?.toLowerCase() === 'fixed' &&
        !isPurchased &&
        currentUser?.id !== content.user.id) {
      setPurchaseModal({ isOpen: true, content });
      return;
    }


    setModalFileIndex(fileIndex);
    setIsModalOpen(true);
  };


  const handlePurchase = () => {
    setIsPurchased(true);
    setPurchaseModal({ isOpen: false, content: null });
    toast.success("Content purchased successfully! You can now view all media.");
  };


  const closePurchaseModal = () => {
    setPurchaseModal({ isOpen: false, content: null });
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);


    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };


  const isVideoFile = (url: string) => {
    return isVideoUrl(url);
  };


  const canViewContent = () => {
    if (!content) return false;
    if (content.contentType?.toLowerCase() !== 'fixed') return true;
    if (currentUser?.id === content.user.id) return true;
    return isPurchased;
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }


  if (error || !content) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Content Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            {error || "The content you are looking for does not exist."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }


  const thumbnailUrl = getThumbnailUrl(content.thumbnail);
  const isImage = isImageUrl(content.thumbnail);


  const HandleDonate = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (content) {
      navigate(`/donate/${content.user.id}`);
    }
  };


  const isOwner = currentUser && currentUser.id && (currentUser.id) === content.user.id;
  const needsPurchase = content.contentType?.toLowerCase() === 'fixed' && !isOwner && !isPurchased;


  return (
    <div className="min-h-screen bg-dark-700">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-600 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>


            <div className="flex items-center space-x-4">
              <button
                onClick={handleShare}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </button>
              {content && <SaveButton contentId={content.id} />}
            </div>
          </div>
        </div>
      </div>


      {/* Purchase Required Notice */}
      {needsPurchase && (
        <div className="bg-orange-600/20 border-b border-orange-600/30">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-orange-400" />
                <span className="text-orange-100 font-medium">
                  This content requires purchase to view all media
                </span>
                <span className="text-orange-200 text-sm">
                  ({content.contentPrice} coins)
                </span>
              </div>
              <button
                onClick={() => setPurchaseModal({ isOpen: true, content })}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                Purchase Now
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Media */}
          <div className="lg:col-span-2">
            {/* Grid/List Toggle */}
            {content.files && content.files.length > 1 && canViewContent() && (
              <div className="flex justify-end mb-4">
                <div className="flex bg-dark-800 rounded-lg p-1">
                  <button
                    className={`p-2 rounded-md transition-colors ${viewMode === "list"
                      ? "bg-primary-500 text-white"
                      : "text-gray-400 hover:text-white hover:bg-dark-600"
                      }`}
                    onClick={() => setViewMode("list")}
                    title="List view"
                  >
                    <ListIcon className="w-5 h-5" />
                  </button>
                  <button
                    className={`p-2 rounded-md transition-colors ${viewMode === "grid"
                      ? "bg-primary-500 text-white"
                      : "text-gray-400 hover:text-white hover:bg-dark-600"
                      }`}
                    onClick={() => setViewMode("grid")}
                    title="Grid view"
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}


            {/* Media Section */}
            {content.files && content.files.length > 0 && canViewContent() ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {content.files.map((file, index) => (
                    <div
                      key={file.id}
                      className="aspect-square bg-dark-800 rounded-xl overflow-hidden flex items-center justify-center relative group cursor-pointer"
                      onClick={() => handleMediaClick(index)}
                    >
                      {isVideoFile(file.fileUrl) ? (
                        <div className="relative w-full h-full">
                          <video
                            src={getThumbnailUrl(file.fileUrl)}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement;
                              target.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center group-hover:bg-white/90 transition-colors">
                              <Play className="w-6 h-6 text-gray-800 ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs flex items-center">
                            <Video className="w-3 h-3 mr-1" />
                            Video
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full group">
                          <img
                            src={getThumbnailUrl(file.fileUrl)}
                            alt={content.title}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 rounded-xl"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {content.files.map((file, index) => (
                    <div
                      key={file.id}
                      className="bg-dark-800 rounded-xl overflow-hidden cursor-pointer group"
                      onClick={() => handleMediaClick(index)}
                    >
                      <div className="relative aspect-video">
                        {isVideoFile(file.fileUrl) ? (
                          <div className="relative w-full h-full">
                            <video
                              src={getThumbnailUrl(file.fileUrl)}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                              onError={(e) => {
                                const target = e.target as HTMLVideoElement;
                                target.style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                              <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center group-hover:bg-white/90 transition-colors">
                                <Play className="w-8 h-8 text-gray-800 ml-1" />
                              </div>
                            </div>
                            <div className="absolute top-4 left-4 bg-black/70 px-3 py-1.5 rounded-full text-white text-sm flex items-center">
                              <Video className="w-4 h-4 mr-1" />
                              Video
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full">
                            <img
                              src={getThumbnailUrl(file.fileUrl)}
                              alt={content.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Fallback to thumbnail or locked content message
              <div
                className="bg-dark-800 rounded-xl overflow-hidden mb-6 cursor-pointer group relative"
                onClick={() => {
                  if (needsPurchase) {
                    setPurchaseModal({ isOpen: true, content });
                  } else {
                    const mockFiles = [{ id: 0, fileUrl: content.thumbnail, createdAt: content.createdAt }];
                    setModalFileIndex(0);
                    setIsModalOpen(true);
                  }
                }}
              >
                <div className="relative aspect-video">
                  {isImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={thumbnailUrl}
                        alt={content.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ background: content.thumbnail }}
                    />
                  )}


                  {/* Locked overlay for premium content */}
                  {needsPurchase && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="h-12 w-12 text-white mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Premium Content</h3>
                        <p className="text-gray-300 mb-4">Purchase to unlock all media files</p>
                        <div className="flex items-center justify-center space-x-2 text-yellow-400">
                          <span className="text-2xl font-bold">{content.contentPrice}</span>
                          <span>coins</span>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Media Count Overlay */}
                  <div className="absolute top-4 left-4 flex space-x-2">
                    {content.imageCount > 0 && (
                      <div className="flex items-center bg-black/70 px-3 py-1.5 rounded-full text-white text-sm">
                        <Image className="w-4 h-4 mr-1" />
                        {content.imageCount} images
                      </div>
                    )}
                    {content.videoCount > 0 && (
                      <div className="flex items-center bg-black/70 px-3 py-1.5 rounded-full text-white text-sm">
                        <Video className="w-4 h-4 mr-1" />
                        {content.videoCount} videos
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-6 mt-3">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleUpvote}
                  disabled={isUpvoting}
                  className={`flex items-center px-4 py-2 rounded-full transition-colors ${isUpvoted
                    ? "bg-red-500 text-white"
                    : "bg-dark-600 text-gray-300 hover:bg-dark-500"
                    } ${isUpvoting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Heart
                    className={`w-5 h-5 mr-2 ${isUpvoted ? "fill-current" : ""
                      }`}
                  />
                  {isUpvoting ? "..." : content.upvotes}
                </button>


                <button className="flex items-center px-4 py-2 bg-dark-600 text-gray-300 rounded-full hover:bg-dark-500 transition-colors">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Comment
                </button>
              </div>
            </div>
          </div>


          {/* Right Column - Info */}
          <div className="lg:col-span-1">
            <div className="bg-dark-800 rounded-xl p-6 sticky top-24">
              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-4 leading-tight">
                {content.title}
              </h1>


              {/* Description */}
              {content.description && (
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {content.description}
                </p>
              )}


              {/* Content Type and Price Info */}
              {content.contentType && (
                <div className="mb-6 p-4 bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Content Type:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                      content.contentType.toLowerCase() === 'fixed' ? 'bg-orange-500' :
                      content.contentType.toLowerCase() === 'fans' ? 'bg-pink-500' :
                      'bg-green-500'
                    }`}>
                      {content.contentType}
                    </span>
                  </div>
                 
                  {content.contentType.toLowerCase() === 'fixed' && content.contentPrice && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Price:</span>
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <span className="font-bold">{content.contentPrice}</span>
                          <span className="text-xs">coins</span>
                        </div>
                      </div>
                     
                      {isPurchased && !isOwner && (
                        <div className="mt-2 p-2 bg-green-600/20 border border-green-600/30 rounded">
                          <p className="text-green-400 text-xs text-center">✓ Already purchased</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}


              {/* Meta Information */}
              <div className="space-y-4 mb-6">
                {/* Author */}
                <div className="flex items-center text-gray-400">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    by{" "}
                    <Link
                      to={`/${content.user.username}/profile`}
                      className="text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      {content.user.username}
                    </Link>
                  </span>
                </div>


                {/* Date */}
                <div className="flex items-center text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {formatDate(content.createdAt)}
                  </span>
                </div>


                {/* Relative Time */}
                <div className="flex items-center text-gray-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {formatRelativeTime(content.createdAt)}
                  </span>
                </div>


                {/* Views (placeholder) */}
                <div className="flex items-center text-gray-400">
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="text-sm">1.2k views</span>
                </div>
              </div>


              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center text-gray-400 mb-3">
                    <Tag className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag) => (
                      <Link
                        key={tag.id}
                        to={`/?tags=${tag.name}`}
                        className="px-3 py-1 bg-dark-600 text-gray-300 rounded-full text-sm hover:bg-dark-500 transition-colors"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}


              {/* Action buttons for content owner vs others */}
              {isOwner ? (
                <div className="flex flex-col gap-3 mb-6">
                  <button
                    onClick={handleEdit}
                    className="flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Content</span>
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    disabled={deleteModal.isDeleting}
                    className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Content</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mb-6">
                  {needsPurchase && (
                    <button
                      onClick={() => setPurchaseModal({ isOpen: true, content })}
                      className="flex items-center justify-center px-4 py-2 text-white rounded-md bg-orange-600 hover:bg-orange-700 transition-colors space-x-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Purchase ({content.contentPrice} coins)</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      toast.success("Reported successfully");
                    }}
                    className="px-4 py-2 text-white rounded-md bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Report
                  </button>
                  <button
                    onClick={HandleDonate}
                    className="px-4 py-2 text-white rounded-md bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    Donate
                  </button>
                </div>
              )}


              {/* Stats */}
              <div className="border-t border-dark-600 pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {content.upvotes}
                    </div>
                    <div className="text-xs text-gray-400">Upvotes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {content.imageCount + content.videoCount}
                    </div>
                    <div className="text-xs text-gray-400">Media Files</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Purchase Modal */}
      {purchaseModal.content && (
        <PurchaseModal
          isOpen={purchaseModal.isOpen}
          onClose={closePurchaseModal}
          content={{
            id: purchaseModal.content.id,
            title: purchaseModal.content.title,
            contentPrice: purchaseModal.content.contentPrice,
            thumbnail: purchaseModal.content.thumbnail,
            user: {
              username: purchaseModal.content.user.username
            }
          }}
          onPurchase={handlePurchase}
        />
      )}


      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, isDeleting: false })}
        onConfirm={handleDelete}
        title={content?.title || ""}
        isDeleting={deleteModal.isDeleting}
      />

      {/* Media Modal */}
      {content.files && content.files.length > 0 && canViewContent() && (
        <MediaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          files={content.files}
          currentIndex={modalFileIndex}
          contentTitle={content.title}
        />
      )}


      {/* Fallback modal for single thumbnail */}
      {(!content.files || content.files.length === 0) && isModalOpen && canViewContent() && (
        <MediaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          files={[{ id: 0, fileUrl: content.thumbnail, createdAt: content.createdAt }]}
          currentIndex={0}
          contentTitle={content.title}
        />
      )}
    </div>
  );
};


export default ContentDetail;