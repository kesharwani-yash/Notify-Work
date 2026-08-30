import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ThemeToggle } from '../components/ThemeToggle';
import { Flame, Landmark, Loader2, ArrowRight, User, Phone, Package, Ruler, MessageSquare } from 'lucide-react';

// ─── Business-Type Schema Map ───────────────────────────────────────────────
interface BusinessSchema {
  itemLabel: string;
  unitLabel: string;
  itemPlaceholder: string;
  unitPlaceholder: string;
  presets: string[];
}

const BUSINESS_SCHEMAS: Record<string, BusinessSchema> = {
  flour_mill: {
    itemLabel: 'Grain Type',
    unitLabel: 'Weight (kg)',
    itemPlaceholder: 'e.g. Wheat, Mustard, Gram',
    unitPlaceholder: 'e.g. 15.5',
    presets: ['Wheat', 'Mustard', 'Gram Flour', 'Bajra', 'Rice', 'Multigrain'],
  },
  tailor: {
    itemLabel: 'Apparel Type',
    unitLabel: 'Quantity / Code',
    itemPlaceholder: 'e.g. Suit, Shirt, Trousers',
    unitPlaceholder: 'e.g. 2 or SKU-01',
    presets: ['Suit', 'Shirt', 'Trousers', 'Kurta', 'Salwar Kameez', 'Blouse'],
  },
  repair: {
    itemLabel: 'Device Name',
    unitLabel: 'Serial / Model No.',
    itemPlaceholder: 'e.g. Mobile Screen, Laptop Battery',
    unitPlaceholder: 'e.g. SM-G991B',
    presets: ['Mobile Screen', 'Laptop Battery', 'Charger Port', 'Speaker', 'Camera Module'],
  },
};

const DEFAULT_SCHEMA: BusinessSchema = {
  itemLabel: 'Item Type',
  unitLabel: 'Quantity / Weight',
  itemPlaceholder: 'Describe the item',
  unitPlaceholder: 'e.g. 10',
  presets: [],
};

function getSchema(businessType: string): BusinessSchema {
  const key = businessType.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  return BUSINESS_SCHEMAS[key] ?? DEFAULT_SCHEMA;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface ServicePreset {
  name: string;
  unit: string;
  rate: number;
}

interface ShopDetails {
  _id: string;
  shopName: string;
  phone: string;
  address: string;
  businessType: string;
  services?: ServicePreset[];
}

interface FormErrors {
  name?: string;
  phone?: string;
  item?: string;
  weight?: string;
}

// ─── Validation helpers ───────────────────────────────────────────────────────
function validatePhone(value: string): string | undefined {
  const digits = value.replace(/\D/g, '');
  if (!value.trim()) return 'Phone number is required.';
  if (digits.length < 10) return 'Must be at least 10 digits.';
  if (digits.length > 13) return 'Too many digits — check the number.';
  return undefined;
}

function validate(fields: { name: string; phone: string; item: string; weight: string }): FormErrors {
  const errors: FormErrors = {};
  if (!fields.name.trim()) errors.name = 'Name is required.';
  const phoneErr = validatePhone(fields.phone);
  if (phoneErr) errors.phone = phoneErr;
  if (!fields.item.trim()) errors.item = 'This field is required.';
  if (!fields.weight.trim()) errors.weight = 'This field is required.';
  return errors;
}

// ─── Reusable Field Component ────────────────────────────────────────────────
interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
const Field: React.FC<FieldProps> = ({ id, label, required, error, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
      {label}
      {required && <span className="text-red-400 font-bold">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

const inputBase = (hasError: boolean) =>
  `w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500
   focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all duration-150
   ${hasError
    ? 'border-red-300 dark:border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-500/10'
    : 'border-zinc-200/80 dark:border-zinc-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
  }`;

// ─── Main Component ───────────────────────────────────────────────────────────
export const SubmitOrder: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [loadingShop, setLoadingShop] = useState<boolean>(true);
  const [errorShop, setErrorShop] = useState<string>('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [item, setItem] = useState('');
  const [weight, setWeight] = useState('');
  const [remarks, setRemarks] = useState('');

  // Validation
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch shop by slug
  useEffect(() => {
    if (!shopId) return;
    const fetchShop = async () => {
      try {
        setLoadingShop(true);
        const data = await api.get<ShopDetails>(`/shops/${shopId}`);
        setShop(data);
      } catch (err: any) {
        setErrorShop(err.message || 'Could not load business details.');
      } finally {
        setLoadingShop(false);
      }
    };
    fetchShop();
  }, [shopId]);

  // Re-validate on any field change
  useEffect(() => {
    const live = validate({ name, phone, item, weight });
    const next: FormErrors = {};
    if (touched.name) next.name = live.name;
    if (touched.phone) next.phone = live.phone;
    if (touched.item) next.item = live.item;
    if (touched.weight) next.weight = live.weight;
    setErrors(next);
  }, [name, phone, item, weight, touched]);

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    setTouched({ name: true, phone: true, item: true, weight: true });
    const allErrors = validate({ name, phone, item, weight });
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;

    try {
      setSubmitting(true);
      const targetShopIdentifier = shop?._id || (shop as any)?.id || (shop as any)?.shopId || shopId;
      const targetSlug = (shop as any)?.slug || shopId;
      const order = await api.post('/orders', {
        shopId: targetShopIdentifier,
        shopIdSlug: targetSlug,
        slug: targetSlug,
        name: name.trim(),
        phone: phone.trim(),
        item: item.trim(),
        weight: parseFloat(weight),
        remarks: remarks.trim(),
      });
      const returnedOrderId = order._id || order.id || order.orderId;
      navigate(`/shop/${shopId}/order/${returnedOrderId}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingShop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-zinc-400 text-xs font-medium tracking-wide">Loading order counter…</p>
        </div>
      </div>
    );
  }

  if (errorShop || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 transition-colors">
        <div className="max-w-sm w-full backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 rounded-3xl p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-center">
          <div className="bg-red-500/10 text-red-500 rounded-2xl h-12 w-12 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Landmark className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Shop Not Found</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6 leading-relaxed">
            {errorShop || "We couldn't retrieve this business. Please scan the QR code again."}
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center w-full px-5 py-3 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-900 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all"
          >
            Go back
          </a>
        </div>
      </div>
    );
  }

  const schema = getSchema(shop.businessType);
  const shopServices = shop.services && shop.services.length > 0 ? shop.services : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 gradient-bg flex flex-col items-center justify-center px-4 py-10 transition-colors relative">
      
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] tracking-wide">
            <Flame className="w-3 h-3 fill-current" /> Powered by NotifyWork
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">{shop.shopName}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">{shop.address}</p>
        </div>

        {/* Form Card */}
        <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs overflow-hidden transition-colors">

          <div className="px-7 pt-7 pb-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Submit Work Order</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Fill in your details and we'll notify you when it's ready.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="px-7 py-6 space-y-5">

            {submitError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium">
                {submitError}
              </div>
            )}

            {/* Customer Name */}
            <Field id="name" label="Your Name" required error={errors.name}>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => touch('name')}
                  placeholder="e.g. Ravi Kumar"
                  autoComplete="name"
                  className={inputBase(!!errors.name) + ' pl-10'}
                />
              </div>
            </Field>

            {/* Phone */}
            <Field id="phone" label="Phone Number" required error={errors.phone}>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => touch('phone')}
                  placeholder="e.g. +91 98765 43210"
                  autoComplete="tel"
                  className={inputBase(!!errors.phone) + ' pl-10'}
                />
              </div>
            </Field>

            {/* Service Preset Quick Chips */}
            {shopServices && (
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Popular Presets (Click to select)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {shopServices.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setItem(preset.name);
                        touch('item');
                      }}
                      className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-zinc-700 dark:text-zinc-300 rounded-lg text-[11px] font-semibold border border-zinc-200/80 dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      {preset.name} {preset.rate > 0 ? `(₹${preset.rate}/${preset.unit})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Item + Unit row */}
            <div className="grid grid-cols-2 gap-3">
              <Field id="item" label={schema.itemLabel} required error={errors.item}>
                <div className="relative">
                  <Package className="absolute left-3 top-3.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  <input
                    id="item"
                    type="text"
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    onBlur={() => touch('item')}
                    placeholder={schema.itemPlaceholder}
                    list="item-presets"
                    className={inputBase(!!errors.item) + ' pl-8'}
                  />
                  <datalist id="item-presets">
                    {schema.presets.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              </Field>

              <Field id="weight" label={schema.unitLabel} required error={errors.weight}>
                <div className="relative">
                  <Ruler className="absolute left-3 top-3.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  <input
                    id="weight"
                    type="text"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onBlur={() => touch('weight')}
                    placeholder={schema.unitPlaceholder}
                    className={inputBase(!!errors.weight) + ' pl-8'}
                  />
                </div>
              </Field>
            </div>

            {/* Remarks */}
            <Field id="remarks" label="Remarks">
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any special instructions… (optional)"
                  rows={3}
                  className={inputBase(false) + ' pl-10 resize-none'}
                />
              </div>
            </Field>

            {/* Submit */}
            <button
              id="submit-order-btn"
              type="submit"
              disabled={submitting}
              className="w-full mt-1 inline-flex items-center justify-center gap-2 px-6 py-3.5
                         bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold
                         hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-60
                         shadow-xs transition-all duration-150 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting your order…
                </>
              ) : (
                <>
                  Submit Order
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
          You'll receive real-time notifications when your order status updates.
        </p>

      </div>
    </div>
  );
};
