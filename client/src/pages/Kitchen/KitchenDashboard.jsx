import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ChefHat, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Flame,
  Package
} from 'lucide-react';
import axios from '../../api/axios';

const KitchenDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    inKitchen: 0,
    completedToday: 0
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKitchenData();
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchKitchenData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchKitchenData = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        axios.get('/kitchen/orders'),
        axios.get('/kitchen/stats')
      ]);

      const orders = ordersRes.data?.orders || [];
      setPendingOrders(orders.slice(0, 10)); // Show top 10 orders

      setStats(statsRes.data?.stats || {
        pending: 0,
        inKitchen: 0,
        completedToday: 0
      });
    } catch (error) {
      console.error('Failed to fetch kitchen data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOrder = async (orderId) => {
    try {
      await axios.patch(`/kitchen/orders/${orderId}/start`);
      fetchKitchenData(); // Refresh data
    } catch (error) {
      console.error('Failed to start order:', error);
      alert('Failed to start order preparation');
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      await axios.patch(`/kitchen/orders/${orderId}/ready`);
      fetchKitchenData(); // Refresh data
    } catch (error) {
      console.error('Failed to mark order as ready:', error);
      alert('Failed to mark order as ready');
    }
  };

  const getOrderPriority = (createdAt) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt)) / 60000);
    if (minutes > 20) return 'urgent';
    if (minutes > 10) return 'high';
    return 'normal';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      normal: 'bg-green-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      urgent: 'URGENT',
      high: 'HIGH',
      normal: 'NORMAL'
    };
    return labels[priority] || 'NORMAL';
  };

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
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ChefHat size={36} className="text-orange-500" />
          Kitchen Dashboard 👨‍🍳
        </h1>
        <p className="text-gray-600 mt-2">Welcome, Chef {user?.name}! Manage incoming orders</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-red-500 p-4 rounded-xl">
              <AlertCircle className="text-white" size={28} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-4 rounded-xl">
              <Flame className="text-white" size={28} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">In Kitchen</p>
              <p className="text-3xl font-bold text-gray-900">{stats.inKitchen}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-4 rounded-xl">
              <CheckCircle className="text-white" size={28} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Queue */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Order Queue</h2>
          <button
            onClick={fetchKitchenData}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900 mb-2">All Caught Up! 🎉</p>
            <p className="text-gray-600">No pending orders. Great work!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => {
              const priority = getOrderPriority(order.createdAt);
              const waitTime = Math.floor((Date.now() - new Date(order.createdAt)) / 60000);

              return (
                <div 
                  key={order._id} 
                  className={`border-l-4 ${
                    priority === 'urgent' ? 'border-red-500' :
                    priority === 'high' ? 'border-orange-500' :
                    'border-green-500'
                  } bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
                        <span className={`w-3 h-3 rounded-full ${getPriorityColor(priority)} ${
                          priority === 'urgent' ? 'animate-pulse' : ''
                        }`}></span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {getPriorityLabel(priority)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : 'Parcel Order'}
                        {' • '}
                        {order.items?.length || 0} items
                        {order.customerName && ` • ${order.customerName}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className={waitTime > 15 ? 'text-red-600' : 'text-gray-500'} />
                      <span className={`font-semibold ${waitTime > 15 ? 'text-red-600' : 'text-gray-700'}`}>
                        {waitTime}m ago
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4 space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Package size={18} className="text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.menuItem?.name}</p>
                          {item.notes && (
                            <p className="text-xs text-red-600 mt-1 font-semibold">⚠️ Note: {item.notes}</p>
                          )}
                        </div>
                        <span className="font-bold text-gray-900 text-lg">×{item.quantity}</span>
                        {item.menuItem?.cookingTime && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            ~{item.menuItem.cookingTime}m
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'placed' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'in-kitchen' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {order.status === 'placed' && '🔵 New Order'}
                      {order.status === 'in-kitchen' && '🔥 Cooking'}
                      {order.status === 'ready' && '✅ Ready'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {order.status === 'placed' && (
                      <button
                        onClick={() => handleStartOrder(order._id)}
                        className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Flame size={20} />
                        Start Cooking
                      </button>
                    )}
                    {order.status === 'in-kitchen' && (
                      <button
                        onClick={() => handleMarkReady(order._id)}
                        className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} />
                        Mark as Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <div className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold text-center">
                        ✅ Ready for Service
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Performance Tips */}
      {stats.inKitchen > 5 && (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 mt-1" size={20} />
            <div>
              <p className="font-semibold text-yellow-900">High Load Alert</p>
              <p className="text-sm text-yellow-700 mt-1">
                You have {stats.inKitchen} orders in kitchen. Prioritize urgent orders and coordinate with your team!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;