import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Users,
  UserPlus,
  Bell,
  ShoppingBag,
  Heart,
  Trash2,
} from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { userService, notificationService } from "../services/api";

const Notification: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    notificationCounts,
    notifications,
    loading,
    error,
    refreshNotifications,
    markAsRead,
  } = useNotifications();

  const [loadingMap, setLoadingMap] = useState<{ [key: string]: boolean }>({});
  const [followingMap, setFollowingMap] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [visibleCounts, setVisibleCounts] = useState<{ [key: string]: number }>(
    {}
  );
  const [loadingMore, setLoadingMore] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [deletingNotifications, setDeletingNotifications] = useState<{
    [key: string]: boolean;
  }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize visible counts for each category
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const initialCounts: { [key: string]: number } = {};
      const grouped = notifications.reduce((acc, notification) => {
        const category = notification.type;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(notification);
        return acc;
      }, {} as { [key: string]: any[] });

      Object.keys(grouped).forEach((category) => {
        initialCounts[category] = Math.min(3, grouped[category].length);
      });

      setVisibleCounts(initialCounts);
    }
  }, [notifications]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
    }
  }, [isAuthenticated, refreshNotifications]);

  // Check follow status for users in notifications
  useEffect(() => {
    const checkFollowStatuses = async () => {
      if (!user?.username || !notifications.length) return;

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

      if (!notifications.find((n) => n.id === notificationId)?.isRead) {
        await markAsRead(notificationId);
      }

      await refreshNotifications();
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [targetUsername]: false }));
    }
  };

  const handleLoadMore = async (category: string) => {
    setLoadingMore((prev) => ({ ...prev, [category]: true }));

    // Simulate loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const currentCount = visibleCounts[category] || 3;
    const newCount = Math.min(
      currentCount + 3,
      groupedNotifications[category]?.length || 0
    );

    setVisibleCounts((prev) => ({
      ...prev,
      [category]: newCount,
    }));

    // Smooth scroll to show the newly loaded content with webkit animation
    setTimeout(() => {
      const categoryElement = document.getElementById(`category-${category}`);
      if (categoryElement) {
        // Get the current scroll position
        const startPosition = window.pageYOffset;
        const targetPosition = categoryElement.offsetTop - 100; // Offset for better visibility
        const distance = targetPosition - startPosition;
        const duration = 800; // Animation duration in ms
        let start: number | null = null;

        const animateScroll = (currentTime: number) => {
          if (start === null) start = currentTime;
          const timeElapsed = currentTime - start;
          const progress = Math.min(timeElapsed / duration, 1);

          // Easing function for smooth animation
          const easeInOutCubic = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          const run = easeInOutCubic(progress);
          window.scrollTo(0, startPosition + distance * run);

          if (timeElapsed < duration) {
            requestAnimationFrame(animateScroll);
          }
        };

        requestAnimationFrame(animateScroll);
      }
    }, 100);

    setLoadingMore((prev) => ({ ...prev, [category]: false }));
  };

  const handleDeleteNotification = async (notificationId: number) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    setDeletingNotifications((prev) => ({
      ...prev,
      [notificationId.toString()]: true,
    }));
    try {
      await notificationService.deleteNotification(notificationId);
      await refreshNotifications();
      setSuccessMessage("Notification deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting notification:", err);
      setSuccessMessage("Failed to delete notification. Please try again.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setDeletingNotifications((prev) => ({
        ...prev,
        [notificationId.toString()]: false,
      }));
    }
  };

  const handleDeleteNotificationsByType = async (category: string) => {
    const categoryTitle = getCategoryTitle(category);
    if (
      !window.confirm(
        `Are you sure you want to delete all ${categoryTitle} notifications? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingNotifications((prev) => ({ ...prev, [category]: true }));
    try {
      await notificationService.deleteNotificationsByType(category);
      await refreshNotifications();
      setSuccessMessage(
        `All ${categoryTitle} notifications deleted successfully!`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting notifications by type:", err);
      setSuccessMessage(
        `Failed to delete ${categoryTitle} notifications. Please try again.`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setDeletingNotifications((prev) => ({ ...prev, [category]: false }));
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
        return <MessageCircle className="h-6 w-6" />;
      case "follow":
        return <Users className="h-6 w-6" />;
      case "friend_request":
        return <UserPlus className="h-6 w-6" />;
      case "trade_request":
        return <ShoppingBag className="h-6 w-6" />;
      case "new_post":
        return <Bell className="h-6 w-6" />;
      case "upvote":
        return <Heart className="h-6 w-6" />;
      default:
        return <Bell className="h-6 w-6" />;
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

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "message":
        return "bg-blue-500";
      case "follow":
        return "bg-green-500";
      case "friend_request":
        return "bg-purple-500";
      case "trade_request":
        return "bg-orange-500";
      case "new_post":
        return "bg-yellow-500";
      case "upvote":
        return "bg-red-500";
      default:
        return "bg-gray-500";
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

  // Group notifications by type
  const groupedNotifications =
    notifications?.reduce((acc, notification) => {
      const category = notification.type;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(notification);
      return acc;
    }, {} as { [key: string]: any[] }) || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-600 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-dark-800 rounded-lg p-6 h-24"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Error Loading Notifications
            </h1>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-dark-700 text-white overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#4B5563 #1F2937",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300">
          {successMessage}
        </div>
      )}
      <style>
        {`
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #1F2937;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: #4B5563;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #6B7280;
          }
        `}
      </style>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-gray-400">
            You have {notificationCounts?.total || 0} total notifications
          </p>
        </div>

        {/* Categorized Notifications */}
        {notifications &&
        notifications.length > 0 &&
        Object.keys(groupedNotifications).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedNotifications).map(
              ([category, categoryNotifications]) => (
                <div
                  key={category}
                  id={`category-${category}`}
                  className="space-y-4"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`${getNotificationColor(category)}`}>
                        {getNotificationIcon(category)}
                      </div>
                      <h2 className="text-xl font-semibold text-white">
                        {getCategoryTitle(category)}
                      </h2>
                      <span className="text-sm text-gray-400">
                        ({categoryNotifications?.length || 0})
                      </span>
                    </div>
                    {categoryNotifications &&
                      categoryNotifications.length > 0 && (
                        <button
                          onClick={() =>
                            handleDeleteNotificationsByType(category)
                          }
                          disabled={deletingNotifications[category]}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center space-x-1"
                          title={`Delete all ${getCategoryTitle(
                            category
                          )} notifications`}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Clear All</span>
                        </button>
                      )}
                  </div>

                  {/* Notifications in this category */}
                  <div
                    className="max-h-96 overflow-y-auto pr-2"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "#4B5563 #1F2937",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <style>
                      {`
                        .category-scroll::-webkit-scrollbar {
                          width: 6px;
                        }
                        .category-scroll::-webkit-scrollbar-track {
                          background: #1F2937;
                          border-radius: 3px;
                        }
                        .category-scroll::-webkit-scrollbar-thumb {
                          background: #4B5563;
                          border-radius: 3px;
                        }
                        .category-scroll::-webkit-scrollbar-thumb:hover {
                          background: #6B7280;
                        }
                      `}
                    </style>
                    <div className="space-y-4 category-scroll">
                      {categoryNotifications
                        ?.slice(0, visibleCounts[category] || 0)
                        ?.map((notification) => {
                          if (!notification) return null;

                          const username = extractUsernameFromMessage(
                            notification.message
                          );
                          const isFollowType = notification.type === "follow";

                          return (
                            <div
                              key={notification.id}
                              className={`bg-dark-800 rounded-lg p-6 border transition-all duration-200 ${
                                notification?.isRead
                                  ? "border-dark-600 opacity-60"
                                  : "border-primary-500 hover:border-primary-400 hover:bg-dark-700"
                              }`}
                            >
                              <div className="flex items-start space-x-4">
                                <div
                                  className={`${getNotificationColor(
                                    notification.type
                                  )} mt-1`}
                                >
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-white">
                                      {notification?.title || "Notification"}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-400">
                                        {notification?.createdAt
                                          ? formatTimeAgo(
                                              notification.createdAt
                                            )
                                          : "Just now"}
                                      </span>
                                      {!notification?.isRead && (
                                        <span
                                          className={`text-xs text-white font-bold rounded-full px-2 py-1 ${getNotificationBadgeColor(
                                            notification.type
                                          )}`}
                                        >
                                          New
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-400 mb-3">
                                    {notification?.message ||
                                      "No message content"}
                                  </p>

                                  {/* Action Buttons */}
                                  <div className="flex items-center space-x-3">
                                    {/* Click to view button */}
                                    <button
                                      onClick={() =>
                                        handleNotificationClick(notification)
                                      }
                                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                                    >
                                      View Details
                                    </button>

                                    {/* Follow/Unfollow button for follow notifications */}
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
                                          className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 ${
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

                                    {/* Mark as read button for unread notifications */}
                                    {!notification?.isRead && (
                                      <button
                                        onClick={() =>
                                          markAsRead(notification.id)
                                        }
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                                      >
                                        Mark as Read
                                      </button>
                                    )}

                                    {/* Delete button for individual notifications */}
                                    <button
                                      onClick={() =>
                                        handleDeleteNotification(
                                          notification?.id || 0
                                        )
                                      }
                                      disabled={
                                        deletingNotifications[
                                          (notification?.id || 0).toString()
                                        ]
                                      }
                                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center space-x-1"
                                      title="Delete this notification"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {categoryNotifications &&
                        visibleCounts[category] <
                          categoryNotifications.length && (
                          <div className="flex flex-col space-y-2 pb-4">
                            <button
                              onClick={() => handleLoadMore(category)}
                              disabled={loadingMore[category]}
                              className="w-full px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {loadingMore[category]
                                ? "Loading..."
                                : `Load More (${Math.min(
                                    3,
                                    (categoryNotifications?.length || 0) -
                                      (visibleCounts[category] || 0)
                                  )} more)`}
                            </button>
                            {categoryNotifications &&
                              categoryNotifications.length > 6 && (
                                <button
                                  onClick={() => {
                                    setVisibleCounts((prev) => ({
                                      ...prev,
                                      [category]: categoryNotifications.length,
                                    }));
                                  }}
                                  className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                                >
                                  Show All (
                                  {(categoryNotifications?.length || 0) -
                                    (visibleCounts[category] || 0)}{" "}
                                  remaining)
                                </button>
                              )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {notifications === null || notifications === undefined
                ? "Loading notifications..."
                : "All caught up!"}
            </h3>
            <p className="text-gray-500">
              {notifications === null || notifications === undefined
                ? "Please wait while we load your notifications."
                : "You don't have any new notifications right now."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
