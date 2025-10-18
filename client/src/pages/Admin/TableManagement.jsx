import React, { useState, useEffect } from 'react';
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

// (Mock API remains the same)
const mockApi = {
  getTables: async () => ({
    data: {
      success: true,
      tables: [
        { _id: '1', tableNumber: 1, capacity: 2, status: 'available', currentOrderId: null },
        { _id: '2', tableNumber: 2, capacity: 4, status: 'occupied', currentOrderId: { orderNumber: 'ORD-001', totalAmount: 847 } },
        { _id: '3', tableNumber: 3, capacity: 4, status: 'available', currentOrderId: null },
        { _id: '4', tableNumber: 4, capacity: 6, status: 'reserved', currentOrderId: null },
        { _id: '5', tableNumber: 5, capacity: 2, status: 'occupied', currentOrderId: { orderNumber: 'ORD-002', totalAmount: 497 } },
        { _id: '6', tableNumber: 6, capacity: 4, status: 'available', currentOrderId: null }
      ],
      stats: {
        total: 6,
        available: 3,
        occupied: 2,
        reserved: 1,
        occupancyRate: 33.33
      }
    }
  }),
  getMenuItems: async () => ({
    data: {
      success: true,
      MenuItems: [
        { _id: 'm1', name: 'Margherita Pizza', price: 299, category: 'Pizza', availability: true, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
        { _id: 'm2', name: 'Veg Burger', price: 199, category: 'Burger', availability: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
        { _id: 'm3', name: 'Chicken Biryani', price: 349, category: 'Main Course', availability: true, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400' },
        { _id: 'm4', name: 'Cold Coffee', price: 149, category: 'Beverage', availability: true, image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400' }
      ]
    }
  }),
  getOrders: async () => ({
    data: {
      success: true,
      orders: [
        {
          _id: 'o1',
          orderNumber: 'ORD-001',
          tableId: '2',
          customerName: 'John Doe',
          status: 'unpaid',
          items: [
            { _id: 'm1', name: 'Margherita Pizza', price: 299, quantity: 1, notes: '' },
            { _id: 'm2', name: 'Veg Burger', price: 199, quantity: 1, notes: '' },
            { _id: 'm3', name: 'Chicken Biryani', price: 349, quantity: 1, notes: '' }
          ],
          totalAmount: 847
        },
        {
          _id: 'o2',
          orderNumber: 'ORD-002',
          tableId: '5',
          customerName: 'Jane Smith',
          status: 'unpaid',
          items: [
            { _id: 'm4', name: 'Cold Coffee', price: 149, quantity: 2, notes: '' },
            { _id: 'm2', name: 'Veg Burger', price: 199, quantity: 1, notes: '' }
          ],
          totalAmount: 497
        }
      ]
    }
  })
};


const TableManagementSystem = () => {
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

  useEffect(() => {
    fetchData();
  }, []);

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
    setSelectedTable(table);
    setShowOrderModal(true);
    setIsOrderDirty(false); 
    if (table.status === 'available' || table.status === 'reserved') {
      setCurrentOrder(null);
      setCart([]);
      setCustomerName('');
    } else if (table.status === 'occupied' && table.currentOrderId) {
      const order = orders[table.currentOrderId.orderNumber];
      if (order) {
        setCurrentOrder(order);
        setCart(order.items.map(item => ({ ...item })));
        setCustomerName(order.customerName);
      }
    }
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
      // Create new order
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
      // Update existing order
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
      {/* Header (No changes) */}
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

        {/* Stats Cards (No changes) */}
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

        {/* Filters (No changes) */}
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

      {/* Tables Grid */}
      {/* ✅ Changed grid to max 4 cols and reduced gap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredTables.map((table) => (
          <div
            key={table._id}
            onClick={() => handleTableClick(table)}
            // ✅ Changed rounded-3xl to rounded-2xl, p-6 to p-4
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
              {/* ✅ Changed mb-4 to mb-3 */}
              <div className="flex items-center justify-between mb-3">
                {/* ✅ Changed p-3 to p-2 */}
                <div className="bg-white rounded-full p-2 shadow-lg">
                  {/* ✅ Changed size 24 to 20 */}
                  <Table2 size={20} className="text-gray-700" />
                </div>
                {getStatusBadge(table.status)}
              </div>

              {/* ✅ Changed mb-4 to mb-3 */}
              <div className="text-center mb-3">
                {/* ✅ Changed text-sm to text-xs, mb-1 to mb-0 */}
                <p className="text-xs text-gray-600 mb-0">Table</p>
                {/* ✅ Changed text-5xl to text-4xl */}
                <p className="text-4xl font-bold text-gray-900">{table.tableNumber}</p>
              </div>

              {/* ✅ Changed gap-2 to gap-1, mb-4 to mb-3 */}
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-3">
                {/* ✅ Changed size 16 to 14 */}
                <Users size={14} />
                {/* ✅ Changed text-sm to text-xs */}
                <span className="text-xs font-medium">{table.capacity} Seats</span>
              </div>

              {table.currentOrderId && (
                // ✅ Changed rounded-xl to lg, p-3 to p-2, space-y-2 to 1
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Order:</span>
                    <span className="font-mono font-semibold text-gray-900">{table.currentOrderId.orderNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Amount:</span>
                    <span className="text-sm font-bold text-orange-600">₹{table.currentOrderId.totalAmount}</span>
                  </div>
                </div>
              )}

              {table.status === 'available' && (
                // ✅ Changed mt-4 to mt-3, py-2 to py-1, px-4 to px-3, text-sm to text-xs
                <div className="mt-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-1 px-3 rounded-xl text-center text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to Create Order
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Order Modal (No changes) */}
      {showOrderModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {currentOrder ? `Edit Order ${currentOrder.orderNumber}` : 'Create Order'} - Table {selectedTable.tableNumber}
                </h2>
                <p className="text-white/90 text-sm">Capacity: {selectedTable.capacity} persons</p>
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
                    const originalItem = currentOrder ? currentOrder.items.find(i => i._id === item._id) : null;
                    const originalQuantity = originalItem ? originalItem.quantity : 0;
                    const isAtOrBelowOriginal = inCart && inCart.quantity <= originalQuantity;

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
                                disabled={currentOrder && isAtOrBelowOriginal}
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
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setIsOrderDirty(true); 
                    }}
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
                    cart.map((item) => {
                      const isOriginalItem = currentOrder && currentOrder.items.some(i => i._id === item._id);
                      return (
                        <div key={item._id} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-600">
                                ₹{item.price} × {item.quantity}
                              </p>
                            </div>
                            <span className="font-bold text-orange-600">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          {!isOriginalItem && (
                            <button
                              onClick={() => updateQuantity(item._id, 0)}
                              className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1"
                            >
                              <Trash2 size={12} />
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-md font-semibold mb-3">Previous Paid Orders</h3>
                    {previousOrders.length === 0 ? (
                      <p className="text-gray-500">No previous orders for this table.</p>
                    ) : (
                      previousOrders.map((order) => (
                        <div key={order.orderNumber} className="mb-4 bg-white rounded-lg p-3 shadow">
                          <div className="font-bold">{order.orderNumber} - {order.customerName}</div>
                          <ul className="text-sm">
                            {order.items.map((i) => (
                              <li key={i._id}>
                                {i.name} x {i.quantity} - ₹{(i.price * i.quantity).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 font-semibold">Total: ₹{order.totalAmount.toFixed(2)}</div>
                        </div>
                      ))
                    )}
                  </div>
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
                  {/* {currentOrder && !isOrderDirty && (
                    <button
                      onClick={handleCompletePayment}
                      className="w-full mt-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      <CheckCircle size={20} />
                      Complete Payment
                    </button>
                  )} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagementSystem;