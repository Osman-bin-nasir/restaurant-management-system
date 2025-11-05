import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

// Lazy-load icons so the H1 text can paint immediately.
const Lucide = () => import('lucide-react');
const Table2 = lazy(() => Lucide().then(m => ({ default: m.Table2 })));
const Users = lazy(() => Lucide().then(m => ({ default: m.Users })));
const CheckCircle = lazy(() => Lucide().then(m => ({ default: m.CheckCircle })));
const Clock = lazy(() => Lucide().then(m => ({ default: m.Clock })));
const RefreshCw = lazy(() => Lucide().then(m => ({ default: m.RefreshCw })));
const Search = lazy(() => Lucide().then(m => ({ default: m.Search })));

// Fixed-size icon fallback so layout doesn't shift when icons load.
const IconShell = ({ size = 32, className = '' }) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{
      inlineSize: size + 24, // padding box mimic
      blockSize: size + 24,
      background:
        'linear-gradient(to bottom right, rgba(234,88,12,1), rgba(234,88,12,0.7))',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    }}
  />
);

const WaiterTableManagement = () => {
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'available' | 'occupied' | 'reserved'
  const navigate = useNavigate();

  // Helpers
  const getTableStatusColor = (status) => {
    const colors = {
      available: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:shadow-green-200',
      occupied: 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300 hover:shadow-orange-200',
      reserved: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 hover:shadow-blue-200',
    };
    return colors[status] || colors.available;
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: { bg: 'bg-green-100', text: 'text-green-700', label: 'Available', Icon: CheckCircle },
      occupied: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Occupied', Icon: Users },
      reserved: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Reserved', Icon: Clock },
    };
    const { bg, text, label, Icon } = badges[status] || badges.available;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        <Suspense fallback={<span className="inline-block w-3 h-3 rounded-full bg-current opacity-30" />}>
          <Icon size={12} />
        </Suspense>
        {label}
      </span>
    );
  };

  const handleTableClick = (table) => {
    navigate(`/waiter/tables/${table._id}`);
  };

  // Non-blocking data fetch: let the shell paint first.
  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setIsFetching(true);
        const { data } = await axios.get('/tables/', { signal: controller.signal });
        setTables(data.tables || []);
        setStats(data.stats || null);
      } catch (error) {
        if (error.name !== 'CanceledError' && error.message !== 'canceled') {
          console.error('Error fetching data:', error);
        }
      } finally {
        setIsFetching(false);
      }
    };

    // Defer to next frame so first paint can happen (helps LCP).
    const id = requestAnimationFrame(fetchData);
    return () => {
      cancelAnimationFrame(id);
      controller.abort();
    };
  }, []);

  const filteredTables = tables.filter((table) => {
    const matchesSearch = String(table.tableNumber ?? '').includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || table.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Quick refresh handler (doesn't block shell)
  const refresh = async () => {
    setIsFetching(true);
    try {
      const { data } = await axios.get('/tables/');
      setTables(data.tables || []);
      setStats(data.stats || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            {/* LCP element: paints immediately (icon is lazy with fixed-size fallback). */}
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Suspense fallback={<IconShell />}>
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-2xl shadow-lg">
                  <Table2 size={32} className="text-white" />
                </div>
              </Suspense>
              Table Management (Waiter View)
            </h1>
            <p className="text-gray-600 text-lg">View and manage tables and orders</p>
          </div>

          <Suspense fallback={<div className="h-11 w-36 rounded-xl bg-gray-200 animate-pulse" />}>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg hover:shadow-xl"
            >
              <RefreshCw size={18} />
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </button>
          </Suspense>
        </div>

        {/* Stats row — shows skeletons during initial/ongoing fetch */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Tables */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tables</p>
                {stats ? (
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                ) : (
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                )}
              </div>
              <Suspense fallback={<div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />}>
                <Table2 className="text-blue-500" size={32} />
              </Suspense>
            </div>
          </div>

          {/* Available */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available</p>
                {stats ? (
                  <p className="text-3xl font-bold text-green-600">{stats.available}</p>
                ) : (
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                )}
              </div>
              <Suspense fallback={<div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />}>
                <CheckCircle className="text-green-500" size={32} />
              </Suspense>
            </div>
          </div>

          {/* Occupied */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Occupied</p>
                {stats ? (
                  <p className="text-3xl font-bold text-orange-600">{stats.occupied}</p>
                ) : (
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                )}
              </div>
              <Suspense fallback={<div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />}>
                <Users className="text-orange-500" size={32} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Suspense fallback={null}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </Suspense>
              <input
                type="text"
                placeholder="Search by table number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                aria-label="Search by table number"
              />
            </div>

            {/* Status Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterStatus('available')}
                className={`flex-1 px-4 py-3 rounded-xl border transition font-medium flex items-center justify-center gap-2 hover:cursor-pointer
                  ${filterStatus === 'available'
                    ? 'bg-green-600 text-white border-green-600 shadow'
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:shadow-green-200'}`}
                aria-pressed={filterStatus === 'available'}
              >
                <Suspense fallback={<span className="w-4 h-4 rounded-full bg-green-500/40" />}>
                  <CheckCircle size={18} />
                </Suspense>
                Available
                {typeof stats?.available === 'number' && (
                  <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${filterStatus === 'available' ? 'bg-white/20' : 'bg-green-100 text-green-700'}`}>
                    {stats.available}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('occupied')}
                className={`flex-1 px-4 py-3 rounded-xl border transition font-medium flex items-center justify-center gap-2 hover:cursor-pointer
                  ${filterStatus === 'occupied'
                    ? 'bg-orange-600 text-white border-orange-600 shadow'
                    : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300 hover:shadow-orange-200'}`}
                aria-pressed={filterStatus === 'occupied'}
              >
                <Suspense fallback={<span className="w-4 h-4 rounded-full bg-orange-500/40" />}>
                  <Users size={18} />
                </Suspense>
                Occupied
                {typeof stats?.occupied === 'number' && (
                  <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${filterStatus === 'occupied' ? 'bg-white/20' : 'bg-orange-100 text-orange-700'}`}>
                    {stats.occupied}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`flex-1 px-4 py-3 rounded-xl border transition font-medium flex items-center justify-center gap-2 hover:cursor-pointer
                  ${filterStatus === 'all'
                    ? 'bg-blue-500 text-white border-gray-700 shadow'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 hover:shadow-blue-200'}`}
                aria-pressed={filterStatus === 'all'}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table cards — skeletons first, then data. Use content-visibility to reduce initial work. */}
      <div className="[content-visibility:auto] [contain-intrinsic-size:1px_5000px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {(isFetching && tables.length === 0)
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 bg-white rounded-2xl border-2 border-gray-100 shadow-sm animate-pulse" />
            ))
          : filteredTables.map((table) => (
              <div
                key={table._id}
                onClick={() => handleTableClick(table)}
                className={`${getTableStatusColor(table.status)} border-2 rounded-2xl p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden group`}
              >
                <div className="absolute inset-0 opacity-5">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white rounded-full p-2 shadow-lg">
                      <Suspense fallback={<div className="w-5 h-5 rounded-full bg-gray-300" />}>
                        <Table2 size={20} className="text-gray-700" />
                      </Suspense>
                    </div>
                    {getStatusBadge(table.status)}
                  </div>

                  <div className="text-center mb-3">
                    <p className="text-xs text-gray-600 mb-0">Table</p>
                    <p className="text-4xl font-bold text-gray-900">{table.tableNumber}</p>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-3">
                    <Suspense fallback={<span className="w-3 h-3 rounded-full bg-gray-300" />}>
                      <Users size={14} />
                    </Suspense>
                    <span className="text-xs font-medium">{table.capacity} Seats</span>
                  </div>

                  {table.currentOrderId && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Order:</span>
                        <span className="font-mono font-semibold text-gray-900">
                          {table.currentOrderId.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Amount:</span>
                        <span className="text-sm font-bold text-orange-600">₹{table.currentOrderId.totalAmount}</span>
                      </div>
                    </div>
                  )}

                  {table.status === 'available' && (
                    <div className="mt-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-1 px-3 rounded-xl text-center text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to View Details
                    </div>
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default WaiterTableManagement;
