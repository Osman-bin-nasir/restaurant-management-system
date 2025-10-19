import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table2, Users, CheckCircle, Clock, ShoppingBag, ArrowLeft, Plus, Minus, X, Trash2 } from 'lucide-react';
import axios from '../../api/axios';
import { getStatusBadge } from './TableManagement.jsx';

const TableDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
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
          setOrderHistory(tableRes.data.orderHistory);
          setMenuItems(menuRes.data.MenuItems);
          if (tableRes.data.table.currentOrderId) {
            const orderRes = await axios.get(`/orders/${tableRes.data.table.currentOrderId._id}`);
            if (orderRes.data.success) {
              setCurrentOrder(orderRes.data.order);
              setCustomerName(orderRes.data.order.customerName);
              // Map items to include menu item details and mark as original
              const cartItems = orderRes.data.order.items.map(item => ({
                _id: item.menuItem._id,
                name: item.menuItem.name,
                price: item.menuItem.price,
                quantity: item.quantity,
                notes: item.notes,
                original: orderRes.data.order.status !== 'placed' // Served if not 'placed'
              }));
              setCart(cartItems);
            }
          }
        } else {
          throw new Error('Failed to fetch table details');
        }
      } catch (err) {
        setError(err.message || 'Error fetching table details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const addToCart = (item) => {
    const existing = cart.find(c => c._id === item._id);
    if (existing) {
      setCart(cart.map(c => (c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { ...item, quantity: 1, notes: '', original: false }]);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    const item = cart.find(c => c._id === itemId);
    if (item.original && newQuantity < item.quantity) {
      return; // Prevent reducing quantity of served items
    }
    if (newQuantity === 0) {
      if (!item.original) {
        setCart(cart.filter(c => c._id !== itemId));
      }
    } else {
      setCart(cart.map(c => (c._id === itemId ? { ...c, quantity: newQuantity } : c)));
    }
  };

  const getTotalAmount = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    try {
      const total = getTotalAmount();
      const orderData = {
        type: 'dine-in',
        tableId: table._id,
        customerName: customerName || 'Guest',
        items: cart.map(({ _id, quantity, notes }) => ({ menuItem: _id, quantity, notes }))
      };

      if (currentOrder) {
        // Update existing order
        // if (currentOrder.status !== 'placed') {
        //   alert('Can only edit orders in "placed" status');
        //   return;
        // }
        const res = await axios.put(`/orders/${currentOrder._id}`, {
          customerName: orderData.customerName,
          items: orderData.items
        });
        setCurrentOrder(res.data.order);
        setTable({ ...table, currentOrderId: res.data.order });
      } else {
        // Create new order
        const res = await axios.post('/orders/', orderData);
        setCurrentOrder(res.data.order);
        setTable({ ...table, status: 'occupied', currentOrderId: res.data.order });
      }

      // Update cart to mark all items as original (since they're now part of the order)
      setCart(cart.map(item => ({ ...item, original: currentOrder ? item.original : true })));
      setShowOrderModal(false);
    } catch (err) {
      console.error('Error submitting order:', err);
      alert(err.message || 'Failed to submit order');
    }
  };

  const handleCompletePayment = async () => {
    if (!currentOrder) return;
    try {
      const res = await axios.put(`/orders/${currentOrder._id}/status`, { status: 'served' });
      setTable({ ...table, status: 'available', currentOrderId: null });
      setCurrentOrder(null);
      setCart([]);
      setCustomerName('');
      setShowOrderModal(false);
    } catch (err) {
      console.error('Error completing payment:', err);
      alert(err.message || 'Failed to complete payment');
    }
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
            onClick={() => navigate('/tables')}
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-2xl shadow-lg">
                <Table2 size={32} className="text-white" />
              </div>
              Table {table.tableNumber} Details
            </h1>
            <p className="text-gray-600 text-lg">Detailed information and order history</p>
          </div>
          <button
            onClick={() => navigate('/tables')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg"
          >
            <ArrowLeft size={18} />
            Back to Tables
          </button>
        </div>
      </div>

      {/* Table Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Table Details Card */}
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
            {table.branchId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Branch:</span>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{table.branchId.name}</p>
                  <p className="text-sm text-gray-600">{table.branchId.location}</p>
                  <p className="text-sm text-gray-600">{table.branchId.contact}</p>
                </div>
              </div>
            )}
            {table.mergedWith && table.mergedWith.length > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Merged With:</span>
                <div className="flex flex-col gap-1">
                  {table.mergedWith.map((mergedTable) => (
                    <span key={mergedTable._id} className="font-semibold text-gray-900">
                      Table {mergedTable.tableNumber} ({mergedTable.capacity} Seats)
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Merged With:</span>
                <span className="text-gray-600">None</span>
              </div>
            )}
          </div>
          {(table.status === 'occupied' || table.status === 'available' || table.status === 'reserved') && (
            <button
              onClick={() => setShowOrderModal(true)}
              className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              {currentOrder ? 'Update Order' : 'Create Order'}
            </button>
          )}
        </div>

        {/* Current Order Card */}
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
                      <span className="text-gray-600">
                        {item.menuItem.name} × {item.quantity}
                        {item.notes && <span className="text-xs text-gray-500"> ({item.notes})</span>}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {currentOrder.status === 'ready' && (
                <button
                  onClick={handleCompletePayment}
                  className="w-full mt-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle size={20} />
                  Complete Payment
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order History (Last 10 Orders)</h2>
        {orderHistory.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No previous orders for this table.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orderHistory.map((order) => (
              <div key={order.orderNumber} className="bg-gray-50 rounded-lg p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString()} {order.waiterId && `by ${order.waiterId.name}`}
                    </p>
                  </div>
                  <span className={`font-semibold ${order.status === 'paid' ? 'text-green-600' : order.status === 'cancelled' ? 'text-red-600' : 'text-orange-600'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between mt-2 font-bold">
                    <span>Total:</span>
                    <span className="text-orange-600">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {currentOrder ? `Edit Order ${currentOrder.orderNumber}` : 'Create Order'} - Table {table.tableNumber}
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
                                disabled={inCart.original}
                                className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No items added</p>
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
                        {!item.original && (
                          <button
                            onClick={() => updateQuantity(item._id, 0)}
                            className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-lg font-bold mb-4">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-orange-600">₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={!customerName.trim() || cart.length === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle size={20} />
                    {currentOrder ? 'Update Order' : 'Create Order'}
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

export default TableDetails;