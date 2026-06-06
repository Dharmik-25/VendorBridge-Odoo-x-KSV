import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Shield } from 'lucide-react';

const Topbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'procurement_officer': return 'bg-brand-500/10 text-brand-400 border border-brand-500/20';
      case 'manager': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'vendor': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'procurement_officer': return 'Officer';
      case 'manager': return 'Manager';
      case 'vendor': return 'Vendor';
      default: return role;
    }
  };

  return (
    <header className="h-16 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-8 text-zinc-100">
      {/* Top Header Label */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 tracking-wide uppercase">VendorBridge ERP</h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        {/* Role Badge */}
        <span className={`px-2.5 py-1 text-2xs font-bold uppercase tracking-wider rounded-md ${getRoleBadgeColor(user.role)}`}>
          {getRoleLabel(user.role)}
        </span>

        {/* Notifications Mock */}
        <button className="text-zinc-400 hover:text-zinc-200 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full"></span>
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-zinc-800"></div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 uppercase">
              {user.name.charAt(0)}
            </div>
            <span className="text-sm font-semibold text-zinc-200">{user.name}</span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
