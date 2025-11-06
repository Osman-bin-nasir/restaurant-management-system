import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import CashierLayout from '../layouts/CashierLayout.jsx';
import KitchenLayout from '../layouts/KitchenLayout.jsx';
import WaiterLayout from '../layouts/WaiterLayout.jsx';
import ManagerLayout from '../layouts/ManagerLayout.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

// Auth Pages
import Login from '../pages/Shared/Login.jsx';
import Register from '../pages/Shared/Register.jsx';
import NotFound from '../pages/Shared/NotFound.jsx';

// Admin Pages
import AdminDashboard from '../pages/Admin/Dashboard.jsx';
import AdminBranchManagement from '../pages/Admin/BranchManagement.jsx';
import AdminMenuManagement from '../pages/Admin/MenuManagement.jsx';
import AdminAllOrders from '../pages/Admin/AllOrders.jsx';
import AdminTableManagement from '../pages/Admin/TableManagement.jsx';
import AdminUserManagement from '../pages/Admin/UserManagement.jsx';
import AdminExpenseManagement from '../pages/Admin/ExpenseManagement.jsx';
import AdminTableDetails from '../pages/Admin/TableDetails.jsx';
import AdminTableDashboard from '../pages/Admin/TableDashboard.jsx';
import RevenueReports from '../pages/Admin/RevenueReports.jsx';
import RevenueDashboard from '../pages/Admin/RevenueDashboard.jsx';
import RolePermissions from '../pages/Admin/RolePermissions.jsx';
import PendingOrders from '../pages/Admin/PendingOrders.jsx';
import InKitchenOrders from '../pages/Admin/InKitchenOrders.jsx';
import ReadyOrders from '../pages/Admin/ReadyOrders.jsx';
import DailyReports from '../pages/Admin/DailyReports.jsx';
import MonthlyReports from '../pages/Admin/MonthlyReports.jsx';
import YearlyReports from '../pages/Admin/YearlyReports.jsx';

// Manager Pages
import ManagerDashboard from '../pages/Manager/Dashboard.jsx';
import ManagerMenuManagement from '../pages/Manager/MenuManagement.jsx';
import ManagerAllOrders from '../pages/Manager/AllOrders.jsx';
import ManagerTableManagement from '../pages/Manager/TableManagement.jsx';
import ManagerExpenseManagement from '../pages/Manager/ExpenseManagement.jsx';
import ManagerTableDetails from '../pages/Manager/TableDetails.jsx';
import ManagerTableDashboard from '../pages/Manager/TableDashboard.jsx';

// Cashier Pages
import CashierDashboard from '../pages/Cashier/CashierDashboard.jsx';
import Billing from '../pages/Cashier/Billing.jsx';
import PendingBills from '../pages/Cashier/PendingBills.jsx';

// Kitchen Pages
import KitchenDashboard from '../pages/Kitchen/KitchenDashboard.jsx';

// Waiter Pages
import WaiterDashboard from '../pages/Waiter/WaiterDashboard.jsx';
import TableOrders from '../pages/Waiter/TableOrders.jsx';
import MyOrders from '../pages/Waiter/MyOrders.jsx';
import CreateOrder from '../pages/Waiter/CreateOrder.jsx';
import WaiterTableDetails from '../pages/Waiter/WaiterTableDetails.jsx';
import ParcelBilling from '../pages/Cashier/ParcelBilling.jsx';
import TableDashboard from '../pages/Admin/TableDashboard.jsx';

const AppRouter = () => {
  const { user } = useAuth();

  return (
    <Router>
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
    </Router>
  );
};

export default AppRouter;
