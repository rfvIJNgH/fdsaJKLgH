import React from 'react';
import { User } from '../../interface/interface';

interface UserCardProps {
  user: User;
  onUserClick?: (user: User) => void;
  actionButton: React.ReactNode;
  isSelected?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, onUserClick, actionButton, isSelected = false }) => {
  return (
    <div
      className={`bg-dark-500 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105 cursor-pointer ${
        isSelected ? 'ring-2 ring-primary-500 bg-dark-400' : ''
      }`}
      onClick={() => onUserClick?.(user)}
    >
      <div className="p-6 text-center">
        {/* Profile Photo */}
        <div className="w-20 h-20 rounded-full bg-gray-500 mx-auto mb-4 overflow-hidden">
          <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-xl font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Username */}
        <h3 className="text-lg font-semibold text-white mb-2 truncate">
          {user.username}
        </h3>

        {/* Gig Title */}
        <h4 className="text-md font-medium text-primary-400 mb-2 truncate">
          {user.bio}
        </h4>
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500 text-white">
              Selected
            </span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          {actionButton}
        </div>
      </div>
    </div>
  );
};

export default UserCard;