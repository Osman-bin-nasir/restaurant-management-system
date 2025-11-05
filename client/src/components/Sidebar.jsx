import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  ShoppingBag,
  Receipt,
  ChefHat,
  DollarSign,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Building2,
  Shield,
  TrendingUp,
  ClipboardList,
  Utensils,
  CreditCard,
  Table2,
  X,
  AlignLeft,
  AreaChart
} from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [openMenus, setOpenMenus] = useState({});
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <aside className="bg-white border-r border-gray-200 w-72 flex flex-col animate-pulse">
          {/* Header Skeleton */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-32 bg-gray-300 rounded-lg"></div>
                <div className="h-3 w-20 bg-gray-300 rounded"></div>
              </div>
              <div className="h-8 w-8 bg-gray-300 rounded-lg"></div>
            </div>
          </div>

          {/* User Profile Skeleton */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300"></div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-3 bg-gray-300 rounded w-20"></div>
              </div>
            </div>
          </div>

          {/* Navigation Skeleton */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
                  <div className="ml-4 space-y-1">
                    {[...Array(2)].map((_, j) => (
                      <div key={j} className="h-6 bg-gray-300 rounded w-3/4"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer Skeleton */}
          <div className="border-t border-gray-200 p-3 space-y-1">
            <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
            <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
          </div>
        </aside>
      </div>
    );
  }

  const userRole = user?.role || 'guest';
  const userName = user?.name || 'Guest User';
  const userEmail = user?.email || 'guest@example.com';

  const toggleSubmenu = (menuId) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const navigationItems = {
    admin: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/admin/dashboard'
      },
      {
        id: 'revenue-dashboard',
        label: 'Revenue Dashboard',
        icon: AreaChart,
        path: '/admin/revenue-dashboard'
      },
      {
        id: 'expenses',
        label: 'Expense Management',
        icon: DollarSign, // Using DollarSign as it fits expenses
        path: '/admin/expenses'
      },
      {
        id: 'menu',
        label: 'Menu Management',
        icon: UtensilsCrossed,
        path: '/admin/menu'
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: ShoppingBag,
        path: '/admin/orders',
        submenu: [
          { id: 'all-orders', label: 'All Orders', path: '/admin/orders' },
          { id: 'pending', label: 'Pending', path: '/admin/orders/pending' },
          { id: 'in-kitchen', label: 'In Kitchen', path: '/admin/orders/in-kitchen' },
          { id: 'ready', label: 'Ready', path: '/admin/orders/ready' }
        ]
      },
      {
        id: 'tables',
        label: 'Table Management',
        icon: Table2,
        path: '/admin/tables'
      },
      {
        id: 'users',
        label: 'User Management',
        icon: Users,
        path: '/admin/users'
      },
      {
        id: 'branches',
        label: 'Branch Management',
        icon: Building2,
        path: '/admin/branches'
      },
      {
        id: 'revenue',
        label: 'Revenue Reports',
        icon: TrendingUp,
        path: '/admin/revenue',
        submenu: [
          { id: 'daily', label: 'Daily Report', path: '/admin/revenue/daily' },
          { id: 'monthly', label: 'Monthly Report', path: '/admin/revenue/monthly' },
          { id: 'yearly', label: 'Yearly Report', path: '/admin/revenue/yearly' }
        ]
      },
      {
        id: 'roles',
        label: 'Role & Permissions',
        icon: Shield,
        path: '/admin/roles'
      }
    ],
    waiter: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/waiter/dashboard'
      },
      {
        id: 'tables',
        label: 'Table Orders',
        icon: Table2,
        path: '/waiter/tables'
      },
      {
        id: 'my-orders',
        label: 'My Orders',
        icon: ClipboardList,
        path: '/waiter/orders'
      }
    ],
    cashier: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/cashier/dashboard'
      },
      {
        id: 'parcel',
        label: 'Create Parcel',
        icon: Utensils,
        path: '/cashier/parcel-billing'
      },
      {
        id: 'pending-bills',
        label: 'Pending Bills',
        icon: CreditCard,
        path: '/cashier/pending-bills'
      },
    ],
    kitchen: [
      {
        id: 'dashboard',
        label: 'Kitchen Dashboard',
        icon: ChefHat,
        path: '/kitchen/dashboard'
      },
      {
        id: 'order-queue',
        label: 'Order Queue',
        icon: ClipboardList,
        path: '/kitchen/orders'
      },
      {
        id: 'menu',
        label: 'Menu Items',
        icon: Utensils,
        path: '/kitchen/menu'
      }
    ]
  };

  const currentNavItems = navigationItems[userRole] || [];

  const NavItem = ({ item, level = 0 }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openMenus[item.id];
    const isActive = location.pathname === item.path;

    const handleItemClick = () => {
      if (hasSubmenu) {
        toggleSubmenu(item.id);
      }
    };

    return (
      <div className="mb-1">
        <div
          onClick={handleItemClick}
          className={`
            w-full flex items-center justify-between px-4 py-3 rounded-lg
            transition-all duration-200 group cursor-pointer
            ${isActive
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
            }
            ${level > 0 ? 'pl-12' : ''}
          `}
        >
          <Link to={item.path} className="flex items-center gap-3">
            <item.icon
              size={20}
              className={`${isActive ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'}`}
            />
            {!isCollapsed && (
              <span className="font-medium">{item.label}</span>
            )}
          </Link>

          {!isCollapsed && hasSubmenu && (
            <div className="transition-transform duration-200">
              {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          )}
        </div>

        {hasSubmenu && isOpen && !isCollapsed && (
          <div className="mt-1 ml-4 space-y-1">
            {item.submenu.map((subItem) => (
              <Link
                key={subItem.id}
                to={subItem.path}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 rounded-lg
                  transition-all duration-200 text-sm
                  ${location.pathname === subItem.path
                    ? 'bg-orange-100 text-orange-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <div className="w-2 h-2 rounded-full bg-current opacity-40" />
                {subItem.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-72'} flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  <span className="text-orange-500">Restro</span>Manager
                </h1>
                <p className="text-xs text-gray-500 mt-1 capitalize">{userRole} Panel</p>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isCollapsed ? <AlignLeft size={20} className="text-gray-600" /> : <X size={20} className="text-gray-600" />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {currentNavItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </nav>

        <div className="border-t border-gray-200 p-3 space-y-1">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setActiveItem('settings')}
          >
            <Settings size={20} className="text-gray-500" />
            {!isCollapsed && <span className="font-medium">Settings</span>}
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;