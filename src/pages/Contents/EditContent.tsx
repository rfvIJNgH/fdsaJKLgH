import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader } from "lucide-react";
import { contentService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";


const EditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<any>(null);


  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contentType: "public",
    contentPrice: 0,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");


  useEffect(() => {
    if (id) {
      fetchContent();
    }
  }, [id]);


  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const response = await contentService.getContentById(id!);
      const contentData = response.data;


      // Check if user owns this content
      if (!user || user.id !== contentData.user.id) {
        toast.error("You can only edit your own content");
        navigate(-1);
        return;
      }


      setContent(contentData);
      setFormData({
        title: contentData.title || "",
        description: contentData.description || "",
        contentType: contentData.contentType || "public",
        contentPrice: contentData.contentPrice || 0,
        tags: contentData.tags?.map((tag: any) => tag.name) || [],
      });
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to load content");
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'contentPrice' ? parseInt(value) || 0 : value
    }));
  };


  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput("");
    }
  };


  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }


    if (formData.contentType === 'fixed' && formData.contentPrice <= 0) {
      toast.error("Fixed content must have a price greater than 0");
      return;
    }


    setIsSubmitting(true);
    try {
      await contentService.updateContent(parseInt(id!), {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        contentType: formData.contentType,
        contentPrice: formData.contentType === 'fixed' ? formData.contentPrice : 0,
        tags: formData.tags,
      });


      toast.success("Content updated successfully!");
      navigate(`/content/${id}`);
    } catch (error: any) {
      console.error("Error updating content:", error);
      const errorMessage = error.response?.data?.message || "Failed to update content";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }


  if (!content) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Content Not Found</h1>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-dark-700">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-600 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <h1 className="text-xl font-bold text-white">Edit Content</h1>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-dark-800 rounded-xl p-6">
            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter content title"
                required
              />
            </div>


            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
                placeholder="Enter content description (optional)"
              />
            </div>


            {/* Content Type */}
            <div className="mb-6">
              <label htmlFor="contentType" className="block text-sm font-medium text-gray-300 mb-2">
                Content Type *
              </label>
              <select
                id="contentType"
                name="contentType"
                value={formData.contentType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="public">Public (Free)</option>
                <option value="fixed">Fixed Price</option>
                <option value="fans">Fans Only</option>
              </select>
              <p className="mt-1 text-sm text-gray-400">
                {formData.contentType === 'public' && "Anyone can view this content for free"}
                {formData.contentType === 'fixed' && "Users must pay a fixed price to view"}
                {formData.contentType === 'fans' && "Only subscribers can view this content"}
              </p>
            </div>


            {/* Content Price (only for fixed) */}
            {formData.contentType === 'fixed' && (
              <div className="mb-6">
                <label htmlFor="contentPrice" className="block text-sm font-medium text-gray-300 mb-2">
                  Price (Coins) *
                </label>
                <input
                  type="number"
                  id="contentPrice"
                  name="contentPrice"
                  value={formData.contentPrice}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 bg-dark-600 border border-dark-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter price in coins"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">
                  Set the price users need to pay to access this content
                </p>
              </div>
            )}


            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-primary-600 text-white rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-white hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add a tag and press Enter"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  disabled={formData.tags.length >= 10}
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Add up to 10 tags to help people discover your content
              </p>
            </div>
          </div>


          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-dark-600 text-gray-300 rounded-lg hover:bg-dark-500 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Content</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default EditContent;