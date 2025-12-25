import React, { useEffect, useState } from "react";
import { Report } from "../types";
import { reportService } from "../services/api";
import SearchInput from "../components/SearchInput";
import DeleteButton from "../components/DeleteButton";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const limit = 20;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = {
        page: currentPage,
        limit,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await reportService.getAllReports(params);
      setReports(response.data.reports);
      setTotalPages(response.data.pagination.totalPages);
      setTotalReports(response.data.pagination.total);
      setError(null);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentPage, statusFilter]);

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReportSelect = (reportId: number) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(filteredReports.map((report) => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleDeleteReports = async () => {
    if (selectedReports.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedReports.length} report(s)?`)) {
      return;
    }

    try {
      for (const reportId of selectedReports) {
        await reportService.deleteReport(reportId);
      }
      setSelectedReports([]);
      fetchReports();
    } catch (err) {
      console.error("Error deleting reports:", err);
      alert("Failed to delete some reports");
    }
  };

  const handleStatusChange = async (reportId: number, newStatus: string) => {
    setUpdatingStatus(reportId);
    try {
      await reportService.updateReportStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, status: newStatus as Report["status"] } : report
        )
      );
      if (selectedReport?.id === reportId) {
        setSelectedReport((prev) => (prev ? { ...prev, status: newStatus as Report["status"] } : null));
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update report status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openDetailModal = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "reviewed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "dismissed":
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

  if (loading && reports.length === 0) {
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
          onClick={fetchReports}
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
            placeholder="Search reports..."
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
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
        <DeleteButton
          onClick={handleDeleteReports}
          disabled={selectedReports.length === 0}
          selectedCount={selectedReports.length}
          label="Delete Selected"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-500 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Reports</p>
          <p className="text-2xl font-bold text-white">{totalReports}</p>
        </div>
        <div className="bg-dark-500 rounded-lg p-4 border border-yellow-500/30">
          <p className="text-yellow-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">
            {reports.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div className="bg-dark-500 rounded-lg p-4 border border-blue-500/30">
          <p className="text-blue-400 text-sm">Under Review</p>
          <p className="text-2xl font-bold text-blue-400">
            {reports.filter((r) => r.status === "reviewed").length}
          </p>
        </div>
        <div className="bg-dark-500 rounded-lg p-4 border border-green-500/30">
          <p className="text-green-400 text-sm">Resolved</p>
          <p className="text-2xl font-bold text-green-400">
            {reports.filter((r) => r.status === "resolved").length}
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
                      selectedReports.length === filteredReports.length &&
                      filteredReports.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Reported User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Images
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
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-500"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => handleReportSelect(report.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openDetailModal(report)}
                        className="text-sm font-medium text-white hover:text-purple-400 transition-colors text-left"
                      >
                        {report.title.length > 30
                          ? report.title.substring(0, 30) + "..."
                          : report.title}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {report.reporter_username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400 font-medium">
                      {report.reported_username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                        disabled={updatingStatus === report.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                          report.status
                        )} bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      >
                        <option value="pending" className="bg-dark-700 text-white">
                          Pending
                        </option>
                        <option value="reviewed" className="bg-dark-700 text-white">
                          Reviewed
                        </option>
                        <option value="resolved" className="bg-dark-700 text-white">
                          Resolved
                        </option>
                        <option value="dismissed" className="bg-dark-700 text-white">
                          Dismissed
                        </option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {report.images.length > 0 ? (
                        <div className="flex -space-x-2">
                          {report.images.slice(0, 3).map((img, idx) => (
                            <button
                              key={img.id}
                              onClick={() => openImageModal(`${BASE_URL}${img.image_url}`)}
                              className="w-8 h-8 rounded-full border-2 border-dark-500 overflow-hidden hover:z-10 hover:scale-110 transition-transform"
                            >
                              <img
                                src={`${BASE_URL}${img.image_url}`}
                                alt={`Attachment ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                          {report.images.length > 3 && (
                            <span className="w-8 h-8 rounded-full bg-gray-600 border-2 border-dark-500 flex items-center justify-center text-xs text-white">
                              +{report.images.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">No images</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openDetailModal(report)}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                      >
                        View Details
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
              {Math.min(currentPage * limit, totalReports)} of {totalReports} reports
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
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-600 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{selectedReport.title}</h2>
                  <p className="text-gray-400 text-sm">Report #{selectedReport.id}</p>
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

              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-dark-500 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Reporter</p>
                  <p className="text-white font-medium">{selectedReport.reporter_username}</p>
                </div>
                <div className="bg-dark-500 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Reported User</p>
                  <p className="text-red-400 font-medium">{selectedReport.reported_username}</p>
                </div>
                <div className="bg-dark-500 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <select
                    value={selectedReport.status}
                    onChange={(e) => handleStatusChange(selectedReport.id, e.target.value)}
                    disabled={updatingStatus === selectedReport.id}
                    className={`mt-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(
                      selectedReport.status
                    )} bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="pending" className="bg-dark-700 text-white">Pending</option>
                    <option value="reviewed" className="bg-dark-700 text-white">Reviewed</option>
                    <option value="resolved" className="bg-dark-700 text-white">Resolved</option>
                    <option value="dismissed" className="bg-dark-700 text-white">Dismissed</option>
                  </select>
                </div>
                <div className="bg-dark-500 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Submitted</p>
                  <p className="text-white">{formatDate(selectedReport.created_at)}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-gray-400 text-sm mb-2">Description</h3>
                <div className="bg-dark-500 rounded-lg p-4">
                  <p className="text-white whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              </div>

              {/* Images */}
              {selectedReport.images.length > 0 && (
                <div>
                  <h3 className="text-gray-400 text-sm mb-2">
                    Attached Images ({selectedReport.images.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedReport.images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => openImageModal(`${BASE_URL}${img.image_url}`)}
                        className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition-colors"
                      >
                        <img
                          src={`${BASE_URL}${img.image_url}`}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={() => {
                    handleStatusChange(selectedReport.id, "resolved");
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => {
                    handleStatusChange(selectedReport.id, "dismissed");
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this report?")) {
                      await reportService.deleteReport(selectedReport.id);
                      setShowDetailModal(false);
                      fetchReports();
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

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ReportsPage;