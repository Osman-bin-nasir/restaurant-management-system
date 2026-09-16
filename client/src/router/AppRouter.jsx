import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const AppLayout = lazy(() => import('../layouts/AppLayout.jsx'));
const AdminLayout = lazy(() => import('../layouts/AdminLayout.jsx'));
const AuthLayout = lazy(() => import('../layouts/AuthLayout.jsx'));
const CashierLayout = lazy(() => import('../layouts/CashierLayout.jsx'));
const KitchenLayout = lazy(() => import('../layouts/KitchenLayout.jsx'));
const WaiterLayout = lazy(() => import('../layouts/WaiterLayout.jsx'));
const ManagerLayout = lazy(() => import('../layouts/ManagerLayout.jsx'));
const Login = lazy(() => import('../pages/Shared/Login.jsx'));
const Register = lazy(() => import('../pages/Shared/Register.jsx'));
const NotFound = lazy(() => import('../pages/Shared/NotFound.jsx'));
const AdminDashboard = lazy(() => import('../pages/Admin/Dashboard.jsx'));
const AdminBranchManagement = lazy(() => import('../pages/Admin/BranchManagement.jsx'));
const AdminMenuManagement = lazy(() => import('../pages/Admin/MenuManagement.jsx'));
const AdminAllOrders = lazy(() => import('../pages/Admin/AllOrders.jsx'));
const AdminTableManagement = lazy(() => import('../pages/Admin/TableManagement.jsx'));
const AdminUserManagement = lazy(() => import('../pages/Admin/UserManagement.jsx'));
const AdminExpenseManagement = lazy(() => import('../pages/Admin/ExpenseManagement.jsx'));
const AdminTableDetails = lazy(() => import('../pages/Admin/TableDetails.jsx'));
const AdminTableDashboard = lazy(() => import('../pages/Admin/TableDashboard.jsx'));
const RevenueReports = lazy(() => import('../pages/Admin/RevenueReports.jsx'));
const RevenueDashboard = lazy(() => import('../pages/Admin/RevenueDashboard.jsx'));
const RolePermissions = lazy(() => import('../pages/Admin/RolePermissions.jsx'));
const PendingOrders = lazy(() => import('../pages/Admin/PendingOrders.jsx'));
const InKitchenOrders = lazy(() => import('../pages/Admin/InKitchenOrders.jsx'));
const ReadyOrders = lazy(() => import('../pages/Admin/ReadyOrders.jsx'));
const DailyReports = lazy(() => import('../pages/Admin/DailyReports.jsx'));
const MonthlyReports = lazy(() => import('../pages/Admin/MonthlyReports.jsx'));
const YearlyReports = lazy(() => import('../pages/Admin/YearlyReports.jsx'));
const ManagerDashboard = lazy(() => import('../pages/Manager/Dashboard.jsx'));
const ManagerMenuManagement = lazy(() => import('../pages/Manager/MenuManagement.jsx'));
const ManagerAllOrders = lazy(() => import('../pages/Manager/AllOrders.jsx'));
const ManagerTableManagement = lazy(() => import('../pages/Manager/TableManagement.jsx'));
const ManagerExpenseManagement = lazy(() => import('../pages/Manager/ExpenseManagement.jsx'));
const ManagerTableDetails = lazy(() => import('../pages/Manager/TableDetails.jsx'));
const ManagerTableDashboard = lazy(() => import('../pages/Manager/TableDashboard.jsx'));
const CashierDashboard = lazy(() => import('../pages/Cashier/CashierDashboard.jsx'));
const Billing = lazy(() => import('../pages/Cashier/Billing.jsx'));
const PendingBills = lazy(() => import('../pages/Cashier/PendingBills.jsx'));
const ParcelBilling = lazy(() => import('../pages/Cashier/ParcelBilling.jsx'));
const KitchenDashboard = lazy(() => import('../pages/Kitchen/KitchenDashboard.jsx'));
const WaiterDashboard = lazy(() => import('../pages/Waiter/WaiterDashboard.jsx'));
const TableOrders = lazy(() => import('../pages/Waiter/TableOrders.jsx'));
const MyOrders = lazy(() => import('../pages/Waiter/MyOrders.jsx'));
const CreateOrder = lazy(() => import('../pages/Waiter/CreateOrder.jsx'));
const WaiterTableDetails = lazy(() => import('../pages/Waiter/WaiterTableDetails.jsx'));

const AppRouter = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Suspense fallback={<Loader />}>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />

        {/* 🔐 Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route
            path="login"
            element={
              user ? (
                <Navigate to={`/${user.role === 'chef' ? 'kitchen' : user.role}/dashboard`} replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="register"
            element={
              user ? (
                <Navigate to={`/${user.role === 'chef' ? 'kitchen' : user.role}/dashboard`} replace />
              ) : (
                <Register />
              )
            }
          />
        </Route>

        {/* 🔒 Protected Routes */}
        <Route path="/" element={<AppLayout />}>
          {/* Admin Routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="table-dashboard" element={<AdminTableDashboard />} />
            <Route path="branches" element={<AdminBranchManagement />} />
            <Route path="menu" element={<AdminMenuManagement />} />
            <Route path="revenue" element={<RevenueReports />} />
            <Route path="revenue-dashboard" element={<RevenueDashboard />} />
            <Route path="roles" element={<RolePermissions />} />
            <Route path="orders" element={<AdminAllOrders />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders/pending" element={<PendingOrders />} />
            <Route path="orders/in-kitchen" element={<InKitchenOrders />} />
            <Route path="orders/ready" element={<ReadyOrders />} />
            <Route path="tables" element={<AdminTableManagement />} />
            <Route path="tables/:id" element={<AdminTableDetails />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="revenue/daily" element={<DailyReports />} />
            <Route path="revenue/monthly" element={<MonthlyReports />} />
            <Route path="revenue/yearly" element={<YearlyReports />} />
            <Route path="expenses" element={<AdminExpenseManagement />} />
          </Route>

          {/* Manager Routes */}
          <Route
            path="manager"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="menu" element={<ManagerMenuManagement />} />
            <Route path="orders" element={<ManagerAllOrders />} />
            <Route path="tables" element={<ManagerTableManagement />} />
            <Route path="table-dashboard" element={<ManagerTableDashboard />} />
            <Route path="tables/:id" element={<ManagerTableDetails />} />
            <Route path="expenses" element={<ManagerExpenseManagement />} />
          </Route>

          {/* Cashier Routes */}
          <Route
            path="cashier"
            element={
              <ProtectedRoute allowedRoles={['cashier']}>
                <CashierLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<CashierDashboard />} />
            <Route path="billing" element={<Billing />} />
            <Route path="parcel-billing" element={<ParcelBilling />} />
            <Route path="pending-bills" element={<PendingBills />} />
          </Route>

          {/* Kitchen Routes */}
          <Route
            path="kitchen"
            element={
              <ProtectedRoute allowedRoles={['chef']}>
                <KitchenLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<KitchenDashboard />} />
          </Route>

          {/* Waiter Routes */}
          <Route
            path="waiter"
            element={
              <ProtectedRoute allowedRoles={['waiter']}>
                <WaiterLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<WaiterDashboard />} />
            <Route path="tables" element={<TableOrders />} />
            <Route path="tables/:id" element={<WaiterTableDetails />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders" element={<MyOrders />} />
          </Route>
        </Route>

        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
