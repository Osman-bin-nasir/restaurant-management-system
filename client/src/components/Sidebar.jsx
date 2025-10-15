import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
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
  AlignLeft
} from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [activeItem, setActiveItem] = useState('dashboard');
  
  const { user, logout } = useAuth();
  console.log(user)
  const userRole = user?.role || 'guest';
  const userName = user?.name || 'Guest User';
  const userEmail = user?.email || 'guest@example.com';

  const toggleSubmenu = (menuId) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Define navigation items based on roles
  const navigationItems = {
    admin: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/admin/dashboard'
      },
      {
        id: 'menu',
        label: 'Menu Management',
        icon: UtensilsCrossed,
        path: '/menu'
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: ShoppingBag,
        path: '/admin/orders',
        submenu: [
          { id: 'all-orders', label: 'All Orders', path: '/admin/orders' },
          { id: 'pending', label: 'Pending', path: '/admin/orders?status=placed' },
          { id: 'in-kitchen', label: 'In Kitchen', path: '/admin/orders?status=in-kitchen' },
          { id: 'ready', label: 'Ready', path: '/admin/orders?status=ready' }
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
        id: 'menu',
        label: 'Menu',
        icon: UtensilsCrossed,
        path: '/menu'
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
        id: 'billing',
        label: 'Billing',
        icon: Receipt,
        path: '/cashier/billing'
      },
      {
        id: 'pending-bills',
        label: 'Pending Bills',
        icon: CreditCard,
        path: '/cashier/pending'
      },
      {
        id: 'daily-summary',
        label: 'Daily Summary',
        icon: DollarSign,
        path: '/cashier/summary'
      }
    ],
    chef: [
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
        path: '/menu'
      }
    ]
  };

  const currentNavItems = navigationItems[userRole] || [];

  const NavItem = ({ item, level = 0 }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openMenus[item.id];
    const isActive = activeItem === item.id;

    return (
      <div className="mb-1">
        <button
          onClick={() => {
            if (hasSubmenu) {
              toggleSubmenu(item.id);
            } else {
              setActiveItem(item.id);
            }
          }}
          className={`
            w-full flex items-center justify-between px-4 py-3 rounded-lg
            transition-all duration-200 group
            ${isActive 
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
              : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
            }
            ${level > 0 ? 'pl-12' : ''}
          `}
        >
          <div className="flex items-center gap-3">
            <item.icon 
              size={20} 
              className={`${isActive ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'}`}
            />
            {!isCollapsed && (
              <span className="font-medium">{item.label}</span>
            )}
          </div>
          
          {!isCollapsed && hasSubmenu && (
            <div className="transition-transform duration-200">
              {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          )}
        </button>

        {hasSubmenu && isOpen && !isCollapsed && (
          <div className="mt-1 ml-4 space-y-1">
            {item.submenu.map((subItem) => (
              <button
                key={subItem.id}
                onClick={() => setActiveItem(subItem.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 rounded-lg
                  transition-all duration-200 text-sm
                  ${activeItem === subItem.id
                    ? 'bg-orange-100 text-orange-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <div className="w-2 h-2 rounded-full bg-current opacity-40" />
                {subItem.label}
              </button>
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
                  <span className="text-orange-500">Resto</span>Manager
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