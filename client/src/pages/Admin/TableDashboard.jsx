import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Search, RefreshCw, Grid3x3, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import axios from '../../api/axios.js';

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  const colors = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border-l-4 ${colors[type]} min-w-80`}>
      {icons[type]}
      <span className="font-medium flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X size={18} />
      </button>
    </div>
  );
};

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    branchId: ''
  });

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Fetch all tables
  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/tables');
      setTables(response.data.tables || []);
      showToast('Tables refreshed successfully', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch tables';
      showToast(errorMsg, 'error');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFetch = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/tables');
        setTables(response.data.tables || []);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch tables';
        showToast(errorMsg, 'error');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    initialFetch();
  }, []);

  // Create table
  const handleCreateTable = async () => {
    if (!formData.tableNumber || !formData.capacity) {
      showToast('Table number and capacity are required', 'error');
      return;
    }

    if (parseInt(formData.capacity) < 1 || parseInt(formData.capacity) > 20) {
      showToast('Capacity must be between 1 and 20', 'error');
      return;
    }

    try {
      const response = await axios.post('/tables', {
        tableNumber: formData.tableNumber,
        capacity: parseInt(formData.capacity),
        ...(formData.branchId && { branchId: formData.branchId })
      });

      setTables([...tables, response.data.table]);
      setShowCreateModal(false);
      setFormData({ tableNumber: '', capacity: '', branchId: '' });
      showToast(`Table ${formData.tableNumber} created successfully`, 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create table';
      
      // Handle conflict error specifically
      if (err.response?.status === 409 || errorMsg.includes('already exists')) {
        showToast(`Table ${formData.tableNumber} already exists in this branch`, 'error');
      } else {
        showToast(errorMsg, 'error');
      }
      console.error('Create error:', err);
    }
  };

  // Delete table
  const handleDeleteTable = async (tableId, tableNumber) => {
    try {
      await axios.delete(`/tables/${tableId}`);
      setTables(tables.filter(t => t._id !== tableId));
      showToast(`Table ${tableNumber} deleted successfully`, 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete table';
      showToast(errorMsg, 'error');
      console.error('Delete error:', err);
    }
  };

  // Confirmation for delete
  const confirmDelete = (tableId, tableNumber, status) => {
    if (status === 'occupied') {
      showToast('Cannot delete occupied table', 'error');
      return;
    }
    setDeleteConfirm({ tableId, tableNumber });
  };

  const executeDelete = () => {
    if (deleteConfirm) {
      handleDeleteTable(deleteConfirm.tableId, deleteConfirm.tableNumber);
      setDeleteConfirm(null);
    }
  };

  // Filter tables
  const filteredTables = tables.filter(table => {
    const matchesSearch = table.tableNumber.toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    occupancy: tables.length > 0 ? ((tables.filter(t => t.status === 'occupied').length / tables.length) * 100).toFixed(0) : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Loading tables...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-2xl">
              <Grid3x3 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
              <p className="text-gray-600">Manage restaurant tables and orders</p>
            </div>
          </div>
          <button
            onClick={fetchTables}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-lg"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm">Total Tables</div>
                <div className="text-4xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Grid3x3 size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm">Available</div>
                <div className="text-4xl font-bold text-green-600">{stats.available}</div>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm">Occupied</div>
                <div className="text-4xl font-bold text-orange-600">{stats.occupied}</div>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <Users size={28} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <div className="text-orange-100 text-sm">Occupancy</div>
                <div className="text-4xl font-bold">{stats.occupancy}%</div>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-md mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by table number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
          >
            <Plus size={20} />
            Add Table
          </button>
        </div>

        {/* Tables Grid */}
        {filteredTables.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md">
            <p className="text-gray-500 text-lg">No tables found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTables.map((table) => (
              <div
                key={table._id}
                className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden transition-all hover:shadow-xl ${
                  table.status === 'available' ? 'border-green-200' : 'border-orange-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gray-100 p-3 rounded-xl">
                      <Grid3x3 size={24} className="text-gray-700" />
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                      table.status === 'available' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      <Users size={14} />
                      {table.status === 'available' ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600">Table</div>
                    <div className="text-5xl font-bold text-gray-900">{table.tableNumber}</div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-4 pb-4 border-b">
                    <Users size={18} />
                    <span className="font-medium">{table.capacity} Seats</span>
                  </div>

                  {table.currentOrderId && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">Order:</div>
                      <div className="text-sm font-mono text-gray-800">{table.currentOrderId.orderNumber}</div>
                      {table.currentOrderId.totalAmount && (
                        <div className="text-lg font-bold text-orange-600 mt-1">
                          ₹{table.currentOrderId.totalAmount}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => confirmDelete(table._id, table.tableNumber, table.status)}
                    disabled={table.status === 'occupied'}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors font-medium ${
                      table.status === 'occupied'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    <Trash2 size={18} />
                    {table.status === 'occupied' ? 'Cannot Delete' : 'Delete Table'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Table Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-6">Create New Table</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Number *
                  </label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({...formData, tableNumber: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., 1, 2, A1, B2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Number of seats"
                    min="1"
                    max="20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.branchId}
                    onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Leave empty for default branch"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ tableNumber: '', capacity: '', branchId: '' });
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTable}
                    className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
                  >
                    Create Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
                <h2 className="text-xl font-bold">Confirm Delete</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-bold">Table {deleteConfirm.tableNumber}</span>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableManagement;