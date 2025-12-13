export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: number;
  title: string;
  imageCount: number;
  videoCount: number;
  thumbnail: string;
  createdAt: string;
  upvotes: number;
  user: User;
}

export interface Thread {
  id: number;
  title: string;
  author: string;
  photos: number;
  videos: number;
  datePosted: string;
  status: 'active' | 'awaiting_moderation' | 'archived';
  replies: number;
}
