import React, { useState } from 'react';
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
} from 'lucide-react';

const OrderCard = ({ order, onStartOrder, onReadyOrder }) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  const isParcel = order.type === 'parcel';

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleStartCooking = () => {
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
    const itemsToComplete =
      selectedItems.length > 0
        ? selectedItems
        : order.items
            .filter((item) =>
              ['in-kitchen', 'cooking'].includes(item.status)
            )
            .map((item) => item.itemId);

    if (itemsToComplete.length > 0) {
      onReadyOrder(order.orderId, itemsToComplete, order);
      setSelectedItems([]);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      placed: { text: 'New', color: 'bg-blue-100 text-blue-700' },
      pending: { text: 'New', color: 'bg-blue-100 text-blue-700' },
      'in-kitchen': { text: 'Cooking', color: 'bg-yellow-100 text-yellow-700' },
      cooking: { text: 'Cooking', color: 'bg-yellow-100 text-yellow-700' },
      ready: { text: 'Ready', color: 'bg-green-100 text-green-700' },
    };
    return badges[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
  };

  const getPriorityBorder = (priority) => {
    if (priority >= 3) return 'border-red-400';
    if (priority === 2) return 'border-orange-400';
    return 'border-gray-200';
  };

  const hasNewItems = order.items.some((i) =>
    ['placed', 'pending'].includes(i.status)
  );
  const hasInProgressItems = order.items.some((i) =>
    ['in-kitchen', 'cooking'].includes(i.status)
  );

  return (
    <div
      className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden transition-all ${getPriorityBorder(
        Math.max(...order.items.map((i) => i.priority || 0))
      )}`}
    >
      {/* Header */}
      <div
        className={`p-5 flex items-center justify-between ${
          isParcel ? 'bg-purple-100' : 'bg-blue-100'
        } border-b`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${
              isParcel ? 'bg-purple-500' : 'bg-blue-500'
            }`}
          >
            {isParcel ? (
              <Package size={22} className="text-white" />
            ) : (
              <Utensils size={22} className="text-white" />
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {order.orderNumber}
            </h3>
            {isParcel ? (
              <p className="text-sm text-gray-700 flex items-center gap-1">
                <User size={14} /> {order.customerName || 'Parcel Order'}
              </p>
            ) : (
              <p className="text-sm text-gray-700">
                Table {order.tableNumber}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 bg-white rounded-lg hover:bg-gray-100 transition"
        >
          {expanded ? (
            <ChevronUp size={20} className="text-gray-700" />
          ) : (
            <ChevronDown size={20} className="text-gray-700" />
          )}
        </button>
      </div>

      {/* Order Info */}
      <div className="px-5 py-3 flex items-center gap-4 text-sm text-gray-600 bg-gray-50 border-b">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isParcel
              ? 'bg-purple-200 text-purple-700'
              : 'bg-blue-200 text-blue-700'
          }`}
        >
          {isParcel ? 'PARCEL' : 'DINE-IN'}
        </div>
      </div>

      {/* Items */}
      {expanded && (
        <div className="p-5 space-y-3 bg-white">
          {order.items.map((item) => {
            const isSelected = selectedItems.includes(item.itemId);
            const badge = getStatusBadge(item.status);

            return (
              <div
                key={item.itemId}
                onClick={() => toggleItemSelection(item.itemId)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {item.menuItem.name}
                    </h4>
                    {item.notes && (
                      <p className="text-sm text-yellow-700 mt-1 bg-yellow-50 px-2 py-1 rounded-md">
                        📝 {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      ×{item.quantity}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                  </div>
                </div>

                {item.menuItem.cookingTime && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Flame size={12} className="text-orange-500" />
                    {item.menuItem.cookingTime} min
                  </div>
                )}

                {item.priority >= 3 && (
                  <div className="mt-2 text-sm text-red-600 flex items-center gap-1 font-semibold">
                    <AlertTriangle size={14} /> HIGH PRIORITY
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      {expanded && (
        <div className="p-5 bg-gray-50 border-t flex flex-wrap gap-3">
          {hasNewItems && (
            <button
              onClick={handleStartCooking}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Flame size={18} />
              {selectedItems.length > 0
                ? `Start ${selectedItems.length}`
                : 'Start All'}
            </button>
          )}

          {hasInProgressItems && (
            <button
              onClick={handleMarkReady}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              {selectedItems.length > 0
                ? `Ready ${selectedItems.length}`
                : 'Mark All Ready'}
            </button>
          )}

          {selectedItems.length > 0 && (
            <button
              onClick={() => setSelectedItems([])}
              className="px-5 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
