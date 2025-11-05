import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

// ---- Lazy icons so text paints immediately (LCP) ----
const Lucide = () => import('lucide-react');
const Table2 = lazy(() => Lucide().then(m => ({ default: m.Table2 })));
const ShoppingBag = lazy(() => Lucide().then(m => ({ default: m.ShoppingBag })));
const Clock = lazy(() => Lucide().then(m => ({ default: m.Clock })));
const CheckCircle = lazy(() => Lucide().then(m => ({ default: m.CheckCircle })));
const AlertCircle = lazy(() => Lucide().then(m => ({ default: m.AlertCircle })));
const Plus = lazy(() => Lucide().then(m => ({ default: m.Plus })));
const ChevronRight = lazy(() => Lucide().then(m => ({ default: m.ChevronRight })));

// Fixed-size visual placeholder to prevent layout shift while icons load
const IconShell = ({ size = 32, rounded = 'rounded-xl', className = '' }) => (
  <div
    className={`${rounded} ${className}`}
    style={{
      inlineSize: size + 24,
      blockSize: size + 24,
      background: 'rgba(0,0,0,0.08)'
    }}
  />
);

const WaiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ myOrders: 0, activeOrders: 0, completedToday: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  // --- Helpers ---
  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-blue-100 text-blue-700',
      'in-kitchen': 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      served: 'bg-purple-100 text-purple-700',
      paid: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const sameLocalDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

  // --- Data fetch (deferred to allow first paint = better LCP) ---
  useEffect(() => {
    if (!user?.id) return;

    const controller = new AbortController();

    const fetchWaiterData = async () => {
      try {
        setIsFetching(true);
        const { data } = await axios.get('/orders', {
          params: { waiterId: user.id },
          signal: controller.signal,
        });

        const allOrders = data?.orders || [];
        const activeOrders = allOrders.filter((o) => ['placed', 'in-kitchen', 'ready'].includes(o.status));
        const completedToday = allOrders.filter((o) => o.status === 'paid' && sameLocalDay(o.createdAt, Date.now()));

        setStats({
          myOrders: allOrders.length,
          activeOrders: activeOrders.length,
          completedToday: completedToday.length,
        });

        setRecentOrders(allOrders.slice(0, 5));
      } catch (error) {
        if (error.name !== 'CanceledError' && error.message !== 'canceled') {
          console.error('Failed to fetch waiter data:', error);
        }
      } finally {
        setIsFetching(false);
      }
    };

    const id = requestAnimationFrame(fetchWaiterData);
    return () => {
      cancelAnimationFrame(id);
      controller.abort();
    };
  }, [user?.id]);

  const refresh = async () => {
    if (!user?.id) return;
    setIsFetching(true);
    try {
      const { data } = await axios.get('/orders', { params: { waiterId: user.id } });
      const allOrders = data?.orders || [];
      const activeOrders = allOrders.filter((o) => ['placed', 'in-kitchen', 'ready'].includes(o.status));
      const completedToday = allOrders.filter((o) => o.status === 'paid' && sameLocalDay(o.createdAt, Date.now()));
      setStats({ myOrders: allOrders.length, activeOrders: activeOrders.length, completedToday: completedToday.length });
      setRecentOrders(allOrders.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header (LCP target): render immediately; icons are lazy with fixed-size fallbacks */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome{user?.name ? `, ${user.name}` : ''}! 🍽️
        </h1>
        <p className="text-gray-600 mt-2">Manage your tables and orders efficiently</p>

        <div className="mt-4">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition shadow"
          >
            <Suspense fallback={<IconShell size={18} rounded="rounded-lg" />}>
              <Clock size={18} />
            </Suspense>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Quick Stats (skeletons while fetching) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* My Orders */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-4 rounded-xl">
              <Suspense fallback={<IconShell />}>
                <ShoppingBag className="text-white" size={28} />
              </Suspense>
            </div>
            <div>
              <p className="text-gray-600 text-sm">My Orders</p>
              {isFetching ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.myOrders}</p>
              )}
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-4 rounded-xl">
              <Suspense fallback={<IconShell />}>
                <Clock className="text-white" size={28} />
              </Suspense>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active Orders</p>
              {isFetching ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
              )}
            </div>
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-4 rounded-xl">
              <Suspense fallback={<IconShell />}>
                <CheckCircle className="text-white" size={28} />
              </Suspense>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Completed Today</p>
              {isFetching ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.completedToday}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => navigate('/waiter/tables')}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <Suspense fallback={<IconShell />}>
                <Table2 size={32} />
              </Suspense>
            </div>
            <div className="text-left">
              <p className="text-xl font-bold">View Tables</p>
              <p className="text-white/80 text-sm">Check table availability</p>
            </div>
          </div>
          <Suspense fallback={<IconShell />}>
            <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </Suspense>
        </button>

        <button
          onClick={() => navigate('/waiter/tables')}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <Suspense fallback={<IconShell />}>
                <Plus size={32} />
              </Suspense>
            </div>
            <div className="text-left">
              <p className="text-xl font-bold">New Order</p>
              <p className="text-white/80 text-sm">Create a new order</p>
            </div>
          </div>
          <Suspense fallback={<IconShell />}>
            <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </Suspense>
        </button>
      </div>

      {/* Recent Orders (skeletons + content-visibility for cheaper initial layout) */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>

        <div className="[content-visibility:auto] [contain-intrinsic-size:1px_800px] space-y-3">
          {isFetching && recentOrders.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
              </div>
            ))
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Suspense fallback={<IconShell size={48} rounded="rounded-full" className="mx-auto mb-3" />}>
                <AlertCircle size={48} className="text-gray-400 mx-auto mb-3" />
              </Suspense>
              <p className="text-gray-600">No orders yet. Start taking orders!</p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <Suspense fallback={<div className="w-5 h-5 rounded bg-gray-200" />}>
                      <ShoppingBag size={20} className="text-orange-500" />
                    </Suspense>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : 'Parcel'} • {order.items?.length || 0} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard;
