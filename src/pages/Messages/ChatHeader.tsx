import React, { useEffect } from 'react';
import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

const ChatHeader: React.FC = () => {
  const { selectedUser, setSelectedUser } = useChatStore();

  if (!selectedUser) return null;

  useEffect(() => {
    const handleEsc = (event: { key: string; }) => {
      if (event.key === "Escape") {
        setSelectedUser(null, null); // same as button click
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setSelectedUser]);

  return (
    <div className="bg-dark-800 border-b border-dark-600 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedUser(null, null)}
            className="md:hidden p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-600">
                <img
                  src={selectedUser.user.profile_image || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={selectedUser.user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              {selectedUser.isLive && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-800"></div>
              )}
            </div>
            <div>
              <h3 className="text-gray-100 font-semibold">{selectedUser.user.username}</h3>
              <p className="text-gray-400 text-sm">
                {selectedUser.isLive ? 'Online' : selectedUser.isLive ? `Last seen ${new Date(selectedUser.isLive).toLocaleDateString()}` : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-gray-300" />
          </button>
          <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-gray-300" />
          </button>
          <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;