import React, { useState, useEffect } from 'react';
import { Package, Clock, RefreshCw, Flame, CheckCircle, User, ChefHat, AlertTriangle, Plus, Minus } from 'lucide-react';
import axios from '../../api/axios';
import { useSocket } from '../../contexts/SocketContext';

const ParcelOrderQueue = () => {
  const [queue, setQueue] = useState({ placed: [], inKitchen: [] });
  const [stats, setStats] = useState({ placed: 0, inKitchen: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [toasts, setToasts] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    fetchQueue();

    if (socket) {
      socket.on('orderUpdated', fetchQueue);

      return () => {
        socket.off('orderUpdated', fetchQueue);
      };
    }
  }, [socket]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchQueue = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const { data } = await axios.get('/kitchen/queue', { params: { status: 'placed,in-kitchen' } });
      if (data.success) {
        setQueue({
          placed: data.queue.newItems || [],
          inKitchen: [...(data.queue.inProgress || []), ...(data.queue.almostReady || [])]
        });
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch kitchen queue:', error);
      showToast('Failed to load queue', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartPreparing = async () => {
    const itemsToStart = selectedItems.filter(item =>
      queue.placed.some(placedItem => placedItem.itemId === item.itemId)
    );

    if (itemsToStart.length === 0) {
      showToast('No new items selected to start', 'error');
      return;
    }

    const itemsByOrder = itemsToStart.reduce((acc, item) => {
      if (!acc[item.orderId]) {
        acc[item.orderId] = [];
      }
      acc[item.orderId].push(item.itemId);
      return acc;
    }, {});

    const itemsPayload = Object.keys(itemsByOrder).map(orderId => ({
      orderId,
      itemIds: itemsByOrder[orderId]
    }));

    try {
      await axios.post('/kitchen/items/start-cooking', { items: itemsPayload });

      // Optimistic update
      setQueue(prev => {
        const newPlaced = prev.placed.filter(item => !itemsToStart.some(i => i.itemId === item.itemId));
        const movedItems = prev.placed
          .filter(item => itemsToStart.some(i => i.itemId === item.itemId))
          .map(item => ({ ...item, status: 'in-kitchen' }));
        
        return {
          placed: newPlaced,
          inKitchen: [...prev.inKitchen, ...movedItems]
        };
      });

      showToast(`${itemsToStart.length} item(s) moved to In Kitchen`);
      setSelectedItems([]);

    } catch (error) {
      console.error('Failed to start cooking:', error);
      showToast('Error starting items', 'error');
    }
  };

  const handleMarkReady = async () => {
    if (selectedItems.length === 0) return;
    showToast(`${selectedItems.length} item(s) marked as ready`);
    setSelectedItems([]);
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(i => i.itemId === item.itemId);
      if (isSelected) {
        return prev.filter(i => i.itemId !== item.itemId);
      } else {
        return [...prev, item];
      }
    });
  };

  const toggleOrderSelection = (orderId, items) => {
    const orderItems = items.filter(item => item.orderId === orderId);
    const allSelected = orderItems.every(item => 
      selectedItems.some(si => si.itemId === item.itemId)
    );

    if (allSelected) {
      setSelectedItems(prev => 
        prev.filter(si => !orderItems.some(oi => oi.itemId === si.itemId))
      );
    } else {
      setSelectedItems(prev => {
        const newItems = orderItems.filter(oi => 
          !prev.some(si => si.itemId === oi.itemId)
        );
        return [...prev, ...newItems];
      });
    }
  };

  const getTimeRemaining = (estimatedTime) => {
    if (!estimatedTime) return { text: '-', urgent: false };
    const diff = new Date(estimatedTime) - new Date();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 0) return { text: 'OVERDUE', urgent: true };
    if (minutes <= 5) return { text: `${minutes}m`, urgent: true };
    return { text: `${minutes}m`, urgent: false };
  };

  const groupByOrder = (items) => {
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.orderId]) {
        grouped[item.orderId] = [];
      }
      grouped[item.orderId].push(item);
    });
    return Object.entries(grouped).map(([orderId, items]) => ({
      orderId,
      orderNumber: items[0].orderNumber,
      customerName: items[0].customerName,
      items,
      minTime: Math.min(...items.filter(i => i.estimatedCompletionTime).map(i => new Date(i.estimatedCompletionTime)))
    })).sort((a, b) => a.minTime - b.minTime);
  };

  const renderOrderCard = (order, status) => {
    const allItemsSelected = order.items.every(item =>
      selectedItems.some(si => si.itemId === item.itemId)
    );
    const someItemsSelected = order.items.some(item =>
      selectedItems.some(si => si.itemId === item.itemId)
    ) && !allItemsSelected;
    
    const mostUrgentTime = getTimeRemaining(new Date(order.minTime).toISOString());

    return (
      <div
        key={order.orderId}
        className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-lg transition-all ${
          allItemsSelected 
            ? 'border-orange-500 shadow-lg ring-2 ring-orange-200' 
            : someItemsSelected
            ? 'border-orange-300'
            : 'border-gray-200'
        }`}
      >
        {/* Order Header */}
        <div
          onClick={() => toggleOrderSelection(order.orderId, status === 'placed' ? queue.placed : queue.inKitchen)}
          className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-t-xl cursor-pointer hover:from-gray-100 hover:to-gray-200 transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Package size={18} className="text-orange-500" />
                <span className="font-bold text-lg text-gray-900">{order.orderNumber}</span>
                {status === 'placed' && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    NEW
                  </span>
                )}
                {status === 'in-kitchen' && (
                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Flame size={10} />
                    COOKING
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={14} />
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Time Badge */}
            <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
              mostUrgentTime.urgent 
                ? 'bg-red-100 text-red-700 animate-pulse' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock size={12} className="inline mr-1" />
              {mostUrgentTime.text}
            </div>
          </div>

          {/* Selection Indicator */}
          <div className="mt-3 flex justify-center">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              allItemsSelected 
                ? 'bg-orange-500 border-orange-500' 
                : someItemsSelected
                ? 'bg-orange-200 border-orange-400'
                : 'border-gray-300'
            }`}>
              {allItemsSelected && <CheckCircle size={14} className="text-white" />}
              {someItemsSelected && <Minus size={14} className="text-orange-700" />}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-4 space-y-3">
          {order.items.map((item, index) => {
            const isSelected = selectedItems.some(si => si.itemId === item.itemId);
            const timeInfo = getTimeRemaining(item.estimatedCompletionTime);

            return (
              <div
                key={item.itemId}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItemSelection(item);
                }}
                className={`bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'ring-2 ring-orange-400 shadow-md' 
                    : 'hover:ring-1 hover:ring-orange-200'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-gray-900">{item.menuItem.name}</h3>
                    {item.menuItem.cookingTime && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                        <Flame size={12} className="text-orange-500" />
                        <span>{item.menuItem.cookingTime} min cook time</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                      ×{item.quantity}
                    </span>
                    <div className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                      timeInfo.urgent 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {timeInfo.text}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {item.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
                    <p className="text-xs font-semibold text-yellow-800 mb-1">📝 Special Instructions:</p>
                    <p className="text-xs text-gray-700">{item.notes}</p>
                  </div>
                )}

                {/* Item Selection Checkbox */}
                <div className="mt-2 flex justify-end">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-orange-500 border-orange-500' 
                      : 'border-gray-400'
                  }`}>
                    {isSelected && <CheckCircle size={12} className="text-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading Kitchen Queue...</p>
        </div>
      </div>
    );
  }

  const placedOrders = groupByOrder(queue.placed);
  const inKitchenOrders = groupByOrder(queue.inKitchen);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white font-semibold animate-fadeIn ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-xl">
                <ChefHat size={32} className="text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kitchen - Parcel Orders</h1>
                <p className="text-gray-600 mt-1">Take-away order management</p>
              </div>
            </div>
            
            <button
              onClick={fetchQueue}
              disabled={refreshing}
              className="bg-orange-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Package size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-blue-600 text-sm font-medium">New Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.placed}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Flame size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-orange-600 text-sm font-medium">In Kitchen</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.inKitchen}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <ChefHat size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Active</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {selectedItems.length > 0 && (
        <div className="sticky top-[13rem] z-40 bg-white border-b-4 border-orange-500 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <CheckCircle className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">
                    {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedItems.filter(i => queue.placed.some(p => p.itemId === i.itemId)).length} new, {' '}
                    {selectedItems.filter(i => queue.inKitchen.some(p => p.itemId === i.itemId)).length} in kitchen
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition active:scale-95"
                >
                  Clear
                </button>
                
                {selectedItems.some(i => queue.placed.some(p => p.itemId === i.itemId)) && (
                  <button
                    onClick={handleStartPreparing}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-md flex items-center gap-2 active:scale-95"
                  >
                    <Flame size={20} />
                    Start Preparing
                  </button>
                )}
                
                {selectedItems.some(i => queue.inKitchen.some(p => p.itemId === i.itemId)) && (
                  <button
                    onClick={handleMarkReady}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition shadow-md flex items-center gap-2 active:scale-95"
                  >
                    <CheckCircle size={20} />
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {placedOrders.length === 0 && inKitchenOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-200">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChefHat size={48} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Kitchen is Clear</h3>
            <p className="text-gray-600">No parcel orders to prepare right now</p>
          </div>
        ) : (
          <>
            {/* New Orders Section */}
            {placedOrders.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                    <Package size={20} />
                    New Orders ({placedOrders.length})
                  </div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-transparent"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {placedOrders.map(order => renderOrderCard(order, 'placed'))}
                </div>
              </div>
            )}

            {/* In Kitchen Section */}
            {inKitchenOrders.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                    <Flame size={20} />
                    In Kitchen ({inKitchenOrders.length})
                  </div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-orange-500 to-transparent"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inKitchenOrders.map(order => renderOrderCard(order, 'in-kitchen'))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ParcelOrderQueue;