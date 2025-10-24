import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  Flame,
  Zap,
} from 'lucide-react';
import axios from '../../api/axios';
import OrderCard from '../../components/OrderCard';

// ====================== HELPER COMPONENTS ======================

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-2xl shadow-md p-6">
    <div className="flex items-center gap-4">
      <div className={`${color} p-4 rounded-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const OrderColumn = ({ title, orders, onStartOrder, onReadyOrder, icon, color }) => {
  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <h2 className={`text-2xl font-bold mb-4 flex items-center gap-3 ${color}`}>
        {icon} {title} ({orders.length})
      </h2>
      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No orders in this category.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <OrderCard
              key={order.orderId}
              order={order}
              onStartOrder={onStartOrder}
              onReadyOrder={onReadyOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ====================== HELPER FUNCTIONS ======================

const groupItemsByOrder = (items) => {
  if (!items || items.length === 0) {
    return [];
  }

  const orders = items.reduce((acc, item) => {
    if (!acc[item.orderId]) {
      acc[item.orderId] = {
        orderId: item.orderId,
        orderNumber: item.orderNumber,
        tableNumber: item.tableNumber,
        items: [],
      };
    }
    acc[item.orderId].items.push(item);
    return acc;
  }, {});

  const sortedOrders = Object.values(orders).sort((a, b) => {
    const priorityA = Math.max(...a.items.map(i => i.priority || 0));
    const priorityB = Math.max(...b.items.map(i => i.priority || 0));
    return priorityB - priorityA;
  });

  return sortedOrders;
};


// ====================== MAIN COMPONENT ======================

const KitchenDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    newItems: 0,
    inProgress: 0,
    almostReady: 0,
    total: 0,
    completedToday: 0
  });
  const [queue, setQueue] = useState({
    newItems: [],
    inProgress: [],
    almostReady: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKitchenData = async () => {
    try {
      setError(null);
      const [queueRes, statsRes] = await Promise.all([
        axios.get('/kitchen/queue'),
        axios.get('/kitchen/stats')
      ]);

      setQueue(queueRes.data.queue || { newItems: [], inProgress: [], almostReady: [] });
      setStats(statsRes.data.stats || { newItems: 0, inProgress: 0, almostReady: 0, total: 0 });

    } catch (err) {
      console.error('Failed to fetch kitchen data:', err);
      setError('Failed to load kitchen data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenData();
    const interval = setInterval(fetchKitchenData, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStartCooking = async (orderId, itemIds) => {
    try {
      await axios.post('/kitchen/items/start-cooking', {
        items: [{ orderId, itemIds }]
      });
      fetchKitchenData();
    } catch (err){console.error('Failed to start cooking item:', err);
      alert('Failed to start cooking. The item might have been updated already.');
    }
  };

  const handleMarkReady = async (orderId, itemIds) => {
    try {
      await axios.post('/kitchen/items/mark-ready', {
        items: [{ orderId, itemIds }]
      });
      fetchKitchenData();
    } catch (err) {
      console.error('Failed to mark item as ready:', err);
      alert('Failed to mark as ready. The item might have been updated already.');
    }
  };

  const newOrders = useMemo(() => groupItemsByOrder(queue.newItems), [queue.newItems]);
  const inProgressOrders = useMemo(() => groupItemsByOrder(queue.inProgress), [queue.inProgress]);
  const almostReadyOrders = useMemo(() => groupItemsByOrder(queue.almostReady), [queue.almostReady]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ChefHat size={36} className="text-orange-500" />
          Kitchen Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Welcome, Chef {user?.name}! Let's get cooking.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard icon={<AlertCircle className="text-white" size={28} />} label="New Items" value={stats.newItems} color="bg-blue-500" />
        <StatCard icon={<Flame className="text-white" size={28} />} label="In Progress" value={stats.inProgress} color="bg-orange-500" />
        <StatCard icon={<CheckCircle className="text-white" size={28} />} label="Completed Today" value={stats.completedToday || 0} color="bg-green-500" />
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {stats.total === 0 && !loading && !error ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <p className="text-2xl font-semibold text-gray-900 mb-2">All Caught Up! 🎉</p>
          <p className="text-gray-600">No items in the queue. Time for a coffee break?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <OrderColumn
            title="New Orders"
            orders={newOrders}
            onStartOrder={handleStartCooking}
            onReadyOrder={handleMarkReady}
            icon={<AlertCircle size={24} />}
            color="text-blue-500"
          />
          <OrderColumn
            title="In Progress"
            orders={inProgressOrders}
            onStartOrder={handleStartCooking}
            onReadyOrder={handleMarkReady}
            icon={<Flame size={24} />}
            color="text-orange-500"
          />
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;
