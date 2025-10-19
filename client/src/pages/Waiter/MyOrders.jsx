import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Eye, XCircle, Clock, DollarSign } from 'lucide-react';
import axios from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ✅ Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterType !== 'all') params.type = filterType;

      const { data } = await axios.get('/orders', { params });
      console.log('Fetched orders:', data.orders);
      console.log('Current user:', user);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User object:', user);
      fetchOrders();
    } else {
      setError("User not authenticated");
      setLoading(false);
    }
  }, [user, filterStatus, filterType]);

  // ✅ Status badge styling
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

  // ✅ Filter orders - Fixed to handle both id and _id
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    
    // Get the waiter ID from the order (handle both _id and id)
    const orderWaiterId = order.waiterId?._id || order.waiterId;
    // Get the current user ID (handle both id and _id)
    const currentUserId = user?.id || user?._id;
    
    console.log('Comparing:', { orderWaiterId, currentUserId, orderNumber: order.orderNumber });
    
    const isMyOrder = orderWaiterId?.toString() === currentUserId?.toString();
    const matchesSearch = (
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower)
    );
    
    return isMyOrder && matchesSearch;
  });

  // ✅ Calculate statistics
  const stats = {
    total: filteredOrders.length,
    placed: filteredOrders.filter((o) => o.status === 'placed').length,
    inKitchen: filteredOrders.filter((o) => o.status === 'in-kitchen').length,
    ready: filteredOrders.filter((o) => o.status === 'ready').length,
    served: filteredOrders.filter((o) => o.status === 'served').length,
    paid: filteredOrders.filter((o) => o.status === 'paid').length,
    totalRevenue: filteredOrders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  // ✅ View order details
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  // ✅ Update all items status
  const updateAllItemsStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        toast.error('Order not found!');
        return;
      }

      const itemIdsToUpdate = order.items.map(item => item._id);

      await axios.patch(`/orders/${orderId}/items/status`, { 
        itemIds: itemIdsToUpdate,
        newStatus 
      });
      
      await fetchOrders();
      toast.success(`Order moved to ${newStatus}`);

    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to update order to ${newStatus}`);
    }
  };

  const cancelOrder = (orderId) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p>Are you sure you want to cancel this order?</p>
        <div className="flex gap-2">
          <button
            className="w-full bg-red-500 text-white py-1 rounded-lg font-semibold hover:bg-red-600 transition"
            onClick={async () => {
              try {
                await axios.patch(`/orders/${orderId}/cancel`, { reason: 'Cancelled by waiter' });
                await fetchOrders();
                setShowModal(false);
                toast.dismiss(t.id);
                toast.success('Order cancelled');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to cancel order');
                toast.dismiss(t.id);
              }
            }}
          >
            Yes
          </button>
          <button
            className="w-full bg-gray-200 text-gray-700 py-1 rounded-lg font-semibold hover:bg-gray-300 transition"
            onClick={() => toast.dismiss(t.id)}
          >
            No
          </button>
        </div>
      </div>
    ));
  };

  // ✅ Loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <Toaster />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">Track and manage your assigned orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
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
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>

          {/* Status Filter */}
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

          {/* Type Filter */}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-12 h-12 text-gray-300" />
                      <p className="text-lg">No orders found</p>
                      <p className="text-sm text-gray-400">
                        {orders.length > 0 
                          ? 'No orders assigned to you yet' 
                          : 'Create your first order to see it here'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{order.customerName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        order.type === 'dine-in' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}>
                        {order.type === 'dine-in' ? 'Dine-in' : 'Parcel'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.tableId?.tableNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{order.totalAmount?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 transition"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => setShowModal(false)}
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
                  <p className="font-semibold text-gray-900 text-sm">
                    {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg text-white">
                  <p className="text-xs opacity-90 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">₹{selectedOrder.totalAmount?.toFixed(2)}</p>
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
                        {item.notes && (
                          <p className="text-sm text-gray-600 mt-1">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="font-bold text-gray-900">₹{(item.menuItem?.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'paid' && (
                <div>
                  <h3 className="text-lg font-bold mb-3 text-gray-900">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status === 'placed' && (
                      <button
                        onClick={() => updateAllItemsStatus(selectedOrder._id, 'in-kitchen')}
                        className="px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold transition shadow-sm"
                      >
                        Move to Kitchen
                      </button>
                    )}
                    {selectedOrder.status === 'ready' && (
                      <button
                        onClick={() => updateAllItemsStatus(selectedOrder._id, 'served')}
                        className="px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold transition shadow-sm"
                      >
                        Mark Served
                      </button>
                    )}
                    <button
                      onClick={() => cancelOrder(selectedOrder._id)}
                      className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition shadow-sm"
                    >
                      Cancel Order
                    </button>
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

export default MyOrders;