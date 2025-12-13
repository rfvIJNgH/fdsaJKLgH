import React from 'react';
import { Eye, Heart, DollarSign } from 'lucide-react';

interface ContentItem {
  id: number;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  revenue: number;
  rank: number;
}

interface TopContentListProps {
  content: ContentItem[];
  isLoading?: boolean;
}

const TopContentList: React.FC<TopContentListProps> = ({ content, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-dark-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top-Selling Content</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-700 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-gray-400';
      case 3: return 'bg-amber-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Top-Selling Content</h3>
      <div className="space-y-4">
        {content.map((item) => (
          <div key={item.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-dark-700 transition-colors">
            <div className="relative">
              <img 
                src={item.thumbnail} 
                alt={item.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className={`absolute -top-2 -left-2 w-6 h-6 ${getRankBadgeColor(item.rank)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                {item.rank}
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium mb-1 truncate">{item.title}</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Eye size={14} />
                  <span>{item.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart size={14} />
                  <span>{item.likes.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign size={14} />
                  <span>${item.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopContentList;