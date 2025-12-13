import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Users,
  UserPlus,
  Bell,
  ShoppingBag,
  Heart,
  ChevronLeft,
  X,
} from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { userService } from "../../services/api";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { notifications, loading, error, refreshNotifications, markAsRead } =
    useNotifications();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<{ [key: string]: boolean }>({});
  const [followingMap, setFollowingMap] = useState<{ [key: string]: boolean }>(
    {}
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      refreshNotifications();
    }
  }, [isAuthenticated, isOpen, refreshNotifications]);

  // Check follow status for users in notifications
  useEffect(() => {
    const checkFollowStatuses = async () => {
      if (!user?.username || !notifications?.length) return;

      const statusMap: { [key: string]: boolean } = {};
      const followNotifications = notifications.filter(
        (n) => n.type === "follow"
      );

      for (const notification of followNotifications) {
        const username = extractUsernameFromMessage(notification.message);
        if (username && username !== user.username) {
          try {
            const response = await userService.checkFollowStatus(username);
            statusMap[username] = response.data.isFollowing;
          } catch (err) {
            console.log("Error checking follow status:", err);
            statusMap[username] = false;
          }
        }
      }
      setFollowingMap(statusMap);
    };

    checkFollowStatuses();
  }, [notifications, user?.username]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    switch (notification.type) {
      case "message":
        navigate("/messages");
        break;
      case "follow":
        if (user?.username) {
          navigate(`/profile/${user.username}/followers`);
        } else {
          navigate("/");
        }
        break;
      case "friend_request":
        if (user?.username) {
          navigate(`/profile/${user.username}`);
        } else {
          navigate("/");
        }
        break;
      case "trade_request":
        navigate("/trading/requests");
        break;
      case "new_post":
        navigate("/");
        break;
      case "upvote":
        navigate(`/content/${notification.data.contentId}`);
        break;
      default:
        navigate("/");
    }
    onClose();
  };

  const handleFollowToggle = async (
    targetUsername: string,
    isFollowing: boolean,
    notificationId: number
  ) => {
    setLoadingMap((prev) => ({ ...prev, [targetUsername]: true }));
    try {
      if (isFollowing) {
        await userService.unfollowUser(targetUsername);
      } else {
        await userService.followUser(targetUsername);
      }

      // Update the following map
      setFollowingMap((prev) => ({ ...prev, [targetUsername]: !isFollowing }));

      if (!notifications?.find((n) => n.id === notificationId)?.isRead) {
        await markAsRead(notificationId);
      }

      await refreshNotifications();
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [targetUsername]: false }));
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle className="h-4 w-4" />;
      case "follow":
        return <Users className="h-4 w-4" />;
      case "friend_request":
        return <UserPlus className="h-4 w-4" />;
      case "trade_request":
        return <ShoppingBag className="h-4 w-4" />;
      case "new_post":
        return <Bell className="h-4 w-4" />;
      case "upvote":
        return <Heart className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "message":
        return "text-blue-400";
      case "follow":
        return "text-green-400";
      case "friend_request":
        return "text-purple-400";
      case "trade_request":
        return "text-orange-400";
      case "new_post":
        return "text-yellow-400";
      case "upvote":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getCategoryTitle = (type: string) => {
    switch (type) {
      case "message":
        return "Messages";
      case "follow":
        return "Followers";
      case "friend_request":
        return "Friend Requests";
      case "trade_request":
        return "Trade Requests";
      case "new_post":
        return "New Posts";
      case "upvote":
        return "Upvotes";
      default:
        return "Other";
    }
  };

  const extractUsernameFromMessage = (message: string): string | null => {
    // Extract username from common notification message patterns
    const patterns = [
      /@(\w+)/, // @username
      /(\w+) started following you/, // username started following you
      /(\w+) sent you a friend request/, // username sent you a friend request
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  // Group notifications by type - Add null check here
  const groupedNotifications = (notifications || []).reduce((acc, notification) => {
    const category = notification.type;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(notification);
    return acc;
  }, {} as { [key: string]: any[] });

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const handleViewAllNotifications = () => {
    navigate("/notification");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div
        ref={dropdownRef}
        className="relative bg-dark-800 rounded-lg shadow-xl border border-dark-600 w-96 max-h-96 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          {selectedCategory ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBackToCategories}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-lg font-semibold text-white">
                {getCategoryTitle(selectedCategory)}
              </h3>
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-dark-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : selectedCategory ? (
            // Show notifications for selected category
            <div className="p-4 space-y-3">
              {groupedNotifications[selectedCategory]?.length > 0 ? (
                groupedNotifications[selectedCategory].map((notification) => {
                  const username = extractUsernameFromMessage(
                    notification.message
                  );
                  const isFollowType = notification.type === "follow";

                  return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        notification.isRead
                          ? "border-dark-600 bg-dark-700 opacity-60"
                          : "border-primary-500 bg-dark-700 hover:bg-dark-600"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`${getNotificationColor(
                            notification.type
                          )} mt-1`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-white truncate">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-400 ml-2">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                              className="px-2 py-1 bg-primary-500 text-white rounded text-xs hover:bg-primary-600 transition-colors"
                            >
                              View
                            </button>
                            {isFollowType &&
                              username &&
                              user?.username !== username && (
                                <button
                                  onClick={() =>
                                    handleFollowToggle(
                                      username,
                                      followingMap[username] || false,
                                      notification.id
                                    )
                                  }
                                  disabled={loadingMap[username]}
                                  className={`px-2 py-1 text-white rounded text-xs transition-colors disabled:opacity-50 ${
                                    followingMap[username]
                                      ? "bg-red-500 hover:bg-red-600"
                                      : "bg-green-500 hover:bg-green-600"
                                  }`}
                                >
                                  {loadingMap[username]
                                    ? "..."
                                    : followingMap[username]
                                    ? "Unfollow"
                                    : "Follow"}
                                </button>
                              )}
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No notifications</p>
                </div>
              )}
            </div>
          ) : (
            // Show categories
            <div className="p-4 space-y-2">
              {Object.keys(groupedNotifications).length > 0 ? (
                <>
                  {Object.entries(groupedNotifications).map(
                    ([category, categoryNotifications]) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`${getNotificationColor(category)}`}>
                            {getNotificationIcon(category)}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white">
                              {getCategoryTitle(category)}
                            </h4>
                            <p className="text-xs text-gray-400">
                              {categoryNotifications.length} notification
                              {categoryNotifications.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {categoryNotifications.filter((n) => !n.isRead)
                            .length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                              {
                                categoryNotifications.filter((n) => !n.isRead)
                                  .length
                              }
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  )}
                  <div className="pt-2 border-t border-dark-600">
                    <button
                      onClick={handleViewAllNotifications}
                      className="w-full text-center py-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      View All Notifications
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No notifications</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;