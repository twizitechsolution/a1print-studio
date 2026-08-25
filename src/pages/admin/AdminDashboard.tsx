import React, { useState } from 'react';
import { Order, Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { AdminLogin } from './AdminLogin';
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

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const { products, orders, updateOrderStatus } = useCartStore();

  const [editingTemplateProduct, setEditingTemplateProduct] = useState<Product | null>(null);

  const handleLoginSuccess = () => {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
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

  const navGroups = [
    {
      title: 'Analytics & Main',
      items: [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, color: 'text-[#3B82F6]' },
        { id: 'reports', label: 'Financial & Sales Reports', icon: BarChart3, color: 'text-emerald-400' },
      ],
    },
    {
      title: 'Catalog & Products',
      items: [
        { id: 'catalog', label: 'Frame Management', icon: Package, color: 'text-purple-400' },
        { id: 'custom_fields', label: 'Customization Fields', icon: Layers, color: 'text-cyan-400' },
        { id: 'design_preview', label: 'Design & Live Preview', icon: Palette, color: 'text-pink-400' },
      ],
    },
    {
      title: 'Sales & Operations',
      items: [
        { id: 'orders', label: 'Orders & Print Queue', icon: Tag, color: 'text-amber-400', badge: orders.length },
        { id: 'customers', label: 'Customers Directory', icon: Users, color: 'text-sky-400' },
        { id: 'shipping', label: 'Shipping & Delivery', icon: Truck, color: 'text-teal-400' },
        { id: 'payments', label: 'Payment Methods & COD', icon: CreditCard, color: 'text-emerald-400' },
      ],
    },
    {
      title: 'Marketing & Comms',
      items: [
        { id: 'coupons', label: 'Coupons & Discounts', icon: Gift, color: 'text-rose-400' },
        { id: 'notifications', label: 'WhatsApp & Notifications', icon: MessageSquare, color: 'text-emerald-400' },
        { id: 'cms', label: 'Store Content CMS', icon: FileText, color: 'text-amber-400' },
      ],
    },
    {
      title: 'System & Admin',
      items: [
        { id: 'settings', label: 'Store Settings', icon: Settings, color: 'text-pink-400' },
        { id: 'users', label: 'Users & Access Roles', icon: Shield, color: 'text-indigo-400' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E1B] text-white flex font-sans select-none">
      
      {/* 1. Left Deep Indigo Sidebar Navigation matching media_1787652165036.jpg */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-[#121829] border-r border-[#262E4A] transition-all duration-300 flex flex-col shrink-0 font-jost`}
      >
        {/* Brand Header */}
        <div className="h-20 border-b border-[#262E4A] flex items-center justify-between px-6">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-lg">
                A1
              </div>
              <div>
                <h1 className="font-playfair text-base font-bold text-white tracking-wide leading-none">A1print Studio</h1>
                <span className="text-[10px] text-[#3B82F6] font-extrabold tracking-widest uppercase block pt-0.5">ADMIN CONTROL CENTER</span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] rounded-xl flex items-center justify-center font-extrabold text-white text-lg mx-auto">
              A1
            </div>
          )}

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg bg-[#1A2035] hover:bg-[#262E4A] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Categorized Nav Links */}
        <nav className="flex-1 p-3 space-y-4 text-xs font-bold overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">
                {isSidebarOpen ? group.title : '•••'}
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as AdminTab)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/25 font-extrabold'
                        : 'text-gray-400 hover:bg-[#1A2035] hover:text-gray-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                    {isSidebarOpen && <span className="truncate flex-1 text-left">{item.label}</span>}
                    {isSidebarOpen && item.badge !== undefined && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md text-[10px] font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#262E4A]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Sign Out Admin</span>}
          </button>
        </div>

      </aside>

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Navbar Header */}
        <header className="h-20 bg-[#121829] border-b border-[#262E4A] px-6 sm:px-8 flex items-center justify-between gap-4 font-jost shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">Admin Control Center /</span>
            <span className="text-xs font-extrabold text-white capitalize">{activeTab.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Firebase Indicator */}
            <div className="hidden md:flex px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🔥 Firebase Cloud DB: Live Connected
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-[#1A2035] hover:bg-[#262E4A] text-gray-300 hover:text-white rounded-xl text-xs font-extrabold border border-[#262E4A] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              View Storefront <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Main Workspace Content Render */}
        <main className="p-6 sm:p-8 space-y-8 flex-1">
          
          {/* Module 1: Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <>
              <AdminDarkStatsCards orders={orders} onSelectStatusFilter={() => setActiveTab('orders')} />
              <AdminCharts orders={orders} onNavigateOrders={() => setActiveTab('orders')} />
            </>
          )}

          {/* Module 2: Frame Management */}
          {activeTab === 'catalog' && (
            <AdminCatalogManager
              onOpenVisualEditor={(product) => setEditingTemplateProduct(product)}
              onOpenTemplateEditor={(product) => setEditingTemplateProduct(product)}
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

          {/* Module 5: Customers Directory */}
          {activeTab === 'customers' && (
            <div className="bg-[#121829] rounded-3xl border border-[#262E4A] p-6 space-y-4 font-jost shadow-xl">
              <h3 className="font-playfair text-xl font-bold text-white">Registered Customers Directory ({orders.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A2035] text-gray-400 text-[11px] font-extrabold uppercase border-b border-[#262E4A]">
                    <tr>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Orders Placed</th>
                      <th className="py-3 px-4">Total Spent</th>
                      <th className="py-3 px-4">Shipping City</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262E4A] font-bold">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#1A2035]/50 transition-colors text-gray-200">
                        <td className="py-3 px-4 text-white font-extrabold">{ord.customer.fullName}</td>
                        <td className="py-3 px-4 font-mono">{ord.customer.phone}</td>
                        <td className="py-3 px-4">1 order</td>
                        <td className="py-3 px-4 text-emerald-400 font-extrabold">₹{ord.total}.00</td>
                        <td className="py-3 px-4">{ord.customer.city}, {ord.customer.state}</td>
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

          {/* Module 12: Content Management CMS */}
          {activeTab === 'cms' && <AdminCMSManager />}

          {/* Module 13: Store Settings */}
          {activeTab === 'settings' && <AdminStoreSettings />}

          {/* Module 14: Users & Access Roles */}
          {activeTab === 'users' && <AdminUserRoleManager />}

        </main>

      </div>

    </div>
  );
};
