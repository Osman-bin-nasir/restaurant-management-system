import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ChefHat, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Flame,
  Package,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from '../../api/axios';

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

const ItemCard = ({ item, onStart, onReady }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const priority = item.priority;
  const waitTime = item.waitTime;

  const getPriorityColor = () => {
    if (priority > 150) return 'border-red-500';
    if (priority > 120) return 'border-orange-500';
    return 'border-blue-500';
  };

  const getPriorityLabel = () => {
    if (priority > 150) return 'URGENT';
    if (priority > 120) return 'HIGH';
    return 'NORMAL';
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-shadow border-l-4 ${getPriorityColor()}`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold text-gray-900">{item.menuItem.name} <span className="text-lg">x{item.quantity}</span></h4>
          <p className="text-sm text-gray-600">
            Order #{item.orderNumber} • {item.tableNumber}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className={waitTime > 15 ? 'text-red-600' : 'text-gray-500'} />
          <span className={`font-semibold ${waitTime > 15 ? 'text-red-600' : 'text-gray-700'}`}>
            {waitTime}m ago
          </span>
        </div>
      </div>

      {item.notes && (
        <p className="text-sm text-red-600 mt-2 font-semibold bg-red-50 p-2 rounded-lg">
          ⚠️ Note: {item.notes}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.status === 'placed' && (
            <button
              onClick={() => onStart(item.orderId, [item.itemId])}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm"
            >
              <Flame size={18} /> Start Cooking
            </button>
          )}
          {item.status === 'in-kitchen' && (
            <button
              onClick={() => onReady(item.orderId, [item.itemId])}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
            >
              <CheckCircle size={18} /> Mark Ready
            </button>
          )}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${
          priority > 150 ? 'bg-red-100 text-red-700' :
          priority > 120 ? 'bg-orange-100 text-orange-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {getPriorityLabel()}
        </span>
      </div>
    </div>
  );
};

const ItemGroup = ({ title, items, onStart, onReady, onBulkAction, actionLabel, icon }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSelect = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleBulkAction = () => {
    const itemsByOrder = selectedItems.reduce((acc, itemId) => {
      const item = items.find(i => i.itemId === itemId);
      if (item) {
        acc[item.orderId] = acc[item.orderId] || [];
        acc[item.orderId].push(item.itemId);
      }
      return acc;
    }, {});

    onBulkAction(Object.entries(itemsByOrder).map(([orderId, itemIds]) => ({ orderId, itemIds })));
    setSelectedItems([]);
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
      <div 
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          {icon} {title} ({items.length})
        </h3>
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </div>

      {isExpanded && (
        <>
          {items.length > 1 && (
            <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded text-orange-500 focus:ring-orange-400"
                  onChange={(e) => setSelectedItems(e.target.checked ? items.map(i => i.itemId) : [])}
                  checked={selectedItems.length === items.length}
                />
                <label className="text-sm font-medium text-gray-700">
                  Select All ({selectedItems.length} selected)
                </label>
              </div>
              <button
                onClick={handleBulkAction}
                disabled={selectedItems.length === 0}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 transition-colors flex items-center gap-2 text-sm"
              >
                {icon} {actionLabel} ({selectedItems.length})
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.itemId} className="flex items-start gap-2">
                {items.length > 1 && (
                  <input
                    type="checkbox"
                    className="h-5 w-5 mt-5 rounded text-orange-500 focus:ring-orange-400"
                    checked={selectedItems.includes(item.itemId)}
                    onChange={() => handleSelect(item.itemId)}
                  />
                )}
                <div className="flex-1">
                  <ItemCard item={item} onStart={onStart} onReady={onReady} />
                </div>
              </div>
            ))}
          </div>
        </>
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
    total: 0
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
    } catch (err) {
      console.error('Failed to start cooking item:', err);
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

  const handleBulkStart = async (itemsToStart) => {
    try {
      await axios.post('/kitchen/items/start-cooking', { items: itemsToStart });
      fetchKitchenData();
    } catch (err) {
      console.error('Failed to bulk start items:', err);
      alert('Failed to start selected items. Some may have been updated already.');
    }
  };

  const handleBulkReady = async (itemsToReady) => {
    try {
      await axios.post('/kitchen/items/mark-ready', { items: itemsToReady });
      fetchKitchenData();
    } catch (err) {
      console.error('Failed to bulk mark items ready:', err);
      alert('Failed to mark selected items as ready. Some may have been updated already.');
    }
  };

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
          Kitchen Queue
        </h1>
        <p className="text-gray-600 mt-2">Welcome, Chef {user?.name}! Here are the items waiting for you.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard icon={<AlertCircle className="text-white" size={28} />} label="New Items" value={stats.newItems} color="bg-blue-500" />
        <StatCard icon={<Flame className="text-white" size={28} />} label="In Progress" value={stats.inProgress} color="bg-orange-500" />
        <StatCard icon={<Zap className="text-white" size={28} />} label="Almost Ready" value={stats.almostReady} color="bg-yellow-500" />
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
        <>
          <ItemGroup
            title="New Items"
            items={queue.newItems}
            onStart={handleStartCooking}
            onReady={handleMarkReady}
            onBulkAction={handleBulkStart}
            actionLabel="Start Selected"
            icon={<AlertCircle size={24} className="text-blue-500" />}
          />
          <ItemGroup
            title="In Progress"
            items={queue.inProgress}
            onStart={handleStartCooking}
            onReady={handleMarkReady}
            onBulkAction={handleBulkReady}
            actionLabel="Mark Ready"
            icon={<Flame size={24} className="text-orange-500" />}
          />
          <ItemGroup
            title="Almost Ready"
            items={queue.almostReady}
            onStart={handleStartCooking}
            onReady={handleMarkReady}
            onBulkAction={handleBulkReady}
            actionLabel="Mark Ready"
            icon={<Zap size={24} className="text-yellow-500" />}
          />
        </>
      )}
    </div>
  );
};

export default KitchenDashboard;
