import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500 border-opacity-75"></div>
          <p className="text-orange-500 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const roleDashboards = {
      admin: '/admin/dashboard',
      manager: '/manager/dashboard',
      waiter: '/waiter/dashboard',
      cashier: '/cashier/dashboard',
      chef: '/kitchen/dashboard'
    };
    
    return <Navigate to={roleDashboards[user.role] || '/login'} replace />;
  }

  // Authorized - render children
  return children;
};

export default ProtectedRoute;