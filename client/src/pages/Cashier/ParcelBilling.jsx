import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios.js';
import {
  ArrowLeft,
  CheckCircle,
  Percent,
  Smartphone,
  Banknote,
  CreditCard,
  Receipt,
  Printer,
  ChevronDown,
  Package,
  User,
  ShoppingBag,
  Trash2,
  Plus
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ParcelBilling = () => {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const printedRef = useRef(false);

  const TAX_RATE = 0.05; // 5% tax

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data } = await axios.get('/menu');
      console.log(data)
      const items = data.MenuItems;
      setMenuItems(items.filter(item => item.availability));
    } catch (err) {
      toast.error('Failed to fetch menu items');
      console.error(err);
      setMenuItems([]);
    }
  };

  const addItemToOrder = (menuItem) => {
    const existingIndex = selectedItems.findIndex(
      item => item.menuItem._id === menuItem._id
    );

    if (existingIndex !== -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          menuItem: menuItem,
          quantity: 1,
          notes: ''
        }
      ]);
    }
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const updated = [...selectedItems];
    updated[index].quantity = newQuantity;
    setSelectedItems(updated);
  };

  const updateNotes = (index, notes) => {
    const updated = [...selectedItems];
    updated[index].notes = notes;
    setSelectedItems(updated);
  };

  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );
  };

  const calculateFinalAmount = () => {
    const subtotal = calculateSubtotal();
    let discountAmount = 0;

    if (discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = parseFloat(discount) || 0;
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = afterDiscount * TAX_RATE;
    const beforeRoundOff = afterDiscount + taxAmount;
    return Math.round(beforeRoundOff);
  };

  const handleProcessPayment = async () => {
    if (processing) return;

    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (discount < 0 || (discountType === 'percentage' && discount > 100)) {
      toast.error('Invalid discount value');
      return;
    }

    const subtotal = calculateSubtotal();
    if (discountType === 'fixed' && discount > subtotal) {
      toast.error('Discount cannot exceed total amount');
      return;
    }

    setProcessing(true);
    try {
      const orderData = {
        items: selectedItems.map(item => ({
          menuItem: item.menuItem._id,
          quantity: item.quantity,
          notes: item.notes
        })),
        customerName: customerName.trim(),
        customerPhone: '',
        paymentMethod,
        discount: discountType === 'percentage'
          ? (subtotal * discount) / 100
          : parseFloat(discount) || 0,
        discountType
      };

      const response = await axios.post('/parcel', orderData);

      if (response.data.success) {
        toast.success('Parcel order created and paid successfully!', { duration: 2000 });
        setCreatedOrder(response.data.order);
        setPaymentSuccess(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment processing failed');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const printBill = () => {
    window.print();
  };

  const goToDashboard = () => {
    setTimeout(() => navigate('/cashier/parcel-orders'), 1000);
  };

  useEffect(() => {
    if (paymentSuccess && !printedRef.current) {
      printedRef.current = true;
      const timer = setTimeout(printBill, 600);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess]);

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: Banknote },
    { id: 'card', name: 'Card', icon: CreditCard },
    { id: 'upi', name: 'UPI', icon: Smartphone },
    { id: 'cheque', name: 'Cheque', icon: Receipt },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (paymentSuccess && createdOrder) {
    const subtotal = calculateSubtotal();
    const discountAmt = discountType === 'percentage'
      ? (subtotal * discount) / 100
      : parseFloat(discount) || 0;
    const afterDiscount = subtotal - discountAmt;
    const taxAmount = afterDiscount * TAX_RATE;
    const beforeRoundOff = afterDiscount + taxAmount;
    const roundOffAmount = Math.round(beforeRoundOff) - beforeRoundOff;
    const finalAmount = calculateFinalAmount();

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
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 text-center">
              <CheckCircle className="mx-auto mb-2" size={56} />
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="mt-1 text-lg">
                Amount Paid: <span className="font-bold">₹{finalAmount.toFixed(2)}</span>
              </p>
            </div>

            <div id="printable-bill" className="p-6 bg-white">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Restaurant Name</h1>
                <p className="text-sm text-gray-600">123 Food Street • +91 98765 43210</p>
                <p className="text-sm">
                  Bill #{createdOrder.orderNumber} • {new Date().toLocaleString()}
                </p>
                <div className="mt-2 inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">
                  PARCEL ORDER
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><strong>Customer:</strong> {createdOrder.customerName}</div>
                <div><strong>Order Type:</strong> Parcel</div>
                <div><strong>Payment:</strong> {paymentMethod.toUpperCase()}</div>
              </div>

              <table className="w-full border-collapse mb-4 text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-1">
                        {item.menuItem.name}
                        {item.notes && <div className="text-xs text-gray-600">Note: {item.notes}</div>}
                      </td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">
                        ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Discount {discountType === 'percentage' ? `(${discount}%)` : ''}:
                    </span>
                    <span>-₹{discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (5%):</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Round Off:</span>
                  <span className={roundOffAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {roundOffAmount >= 0 ? '+' : ''}₹{roundOffAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-1">
                  <span>Total Amount:</span>
                  <span className="text-orange-600">₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 text-center text-xs text-gray-500">
                <p>Thank you for your order!</p>
                <p>Estimated Ready Time: {new Date(createdOrder.estimatedReadyTime).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="no-print p-6 bg-gray-50 flex gap-3">
              <button
                onClick={printBill}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition shadow"
              >
                <Printer size={20} />
                Print Bill
              </button>
              <button
                onClick={goToDashboard}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Toaster position="top-center" />

      {/* Menu Items Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Compact with button on right */}
        <div className="flex-shrink-0 px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="text-orange-600" size={28} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Create Parcel Order</h1>
                <p className="text-xs text-gray-600 mt-0.5">Add items and process payment</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/cashier/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Menu Items - Now has more space */}
        <div className="flex-1 px-6 pb-6 pt-4 overflow-hidden">
          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 h-full flex flex-col overflow-hidden">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Select Items</h2>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="flex-1 overflow-auto mb-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => addItemToOrder(item)}
                    className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg hover:from-orange-100 hover:to-orange-200 transition border border-orange-200 text-left"
                  >
                    <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-600">{item.category}</p>
                    <p className="text-sm font-bold text-orange-600 mt-1">₹{item.price.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="border-t pt-3 mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 appearance-none bg-white font-semibold"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Discount Section */}
            <div className="border-t pt-3">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Percent size={16} />
                Discount (Optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="fixed">Fixed (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percentage' ? 100 : calculateSubtotal()}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Panel - Full Height */}
      <div className="w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden">
        {/* Payment Panel Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
          <h2 className="text-xl font-bold">Payment Details</h2>
        </div>

        {/* Main Content Area - Takes available space */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Customer Info */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                <User className="inline mr-1" size={14} />
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Selected Items */}
            <div>
              <h3 className="font-bold mb-2 text-gray-900 text-sm flex items-center gap-2">
                <ShoppingBag size={16} />
                Selected Items ({selectedItems.length})
              </h3>
              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingBag size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items selected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">{item.menuItem.name}</p>
                          <p className="text-xs text-gray-500">{item.menuItem.category}</p>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Add notes..."
                        value={item.notes}
                        onChange={(e) => updateNotes(index, e.target.value)}
                        className="w-full mb-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-semibold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="font-bold text-sm text-orange-600">
                          ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fixed Bottom Section - Always at bottom */}
          <div className="flex-shrink-0 p-4 space-y-4 bg-white border-t border-gray-200">
            {/* Amount Breakdown */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 space-y-2 border border-orange-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold text-gray-900">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Discount:</span>
                  <span className="font-semibold text-green-600">
                    -₹{(discountType === 'percentage'
                      ? (calculateSubtotal() * discount) / 100
                      : parseFloat(discount)
                    ).toFixed(2)}
                    {discountType === 'percentage' && ` (${discount}%)`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Tax (5%):</span>
                <span className="font-semibold text-gray-900">
                  ₹{((calculateSubtotal() - (discountType === 'percentage'
                    ? (calculateSubtotal() * discount) / 100
                    : parseFloat(discount) || 0)) * TAX_RATE).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Round Off:</span>
                <span className="font-semibold text-gray-900">
                  {(() => {
                    const subtotal = calculateSubtotal();
                    const afterDiscount = subtotal - (discountType === 'percentage'
                      ? (subtotal * discount) / 100
                      : parseFloat(discount) || 0);
                    const taxAmt = afterDiscount * TAX_RATE;
                    const beforeRound = afterDiscount + taxAmt;
                    const roundOff = Math.round(beforeRound) - beforeRound;
                    return `${roundOff >= 0 ? '+' : ''}₹${roundOff.toFixed(2)}`;
                  })()}
                </span>
              </div>
              <div className="border-t-2 border-orange-300 pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Total Amount:</span>
                <span className="font-bold text-2xl text-orange-600">
                  ₹{calculateFinalAmount().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={handleProcessPayment}
              disabled={processing || selectedItems.length === 0 || !customerName.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-lg"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingBag size={22} />
                  Create & Pay ₹{calculateFinalAmount().toFixed(2)}
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Order will be sent to kitchen immediately
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParcelBilling;