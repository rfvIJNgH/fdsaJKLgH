import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ContentGrid from "../../components/Content/ContentGrid";
import Pagination from "../../components/Content/Pagination";
import ShareModal from "./ShareModal";
import EditProfileModal from "./EditProfileModal";
import StatusIndicator from "./StatusIndicator";
import {
  MoreVertical,
  X,
  Share2,
  Edit,
  Crown,
  Gift,
  Camera
} from "lucide-react";
import {
  contentService,
  userService,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { UserProfile } from "../../interface/interface";
import { receiverProfile } from "../../interface/interface";
import { ContentItem } from "../../interface/interface";


const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, isAuthenticated, updateUserProfile, isVip } = useAuth();
  const navigate = useNavigate();


  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<"All Contents" | "Public Contents" | "Premium Contents" | "Fans Contents">(
    "All Contents"
  );


  const [content, setContent] = useState<ContentItem[]>([]);
  const [fansContent, setFansContent] = useState<ContentItem[]>([]);
  const [premiumContent, setPremiumContent] = useState<ContentItem[]>([]);
  const [publicContent, setPublicContent] = useState<ContentItem[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [pageContent, setPageContent] = useState(1);
  const [totalPagesContent, setTotalPagesContent] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);


  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    title: "",
    description: ""
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [receiverProfile, setReceiverProfile] = useState<receiverProfile | null>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };


    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showReportModal) handleCancelReport();
        if (showShareModal) setShowShareModal(false);
        if (showEditModal) setShowEditModal(false);
      }
    };


    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showReportModal, showShareModal, showEditModal]);


  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await userService.getPublicUserProfile(username!);
        
        // Check if this is the current user's profile to show actual VIP status
        const isCurrentUserProfile = currentUser && currentUser.username === username;
        
        // Enhanced profile data
        const enhancedProfile = {
          ...response.data,
          user: {
            ...response.data.user,
          },
          isVip: isCurrentUserProfile ? isVip : Math.random() > 0.5, // Use actual VIP status for current user
          status: ['online', 'away', 'offline'][Math.floor(Math.random() * 3)] as 'online' | 'away' | 'offline',
          isLive: Math.random() > 0.7,
          giftsReceived: {
            total: 1247,
            value: 3580
          },
          giftsSent: {
            total: 892,
            value: 2340
          }
        };
        
        const receiverProfile = {
          user: {
            ...response.data.user,
          },
          status: ['online', 'away', 'offline'][Math.floor(Math.random() * 3)] as 'online' | 'away' | 'offline',
          isLive: Math.random() > 0.7
        }
        setReceiverProfile(receiverProfile);
        setProfile(enhancedProfile);


        // Check follow status if user is authenticated and not viewing their own profile
        if (currentUser && currentUser.username !== username) {
          try {
            const followStatus = await userService.checkFollowStatus(username!);
            setIsFollowing(followStatus.data.isFollowing);
          } catch (error) {
            console.error("Error checking follow status:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [username, currentUser, isVip]);


  useEffect(() => {
    if (!profile) return;
    const fetchUserContent = async () => {
      setIsLoadingContent(true);
      try {
        const response = await contentService.getContentByUser(
          username!,
          pageContent,
          "hot"
        );
        //Filter content by type
        const allContent = response.data.content;
        const publicContent = allContent.filter((item: ContentItem) => {
          return item.contentType === 'public'
        });
        console.log("PublicContent:", publicContent);
        const premiumContent = allContent.filter((item: ContentItem) => {
          return item.contentType === 'fixed'
        });
        const fansContent = allContent.filter((item: ContentItem) => {
          return item.contentType === 'fans'
        });
        setContent(allContent);
        setFansContent(fansContent);
        setPremiumContent(premiumContent);
        setPublicContent(publicContent);
        console.log("AllContent:", allContent);
        setTotalPagesContent(response.data.pagination.totalPages);
      } catch (error) {
        console.error("Error fetching user content:", error);
      } finally {
        setIsLoadingContent(false);
      }
    };
    fetchUserContent();
  }, [profile, pageContent, username]);


  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (isFollowing) {
        await userService.unfollowUser(profile.user.username);
        setIsFollowing(false);
        setProfile((prev) =>
          prev
            ? {
              ...prev,
              followerCount: prev.followerCount - 1,
            }
            : null
        );
      } else {
        await userService.followUser(profile.user.username);
        setIsFollowing(true);
        setProfile((prev) =>
          prev
            ? {
              ...prev,
              followerCount: prev.followerCount + 1,
            }
            : null
        );
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };


  const handleMessage = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (profile) {
      navigate(`/messages/${profile.user.id}`, { state: { receiverProfile } });
    }
  };


  const handleOpenReportModal = () => {
    setShowMenu(false);
    setShowReportModal(true);
    setReportData({ title: "", description: "" });
  };


  const handleCancelReport = () => {
    setShowReportModal(false);
    setReportData({ title: "", description: "" });
  };


  const handleSubmitReport = async () => {
    if (!reportData.title.trim() || !reportData.description.trim()) {
      alert("Please fill in both title and description");
      return;
    }


    setIsSubmittingReport(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Report submitted:", {
        reportedUser: profile?.user.username,
        title: reportData.title,
        description: reportData.description
      });
      alert("Report submitted successfully");
      setShowReportModal(false);
      setReportData({ title: "", description: "" });
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };


  const handleEditProfile = (updatedProfile: Partial<UserProfile['user']>) => {
    // Update local profile state
    setProfile(prev => prev ? {
      ...prev,
      user: { ...prev.user, ...updatedProfile }
    } : null);
   
    // Update auth context with new profile data
    updateUserProfile({
      username: updatedProfile.username,
      profile_image: updatedProfile.profile_image
    });
  };


  const isOwnProfile = currentUser && currentUser.username === profile?.user.username;


  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }


  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">User not found</h2>
          <p className="text-gray-400">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-dark-600">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-dark-700/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Profile Image */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 border-4 border-gray-600 relative group">
                {profile.user.profile_image ? (
                  <img
                    src={profile.user.profile_image}
                    alt={profile.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {profile.user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera className="text-white" size={24} />
                  </div>
                )}
              </div>


              {/* Status Indicator */}
              <div className="absolute -bottom-2 -right-2">
                <StatusIndicator
                  status={profile.status}
                  isLive={profile.isLive}
                  className="bg-dark-700 rounded-full px-2 py-1 border border-gray-600"
                />
              </div>
            </div>


            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center space-x-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">
                  {profile.user.username}
                </h1>
                {profile.isVip && (
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-2 py-1 rounded-full">
                    <Crown size={16} className="text-white" />
                    <span className="text-xs font-semibold text-white">VIP</span>
                  </div>
                )}
                {profile.isLive && (
                  <div className="flex items-center space-x-1 bg-red-500 px-2 py-1 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-xs font-semibold text-white">LIVE</span>
                  </div>
                )}
              </div>


              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-primary-400">{content.length}</div>
                  <div className="text-xs text-gray-400">Posts</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                  <Link to={`/profile/${profile.user.username}/followers`} className="block hover:bg-gray-600/30 transition-colors rounded-lg">
                    <div className="text-lg font-semibold text-primary-400">{profile.followerCount}</div>
                    <div className="text-xs text-gray-400">Followers</div>
                  </Link>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                  <Link to={`/profile/${profile.user.username}/following`} className="block hover:bg-gray-600/30 transition-colors rounded-lg">
                    <div className="text-lg font-semibold text-primary-400">{profile.followingCount}</div>
                    <div className="text-xs text-gray-400">Following</div>
                  </Link>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-primary-400">{profile.upvotesGiven}</div>
                  <div className="text-xs text-gray-400">Upvotes</div>
                </div>
              </div>
            </div>
          </div>


          {/* Gift Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-700/50">
            <div className="bg-gradient-to-r from-primary-500/10 to-primary-500/10 rounded-lg p-4 border border-primary-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="text-pink-400" size={20} />
                <span className="text-sm font-medium text-pink-400">Gifts Received</span>
              </div>
              <div className="text-2xl font-bold text-white">${profile.giftsReceived.value}</div>
              <div className="text-xs text-gray-400">{profile.giftsReceived.total} gifts</div>
            </div>
            <div className="bg-gradient-to-r from-primary-500/10 to-primary-500/10 rounded-lg p-4 border border-primary-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="text-primary-400" size={20} />
                <span className="text-sm font-medium text-primary-400">Gifts Sent</span>
              </div>
              <div className="text-2xl font-bold text-white">${profile.giftsSent.value}</div>
              <div className="text-xs text-gray-400">{profile.giftsSent.total} gifts</div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  <Edit size={16} />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
                {!isVip && (
                  <button
                    onClick={() => navigate('/upgradeplan')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    <Crown size={16} />
                    <span>Upgrade to VIP</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleFollow}
                  className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 ${isFollowing
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
                <button
                  onClick={handleMessage}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  Message
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all transform hover:scale-105"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 z-10 mt-2 w-48 bg-dark-700 rounded-lg shadow-lg border border-gray-700">
                      <button
                        onClick={handleOpenReportModal}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 rounded-lg"
                      >
                        Report User
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>


        {/* Tabs */}
        {!isOwnProfile && (
          <>
            <div className="flex space-x-8 mb-8 border-b border-gray-700">
              <button
                className={`pb-4 px-2 text-sm font-medium transition-colors ${activeTab === "All Contents"
                  ? "border-b-2 border-primary-500 text-primary-500"
                  : "text-gray-400 hover:text-white"
                  }`}
                onClick={() => setActiveTab("All Contents")}
              >
                All Contents ({content.length})
              </button>
              <button
                className={`pb-4 px-2 text-sm font-medium transition-colors ${activeTab === "Public Contents"
                  ? "border-b-2 border-primary-500 text-primary-500"
                  : "text-gray-400 hover:text-white"
                  }`}
                onClick={() => setActiveTab("Public Contents")}
              >
                Public Contents({publicContent.length})
              </button>
              <button
                className={`pb-4 px-2 text-sm font-medium transition-colors ${activeTab === "Premium Contents"
                  ? "border-b-2 border-primary-500 text-primary-500"
                  : "text-gray-400 hover:text-white"
                  }`}
                onClick={() => setActiveTab("Premium Contents")}
              >
                Premium Contents({premiumContent.length})
              </button>
              <button
                className={`pb-4 px-2 text-sm font-medium transition-colors ${activeTab === "Fans Contents"
                  ? "border-b-2 border-primary-500 text-primary-500"
                  : "text-gray-400 hover:text-white"
                  }`}
                onClick={() => setActiveTab("Fans Contents")}
              >
                Fans Contents({fansContent.length})
              </button>
            </div>


            {/* Tab Content */}
            <div>
              {activeTab === "All Contents" && (
                isLoadingContent ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : (
                  <>
                    <ContentGrid content={content} />
                    <Pagination
                      currentPage={pageContent}
                      totalPages={totalPagesContent}
                      onPageChange={(p) => {
                        setPageContent(p);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </>
                )
              )}
              {activeTab === "Public Contents" && (
                isLoadingContent ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : (
                  <>
                    <ContentGrid content={publicContent} />
                    <Pagination
                      currentPage={pageContent}
                      totalPages={totalPagesContent}
                      onPageChange={(p) => {
                        setPageContent(p);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </>
                )
              )}
              {activeTab === "Premium Contents" && (
                isLoadingContent ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : (
                  <>
                    <ContentGrid content={premiumContent} />
                    <Pagination
                      currentPage={pageContent}
                      totalPages={totalPagesContent}
                      onPageChange={(p) => {
                        setPageContent(p);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </>
                )
              )}
              {activeTab === "Fans Contents" && (
                isLoadingContent ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : (
                  <>
                    <ContentGrid content={fansContent} />
                    <Pagination
                      currentPage={pageContent}
                      totalPages={totalPagesContent}
                      onPageChange={(p) => {
                        setPageContent(p);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </>
                )
              )}
            </div>
          </>
        )}


        {/* Own Profile Content */}
        {isOwnProfile && (
          <div className="bg-dark-700/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-white mb-6">My Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                to="/analytics"
                className="bg-primary-700 rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-200 text-center"
              >
                <div className="text-white">
                  <div className="text-2xl font-bold mb-2">Analytics</div>
                  <div className="text-sm opacity-90">View your statistics</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>


      {/* Modals */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        username={profile.user.username}
      />


      {isOwnProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile.user}
          onSave={handleEditProfile}
        />
      )}


      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-700 rounded-xl max-w-md w-full mx-4 p-6 relative border border-gray-700">
            <button
              onClick={handleCancelReport}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>


            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Report User
              </h2>
              <p className="text-gray-400 text-sm">
                Report {profile.user.username} for inappropriate behavior
              </p>
            </div>


            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  value={reportData.title}
                  onChange={(e) => setReportData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief summary of the issue"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSubmittingReport}
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide detailed information about the issue..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  disabled={isSubmittingReport}
                />
              </div>
            </div>


            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCancelReport}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={isSubmittingReport}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                disabled={isSubmittingReport || !reportData.title.trim() || !reportData.description.trim()}
              >
                {isSubmittingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  "Send Report"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Profile;