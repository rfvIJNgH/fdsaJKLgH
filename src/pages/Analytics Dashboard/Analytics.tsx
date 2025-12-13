import React, { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp, Eye, Heart, Star } from 'lucide-react';
import MetricCard from './components/MetricCard';
import Chart from './components/Charts';
import TopContentList from './components/TopContentList';
import EngagementChart from './components/EngagementChart';

interface AnalyticsData {
  totalRevenue: number;
  totalFans: number;
  totalViews: number;
  engagementRate: number;
  revenueChange: number;
  fanGrowth: number;
  viewsChange: number;
  engagementChange: number;
}

const Analytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 12450,
    totalFans: 2847,
    totalViews: 156780,
    engagementRate: 8.4,
    revenueChange: 15.2,
    fanGrowth: 8.7,
    viewsChange: 12.3,
    engagementChange: -2.1
  });

  // Mock data - in real app, this would come from API
  const topContent = [
    {
      id: 1,
      title: "Exclusive Behind the Scenes",
      thumbnail: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200",
      views: 45230,
      likes: 3420,
      revenue: 2850,
      rank: 1
    },
    {
      id: 2,
      title: "Premium Photo Set #42",
      thumbnail: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=200",
      views: 38750,
      likes: 2890,
      revenue: 2340,
      rank: 2
    },
    {
      id: 3,
      title: "Live Stream Highlights",
      thumbnail: "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=200",
      views: 32150,
      likes: 2456,
      revenue: 1890,
      rank: 3
    },
    {
      id: 4,
      title: "Custom Request Collection",
      thumbnail: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=200",
      views: 28900,
      likes: 2123,
      revenue: 1650,
      rank: 4
    },
    {
      id: 5,
      title: "Artistic Portrait Series",
      thumbnail: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=200",
      views: 24680,
      likes: 1889,
      revenue: 1420,
      rank: 5
    }
  ];

  const fanGrowthData = [
    { label: 'Jan', value: 1200 },
    { label: 'Feb', value: 1450 },
    { label: 'Mar', value: 1680 },
    { label: 'Apr', value: 1920 },
    { label: 'May', value: 2150 },
    { label: 'Jun', value: 2380 },
    { label: 'Jul', value: 2590 },
    { label: 'Aug', value: 2847 }
  ];

  const revenueByContentType = [
    { label: 'Photos', value: 5400, color: '#3B82F6' },
    { label: 'Videos', value: 4200, color: '#10B981' },
    { label: 'Live Streams', value: 2850, color: '#F59E0B' }
  ];

  const engagementData = [
    { hour: '00', averageTime: 12, activeUsers: 45, contentViews: 234 },
    { hour: '04', averageTime: 8, activeUsers: 23, contentViews: 156 },
    { hour: '08', averageTime: 15, activeUsers: 89, contentViews: 445 },
    { hour: '12', averageTime: 22, activeUsers: 156, contentViews: 687 },
    { hour: '16', averageTime: 28, activeUsers: 203, contentViews: 892 },
    { hour: '20', averageTime: 35, activeUsers: 267, contentViews: 1045 },
    { hour: '24', averageTime: 18, activeUsers: 98, contentViews: 534 }
  ];

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRange]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Track your content performance and revenue insights</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={`$${analyticsData.totalRevenue.toLocaleString()}`}
          change={analyticsData.revenueChange}
          icon={<DollarSign size={24} className="text-white" />}
          color="success"
        />
        <MetricCard
          title="Fan Club Members"
          value={analyticsData.totalFans.toLocaleString()}
          change={analyticsData.fanGrowth}
          icon={<Users size={24} className="text-white" />}
          color="primary"
        />
        <MetricCard
          title="Total Views"
          value={analyticsData.totalViews.toLocaleString()}
          change={analyticsData.viewsChange}
          icon={<Eye size={24} className="text-white" />}
          color="warning"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${analyticsData.engagementRate}%`}
          change={analyticsData.engagementChange}
          icon={<Heart size={24} className="text-white" />}
          color="error"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Chart
          title="Fan Club Growth Trends"
          data={fanGrowthData}
          type="line"
          height={300}
        />
        <Chart
          title="Token Revenue by Content Type"
          data={revenueByContentType}
          type="pie"
          height={300}
        />
      </div>

      {/* Engagement and Top Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EngagementChart data={engagementData} isLoading={isLoading} />
        </div>
        <div>
          <TopContentList content={topContent} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;