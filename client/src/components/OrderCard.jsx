import React, { useState } from 'react';
import { Clock, Flame, CheckCircle, FileText } from 'lucide-react';

const OrderCard = ({ order, onStart, onReady }) => {
  const { orderNumber, tableNumber, items, waitTime, priority } = order;
  const [showNotes, setShowNotes] = useState({});

  const getPriorityInfo = () => {
    if (priority > 150) return { style: 'border-red-500', label: 'Urgent' };
    if (priority > 120) return { style: 'border-yellow-500', label: 'High' };
    return { style: 'border-blue-500', label: 'Normal' };
  };

  const priorityInfo = getPriorityInfo();

  const getWaitTimeColor = () => {
    if (waitTime > 20) return 'text-red-600 font-bold';
    if (waitTime > 10) return 'text-yellow-600 font-semibold';
    return 'text-gray-600';
  };

  const toggleNotes = (itemId) => {
    setShowNotes(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const placedItems = items.filter(i => i.status === 'placed');
  const inKitchenItems = items.filter(i => i.status === 'in-kitchen');

  const handleStart = () => {
    const itemIdsToStart = placedItems.map(item => item.itemId);
    if (itemIdsToStart.length > 0) onStart(order.orderId, itemIdsToStart);
  };

  const handleReady = () => {
    const itemIdsToReady = inKitchenItems.map(item => item.itemId);
    if (itemIdsToReady.length > 0) onReady(order.orderId, itemIdsToReady);
  };

  return (
    <div className={`bg-white shadow-md rounded-lg border-l-4 ${priorityInfo.style} flex flex-col h-full`}>
      {/* Card Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-bold text-gray-800">Order #{orderNumber}</h3>
            <p className="text-sm text-gray-500">/ Table {tableNumber}</p>
          </div>
          <div className={`flex items-center gap-2 ${getWaitTimeColor()}`}>
            <Clock size={16} />
            <span>{waitTime}m ago</span>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-2 inline-block ${
            priority > 150 ? 'bg-red-100 text-red-700' :
            priority > 120 ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
        }`}>{priorityInfo.label}</span>
      </div>

      {/* Items List */}
      <div className="p-4 flex-grow">
        <ul className="space-y-3">
          {items.map(item => (
            <li key={item.itemId}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${item.status === 'placed' ? 'bg-blue-500' : 'bg-orange-500'}`} title={item.status}></span>
                  <div>
                    <p className="font-semibold text-gray-800">
                      <span className="font-bold text-gray-900">{item.quantity}x</span> {item.menuItem.name}
                    </p>
                  </div>
                </div>
                {item.notes && (
                  <button onClick={() => toggleNotes(item.itemId)} className="text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2">
                    <FileText size={16} />
                  </button>
                )}
              </div>
              {item.notes && showNotes[item.itemId] && (
                <div className="mt-2 ml-5 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  {item.notes}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="flex items-center gap-2">
          {placedItems.length > 0 && (
            <button
              onClick={handleStart}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Flame size={16} /> Start ({placedItems.length})
            </button>
          )}
          {inKitchenItems.length > 0 && (
            <button
              onClick={handleReady}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle size={16} /> Ready ({inKitchenItems.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;