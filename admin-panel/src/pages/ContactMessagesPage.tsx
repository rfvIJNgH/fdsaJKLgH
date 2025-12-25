import React, { useEffect, useState } from "react";
import { ContactMessage } from "../types";
import { contactService } from "../services/api";
import SearchInput from "../components/SearchInput";
import DeleteButton from "../components/DeleteButton";

const ContactMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const limit = 20;

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = {
        page: currentPage,
        limit,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await contactService.getAllMessages(params);
      setMessages(response.data.messages);
      setTotalPages(response.data.pagination.totalPages);
      setTotalMessages(response.data.pagination.total);
      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [currentPage, statusFilter]);

  const filteredMessages = messages.filter(
    (message) =>
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMessageSelect = (messageId: number) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMessages(filteredMessages.map((message) => message.id));
    } else {
      setSelectedMessages([]);
    }
  };

  const handleDeleteMessages = async () => {
    if (selectedMessages.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedMessages.length} message(s)?`)) {
      return;
    }

    try {
      for (const messageId of selectedMessages) {
        await contactService.deleteMessage(messageId);
      }
      setSelectedMessages([]);
      fetchMessages();
    } catch (err) {
      console.error("Error deleting messages:", err);
      alert("Failed to delete some messages");
    }
  };

  const handleStatusChange = async (messageId: number, newStatus: string) => {
    setUpdatingStatus(messageId);
    try {
      await contactService.updateMessageStatus(messageId, newStatus);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, status: newStatus as ContactMessage["status"] } : message
        )
      );
      if (selectedMessage?.id === messageId) {
        setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus as ContactMessage["status"] } : null));
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update message status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openDetailModal = (message: ContactMessage) => {
    setSelectedMessage(message);
    setShowDetailModal(true);
    // Mark as read if unread
    if (message.status === "unread") {
      handleStatusChange(message.id, "read");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "read":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "replied":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "archived":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchMessages}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search messages..."
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-dark-500 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <DeleteButton
          onClick={handleDeleteMessages}
          disabled={selectedMessages.length === 0}
          selectedCount={selectedMessages.length}
          label="Delete Selected"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-500 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Messages</p>
          <p className="text-2xl font-bold text-white">{totalMessages}</p>
        </div>
        <div className="bg-dark-500 rounded-lg p-4 border border-blue-500/30">
          <p className="text-blue-400 text-sm">Unread</p>
          <p className="text-2xl font-bold text-blue-400">
            {messages.filter((m) => m.status === "unread").length}
          </p>
        </div>
        <div className="bg-dark-500 rounded-lg p-4 border border-yellow-500/30">
          <p className="text-yellow-400 text-sm">Read</p>
          <p className="text-2xl font-bold text-yellow-400">
            {messages.filter((m) => m.status === "read").length}
          </p>
        </div>
        <div className="bg-dark-500 rounded-lg p-4 border border-green-500/30">
          <p className="text-green-400 text-sm">Replied</p>
          <p className="text-2xl font-bold text-green-400">
            {messages.filter((m) => m.status === "replied").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-500 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-500"
                    checked={
                      selectedMessages.length === filteredMessages.length &&
                      filteredMessages.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No messages found
                  </td>
                </tr>
              ) : (
                filteredMessages.map((message) => (
                  <tr 
                    key={message.id} 
                    className={`hover:bg-gray-750 transition-colors ${message.status === 'unread' ? 'bg-dark-600/50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-500"
                        checked={selectedMessages.includes(message.id)}
                        onChange={() => handleMessageSelect(message.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openDetailModal(message)}
                        className={`text-sm font-medium hover:text-purple-400 transition-colors text-left ${message.status === 'unread' ? 'text-white font-semibold' : 'text-gray-300'}`}
                      >
                        {message.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <a href={`mailto:${message.email}`} className="hover:text-purple-400">
                        {message.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {message.subject.length > 30
                        ? message.subject.substring(0, 30) + "..."
                        : message.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={message.status}
                        onChange={(e) => handleStatusChange(message.id, e.target.value)}
                        disabled={updatingStatus === message.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                          message.status
                        )} bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      >
                        <option value="unread" className="bg-dark-700 text-white">
                          Unread
                        </option>
                        <option value="read" className="bg-dark-700 text-white">
                          Read
                        </option>
                        <option value="replied" className="bg-dark-700 text-white">
                          Replied
                        </option>
                        <option value="archived" className="bg-dark-700 text-white">
                          Archived
                        </option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(message.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openDetailModal(message)}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, totalMessages)} of {totalMessages} messages
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-dark-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-dark-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-600 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{selectedMessage.subject}</h2>
                  <p className="text-gray-400 text-sm">Message #{selectedMessage.id}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sender Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-dark-500 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">From</p>
                  <p className="text-white font-medium">{selectedMessage.name}</p>
                </div>
                <div className="bg-dark-500 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-purple-400 hover:text-purple-300 font-medium">
                    {selectedMessage.email}
                  </a>
                </div>
                <div className="bg-dark-500 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <select
                    value={selectedMessage.status}
                    onChange={(e) => handleStatusChange(selectedMessage.id, e.target.value)}
                    disabled={updatingStatus === selectedMessage.id}
                    className={`mt-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(
                      selectedMessage.status
                    )} bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="unread" className="bg-dark-700 text-white">Unread</option>
                    <option value="read" className="bg-dark-700 text-white">Read</option>
                    <option value="replied" className="bg-dark-700 text-white">Replied</option>
                    <option value="archived" className="bg-dark-700 text-white">Archived</option>
                  </select>
                </div>
                <div className="bg-dark-500 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Received</p>
                  <p className="text-white">{formatDate(selectedMessage.created_at)}</p>
                </div>
              </div>

              {/* Message Content */}
              <div className="mb-6">
                <h3 className="text-gray-400 text-sm mb-2">Message</h3>
                <div className="bg-dark-500 rounded-lg p-4">
                  <p className="text-white whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-700">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  onClick={() => handleStatusChange(selectedMessage.id, "replied")}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-center"
                >
                  Reply via Email
                </a>
                <button
                  onClick={() => {
                    handleStatusChange(selectedMessage.id, "archived");
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Archive
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this message?")) {
                      await contactService.deleteMessage(selectedMessage.id);
                      setShowDetailModal(false);
                      fetchMessages();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessagesPage;
