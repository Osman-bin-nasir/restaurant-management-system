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
  ChevronDown,
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
  const printedRef = useRef(false);

  const TAX_RATE = 0.05; // 5% tax

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

  // Aggregate duplicate items
  const getAggregatedItems = (items) => {
    const itemMap = new Map();
    
    items.forEach(item => {
      const key = item.menuItem._id;
      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        existing.quantity += item.quantity;
        // Combine notes if different
        if (item.notes && item.notes !== existing.notes) {
          existing.notes = existing.notes ? `${existing.notes}; ${item.notes}` : item.notes;
        }
      } else {
        itemMap.set(key, { ...item });
      }
    });
    
    return Array.from(itemMap.values());
  };

  const calculateFinalAmount = () => {
    if (!order) return;
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (order.totalAmount * discount) / 100;
    } else {
      discountAmount = parseFloat(discount) || 0;
    }
    const afterDiscount = Math.max(0, order.totalAmount - discountAmount);
    const taxAmount = afterDiscount * TAX_RATE;
    const beforeRoundOff = afterDiscount + taxAmount;
    const roundedAmount = Math.round(beforeRoundOff);
    setFinalAmount(roundedAmount);
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

  useEffect(() => {
    if (paymentSuccess && !printedRef.current) {
      printedRef.current = true;
      const timer = setTimeout(printBill, 600);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess]);

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: Banknote },
    { id: 'card', name: 'Card', icon: CardIcon },
    { id: 'upi', name: 'UPI', icon: Smartphone },
    { id: 'cheque', name: 'Cheque', icon: Receipt },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  if (paymentSuccess) {
    const discountAmt =
      discountType === 'percentage'
        ? (order.totalAmount * discount) / 100
        : parseFloat(discount) || 0;
    const afterDiscount = order.totalAmount - discountAmt;
    const taxAmount = afterDiscount * TAX_RATE;
    const beforeRoundOff = afterDiscount + taxAmount;
    const roundOffAmount = Math.round(beforeRoundOff) - beforeRoundOff;
    const aggregatedItems = getAggregatedItems(order.items);

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

            <div id="printable-bill" className="p-6 bg-white font-mono text-sm">
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold">Restaurant Name</h1>
                <p className="text-xs leading-tight mt-1">Branch Name</p>
                <p className="text-xs leading-tight">123 Food Street, Area,</p>
                <p className="text-xs leading-tight">City, State - 500001</p>
                <p className="text-xs leading-tight mt-1">GSTIN: XXXXXXXXXXXX</p>
                <p className="text-xs leading-tight">FSSAI: XXXXXXXXXXXX</p>
                <p className="text-xs leading-tight">TEL: +91 98765 43210</p>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
              </div>

              <div className="text-xs space-y-1 mb-3">
                <div className="flex justify-between">
                  <span>{order.type}</span>
                  <span></span>
                </div>
                <div className="flex justify-between">
                  <span>Bill No. {order.orderNumber}</span>
                  <span>Time {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                <div>Date {new Date().toLocaleDateString('en-GB')}</div>
                <div>Cashier: {order.customerName}</div>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
              </div>

              <table className="w-full text-xs mb-3">
                <thead>
                  <tr>
                    <th className="text-left pb-1">DESC</th>
                    <th className="text-center pb-1 px-2">QTY</th>
                    <th className="text-right pb-1 px-2">RATE</th>
                    <th className="text-right pb-1">AMT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={4} className="border-t border-dashed border-gray-400"></td></tr>
                  {aggregatedItems.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{it.menuItem.name}</td>
                      <td className="text-center py-1 px-2">{it.quantity}pc</td>
                      <td className="text-right py-1 px-2">{it.menuItem.price.toFixed(2)}</td>
                      <td className="text-right py-1">
                        {(it.menuItem.price * it.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-gray-400 my-2"></div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Round Off</span>
                  <span>{roundOffAmount >= 0 ? '+' : ''}{roundOffAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>GRAND TOTAL</span>
                  <span>{finalAmount.toFixed(2)}</span>
                </div>
                <div className="text-center">Paid By {paymentMethod.toUpperCase()}</div>
              </div>

              <div className="border-t border-dashed border-gray-400 my-3"></div>

              <div className="text-xs">
                <div className="text-center font-semibold mb-2">Tax Details</div>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Tax Desc</th>
                      <th className="text-right px-2">Sales</th>
                      <th className="text-right">Tax Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>CGST 2.5%</td>
                      <td className="text-right px-2">{(order.totalAmount - discountAmt).toFixed(2)}</td>
                      <td className="text-right">{(taxAmount / 2).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>SGST 2.5%</td>
                      <td className="text-right px-2">{(order.totalAmount - discountAmt).toFixed(2)}</td>
                      <td className="text-right">{(taxAmount / 2).toFixed(2)}</td>
                    </tr>
                    <tr className="border-t border-gray-400">
                      <td className="font-semibold">Total Tax</td>
                      <td className="text-right px-2"></td>
                      <td className="text-right font-semibold">{taxAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {discount > 0 && (
                <div className="text-xs mt-2">
                  <div className="flex justify-between">
                    <span>Discount {discountType === 'percentage' ? `(${discount}%)` : ''}:</span>
                    <span>-₹{discountAmt.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {notes && (
                <div className="mt-3 text-xs">
                  <strong>Notes:</strong> {notes}
                </div>
              )}

              <div className="border-t border-dashed border-gray-400 my-3"></div>

              <div className="text-center text-xs">
                <p className="font-semibold">Thank You.</p>
                <p>Please Visit Again</p>
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

  const aggregatedItems = getAggregatedItems(order.items);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Toaster position="top-center" />

      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3 bg-gray-50">
        <button
          onClick={() => navigate('/cashier/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Process Payment</h1>
      </div>

      {/* Main Content - No scroll on parent */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Order Summary - Scrollable */}
          <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col overflow-auto">
            <h2 className="text-lg font-bold mb-3 text-gray-900">Order Summary</h2>

            {/* Order Info Grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Order #</p>
                <p className="font-mono font-bold text-sm text-gray-900">{order.orderNumber}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Customer</p>
                <p className="font-semibold text-sm text-gray-900">{order.customerName}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Table</p>
                <p className="font-semibold text-sm text-gray-900">
                  {order.tableId?.tableNumber || 'Parcel'}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Type</p>
                <p className="font-semibold text-sm text-gray-900 capitalize">{order.type}</p>
              </div>
            </div>

            {/* Items */}
            <div className="mb-3">
              <h3 className="font-bold mb-2 text-gray-900 text-sm">Items</h3>
              <div className="space-y-1.5">
                {aggregatedItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{item.menuItem.name}</p>
                      {item.notes && (
                        <p className="text-xs text-gray-600 mt-0.5">Note: {item.notes}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      <p className="font-bold text-sm text-gray-900">
                        ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount Section */}
            {/* <div className="border-t border-gray-200 pt-3 mb-3">
              <h3 className="font-bold mb-2 text-gray-900 text-sm flex items-center gap-2">
                <Percent size={16} />
                Discount (Optional)
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div> */}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any payment notes..."
                rows="2"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Payment Panel - Fixed, No Scroll */}
          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col overflow-hidden">
            <h2 className="text-lg font-bold mb-3 text-gray-900">Payment Details</h2>

            {/* Payment Method Dropdown */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white font-semibold cursor-pointer"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-4 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
              </div>
              {/* {discount > 0 && (
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
              )} */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (5%):</span>
                <span className="font-semibold text-gray-900">
                  ₹{((order.totalAmount - (discountType === 'percentage'
                    ? (order.totalAmount * discount) / 100
                    : parseFloat(discount) || 0)) * TAX_RATE).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Round Off:</span>
                <span className="font-semibold text-gray-900">
                  {(() => {
                    const afterDiscount = order.totalAmount - (discountType === 'percentage'
                      ? (order.totalAmount * discount) / 100
                      : parseFloat(discount) || 0);
                    const taxAmt = afterDiscount * TAX_RATE;
                    const beforeRound = afterDiscount + taxAmt;
                    const roundOff = Math.round(beforeRound) - beforeRound;
                    return `${roundOff >= 0 ? '+' : ''}₹${roundOff.toFixed(2)}`;
                  })()}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Total Amount:</span>
                <span className="font-bold text-xl text-orange-600">
                  ₹{finalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={handleProcessPayment}
              disabled={processing}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
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

            <p className="text-xs text-gray-500 text-center mt-2">
              Payment will be recorded and table will be cleared
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;