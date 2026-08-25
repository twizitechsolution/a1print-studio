import React, { useState } from 'react';
import { AdminUser } from '../../types/admin';
import { Shield, Plus, Trash2, UserCheck, Lock, Activity } from 'lucide-react';

export const AdminUserRoleManager: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([
    {
      id: 'u1',
      name: 'Nirod Kumar',
      email: 'admin@a1print.com',
      role: 'Super Admin',
      active: true,
      lastLogin: '2026-08-25 15:30',
      phone: '9876543210',
    },
    {
      id: 'u2',
      name: 'Ramesh Production',
      email: 'print@a1print.com',
      role: 'Production Manager',
      active: true,
      lastLogin: '2026-08-24 18:45',
      phone: '9123456780',
    },
  ]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminUser['role']>('Production Manager');

  const handleAddUser = () => {
    if (!name.trim() || !email.trim()) return;
    setUsers([
      ...users,
      {
        id: `u-${Date.now()}`,
        name,
        email,
        role,
        active: true,
        lastLogin: 'Never',
        phone: '9876543210',
      },
    ]);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6 font-jost">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" /> Admin Users & Access Roles Management
          </h3>
          <p className="text-xs text-gray-400">Add backend admin users, assign production/editor roles, and review login activity logs.</p>
        </div>
      </div>

      {/* Add Admin User Form */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-4 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Provision New Backend User Access
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Full Name (e.g. Ramesh Kumar)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden"
            />
          </div>
          <div className="sm:col-span-4">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden"
            />
          </div>
          <div className="sm:col-span-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3 py-2 rounded-xl text-xs text-white focus:outline-hidden"
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Production Manager">Production Manager</option>
              <option value="Customer Support">Customer Support</option>
              <option value="Content Editor">Content Editor</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              onClick={handleAddUser}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Create User
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] shadow-xl space-y-3">
        <h4 className="font-bold text-sm text-white">Authorized Admin Accounts ({users.length})</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-jost">
            <thead className="bg-[#1A2035] text-gray-400 text-[10px] font-extrabold uppercase border-b border-[#262E4A]">
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262E4A] font-bold text-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#1A2035]/40 transition-colors">
                  <td className="py-3 px-4 font-extrabold text-white">{u.name}</td>
                  <td className="py-3 px-4 font-mono">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md font-mono text-[10px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 font-mono">{u.lastLogin}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setUsers(users.filter((x) => x.id !== u.id))}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
