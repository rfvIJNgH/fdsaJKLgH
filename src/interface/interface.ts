import { Socket } from "socket.io-client";

export interface ChatRoomProps {
  socket: Socket;
  username: string;
}

export interface ChatState {
  messages: Message[];
  users: User[];
  selectedUser: User | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  addMessage: (message: Message) => void;
}

export interface ContentItem {
  id: number;
  title: string;
  description?: string;
  imageCount: number;
  videoCount: number;
  contentType?: string;
  contentPrice?: number;
  thumbnail: string;
  createdAt: string;
  upvotes: number;
  user?: {
    id: string;
    username: string;
  };
  tags?: Array<{
    id: number;
    name: string;
  }>;
}

export interface Message {
  id: number;
  sender_id?: string;
  receiver_id: string;
  text?: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
}

export interface receiverProfile {
  user: {
    id: string;
    username: string;
    email: string;
    profile_image?: string;
    joinedAt?: string;
  };
  isVip?: boolean;
  status: 'online' | 'away' | 'offline';
  isLive?: boolean;
}

export interface Stream {
  id: string;
  streamer: {
    username: string;
    avatar: string;
  };
  thumbnail: string;
  joiners: number;
  type: "public" | "private" | "battle";
}

export interface User {
  id: number;
  username: string;
  bio: string;
  profileImage?: string;
  followerCount: number;
  contentCount: number;
}

export interface UserProfile {
  user: {
    id: number;
    username: string;
    email: string;
    profile_image?: string;
    joinedAt?: string;
  };
  contentCount: number;
  upvotesGiven: number;
  followerCount: number;
  followingCount: number;
  isVip?: boolean;
  status: 'online' | 'away' | 'offline';
  isLive?: boolean;
  giftsReceived: {
    total: number;
    value: number;
  };
  giftsSent: {
    total: number;
    value: number;
  };
}

export interface Chat {
  id: string;
  participants: User[];
  messages: Message[];
  unreadCount: number;
  lastActivity: string;
}

export interface CoinPack {
  id: string;
  coins: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  bonus?: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}