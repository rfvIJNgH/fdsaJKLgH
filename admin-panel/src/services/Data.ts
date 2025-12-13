import { Thread } from '../types';

export const mockThreads: Thread[] = [
  {
    id: 1,
    title: 'Recent nudes posted',
    author: 'user123',
    photos: 4,
    videos: 5,
    datePosted: 'January 6th, 2023',
    status: 'awaiting_moderation',
    replies: 12
  },
  {
    id: 2,
    title: 'Weekly discussion thread',
    author: 'moderator_jane',
    photos: 0,
    videos: 0,
    datePosted: 'January 5th, 2023',
    status: 'active',
    replies: 34
  },
  {
    id: 3,
    title: 'Site rules and guidelines',
    author: 'admin',
    photos: 1,
    videos: 2,
    datePosted: 'January 1st, 2023',
    status: 'active',
    replies: 8
  }
];
