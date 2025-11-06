import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, RefreshCw, XCircle, Clock, DollarSign, Loader2, Trash2, AlertTriangle, ChefHat, CheckCircle, Utensils, IndianRupee } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import axios from '../../api/axios.js';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0, placed: 0, inKitchen: 0, ready: 0, served: 0, paid: 0
  });
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
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { user } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.keyCode === 27 && showModal) {
        setShowModal(false);
        setSelectedOrder(null);
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showModal]);

  const fetchOrders = useCallback(
    async (currentPage, isRefresh) => {
      if (currentPage === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = { page: currentPage, limit: 10 };
        if (filterStatus !== 'all') params.status = filterStatus;
        if (filterType !== 'all') params.type = filterType;
        if (debouncedSearchTerm) params.searchTerm = debouncedSearchTerm;

        const [dineInRes, parcelRes] = await Promise.all([
          axios.get('/orders', { params }),
          axios.get('/parcel', { params }),
        ]);

        const dineInOrders = dineInRes.data?.orders?.map(o => ({ ...o, orderType: 'dine-in' })) || [];
        const parcelOrders = parcelRes.data?.orders?.map(o => ({ ...o, orderType: 'parcel' })) || [];
        const combinedOrders = [...dineInOrders, ...parcelOrders].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const dineStats = dineInRes.data?.stats || {};
        const parcelStats = parcelRes.data?.stats || {};
        const mergedStats = {
          total: (dineStats.total || 0) + (parcelStats.total || 0),
          placed: (dineStats.placed || 0) + (parcelStats.placed || 0),
          inKitchen: (dineStats.inKitchen || 0) + (parcelStats.inKitchen || 0),
          ready: (dineStats.ready || 0) + (parcelStats.ready || 0),
          served: (dineStats.served || 0) + (parcelStats.served || 0),
          paid: (dineStats.paid || 0) + (parcelStats.paid || 0),
        };

        const dinePage = dineInRes.data?.currentPage || 1;
        const dineTotalPages = dineInRes.data?.totalPages || 1;
        const parcelPage = parcelRes.data?.currentPage || 1;
        const parcelTotalPages = parcelRes.data?.totalPages || 1;
        const hasMorePages = (dinePage < dineTotalPages) || (parcelPage < parcelTotalPages);

        setOrders(prev => currentPage === 1 || isRefresh ? combinedOrders : [...prev, ...combinedOrders]);
        setStats(mergedStats);
        setHasMore(hasMorePages);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to fetch orders');
      } finally {
        if (currentPage === 1) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [user?.token, filterStatus, filterType, debouncedSearchTerm]
  );

  useEffect(() => {
    setPage(1);
    fetchOrders(1, true);
  }, [filterStatus, filterType, debouncedSearchTerm, fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    const handleOrderUpdated = (updatedOrder) => {
      setOrders(prev => prev.map(order => order._id === updatedOrder._id ? updatedOrder : order));
      setSelectedOrder(prev => prev?._id === updatedOrder._id ? updatedOrder : prev);
    };
    const handleOrderDeleted = (data) => {
      setOrders(prev => prev.filter(order => order._id !== data.orderId));
      if (selectedOrder?._id === data.orderId) closeModal();
    };
    socket.on('orderUpdated', handleOrderUpdated);
    socket.on('orderDeleted', handleOrderDeleted);
    return () => {
      socket.off('orderUpdated', handleOrderUpdated);
      socket.off('orderDeleted', handleOrderDeleted);
    };
  }, [socket, selectedOrder]);

  const observer = useRef();
  const lastOrderRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchOrders(nextPage, false);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore, page, fetchOrders]
  );

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
      completed: 'bg-purple-50 text-purple-700 border border-purple-200',
      paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      cancelled: 'bg-red-50 text-red-700 border border-red-200',
    };
    return styles[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const aggregateItems = (items) => {
    const aggregated = {};
    items.forEach(item => {
      const name = item.menuItem?.name;
      if (!name) return;
      if (aggregated[name]) {
        aggregated[name].quantity += item.quantity;
        aggregated[name].totalPrice += (item.menuItem?.price || 0) * item.quantity;
      } else {
        aggregated[name] = {
          name,
          quantity: item.quantity,
          price: item.menuItem?.price || 0,
          totalPrice: (item.menuItem?.price || 0) * item.quantity,
          notes: item.notes
        };
      }
    });
    return Object.values(aggregated);
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    setDeletingOrder(true);

    try {
      const isParcelOrder = selectedOrder.orderType === 'parcel' || selectedOrder.type === 'parcel';
      const endpoint = isParcelOrder ? `/parcel/${selectedOrder._id}` : `/orders/${selectedOrder._id}`;

      await axios.delete(endpoint);

      setOrders(prev => prev.filter(order => order._id !== selectedOrder._id));
      toast.success(`Order ${selectedOrder.orderNumber} deleted successfully`);
      closeModal();
      await fetchOrders(1, true);
    } catch (err) {
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeletingOrder(false);
    }
  };

  const showDeleteConfirmation = () => {
    toast((t) => (
      <div className="flex flex-col gap-4 max-w-md">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-1">Delete Order?</p>
            <p className="text-sm text-gray-700">
              This action cannot be undone. Order {selectedOrder.orderNumber} will be permanently deleted.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              handleDeleteOrder();
            }}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        border: '2px solid #fee',
      }
    });
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);

    try {
      const isParcelOrder = selectedOrder.orderType === 'parcel' || selectedOrder.type === 'parcel';
      let response;

      if (isParcelOrder) {
        if (newStatus === 'in-kitchen') {
          response = await axios.patch(`/parcel/${selectedOrder._id}/items/start`, {
            orderId: selectedOrder._id,
            itemIds: selectedOrder.items.map(item => item._id)
          });
          toast.success(`Order marked in-kitchen`);
        } else if (newStatus === 'ready') {
          response = await axios.patch(`/parcel/${selectedOrder._id}/items/ready`, {
            orderId: selectedOrder._id,
            itemIds: selectedOrder.items.map(item => item._id)
          });
          toast.success(`Order marked as ready`);
        } else if (newStatus === 'completed') {
          response = await axios.patch(`/parcel/${selectedOrder._id}/complete`);
          toast.success(`Order marked completed`);
        }
      } else if (newStatus === 'in-kitchen' || newStatus === 'ready' || newStatus === 'served'  ) {
        response = await axios.patch(`/orders/${selectedOrder._id}/items/status`, {
          itemIds: selectedOrder.items.map(item => item._id),
          newStatus
        });
        toast.success(`Order marked as ${newStatus}`);
      } else{
        response = await axios.patch(`/orders/${selectedOrder._id}/mark-as-paid`, {
          itemIds: selectedOrder.items.map(item => item._id),
          newStatus
        })
        toast.success(`Order marked paid`);
      }


      const updatedOrder = response.data.order;
      setOrders(prev => prev.map(order =>
        order._id === updatedOrder._id ? { ...updatedOrder, orderType: isParcelOrder ? 'parcel' : 'dine-in' } : order
      ));
      setSelectedOrder({ ...updatedOrder, orderType: isParcelOrder ? 'parcel' : 'dine-in' });
      await fetchOrders(1, true);
    } catch (err) {
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getCurrentStatus = (order) => {
    const isParcel = order.orderType === 'parcel' || order.type === 'parcel';
    return isParcel ? (order.orderStatus || order.status || 'placed') : (order.payment?.status || order.status || 'placed');
  };

  const canTransitionTo = (currentStatus, targetStatus) => {
    const transitions = {
      'placed': ['in-kitchen'],
      'in-kitchen': ['ready'],
      'ready': ['served', 'completed'],
      'served': ['paid'],
      'completed': [],
      'paid': [],
      'cancelled': []
    };
    return transitions[currentStatus]?.includes(targetStatus) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Orders</h1>
            <p className="text-gray-600 mt-1">Manage and track all restaurant orders</p>
          </div>
          <button onClick={refreshData} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-blue-600 font-medium mb-1">Placed</p>
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
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search by Order # or Customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition cursor-pointer">
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
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition cursor-pointer">
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waiter</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order #</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      <Search className="w-12 h-12 mx-auto text-gray-300" />
                      <p className="text-lg mt-2">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => {
                    const isParcel = order.orderType === 'parcel' || order.type === 'parcel';
                    const displayStatus = isParcel ? (order.orderStatus || order.status) : (order.payment?.status || order.status);

                    return (
                      <tr key={order._id} ref={index === orders.length - 1 ? lastOrderRef : null} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => viewOrderDetails(order)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isParcel ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            {isParcel ? 'Parcel' : 'Dine-in'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.tableId?.tableNumber || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.waiterId?.name || order.cashierId?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.items?.length || 0} items</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{(order.totalAmount ?? 0).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(displayStatus)}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {loadingMore && (
            <div className="p-4 text-center border-t border-gray-200">
              <Loader2 className="animate-spin mx-auto text-gray-500" size={24} />
            </div>
          )}
        </div>

        {showModal && selectedOrder && (
          <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="bg-white border-black rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-10">
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">Order Number</p>
                    <p className="font-mono font-bold text-gray-900">{selectedOrder.orderNumber}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">Type</p>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${selectedOrder.orderType === 'parcel' || selectedOrder.type === 'parcel' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {selectedOrder.orderType === 'parcel' || selectedOrder.type === 'parcel' ? 'Parcel' : 'Dine-in'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(getCurrentStatus(selectedOrder))}`}>
                      {getCurrentStatus(selectedOrder)}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">Customer</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  {selectedOrder.tableId && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-1">Table</p>
                      <p className="font-semibold text-gray-900">Table {selectedOrder.tableId.tableNumber}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-1">Total Amount</p>
                    <p className="font-bold text-xl text-gray-900">₹{(selectedOrder.totalAmount ?? 0).toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-3 text-gray-900">Order Items</h3>
                  <div className="space-y-2">
                    {aggregateItems(selectedOrder.items || []).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.name} × {item.quantity}</p>
                          {item.notes && <p className="text-sm text-gray-600 mt-1">Note: {item.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">₹{item.price.toFixed(2)} each</p>
                          <p className="font-bold text-gray-900">₹{item.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(() => {
                  const currentStatus = getCurrentStatus(selectedOrder);
                  const isParcel = selectedOrder.orderType === 'parcel' || selectedOrder.type === 'parcel';
                  const isFinalStatus = ['paid', 'completed', 'cancelled'].includes(currentStatus);

                  if (isFinalStatus) return null;

                  return (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-bold mb-3 text-gray-900">Update Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {canTransitionTo(currentStatus, 'in-kitchen') && (
                          <button
                            onClick={() => handleStatusUpdate('in-kitchen')}
                            disabled={updatingStatus}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 transition font-semibold disabled:opacity-50"
                          >
                            {updatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ChefHat className="w-5 h-5" />Mark In-Kitchen</>}
                          </button>
                        )}

                        {canTransitionTo(currentStatus, 'ready') && (
                          <button
                            onClick={() => handleStatusUpdate('ready')}
                            disabled={updatingStatus}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 transition font-semibold disabled:opacity-50"
                          >
                            {updatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" />Mark Ready</>}
                          </button>
                        )}

                        {canTransitionTo(currentStatus, 'served') && !isParcel && (
                          <button
                            onClick={() => handleStatusUpdate('served')}
                            disabled={updatingStatus}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 transition font-semibold disabled:opacity-50"
                          >
                            {updatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Utensils className="w-5 h-5" />Mark Served</>}
                          </button>
                        )}

                        {canTransitionTo(currentStatus, 'paid') && !isParcel && (
                          <button
                            onClick={() => handleStatusUpdate('paid')}
                            disabled={updatingStatus}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 transition font-semibold disabled:opacity-50"
                          >
                            {updatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <><IndianRupee className="w-5 h-5" />Mark Paid</>}
                          </button>
                        )}

                        {canTransitionTo(currentStatus, 'completed') && isParcel && (
                          <button
                            onClick={() => handleStatusUpdate('completed')}
                            disabled={updatingStatus}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 transition font-semibold disabled:opacity-50"
                          >
                            {updatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" />Completed</>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={showDeleteConfirmation}
                    disabled={deletingOrder}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition font-semibold disabled:opacity-50"
                  >
                    {deletingOrder ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Delete Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </>
  );
};

export default AllOrders;
