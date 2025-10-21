import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import {
  CreditCard,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  Percent,
  Receipt,
  Smartphone,
  Banknote,
  CreditCard as CardIcon,
  Printer,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Billing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = new URLSearchParams(location.search).get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [notes, setNotes] = useState('');
  const [finalAmount, setFinalAmount] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const printedRef = useRef(false); // Prevent double print

  useEffect(() => {
    if (!orderId) {
      toast.error('No order ID provided');
      navigate('/cashier/dashboard');
      return;
    }
    fetchOrderDetails();
  }, [orderId, navigate]);

  useEffect(() => {
    if (order) calculateFinalAmount();
  }, [discount, discountType, order]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/orders/${orderId}`);
      setOrder(data.order);
      setFinalAmount(data.order.totalAmount);
    } catch (err) {
      toast.error('Failed to fetch order details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalAmount = () => {
    if (!order) return;
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (order.totalAmount * discount) / 100;
    } else {
      discountAmount = parseFloat(discount) || 0;
    }
    const newAmount = Math.max(0, order.totalAmount - discountAmount);
    setFinalAmount(newAmount);
  };

  const handleProcessPayment = async () => {
    if (processing) return;

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    if (discount < 0 || (discountType === 'percentage' && discount > 100)) {
      toast.error('Invalid discount value');
      return;
    }
    if (discountType === 'fixed' && discount > order.totalAmount) {
      toast.error('Discount cannot exceed total amount');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post('/cashier/payment/process', {
        orderId: order._id,
        paymentMethod,
        discount: discountType === 'percentage'
          ? (order.totalAmount * discount) / 100
          : parseFloat(discount) || 0,
        notes,
      });

      if (response.data.success) {
        toast.success('Payment processed successfully!', { icon: 'Check', duration: 2000 });
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
    setTimeout(() => navigate('/cashier/dashboard'), 1000);
  };

  // Auto-print once after success
  useEffect(() => {
    if (paymentSuccess && !printedRef.current) {
      printedRef.current = true;
      const timer = setTimeout(printBill, 600);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess]);

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: Banknote, color: 'green' },
    { id: 'card', name: 'Card', icon: CardIcon, color: 'blue' },
    { id: 'upi', name: 'UPI', icon: Smartphone, color: 'purple' },
    { id: 'cheque', name: 'Cheque', icon: Receipt, color: 'orange' },
  ];

  // LOADING
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  // NOT FOUND
  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  // SUCCESS SCREEN WITH BILL ON SCREEN
  if (paymentSuccess) {
    const discountAmt =
      discountType === 'percentage'
        ? (order.totalAmount * discount) / 100
        : parseFloat(discount) || 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-center" />

        {/* PRINT STYLES */}
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
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 text-center">
              <CheckCircle className="mx-auto mb-2" size={56} />
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="mt-1 text-lg">
                Amount Paid: <span className="font-bold">₹{finalAmount.toFixed(2)}</span>
              </p>
            </div>

            {/* BILL DISPLAY */}
            <div id="printable-bill" className="p-6 bg-white">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Restaurant Name</h1>
                <p className="text-sm text-gray-600">123 Food Street • +91 98765 43210</p>
                <p className="text-sm">
                  Bill #{order.orderNumber} • {new Date().toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><strong>Customer:</strong> {order.customerName}</div>
                <div><strong>Table:</strong> {order.tableId?.tableNumber || 'Parcel'}</div>
                <div><strong>Type:</strong> {order.type}</div>
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
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-1">{it.menuItem.name}</td>
                      <td className="text-center py-1">{it.quantity}</td>
                      <td className="text-right py-1">
                        ₹{(it.menuItem.price * it.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{order.totalAmount.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Discount {discountType === 'percentage' ? `(${discount}%)` : ''}:
                    </span>
                    <span>-₹{discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-1">
                  <span>Total Amount:</span>
                  <span className="text-orange-600">₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>

              {notes && (
                <div className="mt-4 text-sm">
                  <strong>Notes:</strong> {notes}
                </div>
              )}

              <div className="mt-8 text-center text-xs text-gray-500">
                <p>Thank you for dining with us!</p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
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

  // MAIN PAYMENT FORM
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-center" />

      <div className="mb-6">
        <button
          onClick={() => navigate('/cashier/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Process Payment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Order Summary</h2>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Customer</p>
                <p className="font-semibold text-gray-900">{order.customerName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Table</p>
                <p className="font-semibold text-gray-900">
                  {order.tableId?.tableNumber || 'Parcel'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className="font-semibold text-gray-900 capitalize">{order.type}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-3 text-gray-900">Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.menuItem.name}</p>
                    {item.notes && (
                      <p className="text-sm text-gray-600 mt-1">Note: {item.notes}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    <p className="font-bold text-gray-900">
                      ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-bold mb-3 text-gray-900 flex items-center gap-2">
              <Percent size={18} />
              Apply Discount (Optional)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="fixed">Fixed (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
              <input
                type="number"
                min="0"
                max={discountType === 'percentage' ? 100 : order.totalAmount}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Payment Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any payment notes..."
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Payment Panel */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Payment Method</h2>

          <div className="space-y-3 mb-6">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                    isSelected
                      ? `border-${method.color}-500 bg-${method.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={isSelected}
                    onChange={() => setPaymentMethod(method.id)}
                    className="hidden"
                  />
                  <Icon
                    className={isSelected ? `text-${method.color}-600` : 'text-gray-400'}
                    size={24}
                  />
                  <span
                    className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}
                  >
                    {method.name}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-semibold text-green-600">
                  -₹{(discountType === 'percentage'
                    ? (order.totalAmount * discount) / 100
                    : parseFloat(discount)
                  ).toFixed(2)}
                  {discountType === 'percentage' && ` (${discount}%)`}
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Total Amount:</span>
              <span className="font-bold text-2xl text-orange-600">
                ₹{finalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleProcessPayment}
            disabled={processing}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Process Payment ₹{finalAmount.toFixed(2)}
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Payment will be recorded and table will be cleared
          </p>
        </div>
      </div>
    </div>
  );
};

export default Billing;