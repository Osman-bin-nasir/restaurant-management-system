// AdminUserManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Filter, Edit2, Trash2, Shield,
  Lock, Unlock, Eye, EyeOff, RefreshCw, Download,
  AlertCircle, CheckCircle, XCircle, Clock, MapPin,
  Smartphone, Monitor, Activity, Key, Ban, UserX,
  MoreVertical, X, Save, Calendar, Mail, Phone,
  Building2, Briefcase, UserCheck, UserMinus
} from 'lucide-react';
import axios from '../../api/axios';

// ---------------------------------------------------------------------
// API Configuration
// ---------------------------------------------------------------------
// const API_BASE = '/api/admin/users'; // Change to your actual backend URL

const api = {
  async getAll() {
    const res = await axios.get('/users/');
    const data = res.data;
    if (!data.success) throw new Error(data.message || 'Failed to fetch');
    return data.users;
  },
  async create(payload) {
    console.log(payload);
    const res = await axios.post('/users', payload);
    const data = res.data;
    if (!data.success) throw new Error(data.message || 'Create failed');
    return data.user;
  },
  async update(id, payload) {
    const res = await axios.patch(`/users/${id}`, payload);
    const data = res.data;
    if (!data.success) throw new Error(data.message || 'Update failed');
    return data.user;
  },
  async delete(id) {
    const res = await axios.delete(`/users/${id}`);
    const data = res.data;
    if (!data.success) throw new Error(data.message || 'Delete failed');
  },
  async toggleActive(id, active) {
    await axios.patch(`/users/${id}/active`, { isActive: active });
  },
  async toggleLock(id, lock) {
    await axios.patch(`/users/${id}/lock`, { accountLocked: lock });
  },
  async toggle2FA(id, enable) {
    await axios.patch(`/users/${id}/2fa`, { twoFactorEnabled: enable });
  },
  async forcePasswordReset(id) {
    await axios.post(`/users/${id}/reset-password`);
  },
};

// ---------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------
const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create', 'edit', 'details', 'security'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    branchId: '',
    employeeId: '',
    shift: '',
    contact: '',
    isActive: true,
  });

  // -----------------------------------------------------------------
  // Load users
  // -----------------------------------------------------------------
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAll();
      setUsers(data);
    } catch (err) {
      alert('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // Filtering
  // -----------------------------------------------------------------
  const filteredUsers = users.filter(user => {
    if (!user) return false;

    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      (user.name && user.name.toLowerCase().includes(searchTermLower)) ||
      (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
      (user.employeeId && String(user.employeeId).toLowerCase().includes(searchTermLower));

    const matchesRole = filterRole === 'all' || (user.role && user.role.name === filterRole);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    locked: users.filter(u => u.accountLocked).length,
    unverified: users.filter(u => !u.isAccountVerified).length,
  };

  const rolesMap = new Map();
  const branchesMap = new Map();
  users.forEach(user => {
    if (user.role && user.role._id && user.role.name) {
      rolesMap.set(user.role._id, user.role.name);
    }
    if (user.branchId && user.branchId._id && user.branchId.name) {
      branchesMap.set(user.branchId._id, user.branchId.name);
    }
  });
  const rolesList = Array.from(rolesMap.entries());
  const branchesList = Array.from(branchesMap.entries());

  // -----------------------------------------------------------------
  // Form handlers
  // -----------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // -----------------------------------------------------------------
  // Modal openers
  // -----------------------------------------------------------------
  const openCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      roleId: '',
      branchId: '',
      employeeId: '',
      shift: '',
      contact: '',
      isActive: true,
    });
    setModalType('create');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.role._id,
      branchId: user.branchId._id,
      employeeId: user.employeeId,
      shift: user.shift,
      contact: user.contact || '',
      isActive: user.isActive,
    });
    setModalType('edit');
    setShowModal(true);
  };

  const openDetails = (user) => {
    setSelectedUser(user);
    setModalType('details');
    setShowModal(true);
  };

  const openSecurity = (user) => {
    setSelectedUser(user);
    setModalType('security');
    setShowModal(true);
  };

  // -----------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === 'create') {
        const payload = {
          ...formData,
          role: formData.roleId,
          branchId: formData.branchId,
        };
        const newUser = await api.create(payload);
        setUsers(prev => [...prev, newUser]);
      } else if (modalType === 'edit' && selectedUser) {
        const payload = {
          name: formData.name,
          email: formData.email,
          role: formData.roleId,
          branchId: formData.branchId,
          employeeId: formData.employeeId,
          shift: formData.shift,
          contact: formData.contact,
          isActive: formData.isActive,
        };
        const updated = await api.update(selectedUser._id, payload);
        setUsers(prev => prev.map(u => (u._id === selectedUser._id ? updated : u)));
      }
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(userToDelete._id);
      setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.toggleActive(user._id, !user.isActive);
      setUsers(prev =>
        prev.map(u => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (err) {
      alert('Failed to toggle active status');
    }
  };

  const toggleLock = async (user) => {
    const newLocked = !(user.accountLocked ?? false);
    try {
      await api.toggleLock(user._id, newLocked);
      setUsers(prev =>
        prev.map(u => (u._id === user._id ? { ...u, accountLocked: newLocked } : u))
      );
    } catch (err) {
      alert('Failed to toggle lock');
    }
  };

  const toggle2FA = async (user) => {
    const new2FA = !(user.twoFactorEnabled ?? false);
    try {
      await api.toggle2FA(user._id, new2FA);
      setUsers(prev =>
        prev.map(u => (u._id === user._id ? { ...u, twoFactorEnabled: new2FA } : u))
      );
    } catch (err) {
      alert('Failed to toggle 2FA');
    }
  };

  const forcePasswordReset = async (user) => {
    try {
      await api.forcePasswordReset(user._id);
      alert(`Password reset email sent to ${user.email}`);
    } catch (err) {
      alert('Failed to send reset email');
    }
  };

  // -----------------------------------------------------------------
  // UI Helpers
  // -----------------------------------------------------------------
  const getRoleBadgeColor = (roleName) => {
    const colors = {
      admin: 'bg-red-100 text-red-700 border border-red-200',
      manager: 'bg-blue-100 text-blue-700 border border-blue-200',
      cashier: 'bg-green-100 text-green-700 border border-green-200',
      waiter: 'bg-purple-100 text-purple-700 border border-purple-200',
      chef: 'bg-orange-100 text-orange-700 border border-orange-200',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (user) => {
    if (user.accountLocked) {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1"><Ban size={12} />Locked</span>;
    }
    if (!user.isActive) {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1"><UserX size={12} />Inactive</span>;
    }
    if (!user.isAccountVerified) {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1"><AlertCircle size={12} />Unverified</span>;
    }
    return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1"><CheckCircle size={12} />Active</span>;
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users size={36} className="text-orange-500" />
              User Management
            </h1>
            <p className="text-gray-600 mt-2">Manage users, roles, and security settings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            <button
              onClick={() => alert('Export functionality')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Download size={18} />
              Export
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-lg"
            >
              <Plus size={18} />
              Add User
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace('unverified', 'Unverified')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                {key === 'total' && <Users className="text-blue-500" size={28} />}
                {key === 'active' && <UserCheck className="text-green-500" size={28} />}
                {key === 'inactive' && <UserMinus className="text-gray-500" size={28} />}
                {key === 'locked' && <Ban className="text-red-500" size={28} />}
                {key === 'unverified' && <AlertCircle className="text-yellow-500" size={28} />}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, employee ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="waiter">Waiter</option>
                <option value="chef">Chef</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <RefreshCw className="animate-spin text-orange-500" size={32} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Branch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Shift</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Security</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.contact && <p className="text-xs text-gray-500">{user.contact}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role.name)}`}>
                        {user.role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user)}
                      {(user.failedLoginAttempts ?? 0) > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {user.failedLoginAttempts} failed attempt{(user.failedLoginAttempts ?? 0) > 1 ? 's' : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm text-gray-900">{user.employeeId}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.branchId.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">{user.shift}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {(user.twoFactorEnabled ?? false) ? (
                          <span className="text-xs text-green-600 flex items-center gap-1"><Shield size={12} />2FA On</span>
                        ) : (
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Shield size={12} />2FA Off</span>
                        )}
                        <span className="text-xs text-gray-600">
                          Timeout: {(user.sessionTimeout ?? 30)}m
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetails(user)} title="View" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={16} /></button>
                        <button onClick={() => openEdit(user)} title="Edit" className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => openSecurity(user)} title="Security" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"><Shield size={16} /></button>
                        <button onClick={() => toggleActive(user)} title={user.isActive ? 'Deactivate' : 'Activate'} className={`p-2 ${user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} rounded-lg`}>
                          {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button onClick={() => handleDelete(user)} title="Delete" className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (modalType === 'create' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalType === 'create' ? 'Create New User' : 'Edit User'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>

                {modalType === 'create' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                    <input required type="password" name="password" value={formData.password} onChange={handleInputChange} minLength={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input name="contact" value={formData.contact} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                  <select required name="roleId" value={formData.roleId} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Select Role</option>
                    {rolesList.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Branch *</label>
                  <select required name="branchId" value={formData.branchId} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Select Branch</option>
                    {branchesList.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
                  <input name="employeeId" value={formData.employeeId} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Shift</label>
                  <select name="shift" value={formData.shift} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Select Shift</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Account Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2">
                  <Save size={18} />
                  {modalType === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showModal && modalType === 'details' && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><p className="text-sm text-gray-600">Name</p><p className="font-semibold">{selectedUser.name}</p></div>
                <div><p className="text-sm text-gray-600">Email</p><p className="font-semibold">{selectedUser.email}</p></div>
                <div><p className="text-sm text-gray-600">Phone</p><p className="font-semibold">{selectedUser.contact || '—'}</p></div>
                <div><p className="text-sm text-gray-600">Role</p><p className="font-semibold capitalize">{selectedUser.role.name}</p></div>
                <div><p className="text-sm text-gray-600">Employee ID</p><p className="font-semibold">{selectedUser.employeeId}</p></div>
                <div><p className="text-sm text-gray-600">Branch</p><p className="font-semibold">{selectedUser.branchId.name}</p></div>
                <div><p className="text-sm text-gray-600">Shift</p><p className="font-semibold capitalize">{selectedUser.shift}</p></div>
                <div><p className="text-sm text-gray-600">Status</p>{getStatusBadge(selectedUser)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {showModal && modalType === 'security' && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Require a second verification step</p>
                </div>
                <button
                  onClick={() => toggle2FA(selectedUser)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${(selectedUser.twoFactorEnabled ?? false) ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${(selectedUser.twoFactorEnabled ?? false) ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Account Lock</p>
                  <p className="text-sm text-gray-600">Lock after failed attempts</p>
                </div>
                <button
                  onClick={() => toggleLock(selectedUser)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${(selectedUser.accountLocked ?? false) ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${(selectedUser.accountLocked ?? false) ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={selectedUser.sessionTimeout ?? 30}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 30;
                    setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, sessionTimeout: val } : u));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={() => forcePasswordReset(selectedUser)}
                  className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <Key size={18} />
                  Force Password Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full. p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-600" size={28} />
              <h3 className="text-lg font-semibold">Delete User?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Permanently delete <strong>{userToDelete.name}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;