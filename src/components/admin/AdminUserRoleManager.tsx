import React, { useState, useEffect } from 'react';
import { AdminUser } from '../../types/admin';
import { firebaseCloudDb } from '../../config/firebase';
import { Shield, Plus, Trash2, CheckCircle2, Lock, Key, User, Mail, Phone, Check, RefreshCw } from 'lucide-react';

const MODULE_OPTIONS = [
  { id: 'dashboard', label: 'Dashboard Overview' },
  { id: 'catalog', label: 'Frame Catalog & Editor' },
  { id: 'custom_fields', label: 'Customization Fields' },
  { id: 'orders', label: 'Orders & Print Queue' },
  { id: 'customers', label: 'Customers Directory' },
  { id: 'coupons', label: 'Coupons & Discounts' },
  { id: 'shipping', label: 'Shipping & Delivery' },
  { id: 'payments', label: 'Payments & COD Rules' },
  { id: 'design_preview', label: 'Design & Live Preview' },
  { id: 'reports', label: 'Financial & Sales Reports' },
  { id: 'notifications', label: 'WhatsApp & Notifications' },
  { id: 'cms', label: 'Store Content CMS' },
  { id: 'settings', label: 'Store Settings' },
  { id: 'users', label: 'Users & Access Roles' },
];

const DEFAULT_SUPER_ADMIN: AdminUser = {
  id: 'u-super-admin',
  name: 'Nirod Kumar',
  username: 'admin',
  password: '123',
  email: 'admin@a1print.com',
  role: 'Super Admin',
  allowedTabs: MODULE_OPTIONS.map((m) => m.id),
  active: true,
  lastLogin: 'Active Now',
  phone: '9876543210',
};

export const AdminUserRoleManager: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([DEFAULT_SUPER_ADMIN]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AdminUser['role']>('Production Manager');
  const [allowedTabs, setAllowedTabs] = useState<string[]>([
    'dashboard',
    'orders',
    'catalog',
    'shipping',
  ]);

  // Load users from Cloud Firestore & localStorage on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const cloudUsers = await firebaseCloudDb.getCollection('admin_users');
        const localStr = localStorage.getItem('a1print_admin_users');
        const localUsers: AdminUser[] = localStr ? JSON.parse(localStr) : [];

        const combined = [...cloudUsers, ...localUsers];

        // Deduplicate by username or id
        const userMap = new Map<string, AdminUser>();
        userMap.set(DEFAULT_SUPER_ADMIN.username, DEFAULT_SUPER_ADMIN);

        combined.forEach((u) => {
          if (u && u.username) {
            userMap.set(u.username, u);
          }
        });

        const finalUsers = Array.from(userMap.values());
        setUsers(finalUsers);
        localStorage.setItem('a1print_admin_users', JSON.stringify(finalUsers));
      } catch (e) {
        console.warn('Error loading admin users:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Update default tab checkboxes when role selector changes
  const handleRoleChange = (newRole: AdminUser['role']) => {
    setRole(newRole);
    if (newRole === 'Super Admin') {
      setAllowedTabs(MODULE_OPTIONS.map((m) => m.id));
    } else if (newRole === 'Production Manager') {
      setAllowedTabs(['dashboard', 'orders', 'catalog', 'custom_fields', 'shipping']);
    } else if (newRole === 'Customer Support') {
      setAllowedTabs(['dashboard', 'orders', 'customers', 'notifications']);
    } else if (newRole === 'Content Editor') {
      setAllowedTabs(['dashboard', 'catalog', 'design_preview', 'cms']);
    }
  };

  const handleToggleTab = (tabId: string) => {
    if (allowedTabs.includes(tabId)) {
      setAllowedTabs(allowedTabs.filter((t) => t !== tabId));
    } else {
      setAllowedTabs([...allowedTabs, tabId]);
    }
  };

  const handleCreateUser = async () => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      alert('Please fill out Full Name, Login ID (Username), and Password!');
      return;
    }

    setIsSaving(true);
    const newUser: AdminUser = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      email: email.trim() || `${username.trim()}@a1print.com`,
      phone: phone.trim() || '9876543210',
      role,
      allowedTabs,
      active: true,
      lastLogin: 'Never',
    };

    const updatedUsers = [...users.filter((u) => u.username !== newUser.username), newUser];
    setUsers(updatedUsers);

    // 1. Save to localStorage instantly
    localStorage.setItem('a1print_admin_users', JSON.stringify(updatedUsers));

    // 2. Persist to Cloud Firestore real-time DB
    await firebaseCloudDb.setDocument('admin_users', newUser.id, newUser);

    setIsSaving(false);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setPhone('');
    alert(`✅ Admin User "${newUser.name}" created successfully and saved to database! Login ID: ${newUser.username}`);
  };

  const handleDeleteUser = async (id: string, usernameToDelete: string) => {
    if (usernameToDelete === 'admin') {
      alert('Cannot delete default Super Admin account!');
      return;
    }

    const updatedUsers = users.filter((u) => u.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('a1print_admin_users', JSON.stringify(updatedUsers));

    // Delete from Firestore
    await firebaseCloudDb.deleteDocument('admin_users', id);
  };

  return (
    <div className="space-y-6 font-jost">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" /> Admin Users & Role Access Management
          </h3>
          <p className="text-xs text-gray-400">Add backend admin accounts with Login ID, password, and granular menu permissions saved to live database.</p>
        </div>

        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          🔥 Real-time Database Persistence Active
        </div>
      </div>

      {/* Create New Admin User Form Card */}
      <div className="p-6 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-5 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2 border-b border-[#262E4A] pb-3">
          <Plus className="w-4 h-4 text-emerald-400" /> Create New Admin User Account
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-bold text-gray-300">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-bold text-gray-300">Login ID / Username *</label>
            <input
              type="text"
              placeholder="e.g. ramesh_prod"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white font-mono placeholder-gray-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-bold text-gray-300">Account Password *</label>
            <input
              type="password"
              placeholder="Set Password (e.g. pass123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-bold text-gray-300">Email Address</label>
            <input
              type="email"
              placeholder="ramesh@a1print.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-bold text-gray-300">Phone Number</label>
            <input
              type="text"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white font-mono placeholder-gray-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-bold text-gray-300">Role Preset</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as any)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3 py-2 rounded-xl text-xs text-white font-bold focus:outline-hidden"
            >
              <option value="Super Admin">Super Admin (All Access)</option>
              <option value="Production Manager">Production Manager (Orders & Catalog)</option>
              <option value="Customer Support">Customer Support (Orders & WhatsApp Desk)</option>
              <option value="Content Editor">Content Editor (CMS & Preview Settings)</option>
            </select>
          </div>
        </div>

        {/* Granular Checkboxes for 14 Core Modules */}
        <div className="space-y-3 pt-3 border-t border-[#262E4A]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" /> Granted Menu Permissions ({allowedTabs.length} / 14 Modules Selected):
            </label>
            <button
              type="button"
              onClick={() => setAllowedTabs(MODULE_OPTIONS.map((m) => m.id))}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
            >
              Select All Modules
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {MODULE_OPTIONS.map((mod) => {
              const isChecked = allowedTabs.includes(mod.id);

              return (
                <label
                  key={mod.id}
                  onClick={() => handleToggleTab(mod.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-indigo-600/20 text-white border-indigo-500/50 shadow-sm'
                      : 'bg-[#1A2035] text-gray-400 border-[#262E4A] hover:bg-[#262E4A]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      isChecked ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-gray-600'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="truncate">{mod.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <button
          disabled={isSaving}
          onClick={handleCreateUser}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Saving User to Database...
            </>
          ) : (
            <>
              <User className="w-4 h-4" /> Save User Account to Database
            </>
          )}
        </button>

      </div>

      {/* Authorized Admin Users Table */}
      <div className="p-6 bg-[#121829] rounded-2xl border border-[#262E4A] shadow-xl space-y-4">
        <h4 className="font-bold text-sm text-white">Authorized Database Admin Accounts ({users.length})</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-jost">
            <thead className="bg-[#1A2035] text-gray-400 text-[10px] font-extrabold uppercase border-b border-[#262E4A]">
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Login ID (Username)</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Permitted Modules</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262E4A] font-bold text-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#1A2035]/40 transition-colors">
                  <td className="py-3 px-4 font-extrabold text-white">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-indigo-300">{u.username}</td>
                  <td className="py-3 px-4 font-mono text-gray-400">{u.password ? '••••••••' : 'Passcode'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-[11px]">
                    {(u.allowedTabs || []).length} / 14 modules
                  </td>
                  <td className="py-3 px-4 text-right">
                    {u.username !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
