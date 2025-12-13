import React, { useEffect, useState } from 'react';
import SearchInput from '../components/SearchInput';
import DeleteButton from '../components/DeleteButton';
import { Content } from '../types';
import { contentService } from '../services/api';

const DeletePostsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThreads, setSelectedThreads] = useState<number[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  //get the thread information
  const fetchAllContentWithUsers = async() => {
    try {
      setLoading(true);
      const response = await contentService.getAllContentsWithUsers();
      console.log("allContentswithUsers:", response.data);
      setContents(response.data.content || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllContentWithUsers();
  }, []);

  const filteredContents = contents.filter(content =>
    content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContentSelect = (contentId: number) => {
    setSelectedThreads(prev =>
      prev.includes(contentId)
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedThreads(filteredContents.map(content => content.id));
    } else {
      setSelectedThreads([]);
    }
  };

  const handleDeleteContent = async () => {
    if (selectedThreads.length > 0) {
      try {
        console.log('Deleting content:', selectedThreads);
        const response = await contentService.deleteSelectedContents(selectedThreads);
        console.log('Delete response:', response.data);
        alert(`Successfully deleted ${response.data.deletedCount} content item(s).`);
        
        // Refresh the content list
        await fetchAllContentWithUsers();
        setSelectedThreads([]);

      } catch (error) {
        console.error('Error deleting content:', error);
        alert('Error deleting content. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-300">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search content..."
        />
        <DeleteButton
          onClick={handleDeleteContent}
          disabled={selectedThreads.length === 0}
          selectedCount={selectedThreads.length}
          label="Delete Selected"
        />
      </div>

      <div className="bg-dark-500 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-500"
                    checked={selectedThreads.length === filteredContents.length && filteredContents.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Images</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Videos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Upvotes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date Posted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredContents.map((content: Content) => (
                <tr key={content.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-500"
                      checked={selectedThreads.includes(content.id)}
                      onChange={() => handleContentSelect(content.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{content.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{content.user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{content.imageCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{content.videoCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{content.upvotes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(content.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeletePostsPage;