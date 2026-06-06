import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  FileText,
  Calendar,
  Layers,
  Users,
  CheckCircle,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const RFQCreate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [vendors, setVendors] = useState([]);

  // RFQ Basic Details Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  // RFQ Line Items Form State
  const [items, setItems] = useState([
    { productName: '', quantity: 1, unit: 'pcs', specifications: '' },
  ]);

  // RFQ Assign Vendors Form State
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);

  useEffect(() => {
    // Fetch approved vendors list for multi-select
    const fetchApprovedVendors = async () => {
      try {
        const res = await api.get('/vendors', { params: { status: 'approved' } });
        setVendors(res.data.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load supplier list');
      }
    };
    fetchApprovedVendors();
  }, []);

  const addLineItem = () => {
    setItems([...items, { productName: '', quantity: 1, unit: 'pcs', specifications: '' }]);
  };

  const removeLineItem = (index) => {
    if (items.length === 1) {
      toast.error('RFQ must contain at least one line item');
      return;
    }
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (field === 'quantity') {
      newItems[index][field] = Math.max(1, parseFloat(value) || 1);
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const toggleVendorSelection = (id) => {
    if (selectedVendorIds.includes(id)) {
      setSelectedVendorIds(selectedVendorIds.filter((vId) => vId !== id));
    } else {
      setSelectedVendorIds([...selectedVendorIds, id]);
    }
  };

  const validateStep1 = () => {
    if (!title || title.trim().length < 5) {
      toast.error('Title is required and must be at least 5 characters');
      return false;
    }
    if (!deadline) {
      toast.error('Please specify a submission deadline');
      return false;
    }
    if (new Date(deadline) <= new Date()) {
      toast.error('Deadline must be a valid future date');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productName || items[i].productName.trim() === '') {
        toast.error(`Line item #${i + 1} must have a product/service description`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handlePrev = () => {
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = async () => {
    if (selectedVendorIds.length === 0) {
      toast.error('Please assign at least one vendor to this RFQ');
      return;
    }

    try {
      const res = await api.post('/rfqs', {
        title,
        description,
        deadline,
        items,
        vendorIds: selectedVendorIds,
      });

      // Auto publish RFQ
      await api.put(`/rfqs/${res.data.data.id}/publish`);
      toast.success('RFQ published successfully & vendors notified!');
      navigate('/rfqs');
    } catch (err) {
      toast.error(err.message || 'Failed to submit RFQ');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Create Request for Quotation (RFQ)</h1>
        <p className="text-xs text-zinc-500 mt-1">Configure line items and solicit bids from vendors.</p>
      </div>

      {/* Progress tracker wizard */}
      <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-900 rounded-xl p-4">
        {/* Step 1 */}
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            step >= 1 ? 'bg-brand-500 text-zinc-950 glow-green' : 'bg-zinc-800 text-zinc-500'
          }`}>
            1
          </span>
          <span className={`text-xs font-semibold ${step === 1 ? 'text-zinc-200' : 'text-zinc-500'}`}>RFQ Details</span>
        </div>
        <div className="h-px bg-zinc-850 flex-1 mx-4"></div>
        {/* Step 2 */}
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            step >= 2 ? 'bg-brand-500 text-zinc-950 glow-green' : 'bg-zinc-800 text-zinc-500'
          }`}>
            2
          </span>
          <span className={`text-xs font-semibold ${step === 2 ? 'text-zinc-200' : 'text-zinc-500'}`}>Line Items</span>
        </div>
        <div className="h-px bg-zinc-850 flex-1 mx-4"></div>
        {/* Step 3 */}
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            step >= 3 ? 'bg-brand-500 text-zinc-950 glow-green' : 'bg-zinc-800 text-zinc-500'
          }`}>
            3
          </span>
          <span className={`text-xs font-semibold ${step === 3 ? 'text-zinc-200' : 'text-zinc-500'}`}>Invite Vendors</span>
        </div>
      </div>

      {/* Step panels content */}
      <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6">
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-500" />
              RFQ Specifications
            </h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">RFQ Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q3 Office Desk Procurement"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Detailed Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter scope of work, technical specifications, quality standards..."
                rows="4"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Submission Deadline</label>
              <div className="relative max-w-xs">
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors appearance-none cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-500" />
                Procurement Items List
              </h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 px-3 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-xs rounded-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-lg space-y-4 relative group">
                  {/* Remove line action */}
                  <button
                    type="button"
                    onClick={() => removeLineItem(idx)}
                    className="absolute top-4 right-4 text-zinc-600 hover:text-red-400"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-zinc-500 font-semibold text-xs">Item Line #{idx + 1}</div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Item Description */}
                    <div className="md:col-span-6">
                      <label className="block text-3xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Product Name / Description</label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                        placeholder="Executive Office Chair"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-3">
                      <label className="block text-3xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                        required
                      />
                    </div>

                    {/* Unit */}
                    <div className="md:col-span-3">
                      <label className="block text-3xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Unit</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        placeholder="pcs, box, sets"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Specifications details */}
                  <div>
                    <label className="block text-3xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Item Specifications / Remarks (Optional)</label>
                    <input
                      type="text"
                      value={item.specifications || ''}
                      onChange={(e) => handleItemChange(idx, 'specifications', e.target.value)}
                      placeholder="Mesh back, lumbar support, tilt locks, black color"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-500" />
              Assign & Invite Suppliers
            </h3>

            {vendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendors.map((v) => {
                  const isChecked = selectedVendorIds.includes(v.id);
                  return (
                    <div
                      key={v.id}
                      onClick={() => toggleVendorSelection(v.id)}
                      className={`border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-zinc-900/30 ${
                        isChecked
                          ? 'border-brand-500/40 bg-brand-500/5 glow-green'
                          : 'border-zinc-900 bg-zinc-950/40'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-zinc-200 text-xs sm:text-sm">{v.name}</div>
                        <div className="text-3xs text-zinc-500 mt-1 flex items-center gap-1.5 uppercase">
                          <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-semibold">{v.category}</span>
                          <span>Rating: <strong>{parseFloat(v.rating).toFixed(1)}</strong></span>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-brand-500 border-brand-600 text-zinc-950' : 'border-zinc-800 bg-zinc-900'
                      }`}>
                        {isChecked && <CheckCircle className="w-4 h-4 text-zinc-950" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-650 text-sm">
                No approved vendors registered in the database. Add suppliers first.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons footer */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className="flex items-center gap-1 px-4 py-2 border border-zinc-800 hover:bg-zinc-850 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-zinc-300 font-semibold text-xs cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {step < 3 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-xs cursor-pointer transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1 px-5 py-2 bg-brand-600 hover:bg-brand-500 text-zinc-950 font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-md glow-green"
          >
            Publish RFQ
          </button>
        )}
      </div>
    </div>
  );
};

export default RFQCreate;
