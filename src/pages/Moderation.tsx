import React, { useState } from 'react';
import { FileText, AlertTriangle, UserX, BarChart3, Check, X, Eye, Calendar, Image, Video, Clock, Shield, Users, TrendingUp, Menu } from 'lucide-react';

// Type definitions
interface Post {
    id: string;
    title: string;
    photos: number;
    videos: number;
    datePosted: string;
    status: 'pending' | 'approved' | 'rejected';
    author: string;
}

interface Report {
    id: string;
    reportedContent: string;
    reason: string;
    reporter: string;
    dateReported: string;
    status: 'pending' | 'resolved';
    severity: 'low' | 'medium' | 'high';
}

interface User {
    id: string;
    username: string;
    email: string;
    joinDate: string;
    status: 'active' | 'banned' | 'suspended';
    postsCount: number;
    reportsCount: number;
}

// Mock data
const mockPosts: Post[] = [
    {
        id: '1',
        title: 'Recent nudes posted',
        photos: 4,
        videos: 5,
        datePosted: 'January 6th, 2023',
        status: 'pending',
        author: 'user123'
    },
    {
        id: '2',
        title: 'Beach vacation pics',
        photos: 12,
        videos: 2,
        datePosted: 'January 5th, 2023',
        status: 'approved',
        author: 'beachgirl'
    },
    {
        id: '3',
        title: 'Party night highlights',
        photos: 8,
        videos: 3,
        datePosted: 'January 4th, 2023',
        status: 'pending',
        author: 'partyplanner'
    }
];

const mockReports: Report[] = [
    {
        id: '1',
        reportedContent: 'Inappropriate comment on beach photos',
        reason: 'Harassment',
        reporter: 'concerned_user',
        dateReported: 'January 6th, 2023',
        status: 'pending',
        severity: 'high'
    },
    {
        id: '2',
        reportedContent: 'Spam links in profile',
        reason: 'Spam',
        reporter: 'moderator_helper',
        dateReported: 'January 5th, 2023',
        status: 'resolved',
        severity: 'medium'
    }
];

const mockUsers: User[] = [
    {
        id: '1',
        username: 'problematic_user',
        email: 'problem@example.com',
        joinDate: 'December 15th, 2022',
        status: 'active',
        postsCount: 23,
        reportsCount: 5
    },
    {
        id: '2',
        username: 'good_citizen',
        email: 'good@example.com',
        joinDate: 'November 20th, 2022',
        status: 'active',
        postsCount: 45,
        reportsCount: 0
    },
    {
        id: '3',
        username: 'banned_user',
        email: 'banned@example.com',
        joinDate: 'October 10th, 2022',
        status: 'banned',
        postsCount: 12,
        reportsCount: 8
    }
];

const Moderation: React.FC = () => {
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState(mockPosts);
    const [reports, setReports] = useState(mockReports);
    const [users, setUsers] = useState(mockUsers);
    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
    const [showBanModal, setShowBanModal] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const tabs = [
        { id: 'posts', label: 'Moderate Posts', icon: FileText },
        { id: 'reports', label: 'Reports', icon: AlertTriangle },
        { id: 'users', label: 'Ban Users', icon: UserX },
        { id: 'stats', label: 'Statistics', icon: BarChart3 },
    ];

    const handleApprovePost = (id: string) => {
        setPosts(prev => prev.map(post =>
            post.id === id ? { ...post, status: 'approved' } : post
        ));
    };

    const handleRejectPost = (id: string) => {
        setPosts(prev => prev.map(post =>
            post.id === id ? { ...post, status: 'rejected' } : post
        ));
    };

    const handleResolveReport = (id: string) => {
        setReports(prev => prev.map(report =>
            report.id === id ? { ...report, status: 'resolved' } : report
        ));
    };

    const handleBanUser = (id: string) => {
        setUsers(prev => prev.map(user =>
            user.id === id ? { ...user, status: 'banned' } : user
        ));
    };

    const handleUnbanUser = (id: string) => {
        setUsers(prev => prev.map(user =>
            user.id === id ? { ...user, status: 'active' } : user
        ));
    };

    const handleSelectAllPosts = (checked: boolean) => {
        setSelectedPosts(checked ? posts.map(p => p.id) : []);
    };

    const handleSelectPost = (id: string, checked: boolean) => {
        setSelectedPosts(prev =>
            checked ? [...prev, id] : prev.filter(p => p !== id)
        );
    };

    const handleBanConfirm = (userId: string) => {
        handleBanUser(userId);
        setShowBanModal(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-400 bg-green-600/20 border border-green-600/30';
            case 'rejected': return 'text-red-400 bg-red-600/20 border border-red-600/30';
            case 'banned': return 'text-red-400 bg-red-600/20 border border-red-600/30';
            case 'suspended': return 'text-orange-400 bg-orange-600/20 border border-orange-600/30';
            case 'resolved': return 'text-green-400 bg-green-600/20 border border-green-600/30';
            case 'active': return 'text-green-400 bg-green-600/20 border border-green-600/30';
            default: return 'text-orange-400 bg-orange-600/20 border border-orange-600/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            default: return 'Awaiting moderation';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-400 bg-red-600/20 border border-red-600/30';
            case 'medium': return 'text-orange-400 bg-orange-600/20 border border-orange-600/30';
            default: return 'text-green-400 bg-green-600/20 border border-green-600/30';
        }
    };

    const getStatusIcon = (status: string) => {
        return status === 'resolved' ? <Check className="h-4 w-4 text-green-400" /> : <Clock className="h-4 w-4 text-orange-400" />;
    };

    const renderPostsTable = () => (
        <div className="bg-black/60 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-600/30">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Content Awaiting Moderation</h3>
                    {selectedPosts.length > 0 && (
                        <div className="flex space-x-3">
                            <button
                                onClick={() => selectedPosts.forEach(handleApprovePost)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Approve Selected ({selectedPosts.length})
                            </button>
                            <button
                                onClick={() => selectedPosts.forEach(handleRejectPost)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Reject Selected ({selectedPosts.length})
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedPosts.length === posts.length}
                                    onChange={(e) => handleSelectAllPosts(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Thread Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Media
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Author
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Date Posted
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600/30">
                        {posts.map((post) => (
                            <tr key={post.id} className="hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedPosts.includes(post.id)}
                                        onChange={(e) => handleSelectPost(post.id, e.target.checked)}
                                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-white">{post.title}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                                        {post.photos > 0 && (
                                            <div className="flex items-center space-x-1">
                                                <Image className="h-4 w-4" />
                                                <span>{post.photos}</span>
                                            </div>
                                        )}
                                        {post.videos > 0 && (
                                            <div className="flex items-center space-x-1">
                                                <Video className="h-4 w-4" />
                                                <span>{post.videos}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">{post.author}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-1 text-sm text-gray-300">
                                        <Calendar className="h-4 w-4" />
                                        <span>{post.datePosted}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                                        {getStatusText(post.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <button className="text-purple-400 hover:text-purple-300 transition-colors">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        {post.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprovePost(post.id)}
                                                    className="text-green-400 hover:text-green-300 transition-colors"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRejectPost(post.id)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderReportsTable = () => (
        <div className="bg-black/60 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-600/30">
                <h3 className="text-lg font-semibold text-white">User Reports</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Content
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Reason
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Reporter
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Severity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600/30">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-white">{report.reportedContent}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                                        <span className="text-sm text-gray-300">{report.reason}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">{report.reporter}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getSeverityColor(report.severity)}`}>
                                        {report.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">{report.dateReported}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(report.status)}
                                        <span className="text-sm text-gray-300 capitalize">{report.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <button className="text-purple-400 hover:text-purple-300 transition-colors">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        {report.status === 'pending' && (
                                            <button
                                                onClick={() => handleResolveReport(report.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderUsersTable = () => (
        <>
            <div className="bg-black/60 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-600/30">
                    <h3 className="text-lg font-semibold text-white">User Management</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Join Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Posts
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Reports
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600/30">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-medium text-white">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium text-white">{user.username}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{user.joinDate}</td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{user.postsCount}</td>
                                    <td className="px-6 py-4">
                                        {user.reportsCount > 0 ? (
                                            <div className="flex items-center space-x-1 text-red-400">
                                                <AlertTriangle className="h-4 w-4" />
                                                <span className="text-sm">{user.reportsCount}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-300">0</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(user.status)}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <button className="text-purple-400 hover:text-purple-300 transition-colors">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            {user.status === 'active' ? (
                                                <button
                                                    onClick={() => setShowBanModal(user.id)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <UserX className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnbanUser(user.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                                >
                                                    Unban
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ban Confirmation Modal */}
            {showBanModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-500 border border-red-600/30 rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center space-x-3 mb-4">
                            <UserX className="h-6 w-6 text-red-400" />
                            <h3 className="text-lg font-semibold text-red-400">Confirm Ban</h3>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to ban this user? This action will prevent them from accessing the site while logged in.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowBanModal(null)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleBanConfirm(showBanModal)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Ban User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    const renderStatistics = () => {
        const stats = [
            {
                title: 'Pending Posts',
                value: '24',
                change: '+12%',
                icon: <FileText className="h-8 w-8" />,
                trend: 'up',
            },
            {
                title: 'Active Reports',
                value: '8',
                change: '-5%',
                icon: <AlertTriangle className="h-8 w-8" />,
                trend: 'down',
            },
            {
                title: 'Banned Users',
                value: '15',
                change: '+3',
                icon: <Shield className="h-8 w-8" />,
                trend: 'up',
            },
            {
                title: 'Total Users',
                value: '1,247',
                change: '+8%',
                icon: <Users className="h-8 w-8" />,
                trend: 'up',
            },
        ];

        const getTrendColor = (trend: string) => {
            switch (trend) {
                case 'up': return 'text-green-400';
                case 'down': return 'text-red-400';
                default: return 'text-gray-400';
            }
        };

        return (
            <div className="space-y-6">
                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-black/60 rounded-lg p-6 hover:border-gray-600 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm text-gray-400 mb-2">{stat.title}</h3>
                                    <div className="flex items-center space-x-2">
                                        <div className="text-4xl font-bold text-white">{stat.value}</div>
                                        <span className={`text-sm font-medium ${getTrendColor(stat.trend)}`}>
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-grey-400">
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="bg-black/60 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-4 bg-gray-700/50 rounded-lg">
                            <div className="h-2 w-2 bg-green-400 rounded-full flex-shrink-0"></div>
                            <div className="flex-1">
                                <span className="text-gray-300">Post "Summer beach photos" approved by moderator</span>
                            </div>
                            <span className="text-xs text-gray-500">2 minutes ago</span>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-gray-700/50 rounded-lg">
                            <div className="h-2 w-2 bg-red-400 rounded-full flex-shrink-0"></div>
                            <div className="flex-1">
                                <span className="text-gray-300">User @problematic_user banned for policy violations</span>
                            </div>
                            <span className="text-xs text-gray-500">15 minutes ago</span>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-gray-700/50 rounded-lg">
                            <div className="h-2 w-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                            <div className="flex-1">
                                <span className="text-gray-300">Report resolved: Inappropriate content removed</span>
                            </div>
                            <span className="text-xs text-gray-500">1 hour ago</span>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-gray-700/50 rounded-lg">
                            <div className="h-2 w-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                            <div className="flex-1">
                                <span className="text-gray-300">New user registered: @newuser2023</span>
                            </div>
                            <span className="text-xs text-gray-500">2 hours ago</span>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-gray-700/50 rounded-lg">
                            <div className="h-2 w-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                            <div className="flex-1">
                                <span className="text-gray-300">Content policy updated: New guidelines published</span>
                            </div>
                            <span className="text-xs text-gray-500">5 hours ago</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'posts':
                return renderPostsTable();
            case 'reports':
                return renderReportsTable();
            case 'users':
                return renderUsersTable();
            case 'stats':
                return renderStatistics();
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-dark-500 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden fixed top-4 left-4 z-50 bg-black/60 text-white p-2 rounded-lg"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {/* Sidebar */}
                    <div className={`lg:w-80 lg:flex-shrink-0 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-black/60 rounded-lg p-6">
                            <h1 className="text-2xl font-bold text-white mb-6">Moderation Panel</h1>
                            <nav className="space-y-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setSidebarOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                                            ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <tab.icon size={16} />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {tabs.find(tab => tab.id === activeTab)?.label}
                            </h2>
                        </div>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Moderation;