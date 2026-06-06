import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileSpreadsheet,
  Calendar,
  Layers,
  Users,
  BadgeCent,
  CheckCircle,
  Plus,
  Send,
  Sparkles,
  ChevronLeft,
  XCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const RFQDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [approvedVendors, setApprovedVendors] = useState([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedInviteIds, setSelectedInviteIds] = useState([]);

  const fetchRFQDetails = async () => {
    try {
      const response = await api.get(`/rfqs/${id}`);
      setRfq(response.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load RFQ details');
      navigate('/rfqs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/vendors', { params: { status: 'approved' } });
      setApprovedVendors(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRFQDetails();
    if (user.role === 'admin' || user.role === 'procurement_officer') {
      fetchSuppliers();
    }
  }, [id]);

  const handlePublish = async () => {
    try {
      await api.put(`/rfqs/${id}/publish`);
      toast.success('RFQ published successfully');
      fetchRFQDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to publish RFQ');
    }
  };

  const handleClose = async () => {
    try {
      await api.put(`/rfqs/${id}/close`);
      toast.success('RFQ closed successfully');
      fetchRFQDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to close RFQ');
    }
  };

  const handleSendInvitations = async (e) => {
    e.preventDefault();
    if (selectedInviteIds.length === 0) {
      toast.error('Select at least one vendor');
      return;
    }

    setInviting(true);
    try {
      await api.post(`/rfqs/${id}/invite-vendors`, { vendorIds: selectedInviteIds });
      toast.success('Suppliers invited successfully');
      setInviteModalOpen(false);
      setSelectedInviteIds([]);
      fetchRFQDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to send invitations');
    } finally {
      setInviting(false);
    }
  };

  const toggleInviteSelection = (vId) => {
    if (selectedInviteIds.includes(vId)) {
      setSelectedInviteIds(selectedInviteIds.filter((id) => id !== vId));
    } else {
      setSelectedInviteIds([...selectedInviteIds, vId]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!rfq) return null;

  const isDeadlinePassed = new Date(rfq.deadline) < new Date();
  const isOfficerOrAdmin = user.role === 'admin' || user.role === 'procurement_officer';
  const hasQuotations = rfq.quotations && rfq.quotations.length > 0;
  
  // Find vendor's own quotation if role is vendor
  const myQuote = user.role === 'vendor' && rfq.quotations ? rfq.quotations[0] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back link */}
      <Link to="/rfqs" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-350 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to RFQ list
      </Link>

      {/* Header card details */}
      <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded text-3xs font-bold uppercase border ${
              rfq.status === 'published'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : rfq.status === 'draft'
                ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {rfq.status}
            </span>

            {isDeadlinePassed && rfq.status === 'published' && (
              <span className="flex items-center gap-1 text-red-500 text-3xs font-bold uppercase">
                <Clock className="w-3.5 h-3.5" />
                Submission Deadline Passed
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">{rfq.title}</h1>
          <p className="text-sm text-zinc-400">{rfq.description || 'No description provided.'}</p>

          <div className="flex items-center gap-6 text-2xs text-zinc-500">
            <span>Created: <strong>{new Date(rfq.createdAt).toLocaleDateString()}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Deadline: <strong className="text-zinc-350">{new Date(rfq.deadline).toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Officer/Admin Actions */}
          {isOfficerOrAdmin && (
            <>
              {rfq.status === 'draft' && (
                <button
                  onClick={handlePublish}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-xs transition-colors shadow-md glow-green cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Publish RFQ
                </button>
              )}

              {rfq.status === 'published' && (
                <>
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Invite suppliers
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Close RFQ
                  </button>
                </>
              )}

              {rfq.status !== 'draft' && hasQuotations && (
                <Link
                  to={`/rfqs/${rfq.id}/compare`}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-xs transition-colors shadow-md glow-green cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Compare Quotations
                </Link>
              )}
            </>
          )}

          {/* Vendor specific action */}
          {user.role === 'vendor' && rfq.status === 'published' && !isDeadlinePassed && (
            myQuote ? (
              <Link
                to={`/quotations/${myQuote.id}/edit`}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-100 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Modify Submitted Quotation (₹{parseFloat(myQuote.items?.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0) || 0).toLocaleString()})
              </Link>
            ) : (
              <Link
                to={`/rfqs/${rfq.id}/submit-quotation`}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-xs transition-colors shadow-md glow-green cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Submit Quotation
              </Link>
            )
          )}
        </div>
      </div>

      {/* Main Grid: line items and invited list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Line Items details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-500" />
              Line Items Required
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-zinc-300 text-xs sm:text-sm">
                <thead className="text-3xs uppercase tracking-wider text-zinc-500 bg-zinc-950/40">
                  <tr>
                    <th className="py-2.5 px-4 border-b border-zinc-900">#</th>
                    <th className="py-2.5 px-4 border-b border-zinc-900">Description</th>
                    <th className="py-2.5 px-4 border-b border-zinc-900 text-center">Quantity</th>
                    <th className="py-2.5 px-4 border-b border-zinc-900">Unit</th>
                    <th className="py-2.5 px-4 border-b border-zinc-900">Specifications</th>
                  </tr>
                </thead>
                <tbody>
                  {rfq.items && rfq.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-zinc-900/10">
                      <td className="py-3 px-4 border-b border-zinc-900 text-zinc-500 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-4 border-b border-zinc-900 font-medium text-zinc-200">{item.productName}</td>
                      <td className="py-3 px-4 border-b border-zinc-900 text-center font-bold text-brand-500">{parseFloat(item.quantity)}</td>
                      <td className="py-3 px-4 border-b border-zinc-900 text-zinc-400">{item.unit}</td>
                      <td className="py-3 px-4 border-b border-zinc-900 text-zinc-500 text-2xs italic">{item.specifications || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Invited vendors list (Officers only) */}
        {isOfficerOrAdmin && (
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-500" />
              Invited Suppliers ({rfq.rfqVendors?.length || 0})
            </h3>

            <div className="space-y-3">
              {rfq.rfqVendors && rfq.rfqVendors.length > 0 ? (
                rfq.rfqVendors.map((rv) => (
                  <div key={rv.id} className="bg-zinc-950/60 border border-zinc-900/80 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-200 text-xs">{rv.vendor.name}</div>
                      <div className="text-3xs text-zinc-500 mt-0.5">{rv.vendor.email}</div>
                    </div>
                    {/* Tick for vendor registration status */}
                    <span className="text-brand-500" title="Invitation Notification Sent">
                      <CheckCircle className="w-4 h-4" />
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-650 text-xs py-4 text-center">No vendors invited. Use Invite button.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Invite vendors dialog */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl">
            <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-850">
              <h3 className="font-bold text-zinc-200 text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-500" />
                Invite Supplier Partners
              </h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvitations} className="p-6 space-y-4">
              <p className="text-2xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Approved supplier database:</p>
              
              <div className="max-h-60 overflow-y-auto space-y-2.5 pr-2">
                {approvedVendors
                  // Filter out already invited vendors
                  .filter((v) => !rfq.rfqVendors.some((rv) => rv.vendorId === v.id))
                  .map((v) => {
                    const isChecked = selectedInviteIds.includes(v.id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => toggleInviteSelection(v.id)}
                        className={`border p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked ? 'border-brand-500/40 bg-brand-500/5' : 'border-zinc-850 bg-zinc-950/40'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-zinc-200 text-xs">{v.name}</div>
                          <div className="text-3xs text-zinc-500">{v.email} ({v.category})</div>
                        </div>

                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? 'bg-brand-500 border-brand-600 text-zinc-950' : 'border-zinc-800 bg-zinc-900'
                        }`}>
                          {isChecked && <CheckCircle className="w-3 h-3 text-zinc-950" />}
                        </div>
                      </div>
                    );
                  })}

                {approvedVendors.filter((v) => !rfq.rfqVendors.some((rv) => rv.vendorId === v.id)).length === 0 && (
                  <div className="text-center py-6 text-zinc-600 text-xs">All approved supplier accounts have already been invited.</div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {inviting ? 'Inviting...' : 'Send Invitations'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQDetail;
