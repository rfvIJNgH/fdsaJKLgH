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

export interface ReportImage {
  id: number;
  image_url: string;
}

export interface Report {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  reporter_id: number;
  reporter_username: string;
  reported_user_id: number;
  reported_username: string;
  images: ReportImage[];
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at: string;
}
