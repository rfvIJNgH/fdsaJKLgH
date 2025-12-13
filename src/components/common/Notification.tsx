import React from 'react';

interface NotificationProps {
  message: string;
  show: boolean;
}

export const Notification: React.FC<NotificationProps> = ({ message, show }) =>
  show ? (
    <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300">
      {message}
    </div>
  ) : null;