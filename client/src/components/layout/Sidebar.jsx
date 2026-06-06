import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  CheckSquare,
  FileCheck,
  Receipt,
  History,
  BarChart3,
  User,
  ShieldCheck,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null;

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Super Admin';
      case 'procurement_officer': return 'Procurement Officer';
      case 'manager': return 'Manager / Approver';
      case 'vendor': return 'Vendor Portal';
      default: return role;
    }
  };

  // Define navigations based on permissions
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
    { to: '/vendors', label: 'Vendors', icon: Users, roles: ['admin', 'procurement_officer'] },
    { to: '/rfqs', label: 'RFQs', icon: FileSpreadsheet, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
    { to: '/approvals', label: 'Approvals', icon: CheckSquare, roles: ['admin', 'manager', 'procurement_officer'] },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: FileCheck, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
    { to: '/invoices', label: 'Invoices', icon: Receipt, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
    { to: '/activity-logs', label: 'Activity Logs', icon: History, roles: ['admin'] },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['admin', 'manager', 'procurement_officer'] },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col min-h-screen text-zinc-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-900 gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center border border-brand-500/30 glow-green">
          <svg className="w-5 h-5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 0 1 18 0" />
            <path d="M3 16h18" />
            <path d="M12 3v9" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-zinc-100 tracking-tight text-lg">VendorBridge</div>
          <div className="text-2xs text-brand-500 font-semibold tracking-wider uppercase">{getRoleLabel(user.role)}</div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems
          .filter((item) => item.roles.includes(user.role))
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/50">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-brand-500 border border-zinc-700 uppercase">
            {user.name.charAt(0)}
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-zinc-200 truncate">{user.name}</div>
            <div className="text-2xs text-zinc-500 truncate">{user.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
