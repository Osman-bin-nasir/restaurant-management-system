import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Table2, 
  ShoppingBag, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  ChevronRight
} from 'lucide-react';
import axios from '../../api/axios';

const WaiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myOrders: 0,
    activeOrders: 0,
    completedToday: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaiterData();
  }, []);

  const fetchWaiterData = async () => {
    try {
      const ordersRes = await axios.get('/orders', {
        params: { waiterId: user?.id }
      });

      const allOrders = ordersRes.data?.orders || [];
      const activeOrders = allOrders.filter(o => 
        ['placed', 'in-kitchen', 'ready'].includes(o.status)
      );
      const completedToday = allOrders.filter(o => 
        o.status === 'paid' && 
        new Date(o.createdAt).toDateString() === new Date().toDateString()
      );

      setStats({
        myOrders: allOrders.length,
        activeOrders: activeOrders.length,
        completedToday: completedToday.length
      });

      setRecentOrders(allOrders.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch waiter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'bg-blue-100 text-blue-700',
      'in-kitchen': 'bg-yellow-100 text-yellow-700',
      'ready': 'bg-green-100 text-green-700',
      'served': 'bg-purple-100 text-purple-700',
      'paid': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
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
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}! 🍽️</h1>
        <p className="text-gray-600 mt-2">Manage your tables and orders efficiently</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-4 rounded-xl">
              <ShoppingBag className="text-white" size={28} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">My Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.myOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-4 rounded-xl">
              <Clock className="text-white" size={28} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => navigate('/waiter/tables')}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <Table2 size={32} />
            </div>
            <div className="text-left">
              <p className="text-xl font-bold">View Tables</p>
              <p className="text-white/80 text-sm">Check table availability</p>
            </div>
          </div>
          <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/orders/create')}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <Plus size={32} />
            </div>
            <div className="text-left">
              <p className="text-xl font-bold">New Order</p>
              <p className="text-white/80 text-sm">Create a new order</p>
            </div>
          </div>
          <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={48} className="text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No orders yet. Start taking orders!</p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div 
                key={order._id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <ShoppingBag size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : 'Parcel'} • {order.items?.length || 0} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard;