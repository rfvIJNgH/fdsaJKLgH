import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  X,
  Video,
  Tag,
  AlertCircle,
  Loader2,
  Check,
  Play,
} from "lucide-react";
import {
  contentService,
  uploadService,
  CreateContentRequest,
} from "../../services/api";

interface UploadedFile {
  file: File;
  preview: string;
  type: "image" | "video";
  uploaded?: boolean;
  url?: string;
}

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<number>(0);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumType, setPremiumType] = useState<"fixed" | "fans" | "">("");
  const [premiumDetails, setPremiumDetails] = useState({
    fixedPrice: 0,
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          const type = file.type.startsWith("image/") ? "image" : "video";

          setUploadedFiles((prev) => [
            ...prev,
            {
              file,
              preview,
              type,
              uploaded: false,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      // Adjust thumbnail selection if needed
      if (selectedThumbnailIndex >= newFiles.length) {
        setSelectedThumbnailIndex(Math.max(0, newFiles.length - 1));
      } else if (selectedThumbnailIndex === index) {
        setSelectedThumbnailIndex(0);
      } else if (selectedThumbnailIndex > index) {
        setSelectedThumbnailIndex(selectedThumbnailIndex - 1);
      }
      return newFiles;
    });
  };

  const uploadFiles = async (): Promise<string[]> => {
    const allFiles = uploadedFiles.map((f) => f.file);
    
    if (allFiles.length === 0) {
      throw new Error("No files to upload");
    }

    try {
      const response = await uploadService.uploadMultipleFiles(allFiles);
      return response.data.urls;
    } catch (error) {
      console.error("Error uploading files:", error);
      throw new Error("Failed to upload files");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (uploadedFiles.length === 0) {
      newErrors.files = "At least one file is required";
    }

    if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Upload files first
      const uploadedUrls = await uploadFiles();
      setUploadProgress(50);

      // Create content
      const contentData: CreateContentRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageCount: uploadedFiles.filter((f) => f.type === "image").length,
        videoCount: uploadedFiles.filter((f) => f.type === "video").length,
        contentType: premiumType ? premiumType : "public",
        contentPrice: premiumType == "fixed" ? premiumDetails.fixedPrice : 0,
        thumbnailUrl: uploadedUrls[selectedThumbnailIndex] || uploadedUrls[0] || "",
        fileUrls: uploadedUrls, // Add all file URLs
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      };

      const response = await contentService.createContent(contentData);
      setUploadProgress(100);

      // Redirect to the created content
      navigate(`/content/${response.data.id}`);
    } catch (error) {
      console.error("Error creating content:", error);
      setErrors({ submit: "Failed to create content. Please try again." });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-dark-500 rounded-lg shadow-lg p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Upload Content</h1>
          <p className="text-gray-100">
            Share your amazing content with the Arouzy community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-3">
              Upload Files
            </label>

            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-100 mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-gray-100">
                Supports images (JPG, PNG, GIF) and videos (MP4, MOV, AVI)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {errors.files && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.files}
              </p>
            )}
          </div>

          {/* File Preview */}
          {uploadedFiles.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-100 mb-3">
                Uploaded Files
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className={`aspect-square rounded-lg overflow-hidden bg-gray-800 cursor-pointer border-4 transition-all ${
                        selectedThumbnailIndex === index 
                          ? 'border-primary-500 shadow-lg' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedThumbnailIndex(index)}
                    >
                      {file.type === "image" ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <video
                            src={file.preview}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          {/* Video overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-gray-800 ml-0.5" />
                            </div>
                          </div>
                          {/* Video label */}
                          <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs flex items-center">
                            <Video className="w-3 h-3 mr-1" />
                            Video
                          </div>
                        </div>
                      )}
                      
                      {/* Thumbnail indicator */}
                      {selectedThumbnailIndex === index && (
                        <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <p className="mt-2 text-xs text-gray-300 truncate">
                      {file.file.name}
                    </p>
                    
                    {selectedThumbnailIndex === index && (
                      <p className="text-xs text-primary-400 font-medium">
                        Selected as thumbnail
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              {uploadedFiles.length > 1 && (
                <p className="mt-3 text-sm text-gray-400">
                  Click on any file to select it as the thumbnail
                </p>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-100 mb-2"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`w-full bg-dark-500 text-white px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter a compelling title for your content"
                maxLength={100}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-100 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                className={`w-full bg-dark-500 text-white px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Describe your content (optional)"
                maxLength={1000}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/1000 characters
              </p>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-100 mb-2"
              >
                Tags
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  className="w-full bg-dark-500 text-white pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter tags separated by commas (e.g., art, design, creative)"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Tags help others discover your content
              </p>
            </div>
          </div>

          {/* Premium Settings */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-100">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => {
                    setIsPremium(e.target.checked);
                    if (!e.target.checked) {
                      setPremiumType("");
                      setPremiumDetails({
                        fixedPrice: 0,
                      });
                    }
                  }}
                  className="form-checkbox h-4 w-4 text-primary-600"
                />
                <span>Mark as Premium Content</span>
              </label>
            </div>

            {isPremium && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-100 mb-1">
                    Premium Type
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setPremiumType("fixed")}
                      className={`px-4 py-2 border rounded-md ${premiumType === "fixed"
                        ? "bg-primary-500 text-white"
                        : "bg-dark-500 text-gray-100 border-gray-300"
                        }`}
                    >
                      Fixed Price
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumType("fans")}
                      className={`px-4 py-2 border rounded-md ${premiumType === "fans"
                        ? "bg-primary-500 text-white"
                        : "bg-dark-500 text-gray-100 border-gray-300"
                        }`}
                    >
                      For a Fans
                    </button>
                  </div>
                </div>

                {premiumType === "fixed" && (
                  <div>
                    <label className="block text-sm text-gray-100 mb-1">
                      Fixed Price ($)
                    </label>
                    <input
                      type="number"
                      value={premiumDetails.fixedPrice}
                      onChange={(e) =>
                        setPremiumDetails((prev) => ({
                          ...prev,
                          fixedPrice: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 bg-dark-500 text-white border border-gray-300 rounded-md"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isSubmitting && (
            <div className="bg-gray-100 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-100 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Upload Content
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;