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
  | 'design_preview'
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

  const { products, orders, updateOrderStatus } = useCartStore();

  const [editingTemplateProduct, setEditingTemplateProduct] = useState<Product | null>(null);

  // Live Registered Customers List state from Firestore & Local Storage
  const [registeredCustomers, setRegisteredCustomers] = useState<CustomerUser[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const cloudCustomers = await firebaseCloudDb.getCollection('customer_users');
        const localRaw = localStorage.getItem('a1print_registered_customers_v2');
        const localCustomers: CustomerUser[] = localRaw ? JSON.parse(localRaw) : [];

        const customerMap = new Map<string, CustomerUser>();
        localCustomers.forEach((c) => { if (c && c.phone) customerMap.set(c.phone, c); });
        (cloudCustomers || []).forEach((c) => { if (c && c.phone) customerMap.set(c.phone, c); });

        setRegisteredCustomers(Array.from(customerMap.values()));
      } catch (e) {}
    };

    fetchCustomers();
    const interval = setInterval(fetchCustomers, 10000);
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
        { id: 'design_preview' as AdminTab, label: 'Live Preview Settings', icon: Palette },
      ],
    },
    {
      group: 'Sales & Operations',
      items: [
        { id: 'orders' as AdminTab, label: 'Orders & Print Queue', icon: Package, badge: orders.length },
        { id: 'customers' as AdminTab, label: 'Customers Directory', icon: Users },
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
    <div className="min-h-screen bg-[#0A0D14] text-gray-100 font-jost flex flex-col select-none">
      
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-30 bg-[#121829] border-b border-[#262E4A] px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-white rounded-xl bg-[#1A2035] hover:bg-[#262E4A] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
              A1
            </div>
            <div>
              <h1 className="font-playfair text-lg sm:text-xl font-extrabold text-white leading-none">
                A1print Admin <span className="text-purple-400 font-normal text-xs uppercase tracking-widest block font-jost mt-0.5">Control Studio</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Firebase Cloud DB Connection Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firebase Cloud DB: Live Connected</span>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A2035] hover:bg-[#262E4A] text-gray-300 hover:text-white text-xs font-bold transition-colors border border-[#262E4A]"
          >
            View Storefront <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Active Admin Profile Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A2035] rounded-xl border border-[#262E4A] text-xs font-bold text-white">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">
              {currentAdminUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="leading-tight font-extrabold">{currentAdminUser.name}</p>
              <p className="text-[10px] text-purple-400 font-medium leading-tight">{currentAdminUser.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Sign Out Admin"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Shell */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar Navigation */}
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-0 sm:w-20'} transition-all duration-300 bg-[#121829] border-r border-[#262E4A] flex flex-col shrink-0 overflow-y-auto`}>
          <div className="p-4 space-y-6">
            {navGroups.map((group, idx) => {
              const visibleItems = group.items.filter((item) => allowedTabsSet.has(item.id));
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-2">
                  {isSidebarOpen && (
                    <span className="text-[10px] uppercase font-extrabold text-gray-500 tracking-wider px-3 block">
                      {group.group}
                    </span>
                  )}
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                              : 'text-gray-400 hover:text-white hover:bg-[#1A2035]'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                          {isSidebarOpen && <span className="truncate">{item.label}</span>}
                          {isSidebarOpen && item.badge !== undefined && item.badge > 0 && (
                            <span className="ml-auto px-2 py-0.5 bg-pink-500 text-white font-extrabold text-[10px] rounded-full">
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
          
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between border-b border-[#262E4A] pb-4">
            <div>
              <div className="text-xs text-gray-400 font-medium">
                Admin Control Center / <span className="text-purple-400 font-bold capitalize">{activeTab.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Module 1: Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <AdminDarkStatsCards orders={orders} />
              <AdminCharts orders={orders} />
              <AdminOrderList orders={orders} onUpdateOrderStatus={updateOrderStatus} />
            </div>
          )}

          {/* Module 2: Frame Catalog Manager */}
          {activeTab === 'catalog' && (
            <AdminCatalogManager
              onEditTemplate={(product) => setEditingTemplateProduct(product)}
            />
          )}

          {/* Module 3: Customization Fields */}
          {activeTab === 'custom_fields' && <AdminCustomFieldsManager />}

          {/* Module 4: Orders & Print Queue */}
          {activeTab === 'orders' && (
            <AdminOrderList
              orders={orders}
              onUpdateOrderStatus={updateOrderStatus}
            />
          )}

          {/* Module 5: Registered Customers Directory */}
          {activeTab === 'customers' && (
            <div className="bg-[#121829] rounded-3xl border border-[#262E4A] p-6 space-y-4 font-jost shadow-xl">
              <h3 className="font-playfair text-xl font-bold text-white">
                Registered Customers Directory ({customerList.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A2035] text-gray-400 text-[11px] font-extrabold uppercase border-b border-[#262E4A]">
                    <tr>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Phone Number / Email</th>
                      <th className="py-3 px-4">Orders Placed</th>
                      <th className="py-3 px-4">Total Spent</th>
                      <th className="py-3 px-4">Shipping Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262E4A] font-bold">
                    {customerList.map((cust, i) => (
                      <tr key={i} className="hover:bg-[#1A2035]/50 transition-colors text-gray-200">
                        <td className="py-3 px-4 text-white font-extrabold flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-black">
                            {cust.fullName.charAt(0)}
                          </div>
                          <span>{cust.fullName}</span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div>{cust.phone}</div>
                          {cust.email && <div className="text-[10px] text-gray-400 font-normal">{cust.email}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${cust.orderCount > 0 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-gray-700/50 text-gray-400'}`}>
                            {cust.orderCount} order{cust.orderCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-emerald-400 font-extrabold">₹{cust.totalSpent}.00</td>
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
  );
};
