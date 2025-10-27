import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  Flame,
  Zap,
  Package,
  Utensils,
  RefreshCw
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

const groupItemsByOrder = (items, type = 'table') => {
  if (!items || items.length === 0) {
    return [];
  }

  const orders = items.reduce((acc, item) => {
    if (!acc[item.orderId]) {
      acc[item.orderId] = {
        orderId: item.orderId,
        orderNumber: item.orderNumber,
        tableNumber: item.tableNumber,
        customerName: item.customerName, // For parcel orders
        type: type, // 'table' or 'parcel'
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

const mergeOrdersByStatus = (tableOrders, parcelOrders) => {
  // Merge and sort by priority/time
  return [...tableOrders, ...parcelOrders].sort((a, b) => {
    const priorityA = Math.max(...a.items.map(i => i.priority || 0));
    const priorityB = Math.max(...b.items.map(i => i.priority || 0));
    return priorityB - priorityA;
  });
};

// ====================== MAIN COMPONENT ======================

const KitchenDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    table: { newItems: 0, inProgress: 0, completedToday: 0 },
    parcel: { placed: 0, inKitchen: 0 },
    total: 0
  });
  const [tableQueue, setTableQueue] = useState({
    newItems: [],
    inProgress: []
  });
  const [parcelQueue, setParcelQueue] = useState({
    placed: [],
    inKitchen: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchKitchenData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      setError(null);
      
      const [tableQueueRes, tableStatsRes, parcelQueueRes] = await Promise.all([
        axios.get('/kitchen/queue'),
        axios.get('/kitchen/stats'),
        axios.get('/parcel/queue/kitchen')
      ]);

      // Table orders
      setTableQueue(tableQueueRes.data.queue || { newItems: [], inProgress: [] });
      
      // Parcel orders
      setParcelQueue(parcelQueueRes.data.queue || { placed: [], inKitchen: [] });

      // Combined stats
      const tableStats = tableStatsRes.data.stats || { newItems: 0, inProgress: 0, completedToday: 0 };
      const parcelStats = parcelQueueRes.data.stats || { placed: 0, inKitchen: 0 };
      
      setStats({
        table: tableStats,
        parcel: parcelStats,
        total: tableStats.newItems + tableStats.inProgress + parcelStats.placed + parcelStats.inKitchen
      });

    } catch (err) {
      console.error('Failed to fetch kitchen data:', err);
      setError('Failed to load kitchen data. Please try refreshing.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKitchenData();
    const interval = setInterval(() => fetchKitchenData(), 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStartCooking = async (orderId, itemIds, isParcel = false) => {
    try {
      if (isParcel) {
        await axios.patch(`/parcel/${orderId}/items/start`, {
          orderId,
          itemIds
        });
      } else {
        await axios.post('/kitchen/items/start-cooking', {
          items: [{ orderId, itemIds }]
        });
      }
      fetchKitchenData();
    } catch (err) {
      console.error('Failed to start cooking item:', err);
      alert('Failed to start cooking. The item might have been updated already.');
    }
  };

  const handleMarkReady = async (orderId, itemIds, isParcel = false) => {
    try {
      if (isParcel) {
        await axios.patch(`/parcel/${orderId}/complete`, {
          orderId,
          itemIds
        });
      } else {
        await axios.post('/kitchen/items/mark-ready', {
          items: [{ orderId, itemIds }]
        });
      }
      fetchKitchenData();
    } catch (err) {
      console.error('Failed to mark item as ready:', err);
      alert('Failed to mark as ready. The item might have been updated already.');
    }
  };

  // Group table orders
  const tableNewOrders = useMemo(() => 
    groupItemsByOrder(tableQueue.newItems, 'table'), 
    [tableQueue.newItems]
  );
  const tableInProgressOrders = useMemo(() => 
    groupItemsByOrder(tableQueue.inProgress, 'table'), 
    [tableQueue.inProgress]
  );

  // Group parcel orders
  const parcelNewOrders = useMemo(() => 
    groupItemsByOrder(parcelQueue.placed, 'parcel'), 
    [parcelQueue.placed]
  );
  const parcelInProgressOrders = useMemo(() => 
    groupItemsByOrder(parcelQueue.inKitchen, 'parcel'), 
    [parcelQueue.inKitchen]
  );

  // Merge orders by status
  const allNewOrders = useMemo(() => 
    mergeOrdersByStatus(tableNewOrders, parcelNewOrders), 
    [tableNewOrders, parcelNewOrders]
  );
  const allInProgressOrders = useMemo(() => 
    mergeOrdersByStatus(tableInProgressOrders, parcelInProgressOrders), 
    [tableInProgressOrders, parcelInProgressOrders]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading Kitchen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <ChefHat size={40} className="text-orange-500" />
              Kitchen Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Welcome, Chef {user?.name}! Let's get cooking.</p>
          </div>
          
          <button
            onClick={() => fetchKitchenData(true)}
            disabled={refreshing}
            className="bg-white text-orange-500 px-5 py-3 rounded-xl font-bold hover:bg-orange-50 transition disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-8">
        <StatCard 
          icon={<Utensils className="text-white" size={28} />} 
          label="Table Orders (New)" 
          value={stats.table.newItems} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={<Package className="text-white" size={28} />} 
          label="Parcel Orders (New)" 
          value={stats.parcel.placed} 
          color="bg-purple-500" 
        />
        <StatCard 
          icon={<Flame className="text-white" size={28} />} 
          label="In Progress (All)" 
          value={stats.table.inProgress + stats.parcel.inKitchen} 
          color="bg-orange-500" 
        />
        <StatCard 
          icon={<Zap className="text-white" size={28} />} 
          label="Total Active" 
          value={stats.total} 
          color="bg-red-500" 
        />
        <StatCard 
          icon={<CheckCircle className="text-white" size={28} />} 
          label="Completed Today" 
          value={stats.table.completedToday || 0} 
          color="bg-green-500" 
        />
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {stats.total === 0 && !loading && !error ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <p className="text-2xl font-semibold text-gray-900 mb-2">All Caught Up! 🎉</p>
          <p className="text-gray-600">No items in the queue. Time for a coffee break?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <OrderColumn
            title="New Orders"
            orders={allNewOrders}
            onStartOrder={(orderId, itemIds, order) => 
              handleStartCooking(orderId, itemIds, order?.type === 'parcel')
            }
            onReadyOrder={(orderId, itemIds, order) => 
              handleMarkReady(orderId, itemIds, order?.type === 'parcel')
            }
            icon={<AlertCircle size={24} />}
            color="text-blue-500"
          />
          <OrderColumn
            title="In Progress"
            orders={allInProgressOrders}
            onStartOrder={(orderId, itemIds, order) => 
              handleStartCooking(orderId, itemIds, order?.type === 'parcel')
            }
            onReadyOrder={(orderId, itemIds, order) => 
              handleMarkReady(orderId, itemIds, order?.type === 'parcel')
            }
            icon={<Flame size={24} />}
            color="text-orange-500"
          />
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;