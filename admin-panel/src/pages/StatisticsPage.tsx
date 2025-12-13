import React, { useEffect, useState, useMemo } from 'react';
import { Users, Eye, User, FileText, Shield } from 'lucide-react';
import StatCard from '../components/StatCard';
import { useUsers } from '../contexts/userContext';

const StatisticsPage: React.FC = () => {
  const { allUsers, loading } = useUsers();

  const activeUsers = useMemo(() => {
    return allUsers.filter(user => {
      const updatedAt = new Date(user.updated_at);
      return updatedAt >= new Date('2025-07-17');
    });
  }, [allUsers]);

  return (
    <div className="space-y-6 ">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={allUsers.length}
          icon={Users}
          iconColor="text-gray-400"
        />

        <StatCard
          title="Active Users (30 days)"
          value={activeUsers.length}
          icon={Eye}
          iconColor="text-gray-400"
        />

        <StatCard
          title="New Signups (30 days)"
          value="123"
          icon={User}
          iconColor="text-gray-400"
        />

        <StatCard
          title="Total Threads"
          value="123"
          icon={FileText}
          iconColor="text-gray-400"
        />

        <StatCard
          title="Total Posts"
          value="123"
          icon={FileText}
          iconColor="text-gray-400"
        />

        <StatCard
          title="Pending Moderation"
          value="123"
          icon={Shield}
          iconColor="text-gray-400"
        />
      </div>

      <div className="bg-dark-500 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Activity Overview</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">User Engagement Rate</span>
            <span className="text-green-400">21.6%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Daily Active Users</span>
            <span className="text-white">1,247</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Average Session Duration</span>
            <span className="text-white">8m 32s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;