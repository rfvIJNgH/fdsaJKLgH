import React, { useState, useEffect } from 'react';
import UserCard from './UserCard';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';
import { User } from '../../interface/interface';

interface UsersGridProps {
  actionButton: (userId: number) => React.ReactNode;
  onUserClick?: (user: User) => void;
  selectedUser?: User | null;
}

const UsersGrid: React.FC<UsersGridProps> = ({ actionButton, onUserClick, selectedUser }) => {

  const { data: users, error, isLoading } = useSWR('/api/gigs/all', fetcher);

  // Debug: Log the data to see what we're getting
  console.log('UsersGrid - API Response:', users);
  console.log('UsersGrid - Is Array?', Array.isArray(users));
  console.log('UsersGrid - Length:', users?.length);
  console.log('UsersGrid - Selected User:', selectedUser);

  if(error) {
    return <div>Error: {error.message}</div>;
  }

  // Check if we have valid data
  if (!users || !Array.isArray(users) || users.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-gray-400">
          {!users ? 'Loading...' : 'No gigs found'}
        </div>
      </div>
    );
  }

  // Debug: Log the first user to see the structure
  console.log('UsersGrid - First user:', users[0]);

  const handleUserClick = (user: User) => {
    console.log('User clicked:', user);
    console.log('User username:', user.username);
    console.log('User user_id:', user.id);
    if (onUserClick) {
      onUserClick(user); // Pass full user object to parent
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mb-12">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users && users.map((user: User) => (
          <div key={user.id}>
            <UserCard
              user={user}
              onUserClick={handleUserClick}
              actionButton={actionButton(user.id)}
              isSelected={selectedUser?.id === user.id}
            />
          </div>
        ))}
      </div>

      {(!users || users.length === 0) && (
        <div className="text-center text-gray-400 py-12">
          No users found
        </div>
      )}
    </div>
  );
};

export default UsersGrid;