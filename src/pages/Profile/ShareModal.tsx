import React, { useState } from 'react';
import { X, Copy, Facebook, Twitter, Instagram, Link2, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, username }) => {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/profile/${username}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const shareOptions = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=Check out ${username}'s profile`,
      color: 'bg-sky-500 hover:bg-sky-600'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: '#',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-700 rounded-xl max-w-sm w-full mx-4 p-6 relative border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            Share Profile
          </h2>
          <p className="text-gray-400 text-sm">
            Share {username}'s profile with others
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-dark-600 rounded-lg border border-gray-700">
            <div className="flex-1">
              <input
                type="text"
                value={profileUrl}
                readOnly
                className="w-full bg-transparent text-white text-sm truncate focus:outline-none"
              />
            </div>
            <button
              onClick={handleCopyLink}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => {
                  if (option.url !== '#') {
                    window.open(option.url, '_blank', 'width=600,height=400');
                  }
                }}
                className={`flex flex-col items-center space-y-2 p-4 rounded-lg text-white transition-all transform hover:scale-105 ${option.color}`}
              >
                <option.icon size={24} />
                <span className="text-xs font-medium">{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;