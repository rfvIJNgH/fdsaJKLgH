import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  notificationService,
  NotificationCounts,
  Notification,
} from "../services/api";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notificationCounts: NotificationCounts;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  refreshCounts: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsReadByType: (type: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [notificationCounts, setNotificationCounts] =
    useState<NotificationCounts>({
      total: 0,
      messages: 0,
      follows: 0,
      friendRequests: 0,
      tradeRequests: 0,
      newPosts: 0,
      upvotes: 0,
    });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getNotificationCounts();
      setNotificationCounts(response.data);
    } catch (err) {
      setError("Failed to load notification counts");
      console.error("Error loading notification counts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getNotifications();
      setNotifications(response.data.notifications);
    } catch (err) {
      setError("Failed to load notifications");
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await notificationService.markNotificationAsRead(notificationId);
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        // Refresh counts
        await refreshCounts();
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    },
    [refreshCounts]
  );

  const markAllAsReadByType = useCallback(
    async (type: string) => {
      try {
        await notificationService.markNotificationsAsReadByType(type);
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.type === type
              ? { ...notification, isRead: true }
              : notification
          )
        );
        // Refresh counts
        await refreshCounts();
      } catch (err) {
        console.error("Error marking notifications as read:", err);
      }
    },
    [refreshCounts]
  );

  // Initial load - only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshCounts();
      refreshNotifications();
    }
  }, [isAuthenticated, refreshCounts, refreshNotifications]);

  // Set up polling for real-time updates (every 30 seconds) - only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshCounts();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshCounts]);

  // Clear notifications when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationCounts({
        total: 0,
        messages: 0,
        follows: 0,
        friendRequests: 0,
        tradeRequests: 0,
        newPosts: 0,
        upvotes: 0,
      });
      setNotifications([]);
      setError(null);
    }
  }, [isAuthenticated]);

  const value: NotificationContextType = {
    notificationCounts,
    notifications,
    loading,
    error,
    refreshCounts,
    refreshNotifications,
    markAsRead,
    markAllAsReadByType,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};