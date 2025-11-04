import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Receipt, RefreshCw, Search } from 'lucide-react';
import axios from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';

const PendingBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const socket = useSocket();

  const fetchPendingBills = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/cashier/pending-bills');
      setBills(data.bills || []);
    } catch (error) {
      console.error('Failed to fetch pending bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBills();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleBillPending = (newBill) => {
        const mappedBill = {
          orderId: newBill._id,
          orderNumber: newBill.orderNumber,
          tableNumber: newBill.tableId?.tableNumber || "Parcel",
          customerName: newBill.customerName,
          type: newBill.type,
          items: newBill.items.map(item => ({
            name: item.menuItem?.name,
            quantity: item.quantity,
            price: item.menuItem?.price
          })),
          totalAmount: newBill.totalAmount,
          status: newBill.status,
          waiterId: newBill.waiterId?.name,
          createdAt: newBill.createdAt
        };

        setBills((prevBills) => {
          const existingBill = prevBills.find(bill => bill.orderId === mappedBill.orderId);
          if (existingBill) {
            return prevBills.map(bill => bill.orderId === mappedBill.orderId ? mappedBill : bill);
          } else {
            return [mappedBill, ...prevBills];
          }
        });
      };

      const handleBillRemoved = ({ orderId }) => {
        setBills((prevBills) => prevBills.filter(bill => bill.orderId !== orderId));
      };

      const handleOrderUpdated = (updatedOrder) => {
        if (updatedOrder.status === 'served') {
          handleBillPending(updatedOrder);
        } else {
          handleBillRemoved({ orderId: updatedOrder._id });
        }
      };

      socket.on('billRemoved', handleBillRemoved);
      socket.on('orderUpdated', handleOrderUpdated);

      return () => {
        socket.off('billRemoved', handleBillRemoved);
        socket.off('orderUpdated', handleOrderUpdated);
      };
    }
  }, [socket]);

  const filteredBills = bills.filter(bill =>
    bill.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProcessPayment = (orderId) => {
    navigate(`/cashier/billing?orderId=${orderId}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Bills</h1>
          <p className="text-gray-600 mt-1">Orders ready for payment</p>
        </div>
        <button
          onClick={fetchPendingBills}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="text-center py-12">
          <Receipt size={64} className="text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">No Pending Bills</p>
          <p className="text-gray-600">All due payments have been cleared.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBills.map(bill => (
            <div key={bill.orderId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-lg font-bold text-gray-900">{bill.orderNumber}</p>
                    <p className="text-sm text-gray-600">{bill.customerName}</p>
                  </div>
                  <div className={`text-xs font-bold px-3 py-1 rounded-full ${bill.type === 'dine-in' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {bill.type}
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <p className="text-2xl font-bold text-orange-600">₹{bill.totalAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{bill.items.length} items</p>
                </div>
              </div>

              <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
                <button
                  onClick={() => handleProcessPayment(bill.orderId)}
                  className="w-full bg-green-500 text-white py-2.5 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <CreditCard size={18} />
                  Process Payment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingBills;
