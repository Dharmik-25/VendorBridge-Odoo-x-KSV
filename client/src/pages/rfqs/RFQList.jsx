import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FileSpreadsheet, Search, Plus, Calendar, BadgeAlert, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

const RFQList = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rfqs', {
        params: {
          search,
          status: statusFilter,
        },
      });
      setRfqs(response.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load RFQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, [search, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'draft':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      case 'closed':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'awarded':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-850 text-zinc-500 border-zinc-800';
    }
  };

  const isOfficerOrAdmin = user.role === 'admin' || user.role === 'procurement_officer';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Requests for Quotations (RFQ)</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isOfficerOrAdmin
              ? 'Draft, publish, monitor, and compare bids submitted by vendors.'
              : 'View requests you have been invited to bid on and submit your proposals.'}
          </p>
        </div>

        {isOfficerOrAdmin && (
          <Link
            to="/rfqs/create"
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-sm transition-all cursor-pointer shadow-md glow-green"
          >
            <Plus className="w-4 h-4" />
            New RFQ
          </Link>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        {/* Status filters (Officer only, vendors see only published/closed) */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-850 text-zinc-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {isOfficerOrAdmin && <option value="draft">Draft</option>}
            <option value="published">Published (Active)</option>
            <option value="closed">Closed</option>
            <option value="awarded">Awarded</option>
            {isOfficerOrAdmin && <option value="cancelled">Cancelled</option>}
          </select>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by RFQ title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-850 rounded-lg pl-9 pr-4 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      ) : rfqs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rfqs.map((rfq) => {
            const isDeadlinePassed = new Date(rfq.deadline) < new Date();
            const itemCount = rfq._count?.items || 0;
            const vendorCount = rfq._count?.rfqVendors || 0;
            const quoteCount = rfq._count?.quotations || 0;

            return (
              <div
                key={rfq.id}
                className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 hover:border-zinc-850 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top line: status badge */}
                  <div className="flex justify-between items-start">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold uppercase border ${getStatusBadge(rfq.status)}`}>
                      {rfq.status}
                    </span>
                    {isDeadlinePassed && rfq.status === 'published' && (
                      <span className="flex items-center gap-0.5 text-3xs font-bold text-red-500 uppercase">
                        <BadgeAlert className="w-3.5 h-3.5" />
                        Deadline Passed
                      </span>
                    )}
                  </div>

                  {/* Title & info */}
                  <div>
                    <h3 className="font-bold text-zinc-100 text-base group-hover:text-brand-500 transition-colors truncate">
                      <Link to={`/rfqs/${rfq.id}`}>{rfq.title}</Link>
                    </h3>
                    <p className="text-2xs text-zinc-500 mt-1 truncate">{rfq.description || 'No description provided.'}</p>
                  </div>

                  {/* Metrics details */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-850 bg-zinc-950/20 rounded-lg text-center">
                    <div>
                      <span className="block text-zinc-500 text-3xs uppercase font-semibold">Lines</span>
                      <strong className="text-zinc-200 text-sm font-bold">{itemCount}</strong>
                    </div>
                    <div>
                      <span className="block text-zinc-500 text-3xs uppercase font-semibold">Invited</span>
                      <strong className="text-zinc-200 text-sm font-bold">{vendorCount}</strong>
                    </div>
                    <div>
                      <span className="block text-zinc-500 text-3xs uppercase font-semibold">Bids</span>
                      <strong className="text-brand-500 text-sm font-bold">{quoteCount}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-850/60 flex items-center justify-between text-2xs text-zinc-450">
                  {/* Deadline date */}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Due {new Date(rfq.deadline).toLocaleDateString()}
                  </span>

                  {/* Link action */}
                  <Link
                    to={`/rfqs/${rfq.id}`}
                    className="text-brand-500 hover:text-brand-400 font-bold flex items-center gap-0.5"
                  >
                    View Details
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center bg-zinc-900/10 border border-zinc-900 p-12 rounded-xl">
          <FileSpreadsheet className="w-10 h-10 text-zinc-650 mx-auto mb-4" />
          <h3 className="font-bold text-zinc-300 text-base">No Requests Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">No requests match the criteria, or you haven't been invited to any active RFQs.</p>
        </div>
      )}
    </div>
  );
};

export default RFQList;
