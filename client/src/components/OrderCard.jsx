import React, { useState, useMemo } from 'react';
import { Clock, Flame, CheckCircle, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';

const OrderCard = ({ order, onStartOrder, onReadyOrder }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const { orderNumber, tableNumber, items } = order;

  const waitTime = useMemo(() => {
    if (!items || items.length === 0) return 0;
    return Math.max(...items.map(item => item.waitTime));
  }, [items]);

  const priority = useMemo(() => {
    if (!items || items.length === 0) return 'NORMAL';
    const maxPriority = Math.max(...items.map(item => item.priority));
    if (maxPriority > 150) return 'URGENT';
    if (maxPriority > 120) return 'HIGH';
    return 'NORMAL';
  }, [items]);

  const priorityStyles = {
    URGENT: {
      border: 'border-red-500',
      bg: 'bg-red-50',
      text: 'text-red-700',
      labelBg: 'bg-red-100',
    },
    HIGH: {
      border: 'border-orange-500',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      labelBg: 'bg-orange-100',
    },
    NORMAL: {
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      labelBg: 'bg-blue-100',
    },
  };

  const styles = priorityStyles[priority];

  const getOrderStatus = () => {
    if (items.every(item => item.status === 'ready' || item.status === 'completed')) return 'ready';
    if (items.some(item => item.status === 'in-kitchen')) return 'in-kitchen';
    if (items.every(item => item.status === 'placed')) return 'placed';
    return 'mixed'; // Some placed, some in-kitchen
  }

  const orderStatus = getOrderStatus();

  const handleStart = () => {
    const itemIds = items.filter(i => i.status === 'placed').map(i => i.itemId);
    if (itemIds.length > 0) {
      onStartOrder(order.orderId, itemIds);
    }
  };

  const handleReady = () => {
    const itemIds = items.filter(i => i.status === 'in-kitchen').map(i => i.itemId);
    if (itemIds.length > 0) {
      onReadyOrder(order.orderId, itemIds);
    }
  };

  const itemsToStartCount = items.filter(i => i.status === 'placed').length;
  const itemsToReadyCount = items.filter(i => i.status === 'in-kitchen').length;

  return (
    <div className={`rounded-2xl shadow-lg border-l-8 ${styles.border} ${styles.bg}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 ">Table: {tableNumber}</h3>
            <p className="text-gray-600">Order #{orderNumber}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${styles.labelBg} ${styles.text}`}>
              {priority}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className={waitTime > 15 ? 'text-red-600' : 'text-gray-500'} />
              <span className={`font-semibold ${waitTime > 15 ? 'text-red-600' : 'text-gray-700'}`}>
                {waitTime}m ago
              </span>
            </div>
          </div>
        </div>

        {/* Items List Toggle */}
        <div
          className="flex justify-between items-center mt-4 cursor-pointer text-gray-600"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="font-semibold">{isExpanded ? 'Hide' : 'Show'} {items.length} items</span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {/* Items */}
        {isExpanded && (
          <div className="mt-4 space-y-3">
            {items.map(item => (
              <div key={item.itemId} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{item.menuItem.name} x{item.quantity}</p>
                  {item.notes && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <StickyNote size={12} /> {item.notes}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  item.status === 'placed' ? 'bg-gray-200 text-gray-700' :
                  item.status === 'in-kitchen' ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
          {itemsToStartCount > 0 && (
            <button
              onClick={handleStart}
              className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-base"
            >
              <Flame size={20} /> Start Cooking ({itemsToStartCount})
            </button>
          )}
          {itemsToReadyCount > 0 && (
             <button
              onClick={handleReady}
              className="w-full bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-base"
            >
              <CheckCircle size={20} /> Mark as Ready ({itemsToReadyCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
