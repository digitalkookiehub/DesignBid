import { useState, type FormEvent } from 'react';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { GradientButton } from '@/components/ui/GradientButton';
import type { ClientCreate } from '@/types/client';

interface ClientFormProps {
  initialData?: Partial<ClientCreate>;
  onSubmit: (data: ClientCreate) => void;
  isLoading?: boolean;
}

const propertyTypes = ['Apartment', 'Villa', 'Independent House', 'Penthouse', 'Row House', 'Studio', 'Office', 'Showroom', 'Other'];
const sourceOptions = ['Referral', 'Instagram', 'Google', 'JustDial', 'Word of Mouth', 'Builder Tie-up', 'Repeat Client', 'Other'];

export function ClientForm({ initialData, onSubmit, isLoading }: ClientFormProps) {
  const [form, setForm] = useState<ClientCreate>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    company: initialData?.company || '',  // used as property_type
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    country: initialData?.country || 'India',
    zip_code: initialData?.zip_code || '',  // used as flat_size
    website: initialData?.website || '',    // used as budget_range
    notes: initialData?.notes || '',
    tags: initialData?.tags || [],
    source: initialData?.source || '',
    special_discount: initialData?.special_discount ?? 0,
  });

  const update = (field: keyof ClientCreate, value: string | string[] | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput label="Client Name *" value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="e.g., Rahul & Priya Sharma" />
          <AnimatedInput label="Phone *" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} required placeholder="+91 98765 43210" />
          <AnimatedInput label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="client@email.com" />
          <AnimatedInput label="Alternate Contact" value={form.state || ''} onChange={(e) => update('state', e.target.value)} placeholder="Spouse/family member phone" />
        </div>
      </div>

      {/* Property Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Property Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Type</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm bg-white" value={form.company || ''} onChange={(e) => update('company', e.target.value)}>
              <option value="">Select type</option>
              {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <AnimatedInput label="Flat/Villa Size" value={form.zip_code || ''} onChange={(e) => update('zip_code', e.target.value)} placeholder="e.g., 3 BHK, 1800 sqft" />
          <AnimatedInput label="Property Address" value={form.address || ''} onChange={(e) => update('address', e.target.value)} placeholder="Flat no, Building, Society" />
          <AnimatedInput label="City" value={form.city || ''} onChange={(e) => update('city', e.target.value)} placeholder="e.g., Bangalore, Mumbai" />
          <AnimatedInput label="Budget Range" value={form.website || ''} onChange={(e) => update('website', e.target.value)} placeholder="e.g., ₹8-12 Lakhs" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">How did they find you?</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm bg-white" value={form.source || ''} onChange={(e) => update('source', e.target.value)}>
              <option value="">Select source</option>
              {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Special Discount */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Special Discount</h3>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <AnimatedInput
              label="Discount %"
              type="number"
              value={form.special_discount ?? 0}
              onChange={(e) => update('special_discount', Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <p className="text-sm text-gray-500 mt-5">
            {(form.special_discount ?? 0) > 0
              ? `This client gets ${form.special_discount}% off on all quotations automatically`
              : 'No special discount. Set a percentage to auto-apply on quotations.'}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {['New Construction', 'Renovation', 'Modular Kitchen Only', 'Full Interior', 'Urgent', 'High Budget', 'NRI'].map((tag) => (
            <button key={tag} type="button" onClick={() => {
              const current = form.tags || [];
              update('tags', current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]);
            }} className={`px-3 py-1.5 rounded-full text-sm transition-all ${(form.tags || []).includes(tag) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
        <textarea
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm resize-none"
          rows={3}
          value={form.notes || ''}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Client preferences, family details, any special requirements..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <GradientButton type="submit" isLoading={isLoading}>
          {initialData ? 'Update Client' : 'Add Client'}
        </GradientButton>
      </div>
    </form>
  );
}
