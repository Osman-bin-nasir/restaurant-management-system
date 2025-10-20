import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table2, Users, CheckCircle, Clock, ShoppingBag, ArrowLeft, Plus, Minus, X, Trash2 } from 'lucide-react';
import axios from '../../api/axios';
import { getStatusBadge } from '../Admin/TableManagement.jsx';
import toast, { Toaster } from 'react-hot-toast';

const WaiterTableDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tableRes, menuRes] = await Promise.all([
          axios.get(`/tables/${id}`),
          axios.get('/menu/')
        ]);
        if (tableRes.data.success) {
          setTable(tableRes.data.table);
          setMenuItems(menuRes.data.MenuItems);
          if (tableRes.data.table.currentOrderId) {
            const orderRes = await axios.get(`/orders/${tableRes.data.table.currentOrderId._id}`);
            if (orderRes.data.success) {
              setCurrentOrder(orderRes.data.order);
              setCustomerName(orderRes.data.order.customerName);
              const cartItems = orderRes.data.order.items.map(item => ({
                _id: item.menuItem._id,
                name: item.menuItem.name,
                price: item.menuItem.price,
                quantity: item.quantity,
                notes: item.notes,
                original: orderRes.data.order.status !== 'placed'
              }));
              setCart(cartItems);
            }
          }
        } else {
          throw new Error('Failed to fetch table details');
        }
      } catch (err) {
        const errorMessage = err.response?.status === 404 ? 'Table or order not found' : err.message || 'Error fetching table details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleOpenModal = () => {
    if (currentOrder) {
      setCart([]);
    }
    setShowOrderModal(true);
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c._id === item._id);
    if (existing) {
      setCart(cart.map(c => (c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { ...item, quantity: 1, notes: '', original: false }]);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter(c => c._id !== itemId));
    } else {
      setCart(cart.map(c => (c._id === itemId ? { ...c, quantity: newQuantity } : c)));
    }
  };

  const getTotalAmount = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleOrderSuccess = (order, successMessage, isNewOrder) => {
    setCurrentOrder(order);
    if (isNewOrder) {
      setTable({ ...table, status: 'occupied', currentOrderId: order._id });
    }

    const itemMap = new Map();
    order.items.forEach((item) => {
      const key = item.menuItem._id;
      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        existing.quantity += item.quantity;
        if (item.status === 'placed') {
          existing.original = false;
        }
      } else {
        itemMap.set(key, {
          _id: item.menuItem._id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          notes: item.notes,
          original: item.status !== 'placed',
        });
      }
    });

    setCart(Array.from(itemMap.values()));
    setShowOrderModal(false);
    toast.success(successMessage);
  };

  const proceedWithUpdate = async () => {
    try {
      const orderData = {
        items: cart.map(({ _id, quantity, notes }) => ({ menuItem: _id, quantity, notes })),
      };

      const res = await axios.post(`/orders/${currentOrder._id}/items`, { items: orderData.items });
      if (!res.data.success) throw new Error(res.data.message || 'Failed to update order');

      const updatedOrderRes = await axios.get(`/orders/${res.data.order._id}`);
      if (!updatedOrderRes.data.success) throw new Error(updatedOrderRes.data.message || 'Failed to fetch updated order');

      handleOrderSuccess(updatedOrderRes.data.order, 'Order updated successfully!', false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update order';
      toast.error(errorMessage);
    }
  };

  const handleUpdateConfirmation = () => {
    toast(
      (t) => (
        <div className="bg-white p-6 rounded-xl shadow-2xl text-center max-w-md w-full mx-auto">
          <p className="font-semibold text-xl mb-3 text-gray-800">Confirm Order Update</p>
          <p className="text-sm text-gray-600 mb-5">
            Are you sure you want to update this order? <br /> This action cannot be undone.
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-800 transition"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
              onClick={() => {
                toast.dismiss(t.id);
                proceedWithUpdate();
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        position: 'top-center',
        duration: Infinity, // Stay until dismissed
        style: {
          background: 'transparent', // Remove default toast background
          boxShadow: 'none', // Remove default shadow (handled by toast content)
          padding: 0, // Remove default padding
          margin: 'auto', // Center horizontally
          top: '50%', // Center vertically
          transform: 'translateY(-50%)', // Adjust for vertical centering
          maxWidth: '90vw', // Responsive width
        },
      }
    );
  };

  const handleSubmitOrder = async () => {
    if (currentOrder) {
      handleUpdateConfirmation();
      return;
    }

    try {
      const orderData = {
        type: 'dine-in',
        tableId: table._id,
        customerName: customerName || 'Guest',
        items: cart.map(({ _id, quantity, notes }) => ({ menuItem: _id, quantity, notes })),
      };

      const res = await axios.post('/orders', orderData);
      if (!res.data.success) throw new Error(res.data.message || 'Failed to create order');

      const updatedOrderRes = await axios.get(`/orders/${res.data.order._id}`);
      if (!updatedOrderRes.data.success) throw new Error(updatedOrderRes.data.message || 'Failed to fetch updated order');

      handleOrderSuccess(updatedOrderRes.data.order, 'Order created successfully!', true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create order';
      toast.error(errorMessage);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!currentOrder) return;

    try {
      let itemIdsToUpdate = [];
      if (newStatus === 'in-kitchen') {
        itemIdsToUpdate = currentOrder.items
          .filter(item => item.status === 'placed')
          .map(item => item._id);
      } else if (newStatus === 'served') {
        itemIdsToUpdate = currentOrder.items
          .filter(item => item.status === 'ready')
          .map(item => item._id);
      }

      if (itemIdsToUpdate.length === 0) {
        toast.error(`No items eligible to be marked as ${newStatus}!`);
        return;
      }

      const res = await axios.patch(`/orders/${currentOrder._id}/items/status`, {
        itemIds: itemIdsToUpdate,
        newStatus
      });

      setCurrentOrder(res.data.order);
      toast.success(`Items marked as ${newStatus}!`);
    } catch (err) {
      const errorMessage = err.response?.status === 404
        ? 'Order or items not found'
        : err.response?.data?.message || `Failed to update status to ${newStatus}`;
      toast.error(errorMessage);
    }
  };

  const handleRemoveItem = async (itemId) => {
    toast(
      (t) => (
        <div className="bg-white p-6 rounded-xl shadow-2xl text-center max-w-md w-full mx-auto">
          <p className="font-semibold text-xl mb-3 text-gray-800">Confirm Removal</p>
          <p className="text-sm text-gray-600 mb-5">
            Are you sure you want to remove this item from the order?
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-800 transition"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const res = await axios.delete(`/orders/${currentOrder._id}/items/${itemId}`);
                  if (res.data.success) {
                    toast.success('Item removed successfully!');
                    setCurrentOrder(res.data.order);
                  } else {
                    throw new Error(res.data.message || 'Failed to remove item');
                  }
                } catch (err) {
                  const errorMessage = err.response?.data?.message || err.message || 'Failed to remove item';
                  toast.error(errorMessage);
                }
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ),
      {
        position: 'top-center',
        duration: Infinity,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
        },
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md p-6 text-center">
          <p className="text-red-600 text-lg font-semibold">{error}</p>
          <button
            onClick={() => navigate('/waiter/tables')}
            className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg"
          >
            <ArrowLeft size={18} />
            Back to Tables
          </button>
        </div>
      </div>
    );
  }

  if (!table) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <Toaster position="top-center" />
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-2xl shadow-lg">
                <Table2 size={32} className="text-white" />
              </div>
              Table {table.tableNumber} Details (Waiter View)
            </h1>
            <p className="text-gray-600 text-lg">View and update current order</p>
          </div>
          <button
            onClick={() => navigate('/waiter/tables')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg"
          >
            <ArrowLeft size={18} />
            Back to Tables
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Table Information</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Table Number:</span>
              <span className="font-semibold text-gray-900">{table.tableNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Capacity:</span>
              <span className="font-semibold text-gray-900 flex items-center gap-2">
                <Users size={18} /> {table.capacity} Seats
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              {getStatusBadge(table.status)}
            </div>
            {table.currentOrderId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Order:</span>
                <span className="font-semibold text-gray-900">{table.currentOrderId.orderNumber}</span>
              </div>
            )}
          </div>
          {(table.status === 'occupied' || table.status === 'available' || table.status === 'reserved') && (
            <button
              onClick={handleOpenModal}
              className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              {currentOrder ? 'Update Order' : 'Create Order'}
            </button>
          )}
        </div>

        {table.currentOrderId && currentOrder && (
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Current Order</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-mono font-semibold text-gray-900">{currentOrder.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-semibold text-gray-900">{currentOrder.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${currentOrder.status === 'ready' || currentOrder.status === 'served' ? 'text-green-600' : 'text-orange-600'}`}>
                  {currentOrder.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-orange-600">₹{currentOrder.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Created At:</span>
                <span className="font-semibold text-gray-900">{new Date(currentOrder.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Waiter:</span>
                <span className="font-semibold text-gray-900">{currentOrder.waiterId ? currentOrder.waiterId.name : 'N/A'}</span>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-2">Items</h3>
                {currentOrder.items.length === 0 ? (
                  <p className="text-gray-500">No items in this order.</p>
                ) : (
                  currentOrder.items.map((item) => (
                    <div key={item._id} className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <span className="text-gray-600">
                          {item.menuItem.name} × {item.quantity}
                          {item.notes && <span className="text-xs text-gray-500"> ({item.notes})</span>}
                        </span>
                        <span className={`ml-2 text-xs font-semibold ${item.status === 'ready' ? 'text-green-600' :
                          item.status === 'served' ? 'text-blue-600' :
                            item.status === 'in-kitchen' ? 'text-orange-600' :
                              item.status === 'cancelled' ? 'text-red-600' :
                                'text-gray-600'
                          }`}>
                          ({item.status})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                        </span>
                        {(item.status === 'placed' || item.status === 'in-kitchen') && (
                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full transition"
                            title="Remove Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                {currentOrder.status === 'placed' && (
                  <button
                    onClick={() => handleUpdateStatus('in-kitchen')}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2 rounded-xl font-bold hover:from-yellow-600 hover:to-yellow-700 transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    Send to Kitchen
                  </button>
                )}
                {(currentOrder.status === 'in-kitchen' || currentOrder.status === 'ready') && (
                  <button
                    onClick={() => handleUpdateStatus('served')}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    Mark as Served
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {currentOrder ? `Add Items to Order ${currentOrder.orderNumber}` : 'Create Order'} - Table {table.tableNumber}
                </h2>
                <p className="text-white/90 text-sm">Capacity: {table.capacity} persons</p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex">
              <div className="flex-1 p-6 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Select Items</h3>
                <div className="grid grid-cols-2 gap-4">
                  {menuItems.map((item) => {
                    const inCart = cart.find((c) => c._id === item._id);
                    return (
                      <div
                        key={item._id}
                        className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition group"
                      >
                        <div className="relative h-32 overflow-hidden bg-gray-200">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            ₹{item.price}
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-gray-900 mb-2">{item.name}</h4>
                          {inCart ? (
                            <div className="flex items-center justify-between bg-orange-50 rounded-lg p-2">
                              <button
                                onClick={() => updateQuantity(item._id, inCart.quantity - 1)}
                                className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-bold text-gray-900 text-lg">{inCart.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item._id, inCart.quantity + 1)}
                                className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2"
                            >
                              <Plus size={16} />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {currentOrder ? 'New Items to Add' : 'Order Summary'}
                  </h3>
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    disabled={currentOrder}
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No new items added</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item._id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-600">
                              ₹{item.price} × {item.quantity}
                              {item.notes && <span className="text-xs text-gray-500"> ({item.notes})</span>}
                            </p>
                          </div>
                          <span className="font-bold text-orange-600">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => updateQuantity(item._id, 0)}
                          className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-lg font-bold mb-4">
                    <span className="text-gray-900">{currentOrder ? 'New Items Total:' : 'Total:'}</span>
                    <span className="text-orange-600">₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                  {currentOrder && (
                    <p className="text-red-600 text-center font-bold text-lg my-2">
                      This order cannot be edited later.
                    </p>
                  )}
                  <button
                    onClick={handleSubmitOrder}
                    disabled={!customerName.trim() || cart.length === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle size={20} />
                    {currentOrder ? 'Confirm Update Order' : 'Create Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterTableDetails;