import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Table2,
  ChefHat,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import axios from '../../api/axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    paidOrdersCount: 0,
    todayOrders: 0,
    availableTables: 0,
    occupiedTables: 0,
    reservedTables: 0,
    totalTables: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/dashboard/summary');
      if (!response.data?.success || !response.data?.stats) {
        throw new Error('Dashboard summary response was invalid');
      }
      setStats(response.data.stats);

    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Today Orders',
      value: stats.todayOrders,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      change: `${stats.totalOrders} all time`,
      changeColor: 'text-blue-600'
    },
    {
      title: 'Active Tables',
      value: `${stats.occupiedTables || 0}/${stats.totalTables || 0}`,
      icon: Table2,
      color: 'bg-orange-500',
      change: `${stats.availableTables} available`,
      changeColor: 'text-orange-600'
    },
    {
      title: 'Table Occupancy',
      value: `${stats.occupancyRate || 0}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: `${stats.reservedTables || 0} reserved`,
      changeColor: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-700 text-lg font-semibold mb-2">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your restaurant today.</p>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <span className={`text-sm ${stat.changeColor || 'text-green-600'} font-semibold`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
