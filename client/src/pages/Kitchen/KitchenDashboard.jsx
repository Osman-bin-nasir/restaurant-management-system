import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChefHat, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Flame,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from '../../api/axios';
import OrderCard from '../../components/OrderCard';

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
        waitTime: 0,
        priority: 0,
        items: [],
        status: item.status // Assuming all items in a group have same status
      };
    }
    acc[item.orderId].items.push(item);
    
    if (item.priority > acc[item.orderId].priority) {
        acc[item.orderId].priority = item.priority;
    }
    if (item.waitTime > acc[item.orderId].waitTime) {
        acc[item.orderId].waitTime = item.waitTime;
    }
    return acc;
  }, {});

  return Object.values(orders).sort((a, b) => b.priority - a.priority || b.waitTime - a.waitTime);
};


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

const OrderGroup = ({ title, orders, onStart, onReady, icon }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!orders || orders.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
      <div 
        className="flex items-center justify-between cursor-pointer mb-6"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-3">
          {icon} {title} ({orders.length})
        </h3>
        {isExpanded ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {orders.map(order => (
            <OrderCard 
              key={order.orderId} 
              order={order} 
              onStart={onStart} 
              onReady={onReady} 
            />
          ))}
        </div>
      )}
    </div>
  );
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
    newOrders: [],
    inProgressOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKitchenData = async () => {
    try {
      // No need to setError(null) here, causes flicker. Only on success.
      const [queueRes, statsRes] = await Promise.all([
        axios.get('/kitchen/queue'),
        axios.get('/kitchen/stats')
      ]);
      
      setError(null); // Clear error on success

      const rawQueue = queueRes.data.queue || { newItems: [], inProgress: [], almostReady: [] };
      
      const allItems = [...rawQueue.newItems, ...rawQueue.inProgress, ...rawQueue.almostReady];
      const allOrders = groupItemsByOrder(allItems);

      const newOrders = allOrders.filter(o => o.items.every(i => i.status === 'placed'));
      const inProgressOrders = allOrders.filter(o => !o.items.every(i => i.status === 'placed'));

      setQueue({
        newOrders,
        inProgressOrders
      });

      setStats(statsRes.data.stats || { newItems: 0, inProgress: 0, completedToday: 0, total: 0 });

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
      fetchKitchenData(); // Refresh data
    } catch (err) {
      console.error('Failed to start cooking order:', err);
      alert('Failed to start cooking. The order might have been updated.');
    }
  };

  const handleMarkReady = async (orderId, itemIds) => {
    try {
      await axios.post('/kitchen/items/mark-ready', {
        items: [{ orderId, itemIds }]
      });
      fetchKitchenData(); // Refresh data
    } catch (err) {
      console.error('Failed to mark order as ready:', err);
      alert('Failed to mark as ready. The order might have been updated.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  const totalOrders = queue.newOrders.length + queue.inProgressOrders.length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          <ChefHat size={40} className="text-orange-500" />
          Kitchen Command Center
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Welcome, Chef {user?.name}! Let's get cooking.</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        <StatCard icon={<AlertCircle className="text-white" size={28} />} label="New Orders" value={queue.newOrders.length} color="bg-blue-500" />
        <StatCard icon={<Flame className="text-white" size={28} />} label="In Progress" value={queue.inProgressOrders.length} color="bg-orange-500" />
        <StatCard icon={<CheckCircle className="text-white" size={28} />} label="Completed Today" value={stats.completedToday || 0} color="bg-green-500" />
        <StatCard icon={<Zap className="text-white" size={28} />} label="Total Active Orders" value={totalOrders} color="bg-purple-500" />
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {totalOrders === 0 && !loading && !error ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <CheckCircle size={72} className="text-green-500 mx-auto mb-6 animate-pulse" />
          <p className="text-3xl font-semibold text-gray-900 mb-3">All Caught Up! 🎉</p>
          <p className="text-gray-600 text-lg">The kitchen is clear. Great job, team!</p>
        </div>
      ) : (
        <>
          <OrderGroup
            title="New Orders"
            orders={queue.newOrders}
            onStart={handleStartCooking}
            onReady={handleMarkReady}
            icon={<AlertCircle size={28} className="text-blue-500" />}
          />
          <OrderGroup
            title="In Progress"
            orders={queue.inProgressOrders}
            onStart={handleStartCooking}
            onReady={handleMarkReady}
            icon={<Flame size={28} className="text-orange-500" />}
          />
        </>
      )}
    </div>
  );
};

export default KitchenDashboard;