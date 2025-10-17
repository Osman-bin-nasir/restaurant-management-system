import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';

// Layouts
import AppLayout from './layouts/AppLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Shared Pages
import Login from './pages/Shared/Login';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import MenuManagement from './pages/Admin/MenuManagement';

// Waiter Pages
import WaiterDashboard from './pages/Waiter/WaiterDashboard';

// Cashier Pages
import CashierDashboard from './pages/Cashier/CashierDashboard';

// Kitchen Pages
import KitchenDashboard from './pages/Kitchen/KitchenDashboard';

// Root Redirect Component
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  const roleDashboards = {
    admin: '/admin/dashboard',
    manager: '/admin/dashboard',
    waiter: '/waiter/dashboard',
    cashier: '/cashier/dashboard',
    chef: '/kitchen/dashboard'
  };

  return <Navigate to={roleDashboards[user.role] || '/login'} replace />;
};

// Login Redirect Component
const LoginRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  // If already logged in, redirect to dashboard
  if (user) {
    const roleDashboards = {
      admin: '/admin/dashboard',
      manager: '/admin/dashboard',
      waiter: '/waiter/dashboard',
      cashier: '/cashier/dashboard',
      chef: '/kitchen/dashboard'
    };
    return <Navigate to={roleDashboards[user.role] || '/admin/dashboard'} replace />;
  }

  return <Login />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Root - Redirect based on auth status */}
        <Route path="/" element={<RootRedirect />} />

        {/* Login Route - Redirect if already logged in */}
        <Route path="/login" element={<LoginRedirect />} />

        {/* Protected Routes with Layout */}
        <Route element={<AppLayout />}>
          
          {/* ==================== ADMIN ROUTES ==================== */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/menu" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <MenuManagement />
            </ProtectedRoute>
          } />

          {/* ==================== WAITER ROUTES ==================== */}
          <Route path="/waiter/dashboard" element={
            <ProtectedRoute allowedRoles={['waiter']}>
              <WaiterDashboard />
            </ProtectedRoute>
          } />

          {/* ==================== CASHIER ROUTES ==================== */}
          <Route path="/cashier/dashboard" element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <CashierDashboard />
            </ProtectedRoute>
          } />

          {/* ==================== KITCHEN ROUTES ==================== */}
          <Route path="/kitchen/dashboard" element={
            <ProtectedRoute allowedRoles={['chef']}>
              <KitchenDashboard />
            </ProtectedRoute>
          } />

        </Route>

        {/* Catch all - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;