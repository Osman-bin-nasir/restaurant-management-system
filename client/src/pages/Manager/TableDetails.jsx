import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table2, Users, CheckCircle, ShoppingBag, ArrowLeft, Plus, Minus, X, Trash2, Search } from 'lucide-react';
import axios from '../../api/axios';
import { getStatusBadge } from '../Admin/TableManagement.jsx';
import toast, { Toaster } from 'react-hot-toast';

import { useSocket } from '../../contexts/SocketContext';

const PAGE_SIZE = 5;          // load 5 at a time
const FIRST_PAGE = 1;         // 1-based pagination for your backend

const TableDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);

  // Order history (infinite scroll)
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE); // 1-based
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Refs for infinite scroll
  const loadMoreRef = useRef(null);   // sentinel at list bottom
  const reqIdRef = useRef(0);         // guard against overlapping responses

  // Clear current order and set table to available
  const clearCurrentOrder = useCallback(async () => {
    if (!table) return;
    try {
      await axios.post(`/tables/${table._id}/clear`, {
        status: 'available',
        currentOrderId: null
      });
      setTable(prevTable => ({
        ...prevTable,
        status: 'available',
        currentOrderId: null
      }));
      setCurrentOrder(null);
      setCart([]);
      setCustomerName('');
      toast.success('Table is now available.');
    } catch (err) {
      console.error('Failed to clear order:', err);
      toast.error('Failed to update table status.');
      // Fallback: refetch data
      fetchData();
    }
  }, [table]);

  // Auto-clear if current order has no items
  useEffect(() => {
    if (currentOrder && currentOrder.items.length === 0) {
      clearCurrentOrder();
    }
  }, [currentOrder, clearCurrentOrder]);

  // Close modal with ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27 && showOrderModal) setShowOrderModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showOrderModal]);

  // Fetch table + menu + current order (NOT history here)
  const fetchData = async () => {
    try {
      setLoading(true);

      const [tableRes, menuRes] = await Promise.all([
        axios.get(`/tables/${id}`),
        axios.get('/menu/'),
      ]);

      if (!tableRes.data.success) throw new Error('Failed to fetch table details');

      setTable(tableRes.data.table);
      setMenuItems(menuRes.data.MenuItems);

      if (tableRes.data.table.currentOrderId) {
        try {
          const orderRes = await axios.get(`/orders/${tableRes.data.table.currentOrderId._id}`);
          if (orderRes.data.success && orderRes.data.order.items.length > 0) {
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
          } else {
            await clearCurrentOrder();
          }
        } catch (err) {
          await clearCurrentOrder();
        }
      } else {
        setCurrentOrder(null);
        setCart([]);
        setCustomerName('');
      }
    } catch (err) {
      const errorMessage = err.response?.status === 404 ? 'Table or order not found' : err.message || 'Error fetching table details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch one page of order history (5 at a time) — 1-based page
  const fetchOrdersPage = async (pageToLoad) => {
    if (loadingOrders || !hasMoreOrders) return;

    setLoadingOrders(true);
    const myReqId = ++reqIdRef.current;

    try {
      const apiPage = Math.max(FIRST_PAGE, pageToLoad || FIRST_PAGE); // never below 1
      const params = {
        tableId: id,
        limit: PAGE_SIZE,
        sort: '-createdAt',
        page: apiPage,            // your backend expects 1-based "page"
      };

      const res = await axios.get('/orders', { params });
      if (reqIdRef.current !== myReqId) return; // stale response; ignore

      const incoming = res.data?.orders || [];

      setOrderHistory(prev => {
        const seen = new Set(prev.map(o => o._id || o.orderNumber));
        let newCount = 0;
        const merged = [...prev];

        for (const o of incoming) {
          const key = o._id || o.orderNumber;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(o);
            newCount++;
          }
        }

        if (newCount === 0 || incoming.length < PAGE_SIZE) {
          setHasMoreOrders(false);
        } else {
          setHasMoreOrders(true);
          setCurrentPage(apiPage); // we advanced to this page successfully
        }

        return merged;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load more orders');
      setHasMoreOrders(false); // stop spinner loop on error
    } finally {
      if (reqIdRef.current === myReqId) setLoadingOrders(false);
    }
  };

  // Initial load when table id changes
  useEffect(() => {
    (async () => {
      await fetchData();
      // reset history paging and load first 5 (page 1)
      setOrderHistory([]);
      setCurrentPage(FIRST_PAGE);
      setHasMoreOrders(true);
      fetchOrdersPage(FIRST_PAGE);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Live updates (order/table)
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = (updatedOrder) => {
      // If current order updated
      if (currentOrder && updatedOrder._id === currentOrder._id) {
        setCurrentOrder(updatedOrder);
        toast.success('Order has been updated!');
      }
      // If any order for this table updated, refresh history (restart pagination)
      if (updatedOrder.tableId === id) {
        setOrderHistory([]);
        setCurrentPage(FIRST_PAGE);
        setHasMoreOrders(true);
        fetchOrdersPage(FIRST_PAGE);
      }
    };

    const handleTableUpdate = (updatedTable) => {
      if (table && updatedTable._id === table._id) {
        setTable(updatedTable);
        if (updatedTable.status === 'available') {
          toast.success(`Table ${updatedTable.tableNumber} is now available!`);
        }
      }
    };

    socket.on('orderUpdated', handleOrderUpdate);
    socket.on('tableUpdated', handleTableUpdate);

    return () => {
      socket.off('orderUpdated', handleOrderUpdate);
      socket.off('tableUpdated', handleTableUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentOrder, table, id]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMoreOrders) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loadingOrders) {
          fetchOrdersPage(currentPage + 1); // go to next 1-based page
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [currentPage, hasMoreOrders, loadingOrders]);

  // Filter menu items by search
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = () => {
    if (currentOrder) setCart([]);
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
        if (item.status === 'placed') existing.original = false;
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

    // Refresh history after changes from the top (page 1)
    setOrderHistory([]);
    setCurrentPage(FIRST_PAGE);
    setHasMoreOrders(true);
    fetchOrdersPage(FIRST_PAGE);
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

      const updatedOrder = updatedOrderRes.data.order;
      if (updatedOrder.items.length === 0) {
        await clearCurrentOrder();
        toast.success('Order updated, but no items left. Table is now available.');
      } else {
        handleOrderSuccess(updatedOrder, 'Order updated successfully!', false);
      }
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
        duration: Infinity,
        style: { background: 'transparent', boxShadow: 'none', padding: 0, margin: 'auto', top: '50%', transform: 'translateY(-50%)', maxWidth: '90vw' },
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

      // History could shift; reload from top
      setOrderHistory([]);
      setCurrentPage(FIRST_PAGE);
      setHasMoreOrders(true);
      fetchOrdersPage(FIRST_PAGE);
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
                    if (res.data.order.items.length === 0) {
                      await clearCurrentOrder();
                    } else {
                      setCurrentOrder(res.data.order);
                      toast.success('Item removed successfully!');
                    }
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
        style: { background: 'transparent', boxShadow: 'none', padding: 0, margin: 'auto', top: '50%', transform: 'translateY(-50%)' },
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
            onClick={() => navigate('/manager/tables')}
            className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg"
          >
            <ArrowLeft size={18} />
            Back to Tables
          </button>
        </div>
      </div>
    );
  }

  if (!table) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <Toaster position="top-center" />
      <div className="mb-8">
        <div className="flex items-centered justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-2xl shadow-lg">
                <Table2 size={32} className="text-white" />
              </div>
              Table {table.tableNumber} Details
            </h1>
            <p className="text-gray-600 text-lg">View and update current order</p>
          </div>
          <button
            onClick={() => navigate('/manager/tables')}
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
                        <span className={`ml-2 text-xs font-semibold ${
                          item.status === 'ready' ? 'text-green-600' :
                          item.status === 'served' ? 'text-blue-600' :
                          item.status === 'in-kitchen' ? 'text-orange-600' :
                          item.status === 'cancelled' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          ({item.status})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
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

      {/* Order History with Infinite Scroll */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order History</h2>
        {orderHistory.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No previous orders for this table.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orderHistory.map((order) => (
              <div key={order._id || order.orderNumber} className="bg-gray-50 rounded-lg p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString()}
                      {order.waiterId?.name ? ` · ${order.waiterId.name}` : ''}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      order.status === 'paid'
                        ? 'text-green-600'
                        : order.status === 'cancelled'
                        ? 'text-red-600'
                        : 'text-orange-600'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading spinner only when fetching */}
            {loadingOrders && (
              <div className="h-10 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Loading more…</span>
              </div>
            )}

            {/* Sentinel for IntersectionObserver (present while more data may exist) */}
            {hasMoreOrders && <div ref={loadMoreRef} className="h-1" />}

            {/* Fallback manual load button */}
            {hasMoreOrders && !loadingOrders && (
              <div className="flex justify-center">
                <button
                  onClick={() => fetchOrdersPage(currentPage + 1)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Load more
                </button>
              </div>
            )}

            {!hasMoreOrders && (
              <p className="text-center text-sm text-gray-500">No more orders.</p>
            )}
          </div>
        )}
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">
                  {currentOrder ? `Add Items to Order ${currentOrder.orderNumber}` : 'Create Order'} - Table {table.tableNumber}
                </h2>
                <p className="text-white/90 text-xs">Capacity: {table.capacity} persons</p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main */}
            <div className="flex-1 flex overflow-hidden">
              {/* Menu */}
              <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Select Items</h3>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {filteredMenuItems.length === 0 ? (
                    <div className="col-span-4 text-center py-12">
                      <p className="text-gray-500 text-lg">No items found</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {searchTerm ? `No items matching "${searchTerm}"` : 'No menu items available'}
                      </p>
                    </div>
                  ) : (
                    filteredMenuItems.map((item) => {
                      const inCart = cart.find((c) => c._id === item._id);
                      return (
                        <div
                          key={item._id}
                          className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition cursor-pointer relative group border-2 border-gray-200 hover:border-orange-500"
                          onClick={() => addToCart(item)}
                        >
                          {inCart && (
                            <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                              {inCart.quantity}
                            </div>
                          )}
                          <h4 className="font-bold text-gray-900 text-center text-lg mb-2">{item.name}</h4>
                          <div className="text-center">
                            <span className="text-orange-600 font-bold text-lg">₹{item.price}</span>
                          </div>
                          <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-orange-500 transition-all duration-200 pointer-events-none" />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Cart */}
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
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item._id, item.quantity - 1);
                              }}
                              className="w-6 h-6 bg-gray-300 text-gray-700 rounded flex items-center justify-center hover:bg-gray-400 transition"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-semibold text-gray-900 mx-2">{item.quantity}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item._id, item.quantity + 1);
                              }}
                              className="w-6 h-6 bg-orange-500 text-white rounded flex items-center justify-center hover:bg-orange-600 transition"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item._id, 0);
                            }}
                            className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
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

export default TableDetails;
