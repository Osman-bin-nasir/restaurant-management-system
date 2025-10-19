
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { CreditCard, DollarSign, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const Billing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = new URLSearchParams(location.search).get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided.');
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/orders/${orderId}`);
        setOrder(data.order);
        setError(null);
      } catch (err) {
        setError('Failed to fetch order details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      const response = await axios.post('/cashier/process-payment', {
        orderId: order._id,
        paymentMethod: paymentMethod,
      });

      if (response.data.success) {
        alert('Payment successful!');
        navigate('/cashier/dashboard');
      } else {
        throw new Error(response.data.message || 'Payment failed.');
      }
    } catch (err) {
      alert('Error processing payment: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading order details...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!order) {
    return <div className="p-6">No order details found.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} />
          Back to Pending Bills
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Process Payment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-3">
            <p><strong>Order #:</strong> {order.orderNumber}</p>
            <p><strong>Customer:</strong> {order.customerName}</p>
            <p><strong>Table:</strong> {order.tableId?.tableNumber || 'N/A'}</p>
            <p><strong>Total Amount:</strong> <span className="font-bold text-2xl text-orange-600">₹{order.totalAmount.toFixed(2)}</span></p>
          </div>

          <div className="mt-6">
            <h3 className="font-bold mb-2">Items</h3>
            <ul className="divide-y divide-gray-200">
              {order.items.map(item => (
                <li key={item._id} className="py-2 flex justify-between">
                  <span>{item.menuItem.name} x {item.quantity}</span>
                  <span>₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
          <h2 className="text-xl font-bold mb-4">Payment Method</h2>
          <div className="space-y-3">
            <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`} >
              <input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="hidden" />
              <DollarSign className="text-green-600" />
              <span className="font-semibold">Cash</span>
            </label>
            <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} >
              <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="hidden" />
              <CreditCard className="text-blue-600" />
              <span className="font-semibold">Card</span>
            </label>
          </div>

          <div className="mt-6">
            <button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {isProcessing ? 'Processing...' : `Pay ₹${order.totalAmount.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
