import React from 'react';

const MessageSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}>
          <div className="flex items-end space-x-2 max-w-xs">
            {i % 2 === 0 && (
              <div className="w-8 h-8 bg-dark-600 rounded-full"></div>
            )}
            <div className={`p-3 rounded-lg ${i % 2 === 0 ? 'bg-dark-600' : 'bg-primary-600'}`}>
              <div className={`h-4 rounded w-${Math.floor(Math.random() * 20) + 20} mb-2`}></div>
              <div className={`h-4 rounded w-${Math.floor(Math.random() * 15) + 15}`}></div>
            </div>
            {i % 2 === 1 && (
              <div className="w-8 h-8 bg-dark-600 rounded-full"></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;