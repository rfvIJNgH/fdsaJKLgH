import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'away' | 'offline';
  isLive?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  isLive = false, 
  className = '' 
}) => {
  const getStatusColor = () => {
    if (isLive) return 'bg-red-500';
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (isLive) return 'Live';
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        {isLive && (
          <div className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor()} animate-ping`} />
        )}
      </div>
      <span className="text-sm text-gray-300">
        {getStatusText()}
      </span>
    </div>
  );
};

export default StatusIndicator;