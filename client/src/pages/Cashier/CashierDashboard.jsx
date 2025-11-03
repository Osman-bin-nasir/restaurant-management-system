import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  DollarSign, 
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Package,
  Table2
} from 'lucide-react';
import axios from '../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

const CashierDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    totalDiscount: 0,
    averageTransaction: 0
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    fetchCashierData();
    const interval = setInterval(fetchCashierData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('billPending', (newBill) => {
        setPendingOrders((prevOrders) => [newBill, ...prevOrders]);
        toast.success(`New bill for Order ${newBill.orderNumber} is pending!`);
      });

      socket.on('orderUpdated', (updatedOrder) => {
        // Remove order from pending if its status is paid or cancelled
        if (updatedOrder.status === 'paid' || updatedOrder.status === 'cancelled') {
          setPendingOrders((prevOrders) =>
            prevOrders.filter((order) => order._id !== updatedOrder._id)
          );
          toast.success(`Order ${updatedOrder.orderNumber} has been ${updatedOrder.status}!`);
        } else {
          // If order is updated but still pending, update its details
          setPendingOrders((prevOrders) =>
            prevOrders.map((order) =>
              order._id === updatedOrder._id ? updatedOrder : order
            )
          );
        }
      });

      return () => {
        socket.off('billPending');
        socket.off('orderUpdated');
      };
    }
  }, [socket]);

  const fetchCashierData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        axios.get('/cashier/stats/today'),
        axios.get('/orders', { params: { status: 'served,ready' } })
      ]);

      setStats(statsRes.data?.stats || {
        totalOrders: 0,
        totalAmount: 0,
        totalDiscount: 0,
        averageTransaction: 0
      });

      setPendingOrders(ordersRes.data?.orders || []);
    } catch (error) {
      console.error('Failed to fetch cashier data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = async (order) => {
    try {
      const { data } = await axios.get(`/cashier/bill/${order._id}`);
      setSelectedOrder({ ...order, billDetails: data.bill });
      setShowBillModal(true);
    } catch (error) {
      toast.error('Failed to generate bill');
    }
  };

  const handleProcessPayment = (order) => {
    navigate(`/cashier/billing?orderId=${order._id}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      ready: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready' },
      served: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Served' }
    };
    const badge = badges[status] || badges.ready;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const filteredOrders = pendingOrders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || order.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CreditCard size={36} className="text-green-500" />
              Cashier Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Welcome, {user?.name}! Process payments and manage billing</p>
          </div>
          <button
            onClick={fetchCashierData}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500 p-3 rounded-xl">
              <Receipt className="text-white" size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Orders Today</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-500 p-3 rounded-xl">
              <DollarSign className="text-white" size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Amount</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-500 p-3 rounded-xl">
              <TrendingUp className="text-white" size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Avg Transaction</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{stats.averageTransaction}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-500 p-3 rounded-xl">
              <AlertCircle className="text-white" size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Pending Bills</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{filteredOrders.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
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

      {/* Pending Bills */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Pending Bills</h2>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900 mb-2">All Bills Cleared! 🎉</p>
            <p className="text-gray-600">No pending bills to process</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <div 
                key={order._id} 
                className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{order.orderNumber}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        {order.type === 'dine-in' ? (
                          <>
                            <Table2 size={14} />
                            Table {order.tableId?.tableNumber}
                          </>
                        ) : (
                          <>
                            <Package size={14} />
                            Parcel
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">{order.customerName}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Items</p>
                  <p className="font-semibold text-gray-900">{order.items?.length || 0} items</p>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-3 mb-4">
                  <p className="text-white text-sm opacity-90 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-white">₹{order.totalAmount?.toFixed(2)}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewBill(order)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
                  >
                    <Eye size={18} />
                    View Bill
                  </button>
                  <button
                    onClick={() => handleProcessPayment(order)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition"
                  >
                    <CreditCard size={18} />
                    Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Modal */}
      {showBillModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Bill Preview</h2>
              <button
                onClick={() => setShowBillModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="p-6">
              {/* Bill Details */}
              <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-gray-900">Restaurant Name</h3>
                <p className="text-sm text-gray-600">{selectedOrder.branchId?.name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.branchId?.location}</p>
              </div>

              <div className="border-t border-b border-gray-200 py-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Bill No:</p>
                    <p className="font-semibold">{selectedOrder.billDetails?.billNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date:</p>
                    <p className="font-semibold">{selectedOrder.billDetails?.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Customer:</p>
                    <p className="font-semibold">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Table:</p>
                    <p className="font-semibold">
                      {selectedOrder.tableId?.tableNumber || 'Parcel'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-semibold text-gray-700">Item</th>
                      <th className="text-center py-2 text-sm font-semibold text-gray-700">Qty</th>
                      <th className="text-right py-2 text-sm font-semibold text-gray-700">Price</th>
                      <th className="text-right py-2 text-sm font-semibold text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.billDetails?.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 text-sm">{item.name}</td>
                        <td className="text-center py-3 text-sm">{item.qty}</td>
                        <td className="text-right py-3 text-sm">₹{item.price}</td>
                        <td className="text-right py-3 text-sm font-semibold">₹{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">₹{selectedOrder.billDetails?.summary.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-green-600">-₹{selectedOrder.billDetails?.summary.discount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (5%):</span>
                  <span className="font-semibold">₹{selectedOrder.billDetails?.summary.tax}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="font-bold text-xl text-orange-600">
                    ₹{selectedOrder.billDetails?.summary.total}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowBillModal(false);
                    handleProcessPayment(selectedOrder);
                  }}
                  className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;