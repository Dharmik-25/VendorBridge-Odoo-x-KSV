import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  UserX,
  Star,
  Globe,
  Tag,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import toast from 'react-hot-toast';

const VendorList = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('All'); // All, approved, pending, suspended/rejected
  
  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('IT');
  const [gstNumber, setGstNumber] = useState('');
  const [country, setCountry] = useState('India');

  const fetchVendors = async () => {
    setLoading(true);
    try {
      let statusFilter = '';
      if (selectedTab === 'Active') statusFilter = 'approved';
      if (selectedTab === 'Pending') statusFilter = 'pending';
      if (selectedTab === 'Inactive') statusFilter = 'suspended';

      const response = await api.get('/vendors', {
        params: {
          search,
          status: statusFilter,
        },
      });
      setVendors(response.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, selectedTab]);

  // Check URL params to auto-open create modal
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateModalOpen(true);
      // Clean query parameter after opening
      setSearchParams({});
    }
  }, [searchParams]);

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!name || !email || !category) {
      toast.error('Please enter name, email and category');
      return;
    }

    try {
      await api.post('/vendors', { name, email, phone, category, gstNumber, country });
      toast.success('Vendor added successfully');
      setCreateModalOpen(false);
      resetForm();
      fetchVendors();
    } catch (err) {
      toast.error(err.message || 'Failed to create vendor');
    }
  };

  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setName(vendor.name);
    setEmail(vendor.email);
    setPhone(vendor.phone || '');
    setCategory(vendor.category || 'IT');
    setGstNumber(vendor.gstNumber || '');
    setCountry(vendor.country || 'India');
    setEditModalOpen(true);
  };

  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/vendors/${selectedVendor.id}`, { name, email, phone, category, gstNumber, country });
      toast.success('Vendor details updated');
      setEditModalOpen(false);
      resetForm();
      fetchVendors();
    } catch (err) {
      toast.error(err.message || 'Failed to update vendor');
    }
  };

  const handleDeleteVendor = async (id) => {
    if (!window.confirm('Are you sure you want to suspend this vendor? This will soft-delete their profile.')) return;
    try {
      await api.delete(`/vendors/${id}`);
      toast.success('Vendor profile suspended');
      fetchVendors();
    } catch (err) {
      toast.error(err.message || 'Failed to suspend vendor');
    }
  };

  const handleApproveVendor = async (id) => {
    try {
      await api.put(`/vendors/${id}/approve`);
      toast.success('Vendor status set to Approved');
      fetchVendors();
    } catch (err) {
      toast.error(err.message || 'Failed to approve vendor');
    }
  };

  const handleRejectVendor = async (id) => {
    try {
      await api.put(`/vendors/${id}/reject`);
      toast.success('Vendor status set to Rejected');
      fetchVendors();
    } catch (err) {
      toast.error(err.message || 'Failed to reject vendor');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCategory('IT');
    setGstNumber('');
    setCountry('India');
    setSelectedVendor(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'suspended':
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Vendor Management</h1>
          <p className="text-xs text-zinc-500 mt-1">Add, review, edit, and approve supplier database profiles.</p>
        </div>

        <button
          onClick={() => { resetForm(); setCreateModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Tabs list & search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        {/* Category Tabs */}
        <div className="flex gap-1 bg-zinc-950 p-1 border border-zinc-900 rounded-lg max-w-sm">
          {['All', 'Active', 'Pending', 'Inactive'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                selectedTab === tab
                  ? 'bg-zinc-900 border border-zinc-800 text-brand-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-850 rounded-lg pl-9 pr-4 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Database Listing Table */}
      <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <table className="w-full text-left text-zinc-350 text-xs md:text-sm">
            <thead className="text-3xs md:text-2xs uppercase tracking-wider text-zinc-500 bg-zinc-950/50">
              <tr>
                <th className="py-3.5 px-4 border-b border-zinc-900">Name & Rating</th>
                <th className="py-3.5 px-4 border-b border-zinc-900">Contact Details</th>
                <th className="py-3.5 px-4 border-b border-zinc-900">Category</th>
                <th className="py-3.5 px-4 border-b border-zinc-900">GST Number</th>
                <th className="py-3.5 px-4 border-b border-zinc-900 text-center">Status</th>
                <th className="py-3.5 px-4 border-b border-zinc-900 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-zinc-900/10 transition-colors">
                    {/* Name & rating */}
                    <td className="py-3 px-4 border-b border-zinc-900">
                      <div>
                        <div className="font-bold text-zinc-100 text-sm">{vendor.name}</div>
                        <div className="flex items-center gap-1 text-2xs mt-1 text-zinc-500">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>Rating: <strong>{parseFloat(vendor.rating).toFixed(1)}</strong></span>
                          <span className="mx-1">•</span>
                          <Globe className="w-3 h-3 text-zinc-500" />
                          <span>{vendor.country}</span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 border-b border-zinc-900 space-y-0.5 text-2xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{vendor.email}</span>
                      </div>
                      {vendor.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 border-b border-zinc-900">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-850 text-2xs text-brand-500 font-semibold uppercase">
                        <Tag className="w-2.5 h-2.5 text-brand-500" />
                        {vendor.category}
                      </span>
                    </td>

                    {/* GSTIN */}
                    <td className="py-3 px-4 border-b border-zinc-900 font-mono text-zinc-400 text-2xs">
                      {vendor.gstNumber || 'N/A'}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4 border-b border-zinc-900 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold uppercase border ${getStatusBadge(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>

                    {/* Actions column */}
                    <td className="py-3 px-4 border-b border-zinc-900 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Approval workflow buttons for pending suppliers (Admin only) */}
                        {vendor.status === 'pending' && user.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleApproveVendor(vendor.id)}
                              className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded border border-green-500/20 cursor-pointer"
                              title="Approve Profile"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRejectVendor(vendor.id)}
                              className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded border border-red-500/20 cursor-pointer"
                              title="Reject Profile"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* General modifications */}
                        <button
                          onClick={() => handleEditVendor(vendor)}
                          className="p-1.5 hover:bg-zinc-800 text-zinc-450 hover:text-zinc-200 rounded border border-transparent hover:border-zinc-700 cursor-pointer"
                          title="Edit Info"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Suspension soft-delete (Admin only) */}
                        {vendor.status !== 'suspended' && user.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteVendor(vendor.id)}
                            className="p-1.5 hover:bg-zinc-800 text-red-500/70 hover:text-red-400 rounded border border-transparent hover:border-zinc-750 cursor-pointer"
                            title="Suspend Vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-zinc-500 text-sm">
                    No supplier profiles match the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create Vendor */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl">
            <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-850">
              <h3 className="font-bold text-zinc-200 text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-brand-500" />
                Add Vendor Profile
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Supplier / Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Office Solutions"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@acme.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Phone (10 digits)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength="10"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Supplier Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="IT">IT Infrastructure</option>
                    <option value="Furniture">Office Furniture</option>
                    <option value="Logistics">Supply & Logistics</option>
                    <option value="Stationery">Print & Stationery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">GST Number (Indian format)</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="27ABCDE1234F1Z5"
                    maxLength="15"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Add Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Vendor */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl">
            <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-850">
              <h3 className="font-bold text-zinc-200 text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-brand-500" />
                Edit Supplier Info
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Supplier / Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength="10"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="IT">IT Infrastructure</option>
                    <option value="Furniture">Office Furniture</option>
                    <option value="Logistics">Supply & Logistics</option>
                    <option value="Stationery">Print & Stationery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">GST Number</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    maxLength="15"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;
