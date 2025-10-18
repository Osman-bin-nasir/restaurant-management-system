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
  AlertCircle
} from 'lucide-react';
import axios from '../../api/axios';

const CashierDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    totalDiscount: 0,
    averageTransaction: 0
  });
  const [pendingBills, setPendingBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashierData();
  }, []);

  const fetchCashierData = async () => {
    try {
      const [statsRes, billsRes] = await Promise.all([
        axios.get('/cashier/stats/today'),
        axios.get('/cashier/pending-bills')
      ]);

      setStats(statsRes.data?.stats || {
        totalOrders: 0,
        totalAmount: 0,
        totalDiscount: 0,
        averageTransaction: 0
      });

      setPendingBills(billsRes.data?.bills || []);
    } catch (error) {
      console.error('Failed to fetch cashier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = (orderId) => {
    navigate(`/cashier/billing?orderId=${orderId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard size={36} className="text-green-500" />
          Cashier Dashboard 💳
        </h1>
        <p className="text-gray-600 mt-2">Welcome, {user?.name}! Manage payments and billing</p>
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
          <p className="text-3xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</p>
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
              <Receipt className="text-white" size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Discount</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{stats.totalDiscount}</p>
        </div>
      </div>

      {/* Pending Bills */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Pending Bills</h2>
          <button
            onClick={fetchCashierData}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        {pendingBills.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900 mb-2">All Bills Cleared! 🎉</p>
            <p className="text-gray-600">No pending bills to process</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingBills.map((bill) => (
              <div 
                key={bill.orderId} 
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{bill.orderNumber}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        {bill.tableNumber !== 'Parcel' ? (
                          <>📍 Table {bill.tableNumber}</>
                        ) : (
                          <>📦 {bill.tableNumber}</>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(bill.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{bill.totalAmount}</p>
                    <p className="text-xs text-gray-500">{bill.items} items</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    bill.status === 'ready' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {bill.status === 'ready' ? 'Ready for Billing' : 'Served'}
                  </span>
                  
                  {bill.waiterId && (
                    <span className="text-xs text-gray-600">
                      Waiter: {bill.waiterId}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleProcessPayment(bill.orderId)}
                    className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard size={20} />
                    Process Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <button
          onClick={() => navigate('/cashier/create-order')}
          className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xl font-bold mb-2">Create Order</p>
              <p className="text-white/80 text-sm">Create a new order</p>
            </div>
            <Receipt size={32} />
          </div>
        </button>

        <button
          onClick={() => navigate('/cashier/summary')}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xl font-bold mb-2">Daily Summary</p>
              <p className="text-white/80 text-sm">View today's transactions</p>
            </div>
            <TrendingUp size={32} />
          </div>
        </button>

        <button
          onClick={() => navigate('/cashier/pending-bills')}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xl font-bold mb-2">All Pending Bills</p>
              <p className="text-white/80 text-sm">View all unpaid orders</p>
            </div>
            <AlertCircle size={32} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default CashierDashboard;