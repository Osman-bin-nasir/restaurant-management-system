import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Table2,
  ChefHat,
  AlertCircle,
  Clock
} from 'lucide-react';
import axios from '../../api/axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    availableTables: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch stats from backend (you'll need to create these endpoints)
      const [ordersRes, tablesRes] = await Promise.all([
        axios.get('/orders/stats/summary'),
        axios.get('/tables/stats')
      ]);

      setStats({
        totalOrders: ordersRes.data?.stats?.byStatus?.reduce((sum, s) => sum + s.count, 0) || 0,
        totalRevenue: ordersRes.data?.stats?.byStatus?.reduce((sum, s) => sum + s.totalAmount, 0) || 0,
        activeUsers: 12, // Mock data
        availableTables: tablesRes.data?.stats?.available || 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Users,
      color: 'bg-purple-500',
      change: '+3%'
    },
    {
      title: 'Available Tables',
      value: stats.availableTables,
      icon: Table2,
      color: 'bg-orange-500',
      change: '5 occupied'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your restaurant today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <span className="text-sm text-green-600 font-semibold">{stat.change}</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={24} className="text-orange-500" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ShoppingBag size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">New order placed</p>
                <p className="text-sm text-gray-600">Table #5 - ₹450</p>
              </div>
              <span className="text-xs text-gray-500">2m ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Payment received</p>
                <p className="text-sm text-gray-600">Order #ORD-1234</p>
              </div>
              <span className="text-xs text-gray-500">5m ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">New user registered</p>
                <p className="text-sm text-gray-600">Ravi Waiter</p>
              </div>
              <span className="text-xs text-gray-500">10m ago</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle size={24} className="text-orange-500" />
            Important Alerts
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
              <p className="font-medium text-yellow-900">Low Stock Alert</p>
              <p className="text-sm text-yellow-700 mt-1">5 menu items are running low on ingredients</p>
            </div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <p className="font-medium text-blue-900">Peak Hours Approaching</p>
              <p className="text-sm text-blue-700 mt-1">Dinner rush expected in 30 minutes</p>
            </div>
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <p className="font-medium text-green-900">All Systems Operational</p>
              <p className="text-sm text-green-700 mt-1">Kitchen and billing running smoothly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;