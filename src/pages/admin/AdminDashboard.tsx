import React, { useState } from 'react';
import { Order, Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { AdminLogin } from './AdminLogin';
import { AdminDarkStatsCards } from '../../components/admin/AdminDarkStatsCards';
import { AdminCharts } from '../../components/admin/AdminCharts';
import { AdminOrderList } from '../../components/admin/AdminOrderList';
import { AdminCatalogManager } from '../../components/admin/AdminCatalogManager';
import { AdminTemplateEditor } from './AdminTemplateEditor';
import { AdminReportsSection } from '../../components/admin/AdminReportsSection';
import { AdminSupportDesk } from '../../components/admin/AdminSupportDesk';
import { AdminStoreSettings } from '../../components/admin/AdminStoreSettings';

import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  LogOut,
  Search,
  Bell,
  MessageSquare,
  Menu,
  Wrench,
  Sparkles,
  BarChart3,
  Settings,
} from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
}

const ADMIN_AUTH_KEY = 'a1print_admin_authenticated';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders: initialOrders }) => {
  // Initialize from localStorage so Admin session is 100% preserved across page reloads & F5!
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'orders' | 'catalog' | 'customers' | 'support' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const { products, orders, updateOrderStatus } = useCartStore();

  // Full-Page Template Editor state
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

  // If configuring a template, render the Dedicated Visual Design Workspace full page!
  if (editingTemplateProduct) {
    return (
      <AdminTemplateEditor
        product={editingTemplateProduct}
        onBack={() => setEditingTemplateProduct(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1B] text-white flex font-sans select-none">
      
      {/* 1. Left Vertical Sidebar Navigation */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-[#121829] border-r border-[#262E4A] transition-all duration-300 flex flex-col shrink-0 font-jost`}
      >
        {/* Brand Header */}
        <div className="h-20 border-b border-[#262E4A] flex items-center justify-between px-6">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-lg">
                A1
              </div>
              <div>
                <h1 className="font-playfair text-lg font-bold text-white tracking-wide leading-none">A1print</h1>
                <span className="text-[10px] text-[#3B82F6] font-extrabold tracking-widest uppercase block pt-0.5">Admin Studio</span>
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

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-4 space-y-1.5 text-xs font-bold overflow-y-auto">
          
          <div className="px-3 pb-2 text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">
            {isSidebarOpen ? 'Analytics & Orders' : '•••'}
          </div>

          {/* 1. Dashboard Overview */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:bg-[#1A2035] hover:text-gray-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Dashboard Overview</span>}
          </button>

          {/* 2. Financial & Sales Reports */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:bg-[#1A2035] hover:text-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-emerald-400" />
            {isSidebarOpen && <span>Financial Sales Reports</span>}
          </button>

          {/* 3. Orders & Print Queue */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all justify-between cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:bg-[#1A2035] hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 shrink-0 text-amber-400" />
              {isSidebarOpen && <span>Orders & Print Queue</span>}
            </div>
            {isSidebarOpen && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md text-[10px]">
                {orders.length}
              </span>
            )}
          </button>

          <div className="px-3 pt-3 pb-2 text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">
            {isSidebarOpen ? 'Management & Support' : '•••'}
          </div>

          {/* 4. Frame Catalog & Editor */}
          <button
            onClick={() => setActiveTab('catalog')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:bg-[#1A2035] hover:text-gray-200'
            }`}
          >
            <Package className="w-4 h-4 shrink-0 text-purple-400" />
            {isSidebarOpen && <span>Frame Catalog & Editor</span>}
          </button>

          {/* 5. Customers Directory */}
          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:bg-[#1A2035] hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 text-sky-400" />
            {isSidebarOpen && <span>Customers Directory</span>}
          </button>

          {/* 6. Support & WhatsApp Desk */}
          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'support'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:bg-[#1A2035] hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0 text-emerald-400" />
            {isSidebarOpen && <span>Support & WhatsApp Desk</span>}
          </button>

          {/* 7. Store Settings & Promo Manager */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:bg-[#1A2035] hover:text-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0 text-pink-400" />
            {isSidebarOpen && <span>Store Settings & Promos</span>}
          </button>

        </nav>

        {/* Sidebar Footer Logout Button */}
        <div className="p-4 border-t border-[#262E4A]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>

      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="h-20 bg-[#121829] border-b border-[#262E4A] px-6 sm:px-8 flex items-center justify-between gap-4 font-jost shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400">Admin Control Center /</span>
            <span className="text-xs font-extrabold text-white capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-[#1A2035] hover:bg-[#262E4A] text-gray-300 hover:text-white rounded-xl text-xs font-extrabold border border-[#262E4A] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              View Live Storefront ➔
            </a>
          </div>
        </header>

        {/* Tab Content Render */}
        <main className="p-6 sm:p-8 space-y-8 flex-1">
          
          {/* 1. DASHBOARD OVERVIEW TAB */}
          {activeTab === 'dashboard' && (
            <>
              <AdminDarkStatsCards orders={orders} />
              <AdminCharts orders={orders} />
            </>
          )}

          {/* 2. FINANCIAL SALES REPORTS TAB */}
          {activeTab === 'reports' && (
            <AdminReportsSection orders={orders} />
          )}

          {/* 3. ORDERS & PRINT QUEUE TAB */}
          {activeTab === 'orders' && (
            <AdminOrderList
              orders={orders}
              onUpdateStatus={updateOrderStatus}
            />
          )}

          {/* 4. FRAME CATALOG & EDITOR TAB */}
          {activeTab === 'catalog' && (
            <AdminCatalogManager
              products={products}
              onOpenVisualEditor={(product) => setEditingTemplateProduct(product)}
            />
          )}

          {/* 5. CUSTOMERS DIRECTORY TAB */}
          {activeTab === 'customers' && (
            <div className="bg-[#121829] rounded-3xl border border-[#262E4A] p-6 space-y-4 font-jost">
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

          {/* 6. SUPPORT & WHATSAPP DESK TAB */}
          {activeTab === 'support' && (
            <AdminSupportDesk orders={orders} />
          )}

          {/* 7. STORE SETTINGS & PROMO MANAGER TAB */}
          {activeTab === 'settings' && (
            <AdminStoreSettings />
          )}

        </main>

      </div>

    </div>
  );
};
