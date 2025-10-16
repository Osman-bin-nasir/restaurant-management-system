import React from 'react';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const AppLayout = () => {
  const { loading } = useAuth();

  if (loading) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500 border-opacity-75"></div>
        <p className="text-orange-500 text-lg font-medium">Loading, please wait...</p>
      </div>
    </div>
  );
}

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
