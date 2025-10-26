import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  User,
  Phone,
  Package,
  Clock,
  Check,
  AlertCircle,
  CheckCircle,
  Trash2,
  Percent,
  Receipt,
  CreditCard,
  Printer
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from '../../api/axios';

const CashierParcelOrder = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const categories = ['All', 'Snack', 'Meal', 'Vegan', 'Drink', 'Dessert'];
  const paymentMethods = [
    { id: 'cash', name: 'Cash', color: 'green' },
    { id: 'card', name: 'Card', color: 'blue' },
    { id: 'upi', name: 'UPI', color: 'purple' },
    { id: 'cheque', name: 'Cheque', color: 'orange' }
  ];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/menu");
      if (res.data.success) {
        setMenuItems(res.data.MenuItems);
      }
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
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

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDiscount = () => {
    const subtotal = getSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    }
    return discount;
  };

  const getTax = () => {
    const afterDiscount = getSubtotal() - getDiscount();
    return Math.round(afterDiscount * 0.05); // 5% tax
  };

  const getTotal = () => {
    return getSubtotal() - getDiscount() + getTax();
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleSubmitOrder = async () => {
    // Validation
    if (cart.length === 0) {
      toast.error('Please add items to your order');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        items: cart.map(item => ({
          menuItem: item._id,
          quantity: item.quantity,
          notes: item.notes
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        discount: parseFloat(discount) || 0,
        discountType
      };
      console.log(orderData);

      const res = await axios.post("/parcel", orderData);

      if (res.data.success) {
        setOrderDetails(res.data.order);
        setSuccess(true);
        toast.success('Order created and paid successfully!');
      }
    } catch (err) {
      console.error('Order submission failed:', err);
      const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(`⚠️ ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintBill = () => {
    window.print();
  };

  const handleNewOrder = () => {
    setSuccess(false);
    setOrderDetails(null);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('cash');
    setDiscount(0);
    setDiscountType('fixed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  // Success Screen with Bill
  if (success && orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-center" />

        <style jsx>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-bill,
            #printable-bill * {
              visibility: visible;
            }
            #printable-bill {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print,
            .no-print * {
              display: none !important;
            }
          }
        `}</style>

        <div className="flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 text-center no-print">
              <CheckCircle className="mx-auto mb-2" size={56} />
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="mt-1 text-lg">
                Parcel Order Created
              </p>
            </div>

            {/* BILL DISPLAY */}
            <div id="printable-bill" className="p-6 bg-white">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Restaurant Name</h1>
                <p className="text-sm text-gray-600">Parcel Order Receipt</p>
                <p className="text-sm">
                  {new Date().toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4 pb-4 border-b">
                <div><strong>Order #:</strong> {orderDetails.orderNumber}</div>
                <div><strong>Type:</strong> Parcel</div>
                <div><strong>Customer:</strong> {orderDetails.customerName}</div>
                <div><strong>Phone:</strong> {orderDetails.customerPhone || 'N/A'}</div>
                <div><strong>Payment:</strong> {paymentMethod.toUpperCase()}</div>
                <div><strong>Status:</strong> PAID</div>
              </div>

              <div className="mb-4">
                <p className="font-bold mb-2 text-sm">Estimated Ready Time:</p>
                <p className="text-orange-600 font-bold text-lg">
                  {new Date(orderDetails.estimatedReadyTime).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <table className="w-full border-collapse mb-4 text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Price</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-1">
                        {item.menuItem.name}
                        {item.notes && <div className="text-xs text-gray-500">{item.notes}</div>}
                      </td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">₹{item.priceAtOrder.toFixed(2)}</td>
                      <td className="text-right py-1">
                        ₹{(item.priceAtOrder * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{orderDetails.subtotal.toFixed(2)}</span>
                </div>
                {orderDetails.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Discount {orderDetails.discountType === 'percentage' ? `(${orderDetails.discount}%)` : ''}:
                    </span>
                    <span>-₹{getDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (5%):</span>
                  <span>₹{orderDetails.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-1">
                  <span>Total Amount:</span>
                  <span className="text-orange-600">₹{orderDetails.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500 border-t pt-4">
                <p className="mb-2">Items sent to kitchen. Please collect when ready.</p>
                <p>Thank you for your order!</p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="no-print p-6 bg-gray-50 flex gap-3">
              <button
                onClick={handlePrintBill}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition shadow"
              >
                <Printer size={20} />
                Print Bill
              </button>
              <button
                onClick={handleNewOrder}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition shadow"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Order Creation Screen
  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      <Toaster />
      
      {/* Left Side - Menu */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="p-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-orange-500" />
                Create Parcel Order
              </h1>
              <p className="text-gray-600 mt-1">Bill immediately & send to kitchen</p>
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
                    className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${selectedCategory === category
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

      {/* Right Side - Order Summary & Payment */}
      <div className="w-96 h-screen bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-white text-orange-500 bg-opacity-20 p-2 rounded-lg">
                <Receipt size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Order Bill</h2>
                <p className="text-sm opacity-90">{getTotalItems()} items</p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="bg-white text-orange-500 bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition"
                title="Clear cart"
              >
                <Trash2 size={18} />
              </button>
            )}
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

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Optional"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Cart Items (Scrollable) */}
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
            cart.map((item, index) => (
              <div
                key={item._id}
                className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-600">₹{item.price} × {item.quantity}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => removeFromCart(item._id)}
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
                  placeholder="Special instructions..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
              </div>
            ))
          )}
        </div>

        {/* Payment & Billing Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-white space-y-3 flex-shrink-0">
            {/* Discount Section */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Percent size={16} className="text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">Discount</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="fixed">Fixed (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percentage' ? 100 : getSubtotal()}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="col-span-2 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Payment Method *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-2 rounded-lg text-xs font-semibold transition ${
                      paymentMethod === method.id
                        ? `bg-${method.color}-500 text-white shadow-lg ring-2 ring-${method.color}-300`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₹{getSubtotal().toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount {discountType === 'percentage' ? `(${discount}%)` : ''}:</span>
                  <span className="font-semibold">-₹{getDiscount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (5%):</span>
                <span className="font-semibold">₹{getTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-orange-600">₹{getTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitOrder}
              disabled={submitting || cart.length === 0 || !customerName.trim() || !paymentMethod}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Bill & Send to Kitchen
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierParcelOrder;