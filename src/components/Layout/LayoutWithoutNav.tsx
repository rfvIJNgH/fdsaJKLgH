import React from 'react';
import { Outlet } from 'react-router-dom';

const LayoutWhioutNav: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default LayoutWhioutNav;