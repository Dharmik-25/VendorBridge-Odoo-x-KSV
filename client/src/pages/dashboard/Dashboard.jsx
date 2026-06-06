import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  CheckSquare,
  BadgeCent,
  Receipt,
  Plus,
  UserPlus,
  ArrowRight,
  TrendingUp,
  FileClock,
  Briefcase,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/reports/dashboard-stats');
      setData(response.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const stats = data?.stats || { activeRFQs: 0, pendingApprovals: 0, monthlySpend: 0, totalInvoices: 0 };
  const recentInvoices = data?.recentInvoices || [];
  const recentActivities = data?.recentActivities || [];
  const monthlyTrend = data?.monthlyTrend || [];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Welcome, {user.name}</h1>
          <p className="text-zinc-400 mt-1 text-sm">Here's what is happening across your procurement pipeline today.</p>
        </div>

        {/* Quick Action Actions */}
        <div className="flex gap-3">
          {(user.role === 'admin' || user.role === 'procurement_officer') && (
            <>
              <Link
                to="/rfqs?create=true"
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-sm transition-all shadow-md glow-green cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New RFQ
              </Link>
              <Link
                to="/vendors?create=true"
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-100 font-bold rounded-lg text-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add Vendor
              </Link>
            </>
          )}
          {user.role === 'vendor' && (
            <Link
              to="/rfqs"
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-sm transition-all shadow-md glow-green cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              View Invited RFQs
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-800 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active RFQs</p>
              <h3 className="text-3xl font-bold text-zinc-100 mt-2">{stats.activeRFQs}</h3>
            </div>
            <span className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 group-hover:text-brand-500 group-hover:border-brand-500/20 transition-all">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center text-zinc-500 text-xs">
            <span className="text-brand-500 font-semibold flex items-center gap-0.5 mr-1.5">Open</span>
            for bids
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-800 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pending Approvals</p>
              <h3 className="text-3xl font-bold text-zinc-100 mt-2">{stats.pendingApprovals}</h3>
            </div>
            <span className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 group-hover:text-amber-500 group-hover:border-amber-500/20 transition-all">
              <CheckSquare className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center text-zinc-500 text-xs">
            <span className="text-amber-500 font-semibold flex items-center gap-0.5 mr-1.5">Needs action</span>
            from manager
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-800 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Monthly Spend</p>
              <h3 className="text-3xl font-bold text-zinc-100 mt-2">₹{stats.monthlySpend.toLocaleString()}</h3>
            </div>
            <span className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all">
              <BadgeCent className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center text-zinc-500 text-xs">
            <span className="text-emerald-500 font-semibold flex items-center gap-0.5 mr-1.5">Current month</span>
            billing
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-800 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Recent Invoices</p>
              <h3 className="text-3xl font-bold text-zinc-100 mt-2">{stats.totalInvoices}</h3>
            </div>
            <span className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 group-hover:text-indigo-500 group-hover:border-indigo-500/20 transition-all">
              <Receipt className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center text-zinc-500 text-xs">
            <span className="text-indigo-500 font-semibold flex items-center gap-0.5 mr-1.5">Tracked</span>
            in invoices module
          </div>
        </div>
      </div>

      {/* Analytics Spend Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-zinc-100">Spend Overview</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Aggregate Purchase Order spend trends over the last 6 months.</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-brand-500 font-semibold bg-brand-500/10 px-2 py-1 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" />
              INR (₹)
            </span>
          </div>

          <div className="h-72 w-full">
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="spend" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#spendGrad)" name="Total Spend" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-600 text-sm">No historical data available</div>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Audit Feed</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Real-time immutable activity logs.</p>
          </div>

          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.length > 0 ? (
                recentActivities.map((act, idx) => (
                  <li key={act.id}>
                    <div className="relative pb-8">
                      {idx !== recentActivities.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-850" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-300">
                            <FileClock className="w-4 h-4 text-brand-500" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-xs font-semibold text-zinc-300">
                              {act.action} by <span className="font-bold text-zinc-200">{act.actorName}</span>
                            </p>
                            <p className="text-2xs text-zinc-500 mt-0.5">{act.entityType}</p>
                          </div>
                          <div className="text-right text-2xs whitespace-nowrap text-zinc-500">
                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-600 text-sm">No recent logs recorded.</div>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Recent Invoices</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Invoices generated for purchase order fulfillment.</p>
          </div>
          <Link to="/invoices" className="text-brand-500 hover:text-brand-400 font-semibold text-xs flex items-center gap-1">
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-zinc-350 text-sm">
            <thead className="text-xs uppercase tracking-wider text-zinc-500 bg-zinc-950/50">
              <tr>
                <th className="py-3 px-4 border-b border-zinc-900">Invoice Number</th>
                <th className="py-3 px-4 border-b border-zinc-900">PO Number</th>
                <th className="py-3 px-4 border-b border-zinc-900">Vendor</th>
                <th className="py-3 px-4 border-b border-zinc-900">Issue Date</th>
                <th className="py-3 px-4 border-b border-zinc-900 text-right">Grand Total</th>
                <th className="py-3 px-4 border-b border-zinc-900 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length > 0 ? (
                recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="py-3.5 px-4 border-b border-zinc-900 font-semibold text-zinc-200">
                      <Link to={`/invoices/${inv.id}`} className="hover:text-brand-500">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 border-b border-zinc-900 text-zinc-400">{inv.poNumber}</td>
                    <td className="py-3.5 px-4 border-b border-zinc-900 text-zinc-200 font-medium">{inv.vendorName}</td>
                    <td className="py-3.5 px-4 border-b border-zinc-900 text-zinc-400">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 border-b border-zinc-900 text-right text-brand-500 font-bold">
                      ₹{inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 border-b border-zinc-900 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold uppercase border ${
                          inv.status === 'paid'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : inv.status === 'overdue'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-600 text-sm">
                    No invoices generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
