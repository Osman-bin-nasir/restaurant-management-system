import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table2,
  Plus,
  Users,
  Minus,
  Clock,
  RefreshCw,
  X,
  ShoppingBag,
  CheckCircle,
  Trash2,
  Search
} from 'lucide-react';
import axios from '../../api/axios';
import { useSocket } from '../../contexts/SocketContext';

const TrendingUp = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState({});
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isOrderDirty, setIsOrderDirty] = useState(false);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('tableUpdated', (updatedTable) => {
        setTables((prevTables) =>
          prevTables.map((table) =>
            table._id === updatedTable._id ? updatedTable : table
          )
        );
      });

      return () => {
        socket.off('tableUpdated');
      };
    }
  }, [socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tablesRes, menuRes, ordersRes] = await Promise.all([
        axios.get('/tables/'),
        axios.get('/menu/'),
        axios.get('/orders/')
      ]);
      setTables(tablesRes.data.tables);
      setStats(tablesRes.data.stats);
      setMenuItems(menuRes.data.MenuItems);
      setOrders(ordersRes.data.orders.reduce((acc, o) => ({ ...acc, [o.orderNumber]: o }), {}));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTableStatusColor = (status) => {
    const colors = {
      available: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:shadow-green-200',
      occupied: 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300 hover:shadow-orange-200',
      reserved: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 hover:shadow-blue-200'
    };
    return colors[status] || colors.available;
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: { bg: 'bg-green-100', text: 'text-green-700', label: 'Available', icon: CheckCircle },
      occupied: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Occupied', icon: Users },
      reserved: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Reserved', icon: Clock }
    };
    const badge = badges[status] || badges.available;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  const handleTableClick = (table) => {
    navigate(`/manager/tables/${table._id}`);
  };

  const addToCart = (item) => {
    setIsOrderDirty(true);
    const existing = cart.find(c => c._id === item._id);
    if (existing) {
      setCart(cart.map(c => (c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { ...item, quantity: 1, notes: '' }]);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (currentOrder) {
      const originalItem = currentOrder.items.find(item => item._id === itemId);
      const originalQuantity = originalItem ? originalItem.quantity : 0;
      if (newQuantity < originalQuantity) {
        return;
      }
    }

    const currentItem = cart.find(c => c._id === itemId);
    const currentQuantity = currentItem ? currentItem.quantity : 0;
    if (newQuantity === currentQuantity) {
      return;
    }

    setIsOrderDirty(true);

    if (newQuantity === 0) {
      setCart(cart.filter(c => c._id !== itemId));
    } else {
      setCart(cart.map(c => (c._id === itemId ? { ...c, quantity: newQuantity } : c)));
    }
  };

  const getTotalAmount = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = () => {
    const total = getTotalAmount();
    if (!currentOrder) {
      const newOrderNumber = `ORD-${String(Object.keys(orders).length + 3).padStart(3, '0')}`;
      const newOrder = {
        _id: `o${Object.keys(orders).length + 3}`,
        orderNumber: newOrderNumber,
        tableId: selectedTable._id,
        customerName,
        status: 'unpaid',
        items: cart.map(({ notes, ...item }) => item),
        totalAmount: total
      };
      setOrders({ ...orders, [newOrderNumber]: newOrder });
      setTables(tables.map(t => 
        t._id === selectedTable._id ? { ...t, status: 'occupied', currentOrderId: { orderNumber: newOrderNumber, totalAmount: total } } : t
      ));
      setStats({
        ...stats,
        available: stats.available - 1,
        occupied: stats.occupied + 1,
        occupancyRate: ((stats.occupied + 1) / stats.total * 100).toFixed(2)
      });
    } else {
      const updatedOrder = {
        ...currentOrder,
        customerName,
        items: cart.map(({ notes, ...item }) => item),
        totalAmount: total
      };
      setOrders({ ...orders, [currentOrder.orderNumber]: updatedOrder });
      setTables(tables.map(t => 
        t._id === selectedTable._id ? { ...t, currentOrderId: { ...t.currentOrderId, totalAmount: total } } : t
      ));
    }
    setShowOrderModal(false);
    setSelectedTable(null);
  };

  const handleCompletePayment = () => {
    if (currentOrder) {
      setOrders({ ...orders, [currentOrder.orderNumber]: { ...currentOrder, status: 'paid' } });
      setTables(tables.map(t => 
        t._id === selectedTable._id ? { ...t, status: 'available', currentOrderId: null } : t
      ));
      setStats({
        ...stats,
        available: stats.available + 1,
        occupied: stats.occupied - 1,
        occupancyRate: ((stats.occupied - 1) / stats.total * 100).toFixed(2)
      });
      setShowOrderModal(false);
      setSelectedTable(null);
    }
  };

  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.tableNumber.toString().includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || table.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const previousOrders = selectedTable 
    ? Object.values(orders).filter(o => o.tableId === selectedTable._id && o.status === 'paid') 
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-2xl shadow-lg">
                <Table2 size={32} className="text-white" />
              </div>
              Table Management
            </h1>
            <p className="text-gray-600 text-lg">Manage restaurant tables and orders</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg hover:shadow-xl"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Tables</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Table2 className="text-blue-500" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available</p>
                  <p className="text-3xl font-bold text-green-600">{stats.available}</p>
                </div>
                <CheckCircle className="text-green-500" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Occupied</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.occupied}</p>
                </div>
                <Users className="text-orange-500" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reserved</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.reserved}</p>
                </div>
                <Clock className="text-blue-500" size={32} />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/90 mb-1">Occupancy</p>
                  <p className="text-3xl font-bold text-white">{stats.occupancyRate}%</p>
                </div>
                <TrendingUp className="text-white" size={32} />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by table number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredTables.map((table) => (
          <div
            key={table._id}
            onClick={() => handleTableClick(table)}
            className={`${getTableStatusColor(table.status)} border-2 rounded-2xl p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden group`}
          >
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-white rounded-full p-2 shadow-lg">
                  <Table2 size={20} className="text-gray-700" />
                </div>
                {getStatusBadge(table.status)}
              </div>

              <div className="text-center mb-3">
                <p className="text-xs text-gray-600 mb-0">Table</p>
                <p className="text-4xl font-bold text-gray-900">{table.tableNumber}</p>
              </div>

              <div className="flex items-center justify-center gap-1 text-gray-600 mb-3">
                <Users size={14} />
                <span className="text-xs font-medium">{table.capacity} Seats</span>
              </div>

              {table.currentOrderId && (
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Order:</span>
                    <span className="font-mono font-semibold text-gray-900">{table.currentOrderId.orderNumber}</span>
                  </div>
                </div>
              )}

              {table.status === 'available' && (
                <div className="mt-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-1 px-3 rounded-xl text-center text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to View Details
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableManagement;

export const getStatusBadge = (status) => {
  const badges = {
    available: { bg: 'bg-green-100', text: 'text-green-700', label: 'Available', icon: CheckCircle },
    occupied: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Occupied', icon: Users },
    reserved: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Reserved', icon: Clock }
  };
  const badge = badges[status] || badges.available;
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
      <Icon size={12} />
      {badge.label}
    </span>
  );
};