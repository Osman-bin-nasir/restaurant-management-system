import React, { useState, useMemo } from 'react';
import {
  Clock,
  Flame,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Utensils,
  Package,
  User,
  Sparkles,
  Zap,
  ChefHat,
  Timer,
} from 'lucide-react';

const OrderCard = ({ order, onStartOrder, onReadyOrder }) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const isParcel = order.type === 'parcel';

  // Group items by menuItem.id and aggregate quantity
  const groupedItems = useMemo(() => {
    const map = new Map();

    order.items.forEach((item) => {
      const key = item.menuItem.id || item.menuItem.name;
      if (!map.has(key)) {
        map.set(key, {
          ...item,
          originalItems: [],
          quantity: 0,
        });
      }
      const group = map.get(key);
      group.quantity += item.quantity;
      group.originalItems.push(item);
    });

    return Array.from(map.values());
  }, [order.items]);

  const toggleItemSelection = (originalItemIds) => {
    setPulseAnimation(true);
    setTimeout(() => setPulseAnimation(false), 300);
    
    setSelectedItems((prev) => {
      const newSelection = originalItemIds.filter((id) => !prev.includes(id));
      const removed = originalItemIds.filter((id) => prev.includes(id));
      return prev
        .filter((id) => !removed.includes(id))
        .concat(newSelection.length > 0 ? newSelection : []);
    });
  };

  const handleStartCooking = () => {
    setPulseAnimation(true);
    setTimeout(() => setPulseAnimation(false), 500);
    
    const itemsToStart =
      selectedItems.length > 0
        ? selectedItems
        : order.items
            .filter((item) => ['placed', 'pending'].includes(item.status))
            .map((item) => item.itemId);

    if (itemsToStart.length > 0) {
      onStartOrder(order.orderId, itemsToStart, order);
      setSelectedItems([]);
    }
  };

  const handleMarkReady = () => {
    setPulseAnimation(true);
    setTimeout(() => setPulseAnimation(false), 500);
    
    const itemsToComplete =
      selectedItems.length > 0
        ? selectedItems
        : order.items
            .filter((item) => ['in-kitchen', 'cooking'].includes(item.status))
            .map((item) => item.itemId);

    if (itemsToComplete.length > 0) {
      onReadyOrder(order.orderId, itemsToComplete, order);
      setSelectedItems([]);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      placed: { 
        text: 'New Order', 
        color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
        icon: <Sparkles size={12} className="inline mr-1" />
      },
      pending: { 
        text: 'New Order', 
        color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
        icon: <Sparkles size={12} className="inline mr-1" />
      },
      'in-kitchen': { 
        text: 'Cooking', 
        color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
        icon: <Flame size={12} className="inline mr-1" />
      },
      cooking: { 
        text: 'Cooking', 
        color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
        icon: <Flame size={12} className="inline mr-1" />
      },
      ready: { 
        text: 'Ready to Serve', 
        color: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
        icon: <CheckCircle size={12} className="inline mr-1" />
      },
    };
    return badges[status] || { text: status, color: 'bg-gray-100 text-gray-700', icon: null };
  };

  const getPriorityBorder = (priority) => {
    if (priority >= 3) return 'border-l-4 border-l-red-500 shadow-lg shadow-red-200';
    if (priority === 2) return 'border-l-4 border-l-orange-400 shadow-md shadow-orange-100';
    return 'border-l-4 border-l-blue-300 shadow-sm';
  };

  const hasNewItems = order.items.some((i) =>
    ['placed', 'pending'].includes(i.status)
  );
  const hasInProgressItems = order.items.some((i) =>
    ['in-kitchen', 'cooking'].includes(i.status)
  );

  const totalCookingTime = order.items.reduce((total, item) => {
    return total + ((item.menuItem.cookingTime || 0) * item.quantity);
  }, 0);

  return (
    <div
      className={`bg-white rounded-2xl border-2 border-r-0 overflow-hidden transition-all duration-300 hover:shadow-xl ${
        pulseAnimation ? 'animate-pulse' : ''
      } ${getPriorityBorder(
        Math.max(...order.items.map((i) => i.priority || 0))
      )}`}
    >
      {/* Enhanced Header */}
      <div
        className={`p-5 flex items-center justify-between bg-gradient-to-r ${
          isParcel 
            ? 'from-purple-500 to-purple-600' 
            : 'from-blue-500 to-blue-600'
        } text-white relative overflow-hidden`}
      >
        <div className="flex items-center gap-4 z-10">
          <div className="relative">
            <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm ${
              isParcel ? 'shadow-purple-200' : 'shadow-blue-200'
            } shadow-lg`}>
              {isParcel ? (
                <Package size={22} className="text-white" />
              ) : (
                <Utensils size={22} className="text-white" />
              )}
            </div>
            {hasNewItems && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white drop-shadow-sm">
                #{order.orderNumber}
              </h3>
              {hasNewItems && (
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm animate-pulse">
                  NEW
                </span>
              )}
            </div>
            {isParcel ? (
              <p className="text-white/90 text-sm flex items-center gap-1">
                <User size={14} /> {order.customerName || 'Takeaway Order'}
              </p>
            ) : (
              <p className="text-white/90 text-sm">
                Table {order.tableNumber} • {order.capacity || 'Standard'} seats
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-200 backdrop-blur-sm z-10"
        >
          {expanded ? (
            <ChevronUp size={20} className="text-white" />
          ) : (
            <ChevronDown size={20} className="text-white" />
          )}
        </button>

        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 translate-y-12"></div>
      </div>

      {/* Enhanced Order Info */}
      <div className="px-5 py-3 flex items-center justify-between text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
            <Clock size={14} className="text-blue-500" />
            <span className="font-medium">{groupedItems.length} item{groupedItems.length > 1 ? 's' : ''}</span>
          </div>
          
          {totalCookingTime > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
              <Timer size={14} className="text-orange-500" />
              <span className="font-medium">{totalCookingTime} min</span>
            </div>
          )}
        </div>

        <div
          className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
            isParcel
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}
        >
          {isParcel ? '🛍️ PARCEL' : '🍽️ DINE-IN'}
        </div>
      </div>

      {/* Enhanced Aggregated Items */}
      {expanded && (
        <div className="p-5 space-y-3 bg-gradient-to-br from-white to-gray-50">
          {groupedItems.map((group) => {
            const { originalItems, quantity, menuItem, notes, priority } = group;
            const isSelected = originalItems.every((item) =>
              selectedItems.includes(item.itemId)
            );
            const isPartiallySelected = originalItems.some((item) =>
              selectedItems.includes(item.itemId)
            );

            const badge = getStatusBadge(originalItems[0].status);

            return (
              <div
                key={group.menuItem.id || group.menuItem.name}
                onClick={() =>
                  toggleItemSelection(originalItems.map((i) => i.itemId))
                }
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                  isSelected
                    ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md scale-[1.02]'
                    : isPartiallySelected
                    ? 'border-orange-300 bg-orange-25 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-[1.01] bg-white'
                }`}
              >
                {/* Background effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isSelected ? 'bg-orange-500/5' : 'bg-gray-500/3'
                }`}></div>

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${
                        originalItems[0].status === 'ready' ? 'bg-green-500' :
                        ['in-kitchen', 'cooking'].includes(originalItems[0].status) ? 'bg-orange-500 animate-pulse' :
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg group-hover:text-gray-800">
                          {menuItem.name}
                        </h4>
                        {notes && (
                          <p className="text-sm text-yellow-700 mt-2 bg-yellow-50/80 px-3 py-2 rounded-lg border border-yellow-200">
                            📝 {notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {menuItem.cookingTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2 ml-5">
                        <ChefHat size={14} className="text-orange-500" />
                        <span>{menuItem.cookingTime} min each</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md">
                      ×{quantity}
                    </span>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${badge.color}`}
                    >
                      {badge.icon}
                      {badge.text}
                    </span>
                  </div>
                </div>

                {priority >= 3 && (
                  <div className="mt-3 ml-5 text-sm text-red-600 flex items-center gap-2 font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    <AlertTriangle size={16} className="text-red-500" />
                    <span>HIGH PRIORITY ORDER</span>
                    <Zap size={14} className="text-red-500 animate-pulse" />
                  </div>
                )}

                {/* Selection indicator */}
                {isPartiallySelected && !isSelected && (
                  <div className="absolute top-3 right-3 w-4 h-4 bg-orange-400 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                )}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Action Buttons */}
      {expanded && (
        <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex flex-wrap gap-3">
          {hasNewItems && (
            <button
              onClick={handleStartCooking}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-md group"
            >
              <div className="p-1.5 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                <Flame size={18} className="text-white" />
              </div>
              <span>
                {selectedItems.length > 0
                  ? `Start Cooking (${selectedItems.length})`
                  : 'Start All Cooking'}
              </span>
            </button>
          )}

          {hasInProgressItems && (
            <button
              onClick={handleMarkReady}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-md group"
            >
              <div className="p-1.5 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                <CheckCircle size={18} className="text-white" />
              </div>
              <span>
                {selectedItems.length > 0
                  ? `Mark Ready (${selectedItems.length})`
                  : 'Mark All Ready'}
              </span>
            </button>
          )}

          {selectedItems.length > 0 && (
            <button
              onClick={() => setSelectedItems([])}
              className="px-6 py-4 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-2xl font-semibold hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;