import React, { useState, useEffect, useMemo } from 'react';
import { Clock, ChefHat, CheckCircle, AlertCircle, Timer, Users, Package, Flame, Play, Check, MapPin } from 'lucide-react';
import axios from '../../api/axios.js';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

const KitchenDashboard = () => {
  const [queue, setQueue] = useState({ newItems: [], inProgress: [] });
  const [stats, setStats] = useState({ newItems: 0, inProgress: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Connect to socket
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Kitchen connected to socket');
      toast.success('Connected to kitchen system');
    });

    newSocket.on('newOrder', (order) => {
      console.log('🔔 New order received:', order);
      toast.success(`New Order: ${order.orderNumber}`);
      fetchQueue();
    });

    newSocket.on('orderUpdated', (order) => {
      console.log('🔄 Order updated:', order);
      fetchQueue();
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Kitchen disconnected from socket');
      toast.error('Disconnected from kitchen system');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch kitchen queue
  const fetchQueue = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:3000/api/kitchen/queue', {
        withCredentials: true
      });
      
      if (data.success) {
        setQueue(data.queue);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
      toast.error('Failed to load kitchen queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  // Group items by orderId
  const groupedNewItems = useMemo(() => {
    const groups = queue.newItems.reduce((acc, item) => {
      const orderId = item.orderId;
      if (!acc[orderId]) {
        acc[orderId] = {
          orderId,
          orderNumber: item.orderNumber,
          tableNumber: item.tableNumber,
          orderType: item.orderType,
          waitTime: item.waitTime,
          items: [],
          maxPriority: 0
        };
      }
      acc[orderId].items.push(item);
      acc[orderId].maxPriority = Math.max(acc[orderId].maxPriority, item.priority || 0);
      return acc;
    }, {});
    return Object.values(groups);
  }, [queue.newItems]);

  const groupedInProgressItems = useMemo(() => {
    const groups = queue.inProgress.reduce((acc, item) => {
      const orderId = item.orderId;
      if (!acc[orderId]) {
        acc[orderId] = {
          orderId,
          orderNumber: item.orderNumber,
          tableNumber: item.tableNumber,
          orderType: item.orderType,
          waitTime: item.waitTime,
          items: [],
          maxPriority: 0
        };
      }
      acc[orderId].items.push(item);
      acc[orderId].maxPriority = Math.max(acc[orderId].maxPriority, item.priority || 0);
      return acc;
    }, {});
    return Object.values(groups);
  }, [queue.inProgress]);

  const newOrderCount = groupedNewItems.length;
  const inProgressOrderCount = groupedInProgressItems.length;

  // Start all items in order
  const startAllCooking = async (order) => {
    const orderId = order.orderId;
    console.log(order)
    const group = groupedNewItems.find(g => g.orderId === orderId);
    if (!group || group.items.length === 0) return;

    const itemIds = group.items.map(item => item.itemId);

    try {
      if(order.orderType === 'dine-in' || order.orderType === 'parcel') {
        const { data } = await axios.post('/kitchen/items/start-cooking',
        { 
          items: [{ orderId, itemIds }]
        },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success(data.message || 'Started cooking all items!');
        fetchQueue();
      }
      }
      else {
        const { data } = await axios.patch(`/parcel/${orderId}/items/start`,
        { 
          items: [{ orderId, itemIds }]
        },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success(data.message || 'Started cooking all items!');
        fetchQueue();
      }
      }
    } catch (error) {
      console.error('Failed to start cooking:', error);
      toast.error(error.response?.data?.message || 'Failed to start all cooking');
    }
  };

  // Mark all items in order as ready
  const markAllReady = async (order) => {
    const orderId = order.orderId;
    console.log(order.orderType)    //order.orderType
    const group = groupedInProgressItems.find(g => g.orderId === orderId);
    if (!group || group.items.length === 0) return;

    const itemIds = group.items.map(item => item.itemId);

    try {
      if(true) {
      const { data } = await axios.post('kitchen/items/mark-ready',
        { 
          items: [{ orderId, itemIds }]
        },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message || 'Marked all items as ready!');
        fetchQueue();
      }
      } else {
        const { data } = await axios.patch(`/parcel/${orderId}/items/ready`,
        { 
          items: [{ orderId, itemIds }]
        },
        { withCredentials: true }
      );
      console.log("marked parcel items ready")
      if (data.success) {
        toast.success(data.message || 'Marked all items as ready!');
        fetchQueue();
      }
      }
      
    } catch (error) {
      console.error('Failed to mark ready:', error);
      toast.error(error.response?.data?.message || 'Failed to mark all ready');
    }
  };

  // Get order type label
  const getOrderTypeLabel = (orderType, tableNumber) => {
    if (orderType === 'dine-in') {
      const tableStr = String(tableNumber || '');
      return tableStr.startsWith('5') ? 'Dine-in' : 'Dine-in';
    }
    return 'Takeaway';
  };

  // Get location label
  const getLocationLabel = (orderType, tableNumber) => {
    if (orderType === 'dine-in') {
      return String(tableNumber || '');
    }
    return 'Takeaway';
  };

  // Render items list with aggregation
  const renderItemsList = (items) => {
    // Group identical items by name and sum quantities
    const grouped = items.reduce((acc, item) => {
      const name = item.menuItem?.name || 'Unknown';
      if (!acc[name]) {
        acc[name] = {
          name,
          totalQty: 0,
          notes: new Set() // Use Set for unique notes
        };
      }
      acc[name].totalQty += item.quantity || 1;
      if (item.notes) {
        acc[name].notes.add(item.notes);
      }
      return acc;
    }, {});

    return (
      <ul className="list-disc list-inside space-y-1 text-lg text-gray-700 mb-4 ml-4">
        {Object.values(grouped).map(({ name, totalQty, notes }) => (
          <li key={name} className="text-gray-900">
            {name} {totalQty > 1 && `×${totalQty}`}
            {notes.size > 0 && (
              <span className="block text-sm text-gray-600 mt-1">
                Notes: {Array.from(notes).join('; ')}
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  };

  // Render order card
  const renderOrderCard = (group, section) => {
    const items = section === 'newItems' ? groupedNewItems : groupedInProgressItems;
    const order = items.find(g => g.orderId === group.orderId);
    if (!order) return null;

    const orderTypeLabel = getOrderTypeLabel(order.orderType, order.tableNumber);
    const locationLabel = getLocationLabel(order.orderType, order.tableNumber);
    const isNew = section === 'newItems';
    const cardBg = isNew ? 'bg-orange-100 border-orange-200' : 'bg-green-500/10 border-green-300';

    return (
      <div
        key={order.orderId}
        className={`rounded-lg border-2 ${cardBg} p-4 shadow-md w-full max-w-md min-h-96 flex flex-col`}
      >
        {/* Header */}
        <div className="flex flex-col mb-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-xl text-gray-900">{order.orderType === 'parcel' ? '' : "Table "}{locationLabel} </h3>
          </div>
          {/* <p className="text-sm text-gray-600 italic">{orderTypeLabel}</p> */}
          <div className="flex items-center gap-1 text-md text-gray-700 mt-1">
            {/* <MapPin size={14} /> */}
            #{order.orderNumber}
          </div>
        </div>

        {/* Items */}
        {renderItemsList(order.items)}

        {/* Time */}
        <div className="flex items-center gap-1 text-md text-gray-600 mb-4">
          <Clock size={14} />
          {order.waitTime} mins ago
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button
            onClick={() => isNew ? startAllCooking(order) : markAllReady(order)}
            className={`w-full py-3 rounded-md font-semibold text-white shadow-md transition ${
              isNew 
                ? 'bg-orange-500 hover:bg-orange-600 hover:cursor-pointer' 
                : 'bg-green-600 hover:bg-green-700 hover:cursor-pointer'
            }`}
          >
            {isNew ? 'Start Preparing' : 'Mark Ready'}
          </button>
        </div>
      </div>
    );
  };

  if (loading && queue.newItems.length === 0 && queue.inProgress.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <Toaster position="top-center" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-2xl shadow-xl">
              <ChefHat size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">Kitchen Dashboard</h1>
              <p className="text-gray-600 text-lg">Manage orders in real-time</p>
            </div>
          </div>

          <button
            onClick={fetchQueue}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg"
          >
            <Clock size={20} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">New Orders</p>
                <p className="text-4xl font-bold text-blue-700">{newOrderCount}</p>
              </div>
              <AlertCircle className="text-blue-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-4xl font-bold text-orange-700">{inProgressOrderCount}</p>
              </div>
              <Flame className="text-orange-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Items</p>
                <p className="text-4xl font-bold text-purple-700">{stats.total}</p>
              </div>
              <ChefHat className="text-purple-500" size={40} />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* New Items */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-500 p-3 rounded-lg shadow-md">
              <AlertCircle size={28} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              New Orders ({newOrderCount})
            </h2>
          </div>

          {newOrderCount === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <CheckCircle size={56} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-xl font-medium">No new orders</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {groupedNewItems.map(group => renderOrderCard(group, 'newItems'))}
            </div>
          )}
        </div>

        {/* In Progress */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500 p-3 rounded-lg shadow-md">
              <Flame size={28} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              In Progress ({inProgressOrderCount})
            </h2>
          </div>

          {inProgressOrderCount === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Clock size={56} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-xl font-medium">No items cooking</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {groupedInProgressItems.map(group => renderOrderCard(group, 'inProgress'))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KitchenDashboard;