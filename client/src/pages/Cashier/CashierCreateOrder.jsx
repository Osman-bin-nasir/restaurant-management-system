import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  User,
  Package,
  Clock,
  Check,
  AlertCircle,
  Trash2,
  Table2,
  CreditCard
} from 'lucide-react';

const CashierCreateOrder = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderType, setOrderType] = useState('parcel');
  const [selectedTable, setSelectedTable] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [notification, setNotification] = useState(null);

  const categories = ['All', 'Snack', 'Meal', 'Vegan', 'Dessert', 'Drink'];

  // Mock data for demo
  const mockMenuItems = [
    {
      _id: '1',
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
      price: 299,
      category: 'Meal',
      image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400',
      availability: true,
      cookingTime: 15
    },
    {
      _id: '2',
      name: 'Caesar Salad',
      description: 'Crisp romaine lettuce with parmesan and croutons',
      price: 199,
      category: 'Vegan',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
      availability: true,
      cookingTime: 5
    },
    {
      _id: '3',
      name: 'Chocolate Brownie',
      description: 'Rich chocolate brownie with vanilla ice cream',
      price: 149,
      category: 'Dessert',
      image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400',
      availability: true,
      cookingTime: 3
    },
    {
      _id: '4',
      name: 'French Fries',
      description: 'Crispy golden fries with special seasoning',
      price: 99,
      category: 'Snack',
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
      availability: true,
      cookingTime: 8
    },
    {
      _id: '5',
      name: 'Mango Smoothie',
      description: 'Fresh mango blended with yogurt and honey',
      price: 129,
      category: 'Drink',
      image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400',
      availability: true,
      cookingTime: 2
    },
    {
      _id: '6',
      name: 'Chicken Burger',
      description: 'Grilled chicken with lettuce, tomato, and special sauce',
      price: 249,
      category: 'Meal',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      availability: true,
      cookingTime: 12
    }
  ];

  const mockTables = [
    { _id: 't1', tableNumber: 'T1' },
    { _id: 't2', tableNumber: 'T2' },
    { _id: 't3', tableNumber: 'T3' },
    { _id: 't4', tableNumber: 'T4' },
    { _id: 't5', tableNumber: 'T5' },
    { _id: 't6', tableNumber: 'T6' },
    { _id: 't7', tableNumber: 'T7' },
    { _id: 't8', tableNumber: 'T8' }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMenuItems(mockMenuItems);
      setTables(mockTables);
      setLoading(false);
    }, 500);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.availability;
  });

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, notes: '' }]);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item._id !== itemId));
    } else {
      setCart(cart.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const updateNotes = (itemId, notes) => {
    setCart(cart.map(item =>
      item._id === itemId ? { ...item, notes } : item
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getFinalAmount = () => {
    const total = getTotalAmount();
    let discountAmount = 0;
    
    if (discountType === 'percentage') {
      discountAmount = (total * discount) / 100;
    } else {
      discountAmount = parseFloat(discount) || 0;
    }
    
    return Math.max(0, total - discountAmount);
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      showNotification('Please add items to your order', 'error');
      return;
    }

    if (!customerName.trim()) {
      showNotification('Please enter customer name', 'error');
      return;
    }

    if (orderType === 'dine-in' && !selectedTable) {
      showNotification('Please select a table for dine-in order', 'error');
      return;
    }

    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const order = {
        _id: 'ord_' + Date.now(),
        orderNumber: 'ORD' + Math.floor(1000 + Math.random() * 9000),
        totalAmount: getTotalAmount(),
        type: orderType,
        customerName: customerName,
        items: cart
      };
      
      setCreatedOrder(order);
      setShowPaymentModal(true);
      setSubmitting(false);
      
      // Remove selected table from available tables
      if (orderType === 'dine-in' && selectedTable) {
        setTables(prev => prev.filter(t => t._id !== selectedTable));
      }
    }, 1000);
  };

  const handleProcessPayment = async () => {
    if (!createdOrder) return;

    setSubmitting(true);

    // Simulate payment processing
    setTimeout(() => {
      showNotification('Order created and paid successfully!', 'success');
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setSelectedTable(null);
      setDiscount(0);
      setCreatedOrder(null);
      setShowPaymentModal(false);
      setSubmitting(false);
      
      // Refresh tables (restore in demo)
      setTables(mockTables);
    }, 1500);
  };

  const handleSkipPayment = () => {
    showNotification('Order created successfully! Process payment later.', 'success');
    
    setCart([]);
    setCustomerName('');
    setSelectedTable(null);
    setCreatedOrder(null);
    setShowPaymentModal(false);
    setSubmitting(false);
    
    // Refresh tables
    setTables(mockTables);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-semibold">{notification.message}</span>
          </div>
        </div>
      )}
      
      {/* Left Side - Menu */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="p-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Create & Bill Order</h1>
              <p className="text-gray-600 mt-1">Select items and process payment instantly</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
            </div>

            {/* Category Tabs */}
            <div className="overflow-x-auto">
              <div className="flex gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${
                      selectedCategory === category
                        ? 'bg-orange-500 text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMenu.map(item => {
              const cartItem = cart.find(c => c._id === item._id);
              return (
                <div
                  key={item._id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group border border-gray-100"
                >
                  <div className="relative h-40 overflow-hidden bg-gray-200">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg">
                      ₹{item.price}
                    </div>
                    {item.cookingTime && (
                      <div className="absolute top-2 left-2 bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
                        <Clock size={12} />
                        {item.cookingTime}m
                      </div>
                    )}
                    {cartItem && (
                      <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        {cartItem.quantity} in cart
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-bold text-base text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">{item.description}</p>

                    {cartItem ? (
                      <div className="flex items-center justify-between bg-orange-50 rounded-lg p-2 border border-orange-200">
                        <button
                          onClick={() => updateQuantity(item._id, cartItem.quantity - 1)}
                          className="w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition active:scale-95"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-gray-900 text-lg">{cartItem.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, cartItem.quantity + 1)}
                          className="w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition active:scale-95"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2 active:scale-95"
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

          {filteredMenu.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">No items found</p>
              <p className="text-gray-600">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-96 h-screen bg-white border-l border-gray-200 flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingCart size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Order Cart</h2>
                <p className="text-sm opacity-90">{getTotalItems()} items</p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {/* Order Type Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setOrderType('dine-in');
                setSelectedTable(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm ${
                orderType === 'dine-in'
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Table2 size={16} />
              Dine-in
            </button>
            <button
              onClick={() => {
                setOrderType('parcel');
                setSelectedTable(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm ${
                orderType === 'parcel'
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Package size={16} />
              Parcel
            </button>
          </div>
        </div>

        {/* Customer Details */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3 flex-shrink-0">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Customer Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter name"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
            </div>
          </div>

          {orderType === 'dine-in' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select Table *
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {tables.map(table => (
                  <button
                    key={table._id}
                    onClick={() => setSelectedTable(table._id)}
                    className={`p-2 rounded-lg font-bold text-sm transition active:scale-95 ${
                      selectedTable === table._id
                        ? 'bg-orange-500 text-white shadow-lg ring-2 ring-orange-300'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-orange-300'
                    }`}
                  >
                    {table.tableNumber}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <ShoppingCart size={48} className="text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-1">Cart is empty</p>
              <p className="text-sm text-gray-600">Add items from the menu</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item._id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-600">₹{item.price} × {item.quantity}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => updateQuantity(item._id, 0)}
                      className="text-red-500 hover:text-red-600 transition p-1"
                    >
                      <X size={16} />
                    </button>
                    <span className="font-bold text-orange-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="w-6 h-6 bg-white rounded flex items-center justify-center hover:bg-gray-200 transition active:scale-95 border border-gray-300"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="font-bold text-sm text-gray-900 min-w-[1.5rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="w-6 h-6 bg-white rounded flex items-center justify-center hover:bg-gray-200 transition active:scale-95 border border-gray-300"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => updateNotes(item._id, e.target.value)}
                  placeholder="Add special instructions..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-white space-y-3 flex-shrink-0">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>Subtotal</span>
                <span>₹{getTotalAmount().toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span className="text-orange-600">₹{getTotalAmount().toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={submitting || cart.length === 0 || !customerName.trim() || (orderType === 'dine-in' && !selectedTable)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Create & Bill Order
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && createdOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Process Payment</h2>
              <p className="text-sm text-gray-600 mt-1">Order {createdOrder.orderNumber}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Discount (Optional)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="fixed">₹</option>
                    <option value="percentage">%</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Amount Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Total:</span>
                  <span className="font-semibold">₹{createdOrder.totalAmount.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-semibold text-green-600">
                      -₹{(discountType === 'percentage' 
                        ? (createdOrder.totalAmount * discount) / 100 
                        : discount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Final Amount:</span>
                  <span className="font-bold text-xl text-orange-600">
                    ₹{getFinalAmount().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkipPayment}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Pay Later
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierCreateOrder;