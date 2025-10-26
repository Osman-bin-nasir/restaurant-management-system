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

      const { data } = await api.get('/orders', { params, headers: { Authorization: `Bearer ${user.token}` } });
      
      setOrders(prev => (currentPage === 1 || isRefresh) ? data.orders : [...prev, ...data.orders]);
      setStats(data.stats);
      setHasMore(data.currentPage < data.totalPages);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      if (currentPage === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }, [user.token, filterStatus, filterType, debouncedSearchTerm]);

  useEffect(() => {
    setPage(1);
    fetchOrders(1, true); // `isRefresh` true to replace data
  }, [filterStatus, filterType, debouncedSearchTerm]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchOrders(nextPage, false);
  }

  const refreshData = () => {
    setPage(1);
    fetchOrders(1, true);
  }

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
          <p className="text-3xl font-bold">₹{stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

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
              {/* Table Head */}
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {orders.length === 0 && !loading ? (
                <tr><td colSpan="10" className="px-6 py-12 text-center text-gray-500"><Search className="w-12 h-12 mx-auto text-gray-300" /><p className="text-lg mt-2">No orders found</p></td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap"><span className="font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900">{order.customerName}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${order.type === 'dine-in' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>{order.type === 'dine-in' ? 'Dine-in' : 'Parcel'}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.tableId?.tableNumber || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.waiterId?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.items?.length || 0} items</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-bold text-gray-900">₹{order.totalAmount?.toFixed(2)}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>{order.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"><div className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div><div className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN')}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><button onClick={() => viewOrderDetails(order)} className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 transition"><Eye className="w-4 h-4" />View</button></td>
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
                    {loadingMore ? <><Loader2 className="animate-spin" size={20}/> Loading...</> : 'Load More'}
                </button>
            </div>
        )}
      </div>

      {/* Modal remains the same */}
    </div>
  );
};

export default AllOrders;
