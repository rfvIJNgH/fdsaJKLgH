import axios from "axios";

// Define base URL for different environments
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const CHAT_URL =
  import.meta.env.VITE_CHAT_SERVER_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log(token);
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors globally
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Content API services
export const contentService = {
  getContent: async (params?: {
    page?: number;
    sort?: string;
    username?: string;
    collectedBy?: string;
    minUpvotes?: number;
    fromDate?: string;
    tags?: string[];
  }) => {
    return api.get("/api/content", { params });
  },
  getTags: async () => {
    return api.get("/api/tags");
  },
  getContentById: async (id: string) => {
    return api.get(`/api/content/${id}`);
  },
  getContentByUser: async (username: string, page = 1, sort = "hot") => {
    return api.get(`/api/content`, { params: { page, sort, username } });
  },
  getCollectionsByUser: async (userId: number, page = 1, sort = "hot") => {
    return api.get("/api/content", {
      params: { page, sort, collectedBy: userId },
    });
  },
  createContent: async (data: CreateContentRequest) => {
    return api.post("/api/content", data);
  },
  updateContent: async (id: number, data: UpdateContentRequest) => {
    return api.put(`/api/content/${id}`, data);
  },
  deleteContent: async (id: number) => {
    return api.delete(`/api/content/${id}`);
  },
  upvoteContent: async (contentId: number) => {
    return api.post(`/api/content/${contentId}/upvote`);
  },
  checkUpvoteStatus: async (contentId: number) => {
    return api.get(`/api/content/${contentId}/upvote`);
  },
  purchaseContent: async (contentId: number) => {
    return api.post(`/api/content/${contentId}/purchase`);
  },
  checkPurchaseStatus: async (contentId: number) => {
    return api.get(`/api/content/${contentId}/purchase`);
  },
};

// Search API services
export const searchService = {
  searchContent: async (query: string, page = 1) => {
    return api.get("/api/search/content", { params: { q: query, page } });
  },
  getSearchSuggestions: async (query: string) => {
    return api.get("/api/search/suggestions", { params: { q: query } });
  },
};

// Upload API services
export const uploadService = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadMultipleFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file); // Changed to use same name for all files
    });

    return api.post("/api/upload/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// User API services
export const userService = {
  getUserProfile: async () => {
    return api.get("/api/user/profile");
  },
  getUserDashboard: async () => {
    return api.get("/api/user/dashboard");
  },
  updateUserProfile: async (data: FormData | { username?: string; email?: string; bio?: string; }) => {
    // Check if data is FormData (for file uploads) or regular object
    if (data instanceof FormData) {
      return api.put("/api/user/profile", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      return api.put("/api/user/profile", data);
    }
  },
  followUser: async (username: string) => {
    return api.post(`/api/users/${username}/follow`);
  },
  unfollowUser: async (username: string) => {
    return api.delete(`/api/users/${username}/follow`);
  },
  getPublicUserProfile: async (username: string) => {
    return api.get(`/api/users/${username}/profile`);
  },
  checkFollowStatus: async (username: string) => {
    return api.get(`/api/users/${username}/follow/status`);
  },
  getFollowers: async (username: string) => {
    return api.get(`/api/users/${username}/followers`);
  },
  getFollowing: async (username: string) => {
    return api.get(`/api/users/${username}/following`);
  },
  getUserById: async (userId: number) => {
    return api.get(`/api/users/${userId}`);
  },
};

// VIP API services
export const vipService = {
  upgradeToPremium: async (planType: string, coinAmount: number) => {
    return api.post("/api/vip/upgrade", { planType, coinAmount });
  },
  getVipStatus: async () => {
    return api.get("/api/vip/status");
  },
  cancelVip: async () => {
    return api.post("/api/vip/cancel");
  }
};

// Trading API services
export const tradingService = {
  uploadTradingContent: async (data: FormData) => {
    return api.post("/api/trading/upload", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  listTradingContent: async () => {
    return api.get("/api/trading");
  },
  sendTradeRequest: async (
    tradingContentId: number,
    offeredContentId: number
  ) => {
    return api.post("/api/trading/request", {
      tradingContentId,
      offeredContentId,
    });
  },
  listMyTradingContent: async () => {
    return api.get("/api/trading/mine");
  },
  listTradeRequests: async () => {
    return api.get("/api/trading/requests");
  },
  acceptTradeRequest: async (requestId: number) => {
    return api.post(`/api/trading/request/${requestId}/accept`);
  },
  rejectTradeRequest: async (requestId: number) => {
    return api.post(`/api/trading/request/${requestId}/reject`);
  },
};

// Collections API services
export const collectionService = {
  createCollection: async (data: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    return api.post("/api/collections", data);
  },
  listMyCollections: async () => {
    return api.get("/api/collections/my");
  },
  listPublicCollections: async (username: string) => {
    return api.get(
      `/api/collections/public?username=${encodeURIComponent(username)}`
    );
  },
  getCollectionContent: async (collectionId: number) => {
    return api.get(`/api/collections/content?collectionId=${collectionId}`);
  },
  getCollectionById: async (collectionId: number) => {
    return api.get(`/api/collections/detail/${collectionId}`);
  },
  saveToCollection: async (collectionId: number, contentId: number) => {
    return api.post("/api/collections/save", { collectionId, contentId });
  },
  removeFromCollection: async (collectionId: number, contentId: number) => {
    return api.delete(
      `/api/collections/remove?collectionId=${collectionId}&contentId=${contentId}`
    );
  },
  updateCollection: async (
    collectionId: number,
    data: { name: string; description?: string; isPublic: boolean }
  ) => {
    return api.put(
      `/api/collections/update?collectionId=${collectionId}`,
      data
    );
  },
  deleteCollection: async (collectionId: number) => {
    return api.delete(`/api/collections/delete?collectionId=${collectionId}`);
  },
};

// Chat server API (for conversations)
export const chatService = {
  getConversations: async (userId: number) => {
    const res = await fetch(
      `${CHAT_URL}/messages/conversations?userId=${userId}`
    );
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },
  uploadAttachment: async (file: File) => {
    const formData = new FormData();
    formData.append("attachment", file);
    const res = await fetch(`${CHAT_URL}/upload/attachment`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload attachment");
    return res.json();
  },
  getMessageHistory: async (userA: number, userB: number) => {
    const res = await fetch(
      `${CHAT_URL}/messages/history?userA=${userA}&userB=${userB}`
    );
    if (!res.ok) throw new Error("Failed to fetch message history");
    return res.json();
  },
};

// Notifications API services
export const notificationService = {
  getNotificationCounts: async () => {
    return api.get("/api/notifications/counts");
  },
  getNotifications: async (page = 1, limit = 20) => {
    return api.get("/api/notifications", { params: { page, limit } });
  },
  markNotificationAsRead: async (notificationId: number) => {
    return api.post(`/api/notifications/${notificationId}/read`);
  },
  markNotificationsAsReadByType: async (type: string) => {
    return api.post(`/api/notifications/${type}/read`);
  },
  deleteNotification: async (notificationId: number) => {
    return api.delete(`/api/notifications/delete/${notificationId}`);
  },
  deleteNotificationsByType: async (type: string) => {
    return api.delete(`/api/notifications/delete-type/${type}`);
  },
};

// Coin Services
export const coinService = {
  // Get coin data for a specific user
  getUserCoins: async (userId: string) => {
    return api.get(
      `/api/coins/${userId}`
    );
  },

  addCoins: (userId: string, coins: number) =>
    api.post(`/api/coins/${userId}/add`, { coins }),

  deductCoins: (userId: string, coins: number) => {
    return api.post(`api/coins/${userId}/deduct`, { coins });
  }
};

// Subscription API services
export const subscriptionService = {
  subscribeToCreator: async (creatorId: string, coinAmount: number) => {
    return api.post("/api/subscriptions/subscribe", {
      creatorId,
      coinAmount
    });
  },
  checkSubscriptionStatus: async (creatorId: string) => {
    return api.get(`/api/subscriptions/${creatorId}/status`);
  },
  getMySubscriptions: async () => {
    return api.get("/api/subscriptions/my");
  },
  unsubscribeFromCreator: async (creatorId: string) => {
    return api.delete(`/api/subscriptions/${creatorId}`);
  }
};

export interface CreateContentRequest {
  title: string;
  description?: string;
  imageCount: number;
  videoCount: number;
  contentType: string;
  contentPrice: number;
  thumbnailUrl?: string;
  fileUrls?: string[]; // Add file URLs array
  tags?: string[];
}

export interface UpdateContentRequest {
  title?: string;
  description?: string;
  contentType?: string;
  contentPrice?: number;
  tags?: string[];
}

export interface UploadResponse {
  filename: string;
  url: string;
}

export interface Collection {
  id: number;
  userId: number;
  name: string;
  description?: string;
  isPublic: boolean;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserDashboard {
  user: {
    id: number;
    username: string;
    email: string;
  };
  content: Array<{
    id: number;
    title: string;
    description?: string;
    imageCount: number;
    videoCount: number;
    thumbnail: string;
    createdAt: string;
    upvotes: number;
    user: {
      id: number;
      username: string;
    };
    images?: Array<{
      id: number;
      imageUrl: string;
      imageOrder: number;
    }>;
  }>;
  collections: Collection[];
  stats: {
    contentCount: number;
    collectionCount: number;
    totalUpvotes: number;
    followerCount: number;
  };
}

export interface CollectionContent {
  id: number;
  collectionId: number;
  contentId: number;
  addedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: "message" | "follow" | "friend_request" | "trade_request" | "new_post";
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationCounts {
  total: number;
  messages: number;
  follows: number;
  friendRequests: number;
  tradeRequests: number;
  newPosts: number;
  upvotes: number;
}

// Helper function to construct full thumbnail URL
export const getThumbnailUrl = (thumbnail: string): string => {
  // If thumbnail is already a full URL, return it as is
  if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
    return thumbnail;
  }

  // If it's a relative path, construct the full URL
  if (thumbnail.startsWith("/uploads/")) {
    const backendUrl =
      import.meta.env.VITE_API_URL || "arouzy-production.up.railway.app";
    return `${backendUrl}${thumbnail}`;
  }

  // If it's a gradient or other CSS value, return as is
  if (thumbnail.includes("gradient") || thumbnail.includes("#")) {
    return thumbnail;
  }

  // Default fallback
  return thumbnail;
};