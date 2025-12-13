import React from 'react';
import AdminPanel from './pages/AdminPanel';
import { UserProvider } from './contexts/userContext';

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <UserProvider>
        <AdminPanel />
      </UserProvider>
    </div>
  );
}

export default App;