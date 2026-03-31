import { useState, useRef, type FormEvent } from 'react';
import { Upload, Building2, Image } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8003';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [companyAddress, setCompanyAddress] = useState(user?.company_address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(user?.company_logo_url || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, company_name: companyName, company_address: companyAddress, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/auth/me/logo', form);
      setLogoUrl(res.data.company_logo_url);
    } catch {
      alert('Failed to upload logo. Only image files (JPG, PNG) are allowed.');
    } finally {
      setUploading(false);
    }
  };

  const fullLogoUrl = logoUrl ? `${apiBase}${logoUrl}` : '';

  return (
    <PageWrapper>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="max-w-2xl space-y-6">
        {/* Company Branding */}
        <GlassCard>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Building2 size={18} className="text-blue-600" /> Company Branding</h3>
          <p className="text-sm text-gray-500 mb-4">Your company logo and details appear on all quotations and proposals sent to clients.</p>

          {/* Logo Upload */}
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
              {fullLogoUrl ? (
                <img src={fullLogoUrl} alt="Company Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Image size={32} className="text-gray-300" />
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
                e.target.value = '';
              }} />
              <GradientButton variant="secondary" size="sm" onClick={() => fileRef.current?.click()} isLoading={uploading}>
                <Upload size={14} /> {logoUrl ? 'Change Logo' : 'Upload Logo'}
              </GradientButton>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG. Max 10MB. Recommended: 300x100px</p>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatedInput label="Company / Firm Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., Priya Interiors" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Address</label>
              <textarea
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm resize-none"
                rows={3}
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="#42, 2nd Floor, 5th Main, HSR Layout, Bangalore - 560102"
              />
            </div>
          </div>
        </GlassCard>

        {/* Profile */}
        <GlassCard>
          <h3 className="font-semibold mb-4">Personal Details</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatedInput label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <AnimatedInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <AnimatedInput label="Email" value={user?.email || ''} disabled />
            <div className="flex items-center gap-3">
              <GradientButton type="submit" isLoading={saving}>Save Changes</GradientButton>
              {saved && <span className="text-green-600 text-sm">Saved!</span>}
            </div>
          </form>
        </GlassCard>

        {/* Preview */}
        <GlassCard>
          <h3 className="font-semibold mb-4">Quotation Header Preview</h3>
          <p className="text-xs text-gray-400 mb-3">This is how your branding appears on quotations and proposals</p>
          <div className="border border-gray-200 rounded-lg p-8 bg-white">
            <div className="text-center">
              {fullLogoUrl && (
                <img src={fullLogoUrl} alt="Logo" className="h-16 object-contain mx-auto mb-3" />
              )}
              <h4 className="text-xl font-bold text-blue-700">{companyName || 'Your Company Name'}</h4>
              <p className="text-sm text-gray-500 whitespace-pre-line mt-1">{companyAddress || 'Your Company Address'}</p>
              <p className="text-sm text-gray-500 mt-1">
                {[phone ? `Ph: ${phone}` : '', user?.email ? `Email: ${user.email}` : ''].filter(Boolean).join(' | ')}
              </p>
            </div>
            <hr className="my-4" />
            <p className="text-sm text-gray-400 italic">Client name and project details will appear below this header...</p>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
