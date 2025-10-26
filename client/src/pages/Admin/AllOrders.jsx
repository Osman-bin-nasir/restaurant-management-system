import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, Eye, XCircle, Clock, DollarSign, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

// Custom hook for debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, placed: 0, inKitchen: 0, ready: 0, served: 0, paid: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const fetchOrders = useCallback(async (currentPage, isRefresh) => {
    if (currentPage === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: 10,
      };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterType !== 'all') params.type = filterType;
      if (debouncedSearchTerm) params.searchTerm = debouncedSearchTerm;

      const { data } = await api.get('/orders', {
        params,
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const incoming = data.orders || [];
      setOrders(prev => (currentPage === 1 || isRefresh) ? incoming : [...prev, ...incoming]);
      setStats(data.stats || { total: 0, placed: 0, inKitchen: 0, ready: 0, served: 0, paid: 0, totalRevenue: 0 });
      setHasMore(Boolean(data.currentPage && data.totalPages && data.currentPage < data.totalPages));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      if (currentPage === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }, [user?.token, filterStatus, filterType, debouncedSearchTerm]);

  useEffect(() => {
    setPage(1);
    fetchOrders(1, true);
  }, [filterStatus, filterType, debouncedSearchTerm, fetchOrders]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchOrders(nextPage, false);
  };

  const refreshData = () => {
    setPage(1);
    fetchOrders(1, true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      placed: 'bg-blue-50 text-blue-700 border border-blue-200',
      'in-kitchen': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      ready: 'bg-green-50 text-green-700 border border-green-200',
      served: 'bg-purple-50 text-purple-700 border border-purple-200',
      paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      cancelled: 'bg-red-50 text-red-700 border border-red-200',
    };
    return styles[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/all-items/status`, { newStatus }, { headers: { Authorization: `Bearer ${user.token}` } });
      // refresh list and selected order if open
      await fetchOrders(1, true);
      if (selectedOrder?._id === orderId) {
        const { data } = await api.get(`/orders/${orderId}`, { headers: { Authorization: `Bearer ${user.token}` } });
        setSelectedOrder(data.order);
      }
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.patch(`/orders/${orderId}/cancel`, { reason: 'Cancelled by admin' }, { headers: { Authorization: `Bearer ${user.token}` } });
      await fetchOrders(1, true);
      setShowModal(false);
      setSelectedOrder(null);
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const markOrderAsPaid = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/mark-as-paid`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
      await fetchOrders(1, true);
      const { data } = await api.get(`/orders/${orderId}`, { headers: { Authorization: `Bearer ${user.token}` } });
      setSelectedOrder(data.order);
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Orders</h1>
          <p className="text-gray-600 mt-1">Manage and track all restaurant orders</p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-blue-600 font-medium">Placed</p>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">New</span>
          </div>
          <p className="text-3xl font-bold text-blue-700">{stats.placed}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-yellow-600 font-medium mb-1">In Kitchen</p>
          <p className="text-3xl font-bold text-yellow-700">{stats.inKitchen}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-green-600 font-medium mb-1">Ready</p>
          <p className="text-3xl font-bold text-green-700">{stats.ready}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-purple-600 font-medium mb-1">Served</p>
          <p className="text-3xl font-bold text-purple-700">{stats.served}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-emerald-600 font-medium mb-1">Paid</p>
          <p className="text-3xl font-bold text-emerald-700">{stats.paid}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-xl shadow-sm text-white">
          <p className="text-sm opacity-90 mb-1 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Revenue
          </p>
          <p className="text-3xl font-bold">₹{(stats.totalRevenue ?? 0).toFixed(2)}</p>
        </div>
      </div>

      {/* filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Order # or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none transition cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="in-kitchen">In Kitchen</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none transition cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="dine-in">Dine-in</option>
              <option value="parcel">Parcel</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Table</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waiter</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {orders.length === 0 && !loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto text-gray-300" />
                    <p className="text-lg mt-2">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{order.customerName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${order.type === 'dine-in' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                        {order.type === 'dine-in' ? 'Dine-in' : 'Parcel'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.tableId?.tableNumber || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.waiterId?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.items?.length || 0} items</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">₹{((order.totalAmount ?? 0)).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => viewOrderDetails(order)} className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 transition">
                        <Eye className="w-4 h-4" />View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="p-4 text-center border-t border-gray-200">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center justify-center gap-2 w-full md:w-auto mx-auto px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
            >
              {loadingMore ? <><Loader2 className="animate-spin" size={20} /> Loading...</> : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => { setShowModal(false); setSelectedOrder(null); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Order Number</p>
                  <p className="font-mono font-bold text-gray-900">{selectedOrder.orderNumber}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Customer Name</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Order Type</p>
                  <p className="font-semibold text-gray-900 capitalize">{selectedOrder.type}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Waiter</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.waiterId?.name || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Table</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.tableId?.tableNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Created At</p>
                  <p className="font-semibold text-gray-900 text-sm">{new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg text-white">
                  <p className="text-xs opacity-90 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">₹{((selectedOrder.totalAmount ?? 0)).toFixed(2)}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-gray-900">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.menuItem?.name}</p>
                        {item.notes && <p className="text-sm text-gray-600 mt-1">Note: {item.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="font-bold text-gray-900">₹{(((item.menuItem?.price ?? 0) * item.quantity)).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'paid' && (
                <div>
                  <h3 className="text-lg font-bold mb-3 text-gray-900">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status === 'placed' && (
                      <button onClick={() => updateOrderStatus(selectedOrder._id, 'in-kitchen')} className="px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold transition shadow-sm">Move to Kitchen</button>
                    )}
                    {selectedOrder.status === 'in-kitchen' && (
                      <button onClick={() => updateOrderStatus(selectedOrder._id, 'ready')} className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition shadow-sm">Mark Ready</button>
                    )}
                    {selectedOrder.status === 'ready' && (
                      <button onClick={() => updateOrderStatus(selectedOrder._id, 'served')} className="px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold transition shadow-sm">Mark Served</button>
                    )}
                    {selectedOrder.status === 'served' && (
                      <button onClick={() => markOrderAsPaid(selectedOrder._id)} className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold transition shadow-sm">Mark Paid</button>
                    )}
                    <button onClick={() => cancelOrder(selectedOrder._id)} className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition shadow-sm">Cancel Order</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrders;