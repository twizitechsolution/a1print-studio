import React, { useState, useEffect } from 'react';
import { Order, Product } from '../../types';
import { AdminUser } from '../../types/admin';
import { useCartStore } from '../../store/useCartStore';
import { firebaseCloudDb } from '../../config/firebase';
import { CustomerUser } from '../../store/useAuthStore';
import { AdminLogin, SUPER_ADMIN_USER } from './AdminLogin';
import { AdminDarkStatsCards } from '../../components/admin/AdminDarkStatsCards';
import { AdminCharts } from '../../components/admin/AdminCharts';
import { AdminOrderList } from '../../components/admin/AdminOrderList';
import { AdminCatalogManager } from '../../components/admin/AdminCatalogManager';
import { AdminTemplateEditor } from './AdminTemplateEditor';
import { AdminStoreSettings } from '../../components/admin/AdminStoreSettings';
import { AdminCustomFieldsManager } from '../../components/admin/AdminCustomFieldsManager';
import { AdminCouponManager } from '../../components/admin/AdminCouponManager';
import { AdminShippingManager } from '../../components/admin/AdminShippingManager';
import { AdminPaymentManager } from '../../components/admin/AdminPaymentManager';
import { AdminDesignPreviewManager } from '../../components/admin/AdminDesignPreviewManager';
import { AdminAdvancedReports } from '../../components/admin/AdminAdvancedReports';
import { AdminNotificationDesk } from '../../components/admin/AdminNotificationDesk';
import { AdminCMSManager } from '../../components/admin/AdminCMSManager';
import { AdminUserRoleManager } from '../../components/admin/AdminUserRoleManager';
import { AdminThemeProvider } from '../../context/AdminThemeContext';
import { AdminThemeSwitch } from '../../components/admin/AdminThemeSwitch';
import { AdminSupportDesk } from '../../components/admin/AdminSupportDesk';

import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  LogOut,
  Bell,
  MessageSquare,
  Menu,
  BarChart3,
  Settings,
  Layers,
  Gift,
  Truck,
  CreditCard,
  Palette,
  FileText,
  Shield,
  ExternalLink,
  User as UserIcon,
} from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
}

const ADMIN_AUTH_KEY = 'a1print_admin_authenticated';

export type AdminTab =
  | 'dashboard'
  | 'catalog'
  | 'custom_fields'
  | 'orders'
  | 'customers'
  | 'coupons'
  | 'shipping'
  | 'payments'
  | 'support'
  | 'reports'
  | 'notifications'
  | 'cms'
  | 'settings'
  | 'users';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders: initialOrders }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  });

  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser>(() => {
    const saved = localStorage.getItem('a1print_admin_user');
    return saved ? JSON.parse(saved) : SUPER_ADMIN_USER;
  });

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const { products, orders, updateOrderStatus, updatePaymentStatus, updateOrderAdminRemark, recordOrderAction } = useCartStore();

  const [editingTemplateProduct, setEditingTemplateProduct] = useState<Product | null>(null);

  // Live Registered Customers List state from Firestore & Local Storage
  const [registeredCustomers, setRegisteredCustomers] = useState<CustomerUser[]>([]);

  useEffect(() => {
    const syncLiveAdminData = async () => {
      try {
        // 1. Fetch Registered Customers
        const cloudCustomers = await firebaseCloudDb.getCollection('customer_users');
        const localRaw = localStorage.getItem('a1print_registered_customers_v2');
        const localCustomers: CustomerUser[] = localRaw ? JSON.parse(localRaw) : [];

        const customerMap = new Map<string, CustomerUser>();
        localCustomers.forEach((c) => { if (c && c.phone) customerMap.set(c.phone, c); });
        (cloudCustomers || []).forEach((c) => { if (c && c.phone) customerMap.set(c.phone, c); });
        setRegisteredCustomers(Array.from(customerMap.values()));
      } catch (e) {}
    };

    syncLiveAdminData();
    const interval = setInterval(syncLiveAdminData, 5000); // 5-Second Live Polling!
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user: AdminUser) => {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    localStorage.setItem('a1print_admin_user', JSON.stringify(user));
    setCurrentAdminUser(user);
    setIsAuthenticated(true);
    if (user.allowedTabs && user.allowedTabs.length > 0) {
      setActiveTab(user.allowedTabs[0] as AdminTab);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem('a1print_admin_user');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  if (editingTemplateProduct) {
    return (
      <AdminTemplateEditor
        product={editingTemplateProduct}
        onBack={() => setEditingTemplateProduct(null)}
      />
    );
  }

  const allowedTabsSet = new Set(
    currentAdminUser.role === 'Super Admin'
      ? [
          'dashboard',
          'catalog',
          'custom_fields',
          'orders',
          'customers',
          'coupons',
          'shipping',
          'payments',
          'support',
          'design_preview',
          'reports',
          'notifications',
          'cms',
          'settings',
          'users',
        ]
      : currentAdminUser.allowedTabs
  );

  const navGroups = [
    {
      group: 'Analytics & Main',
      items: [
        { id: 'dashboard' as AdminTab, label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'reports' as AdminTab, label: 'Financial & Sales Reports', icon: BarChart3 },
      ],
    },
    {
      group: 'Products & Customization',
      items: [
        { id: 'catalog' as AdminTab, label: 'Frame Catalog', icon: Layers },
        { id: 'custom_fields' as AdminTab, label: 'Customization Fields', icon: Settings },
      ],
    },
    {
      group: 'Sales & Operations',
      items: [
        { id: 'orders' as AdminTab, label: 'Orders & Print Queue', icon: Package, badge: orders.length },
        { id: 'customers' as AdminTab, label: 'Customers Directory', icon: Users },
        { id: 'support' as AdminTab, label: 'Help Desk & Support', icon: MessageSquare },
        { id: 'shipping' as AdminTab, label: 'Shipping Rules', icon: Truck },
        { id: 'payments' as AdminTab, label: 'Payments & COD', icon: CreditCard },
      ],
    },
    {
      group: 'Marketing & Comms',
      items: [
        { id: 'coupons' as AdminTab, label: 'Coupons & Discounts', icon: Tag },
        { id: 'notifications' as AdminTab, label: 'WhatsApp Desk', icon: MessageSquare },
        { id: 'cms' as AdminTab, label: 'Store CMS Banners', icon: Gift },
      ],
    },
    {
      group: 'Settings & Security',
      items: [
        { id: 'users' as AdminTab, label: 'User & Access Control', icon: Shield },
        { id: 'settings' as AdminTab, label: 'Store Configuration', icon: Settings },
      ],
    },
  ];

  // Merge customer directory from registered accounts AND placed orders
  const mergedCustomerDirectory = () => {
    const map = new Map<string, { fullName: string; phone: string; email: string; orderCount: number; totalSpent: number; city: string; state: string }>();

    // Add registered accounts first
    registeredCustomers.forEach((c) => {
      const phoneKey = c.phone || c.email || c.id;
      map.set(phoneKey, {
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        orderCount: 0,
        totalSpent: 0,
        city: c.savedAddresses?.[0]?.city || 'N/A',
        state: c.savedAddresses?.[0]?.state || 'N/A',
      });
    });

    // Add orders placed
    orders.forEach((ord) => {
      if (!ord) return;
      const cust = ord.customer || {};
      const phoneKey = cust.phone || cust.email || cust.fullName || ord.id || 'Guest';
      const existing = map.get(phoneKey);
      const totalVal = Number(ord.total || ord.subtotal || 0);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += totalVal;
        if (cust.city) existing.city = cust.city;
        if (cust.state) existing.state = cust.state;
      } else {
        map.set(phoneKey, {
          fullName: cust.fullName || 'Valued Customer',
          phone: cust.phone || 'N/A',
          email: cust.email || '',
          orderCount: 1,
          totalSpent: totalVal,
          city: cust.city || 'N/A',
          state: cust.state || 'N/A',
        });
      }
    });

    return Array.from(map.values());
  };

  const customerList = mergedCustomerDirectory();

  return (
    <AdminThemeProvider>
      <div className="min-h-screen dark:bg-zinc-950 bg-slate-50 dark:text-zinc-100 text-slate-900 font-sans flex flex-col select-none transition-colors">
        
        {/* Top Admin Navigation Header (shadcn-admin style) */}
        <header className="sticky top-0 z-30 dark:bg-zinc-950/80 bg-white/80 border-b dark:border-zinc-800/80 border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
            title="Toggle Sidebar Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-950 font-bold text-sm flex items-center justify-center shadow-xs">
              A1
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 leading-tight flex items-center gap-2">
                A1print Studio <span className="text-[10px] font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">Admin</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sun / Moon Light & Dark Theme Switcher Dropdown */}
          <AdminThemeSwitch />

          {/* Live Firebase Cloud DB Connection Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full dark:bg-emerald-950/30 bg-emerald-50 border dark:border-emerald-800/40 border-emerald-200 dark:text-emerald-400 text-emerald-700 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cloud Sync: Live</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-600 text-white rounded-full">v2.6.0 (Admin Remark Callback Fixed)</span>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg dark:bg-zinc-900 bg-white dark:hover:bg-zinc-800 hover:bg-slate-100 dark:text-zinc-300 text-slate-700 hover:text-zinc-100 text-xs font-medium transition-colors border dark:border-zinc-800 border-slate-200 shadow-xs"
          >
            Storefront <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>

          {/* Active Admin Profile Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 dark:bg-zinc-900 bg-white rounded-lg border dark:border-zinc-800 border-slate-200 text-xs dark:text-zinc-200 text-slate-800 shadow-xs">
            <div className="w-5 h-5 rounded-full dark:bg-zinc-700 bg-slate-200 dark:text-zinc-100 text-slate-800 flex items-center justify-center text-[10px] font-bold">
              {currentAdminUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="leading-none text-xs font-semibold">{currentAdminUser.name}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
            title="Sign Out Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Shell */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs z-30 lg:hidden cursor-pointer"
          />
        )}

        {/* Left Sidebar Navigation (Desktop Static & Mobile Fixed Drawer) */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 ${
            isSidebarOpen ? 'w-60 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
          } transition-all duration-200 dark:bg-zinc-950 bg-white border-r dark:border-zinc-800/80 border-slate-200 flex flex-col shrink-0 overflow-y-auto shadow-xs`}
        >
          <div className="p-3 space-y-5">
            {navGroups.map((group, idx) => {
              const visibleItems = group.items.filter((item) => allowedTabsSet.has(item.id));
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-1">
                  {isSidebarOpen && (
                    <span className="text-[10px] uppercase font-medium dark:text-zinc-500 text-slate-400 tracking-wider px-2 py-1 block">
                      {group.group}
                    </span>
                  )}
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            if (window.innerWidth < 1024) {
                              setIsSidebarOpen(false);
                            }
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            isActive
                              ? 'dark:bg-zinc-800/90 bg-slate-100 dark:text-zinc-100 text-slate-900 font-semibold'
                              : 'dark:text-zinc-400 text-slate-600 dark:hover:text-zinc-200 hover:text-slate-900 dark:hover:bg-zinc-900/60 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'dark:text-zinc-100 text-slate-900' : 'dark:text-zinc-400 text-slate-500'}`} />
                          {isSidebarOpen && <span className="truncate">{item.label}</span>}
                          {isSidebarOpen && item.badge !== undefined && item.badge > 0 && (
                            <span className="ml-auto px-1.5 py-0.2 dark:bg-zinc-800 bg-slate-200 dark:text-zinc-200 text-slate-800 font-mono text-[10px] rounded border dark:border-zinc-700 border-slate-300">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Dynamic Viewport Panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 dark:bg-zinc-950 bg-slate-50">
          
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between border-b dark:border-zinc-800/80 border-slate-200 pb-3.5">
            <div>
              <div className="text-xs dark:text-zinc-400 text-slate-500 font-normal">
                Dashboard / <span className="dark:text-zinc-100 text-slate-900 font-semibold capitalize">{activeTab.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Module 1: Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <AdminDarkStatsCards
                orders={orders}
                onSelectStatusFilter={(statusFilter) => {
                  if (statusFilter === 'reports' || statusFilter === 'customers') {
                    setActiveTab(statusFilter as any);
                  } else {
                    setActiveTab('orders');
                  }
                }}
              />
              <AdminCharts
                orders={orders}
                onNavigateOrders={(filterStatus) => {
                  setActiveTab('orders');
                }}
              />
            </div>
          )}

          {/* Module 2: Frame Catalog Manager */}
          {activeTab === 'catalog' && (
            <AdminCatalogManager
              onEditTemplate={(product) => setEditingTemplateProduct(product)}
              onOpenTemplateEditor={(product) => setEditingTemplateProduct(product)}
              onOpenVisualEditor={(product) => setEditingTemplateProduct(product)}
            />
          )}

          {/* Module 3: Customization Fields */}
          {activeTab === 'custom_fields' && <AdminCustomFieldsManager />}

          {/* Module 4: Orders & Print Queue */}
          {activeTab === 'orders' && (
            <AdminOrderList
              orders={orders}
              onUpdateOrderStatus={updateOrderStatus}
              onUpdatePaymentStatus={updatePaymentStatus}
              onUpdateAdminRemark={updateOrderAdminRemark}
              onRecordOrderAction={recordOrderAction}
              currentAdminUser={currentAdminUser}
            />
          )}

          {/* Module: Help Desk & Customer Support Tickets */}
          {activeTab === 'support' && <AdminSupportDesk />}

          {/* Module 5: Registered Customers Directory */}
          {activeTab === 'customers' && (
            <div className="dark:bg-zinc-900/40 bg-white rounded-xl border dark:border-zinc-800 border-slate-200 p-5 space-y-4 font-sans shadow-xs">
              <div className="flex items-center justify-between border-b dark:border-zinc-800 border-slate-200 pb-3">
                <h3 className="text-xl font-bold tracking-tight dark:text-zinc-100 text-slate-900">
                  Registered Customers Directory ({customerList.length})
                </h3>
                <span className="text-xs dark:text-zinc-400 text-slate-500 font-medium dark:bg-zinc-900 bg-slate-100 px-2.5 py-1 rounded-md border dark:border-zinc-800 border-slate-200">10 per page</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="dark:bg-zinc-900 bg-slate-100 dark:text-zinc-400 text-slate-600 text-[11px] font-medium uppercase border-b dark:border-zinc-800 border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Phone Number / Email</th>
                      <th className="py-3 px-4">Orders Placed</th>
                      <th className="py-3 px-4">Total Spent</th>
                      <th className="py-3 px-4">Shipping Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-zinc-800/60 divide-slate-200 font-medium">
                    {customerList.slice(0, 10).map((cust, i) => (
                      <tr key={i} className="dark:hover:bg-zinc-900/60 hover:bg-slate-50 transition-colors dark:text-zinc-200 text-slate-800">
                        <td className="py-3 px-4 dark:text-zinc-100 text-slate-900 font-semibold flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full dark:bg-zinc-800 bg-slate-200 dark:text-zinc-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                            {cust.fullName.charAt(0)}
                          </div>
                          <span>{cust.fullName}</span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div>{cust.phone}</div>
                          {cust.email && <div className="text-[10px] dark:text-zinc-400 text-slate-500 font-normal">{cust.email}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${cust.orderCount > 0 ? 'dark:bg-purple-950/40 bg-purple-50 dark:text-purple-300 text-purple-700 dark:border-purple-800/40 border-purple-200' : 'dark:bg-zinc-950 bg-slate-100 dark:text-zinc-500 text-slate-500 dark:border-zinc-800 border-slate-200'}`}>
                            {cust.orderCount} order{cust.orderCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-emerald-500 font-bold font-mono">₹{cust.totalSpent}.00</td>
                        <td className="py-3 px-4">{cust.city}{cust.state !== 'N/A' ? `, ${cust.state}` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Module 6: Coupons & Discounts */}
          {activeTab === 'coupons' && <AdminCouponManager />}

          {/* Module 7: Shipping Management */}
          {activeTab === 'shipping' && <AdminShippingManager />}

          {/* Module 8: Payment Methods & COD */}
          {activeTab === 'payments' && <AdminPaymentManager />}

          {/* Module 9: Design & Live Preview */}
          {activeTab === 'design_preview' && <AdminDesignPreviewManager />}

          {/* Module 10: Reports & Analytics */}
          {activeTab === 'reports' && <AdminAdvancedReports orders={orders} />}

          {/* Module 11: WhatsApp & Notifications */}
          {activeTab === 'notifications' && <AdminNotificationDesk />}

          {/* Module 12: CMS & Home Banners */}
          {activeTab === 'cms' && <AdminCMSManager />}

          {/* Module 13: Store Settings */}
          {activeTab === 'settings' && <AdminStoreSettings />}

          {/* Module 14: User & Role Access Control */}
          {activeTab === 'users' && <AdminUserRoleManager />}

        </main>
      </div>
    </div>
  </AdminThemeProvider>
  );
};
