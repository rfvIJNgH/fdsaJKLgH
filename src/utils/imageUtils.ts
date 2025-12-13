// Helper function to construct full thumbnail URL
export const getThumbnailUrl = (thumbnail: string): string => {
  // If thumbnail is already a full URL, return it as is
  if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
    return thumbnail;
  }

  // If it's a relative path, construct the full URL
  if (thumbnail.startsWith("/uploads/")) {
    const backendUrl =
      import.meta.env.VITE_API_URL || "arouzy-production.up.railway.app";
    return `${backendUrl}${thumbnail}`;
  }

  // Default fallback
  return thumbnail;
};

// Helper function to check if thumbnail is an image URL
export const isImageUrl = (thumbnail: string): boolean => {
  return (
    thumbnail.startsWith("http://") ||
    thumbnail.startsWith("https://") ||
    thumbnail.startsWith("/uploads/")
  ) && !isVideoUrl(thumbnail);
};

// Helper function to check if thumbnail is a video URL
export const isVideoUrl = (thumbnail: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  return videoExtensions.some(ext => thumbnail.toLowerCase().includes(ext));
};