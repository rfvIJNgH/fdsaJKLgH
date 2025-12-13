import React, { useState } from 'react';
import { Clock, Users, Play } from 'lucide-react';

interface EngagementData {
  hour: string;
  averageTime: number;
  activeUsers: number;
  contentViews: number;
}

interface EngagementChartProps {
  data: EngagementData[];
  isLoading?: boolean;
}

const EngagementChart: React.FC<EngagementChartProps> = ({ data, isLoading }) => {
  const [selectedMetric, setSelectedMetric] = useState<'averageTime' | 'activeUsers' | 'contentViews'>('averageTime');

  if (isLoading) {
    return (
      <div className="bg-dark-800 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-48 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d[selectedMetric]));

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'averageTime': return 'Avg. Time (minutes)';
      case 'activeUsers': return 'Active Users';
      case 'contentViews': return 'Content Views';
      default: return '';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'averageTime': return <Clock size={16} />;
      case 'activeUsers': return <Users size={16} />;
      case 'contentViews': return <Play size={16} />;
      default: return null;
    }
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Viewer Engagement Analytics</h3>
        <div className="flex space-x-2">
          {(['averageTime', 'activeUsers', 'contentViews'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedMetric === metric
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {getMetricIcon(metric)}
              <span>{getMetricLabel(metric)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 relative">
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400">
          <span>{maxValue}</span>
          <span>{Math.floor(maxValue * 0.75)}</span>
          <span>{Math.floor(maxValue * 0.5)}</span>
          <span>{Math.floor(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        <div className="ml-8 h-full flex items-end space-x-1">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group">
              <div className="relative w-full">
                <div
                  className="w-full bg-primary-500 rounded-t-lg transition-all duration-300 group-hover:bg-primary-400 relative"
                  style={{
                    height: `${(item[selectedMetric] / maxValue) * 100}%`,
                    minHeight: '4px'
                  }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-dark-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item[selectedMetric].toLocaleString()}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400 mt-1">{item.hour}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-primary-400 mb-1">
            <Clock size={16} />
            <span className="text-sm">Avg. Session</span>
          </div>
          <div className="text-xl font-bold text-white">
            {Math.round(data.reduce((sum, d) => sum + d.averageTime, 0) / data.length)}m
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-green-400 mb-1">
            <Users size={16} />
            <span className="text-sm">Peak Users</span>
          </div>
          <div className="text-xl font-bold text-white">
            {Math.max(...data.map(d => d.activeUsers)).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-yellow-400 mb-1">
            <Play size={16} />
            <span className="text-sm">Total Views</span>
          </div>
          <div className="text-xl font-bold text-white">
            {data.reduce((sum, d) => sum + d.contentViews, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementChart;