import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { getThumbnailUrl, isVideoUrl } from '../../utils/imageUtils';

interface MediaFile {
  id: number;
  fileUrl: string;
  createdAt: string;
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: MediaFile[];
  currentIndex: number;
  contentTitle: string;
}

const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  onClose,
  files,
  currentIndex,
  contentTitle,
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : files.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < files.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = () => {
    const currentFile = files[activeIndex];
    if (currentFile) {
      const link = document.createElement('a');
      link.href = getThumbnailUrl(currentFile.fileUrl);
      link.download = `${contentTitle}-${activeIndex + 1}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    const currentFile = files[activeIndex];
    if (currentFile) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: contentTitle,
            url: getThumbnailUrl(currentFile.fileUrl),
          });
        } catch (error) {
          // Fallback to clipboard
          navigator.clipboard.writeText(getThumbnailUrl(currentFile.fileUrl));
        }
      } else {
        navigator.clipboard.writeText(getThumbnailUrl(currentFile.fileUrl));
      }
    }
  };

  if (!isOpen || !files || files.length === 0) {
    return null;
  }

  const currentFile = files[activeIndex];
  const isVideo = isVideoUrl(currentFile?.fileUrl || '');

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h2 className="text-white font-semibold text-lg truncate max-w-md">
              {contentTitle}
            </h2>
            {files.length > 1 && (
              <div className="text-gray-300 text-sm">
                {activeIndex + 1} / {files.length}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {isVideo ? (
            <video
              key={currentFile.id}
              src={getThumbnailUrl(currentFile.fileUrl)}
              className="w-full h-full max-w-[90vw] max-h-[calc(100vh-200px)] object-contain rounded-lg"
              controls
              autoPlay
              style={{
                maxWidth: '90vw',
                maxHeight: 'calc(100vh - 200px)',
              }}
              onError={(e) => {
                console.error('Video load error:', e);
              }}
            />
          ) : (
            <img
              src={getThumbnailUrl(currentFile.fileUrl)}
              alt={`${contentTitle} - ${activeIndex + 1}`}
              className="w-full h-full max-w-[90vw] max-h-[calc(100vh-200px)] object-contain rounded-lg"
              style={{
                maxWidth: '90vw',
                maxHeight: 'calc(100vh - 200px)',
              }}
              onError={(e) => {
                console.error('Image load error:', e);
              }}
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {files.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
              title="Previous (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
              title="Next (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {files.length > 1 && (
        <div className="flex-shrink-0 pb-4">
          <div className="flex justify-center">
            <div className="bg-black/50 rounded-lg p-2 max-w-full">
              <div className="flex space-x-2 overflow-x-auto overflow-y-hidden scrollbar-hide px-2" style={{ maxWidth: '90vw' }}>
                {files.map((file, index) => {
                  const isVideoThumb = isVideoUrl(file.fileUrl);
                  return (
                    <button
                      key={file.id}
                      onClick={() => setActiveIndex(index)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === activeIndex
                          ? 'border-white scale-110'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      {isVideoThumb ? (
                        <video
                          src={getThumbnailUrl(file.fileUrl)}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={getThumbnailUrl(file.fileUrl)}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close modal"
      />
    </div>
  );
};

export default MediaModal;