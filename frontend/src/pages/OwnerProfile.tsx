import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Store,
  Tag,
  QrCode,
  Save,
  Check,
  Plus,
  Trash2,
  Edit2,
  Printer,
  ExternalLink,
  Loader2,
  Clock,
  MapPin,
  Phone,
  User
} from 'lucide-react';

interface ServicePreset {
  _id?: string;
  name: string;
  unit: string;
  rate: number;
}

export const OwnerProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'services' | 'qr'>('general');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab 1: General Details
  const [shopName, setShopName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [operatingHours, setOperatingHours] = useState<string>('9:00 AM - 8:00 PM');
  const [businessType, setBusinessType] = useState<string>('Flour Mill');
  const [shopIdSlug, setShopIdSlug] = useState<string>('');

  // Tab 2: Services & Pricing Presets
  const [services, setServices] = useState<ServicePreset[]>([]);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceUnit, setNewServiceUnit] = useState<string>('kg');
  const [newServiceRate, setNewServiceRate] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.get('/shop/profile');
      setShopName(data?.shopName || 'My Shop');
      setOwnerName(data?.ownerName || 'Owner');
      setPhone(data?.phone || '');
      setAddress(data?.address || '');
      setOperatingHours(data?.operatingHours || '9:00 AM - 8:00 PM');
      setBusinessType(data?.businessType || 'Flour Mill');
      setShopIdSlug(data?.slug || data?.shopId || '');

      if (data?.services && Array.isArray(data.services)) {
        setServices(data.services.map((s: any) => ({
          name: s?.name || '',
          unit: s?.unit || 'kg',
          rate: typeof s?.rate === 'number' ? s.rate : (parseFloat(s?.rate) || 0)
        })));
      }
    } catch (err: any) {
      console.error('Failed to load shop profile:', err);
      setErrorMessage('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage(null);

      const payload = {
        shopName,
        ownerName,
        phone,
        address,
        operatingHours,
        businessType,
        services
      };

      const res = await api.put('/shop/profile', payload);
      showToast(res.message || 'Profile changes saved successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  // Add or Edit Preset
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const rateNum = parseFloat(newServiceRate) || 0;
    const newPreset: ServicePreset = {
      name: newServiceName.trim(),
      unit: newServiceUnit.trim() || 'kg',
      rate: rateNum
    };

    if (editingIndex !== null) {
      const updated = [...services];
      updated[editingIndex] = newPreset;
      setServices(updated);
      setEditingIndex(null);
    } else {
      setServices(prev => [...prev, newPreset]);
    }

    setNewServiceName('');
    setNewServiceRate('');
    setNewServiceUnit('kg');
  };

  const handleEditService = (index: number) => {
    const item = services[index];
    setNewServiceName(item.name);
    setNewServiceUnit(item.unit);
    setNewServiceRate(item.rate.toString());
    setEditingIndex(index);
  };

  const handleDeleteService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setNewServiceName('');
      setNewServiceRate('');
    }
  };

  // QR Print Standee Window Generator
  const handlePrintStandee = () => {
    const customerSubmissionUrl = `${window.location.origin}/shop/${shopIdSlug}/submit`;
    const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(customerSubmissionUrl)}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download/print the counter standee.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${shopName} - Customer Counter Standee</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 40px;
              background-color: #f4f4f5;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .standee-card {
              background: #ffffff;
              width: 380px;
              border-radius: 28px;
              padding: 36px 28px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.12);
              text-align: center;
              border: 2px solid #e4e4e7;
            }
            .brand-pill {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: #ecfdf5;
              color: #059669;
              font-weight: 800;
              font-size: 11px;
              padding: 6px 14px;
              border-radius: 999px;
              border: 1px solid #a7f3d0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .shop-title {
              font-size: 24px;
              font-weight: 900;
              color: #09090b;
              margin: 16px 0 4px 0;
              letter-spacing: -0.5px;
            }
            .business-type {
              font-size: 12px;
              font-weight: 600;
              color: #71717a;
              margin-bottom: 24px;
            }
            .qr-wrapper {
              background: #ffffff;
              border: 2px solid #18181b;
              padding: 16px;
              border-radius: 20px;
              display: inline-block;
              margin-bottom: 24px;
            }
            .qr-wrapper img {
              width: 220px;
              height: 220px;
              display: block;
            }
            .instruction {
              font-size: 13px;
              font-weight: 700;
              color: #18181b;
              margin-bottom: 6px;
            }
            .sub-instruction {
              font-size: 11px;
              color: #71717a;
              line-height: 1.4;
              margin-bottom: 20px;
            }
            .footer-url {
              font-size: 10px;
              font-weight: 700;
              color: #059669;
              background: #f0fdf4;
              padding: 8px 12px;
              border-radius: 12px;
              word-break: break-all;
            }
            @media print {
              body { background: white; padding: 0; }
              .standee-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="standee-card">
            <div class="brand-pill">⚡ NotifyWork Express</div>
            <h1 class="shop-title">${shopName}</h1>
            <p class="business-type">${businessType} • Quick Order Drop</p>

            <div class="qr-wrapper">
              <img src="${qrImageSrc}" alt="Customer Submission QR Code" />
            </div>

            <p class="instruction">📷 Scan with Smartphone Camera</p>
            <p class="sub-instruction">Scan to submit your item details &amp; receive live status notifications when ready.</p>

            <div class="footer-url">${customerSubmissionUrl}</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const customerSubmissionUrl = `${window.location.origin}/shop/${shopIdSlug}/submit`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Loading Shop Profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header Breadcrumb */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group mb-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Shop Settings &amp; Profile</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage shop details, pricing presets, and QR standee.</p>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in">
          <Check className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
          <span>⚠</span> {errorMessage}
        </div>
      )}

      {/* Sleek Tabbed Navigation Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <Store className="w-4 h-4" /> General Details
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'services'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <Tag className="w-4 h-4" /> Services &amp; Pricing
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'qr'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <QrCode className="w-4 h-4" /> QR &amp; Share
        </button>
      </div>

      {/* TAB CONTENT PANELS */}
      <form onSubmit={handleSaveProfile} className="space-y-6">

        {/* ── TAB 1: GENERAL DETAILS ── */}
        {activeTab === 'general' && (
          <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2">Shop Profile Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shop Name */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Shop Name
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Owner Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Owner Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Business Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Operating Hours */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Operating Hours
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="e.g. 9:00 AM - 8:00 PM (Mon-Sat)"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                  />
                </div>
              </div>

              {/* Business Type */}
              {/* Business Type (Read Only) */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Business Category
                </label>
                <input
                  type="text"
                  value="Flour Mill"
                  disabled
                  readOnly
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                />
              </div>

              {/* Shop URL Slug (Read Only) */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Custom QR URL Slug
                </label>
                <input
                  type="text"
                  value={shopIdSlug}
                  disabled
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 rounded-xl text-xs font-mono font-semibold text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                Shop Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-900 text-xs font-bold rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save General Details
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: SERVICES & PRICING PRESETS ── */}
        {activeTab === 'services' && (
          <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-1">Services &amp; Pricing Presets</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Add common grinding/milling items and default rate pricing. These will auto-suggest when logging new requests.</p>
            </div>

            {/* Add / Edit Form */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {editingIndex !== null ? 'Edit Service Preset' : 'Add New Service Preset'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Wheat Atta)"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />

                <select
                  value={newServiceUnit}
                  onChange={(e) => setNewServiceUnit(e.target.value)}
                  className="px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="kg">kg (Kilogram)</option>
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="meter">meter</option>
                  <option value="pair">pair</option>
                </select>

                <input
                  type="number"
                  step="0.5"
                  placeholder="Rate (₹ per unit)"
                  value={newServiceRate}
                  onChange={(e) => setNewServiceRate(e.target.value)}
                  className="px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddService}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {editingIndex !== null ? 'Update Item' : 'Add Item Preset'}
                </button>
                {editingIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(null);
                      setNewServiceName('');
                      setNewServiceRate('');
                    }}
                    className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Presets Table / List */}
            {services.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No preset items added yet. Use the form above to add your first service preset.</p>
            ) : (
              <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800">
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Item Name</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Default Unit</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Rate (₹)</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {services.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                        <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">{item.unit}</td>
                        <td className="px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{item.rate} / {item.unit}</td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleEditService(idx)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(idx)}
                            className="p-1.5 text-rose-500 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-900 text-xs font-bold rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Presets...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Presets &amp; Rates
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 4: PRINTABLE QR CODE STANDEE HUB ── */}
        {activeTab === 'qr' && (
          <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-1">Printable Counter Standee Hub</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">High-resolution QR code standee poster for your shop counter. Customers scan to leave work items and track order status.</p>
            </div>

            {/* Standee Poster Preview */}
            <div className="flex flex-col items-center justify-center p-6 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl">
              <div className="bg-white text-zinc-900 p-8 rounded-3xl shadow-2xl border-2 border-zinc-900 max-w-sm w-full text-center space-y-4">
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-300">
                  ⚡ NotifyWork Express
                </div>

                <div>
                  <h3 className="text-xl font-black tracking-tight text-zinc-900 leading-tight">{shopName || 'Sharma Flour Mill'}</h3>
                  <p className="text-xs font-semibold text-zinc-500 mt-0.5">{businessType} • Quick Order Drop</p>
                </div>

                <div className="bg-white p-3 border-2 border-zinc-900 rounded-2xl inline-block shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(customerSubmissionUrl)}`}
                    alt="Counter Standee QR Code"
                    className="w-52 h-52 mx-auto"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold text-zinc-900 flex items-center justify-center gap-1.5">
                    📷 Scan with Smartphone Camera
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    Submit item details &amp; receive instant notifications when ready for pickup.
                  </p>
                </div>

                <div className="bg-emerald-50 text-emerald-800 text-[10px] font-bold py-2 px-3 rounded-xl border border-emerald-200 break-all">
                  {customerSubmissionUrl}
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handlePrintStandee}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Download / Print Counter Standee
                </button>

                <a
                  href={customerSubmissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
                >
                  Test Submission URL <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};
