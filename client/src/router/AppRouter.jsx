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
import BranchManagement from '../pages/Admin/BranchManagement.jsx';
import MenuManagement from '../pages/Admin/MenuManagement.jsx';
import RevenueReports from '../pages/Admin/RevenueReports.jsx';
import RolePermissions from '../pages/Admin/RolePermissions.jsx';
import AllOrders from '../pages/Admin/AllOrders.jsx';
import PendingOrders from '../pages/Admin/PendingOrders.jsx';
import InKitchenOrders from '../pages/Admin/InKitchenOrders.jsx';
import ReadyOrders from '../pages/Admin/ReadyOrders.jsx';
import TableManagement from '../pages/Admin/TableManagement.jsx';
import UserManagement from '../pages/Admin/UserManagement.jsx';
import DailyReports from '../pages/Admin/DailyReports.jsx';
import MonthlyReports from '../pages/Admin/MonthlyReports.jsx';
import YearlyReports from '../pages/Admin/YearlyReports.jsx';
import ManagerDashboard from '../pages/Manager/ManagerDashboard.jsx';

// Cashier Pages
import CashierDashboard from '../pages/Cashier/CashierDashboard.jsx';
import Billing from '../pages/Cashier/Billing.jsx';
import PendingBills from '../pages/Cashier/PendingBills.jsx';
import DailySummary from '../pages/Cashier/DailySummary.jsx';
import CashierCreateOrder from '../pages/Cashier/CashierCreateOrder.jsx';

// Kitchen Pages
import KitchenDashboard from '../pages/Kitchen/KitchenDashboard.jsx';
import OrderQueue from '../pages/Kitchen/OrderQueue.jsx';
import MenuItems from '../pages/Kitchen/MenuItems.jsx';

// Waiter Pages
import WaiterDashboard from '../pages/Waiter/WaiterDashboard.jsx';
import TableOrders from '../pages/Waiter/TableOrders.jsx';
import MyOrders from '../pages/Waiter/MyOrders.jsx';
import CreateOrder from '../pages/Waiter/CreateOrder.jsx';

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
            <Route path="branches" element={<BranchManagement />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="revenue" element={<RevenueReports />} />
            <Route path="roles" element={<RolePermissions />} />
            <Route path="orders" element={<AllOrders />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders/pending" element={<PendingOrders />} />
            <Route path="orders/in-kitchen" element={<InKitchenOrders />} />
            <Route path="orders/ready" element={<ReadyOrders />} />
            <Route path="tables" element={<TableManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="revenue/daily" element={<DailyReports />} />
            <Route path="revenue/monthly" element={<MonthlyReports />} />
            <Route path="revenue/yearly" element={<YearlyReports />} />
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
            <Route path="pending-bills" element={<PendingBills />} />
            <Route path="daily-summary" element={<DailySummary />} />
            <Route path="create-order" element={<CashierCreateOrder />} />
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
            <Route path="orders" element={<OrderQueue />} />
            <Route path="menu" element={<MenuItems />} />
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
