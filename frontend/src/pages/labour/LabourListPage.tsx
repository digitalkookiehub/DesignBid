import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Star,
  Pencil,
  Trash2,
  X,
  Phone,
  MapPin,
  Clock,
  Users,
  IndianRupee,
  Upload,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { useLabours, useCreateLabour, useDeleteLabour } from '@/hooks/useLabours';
import { bulkUpload, downloadTemplate, exportLabours } from '@/services/labourService';
import type { Labour, LabourSpecialization, LabourCreate } from '@/types/labour';

const SPECIALIZATION_LABELS: Record<LabourSpecialization, string> = {
  civil: 'Civil Work',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  carpentry: 'Carpentry',
  painting: 'Painting',
  false_ceiling: 'False Ceiling',
  flooring: 'Flooring',
  hvac: 'HVAC',
  modular_kitchen: 'Modular Kitchen',
  furniture: 'Furniture',
  supervisor: 'Supervisor',
  helper: 'Helper',
  other: 'Other',
};

const SPECIALIZATION_COLORS: Record<LabourSpecialization, string> = {
  civil: 'bg-amber-100 text-amber-700',
  electrical: 'bg-yellow-100 text-yellow-700',
  plumbing: 'bg-blue-100 text-blue-700',
  carpentry: 'bg-orange-100 text-orange-700',
  painting: 'bg-pink-100 text-pink-700',
  false_ceiling: 'bg-purple-100 text-purple-700',
  flooring: 'bg-teal-100 text-teal-700',
  hvac: 'bg-cyan-100 text-cyan-700',
  modular_kitchen: 'bg-rose-100 text-rose-700',
  furniture: 'bg-lime-100 text-lime-700',
  supervisor: 'bg-indigo-100 text-indigo-700',
  helper: 'bg-gray-100 text-gray-700',
  other: 'bg-slate-100 text-slate-700',
};

type FilterTab = 'all' | LabourSpecialization;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'civil', label: 'Civil' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'false_ceiling', label: 'False Ceiling' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'helper', label: 'Helper' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM: LabourCreate = {
  name: '',
  phone: '',
  specialization: undefined,
  daily_rate: undefined,
  city: undefined,
  experience_years: undefined,
  email: undefined,
  address: undefined,
  id_proof_type: undefined,
  id_proof_number: undefined,
  notes: undefined,
};

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

function LabourCard({
  labour,
  onDelete,
  onEdit,
}: {
  labour: Labour;
  onDelete: (id: number) => void;
  onEdit: (labour: Labour) => void;
}) {
  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-base">{labour.name}</h3>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
            <Phone size={13} />
            <span>{labour.phone}</span>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${SPECIALIZATION_COLORS[labour.specialization]}`}
        >
          {SPECIALIZATION_LABELS[labour.specialization]}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-600">
        {labour.daily_rate !== null && (
          <span className="flex items-center gap-1">
            <IndianRupee size={13} />
            {labour.daily_rate}/day
          </span>
        )}
        {labour.city && (
          <span className="flex items-center gap-1">
            <MapPin size={13} />
            {labour.city}
          </span>
        )}
        {labour.experience_years !== null && (
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {labour.experience_years} yr{labour.experience_years !== 1 ? 's' : ''} exp
          </span>
        )}
      </div>

      {labour.current_project && (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full w-fit">
          Working: {labour.current_project}
        </span>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <StarRating rating={labour.rating} />
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(labour)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(labour.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

export default function LabourListPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [form, setForm] = useState<LabourCreate>({ ...EMPTY_FORM });

  const specFilter = activeTab === 'all' ? undefined : activeTab;
  const { data: labours, isLoading } = useLabours(specFilter, search || undefined);
  const createMutation = useCreateLabour();
  const deleteMutation = useDeleteLabour();

  const labourList = useMemo(() => (Array.isArray(labours) ? labours : []) as Labour[], [labours]);

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this labourer?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (_labour: Labour) => {
    // TODO: navigate to edit page or open edit modal
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    createMutation.mutate(form, {
      onSuccess: () => {
        setForm({ ...EMPTY_FORM });
        setShowForm(false);
      },
    });
  };

  const updateField = <K extends keyof LabourCreate>(key: K, value: LabourCreate[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Labour Directory</h1>
        <div className="flex gap-2 flex-wrap">
          <GradientButton variant="secondary" size="sm" onClick={() => downloadTemplate()}>
            <Download size={14} /> Template
          </GradientButton>
          <GradientButton variant="secondary" size="sm" onClick={() => exportLabours()}>
            <FileSpreadsheet size={14} /> Export
          </GradientButton>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all">
            <Upload size={14} /> Bulk Upload
            <input type="file" accept=".xlsx" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const result = await bulkUpload(file);
                setUploadResult(result);
              } catch { setUploadResult({ created: 0, skipped: 0, errors: ['Upload failed'] }); }
              e.target.value = '';
            }} />
          </label>
          <GradientButton onClick={() => setShowForm(true)}>
            <Plus size={18} /> Add Labour
          </GradientButton>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${uploadResult.created > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="flex items-center justify-between">
            <span>{uploadResult.created} created, {uploadResult.skipped} skipped</span>
            <button onClick={() => setUploadResult(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>
          {uploadResult.errors.length > 0 && (
            <ul className="mt-1 text-xs space-y-0.5">
              {uploadResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
              {uploadResult.errors.length > 5 && <li>...and {uploadResult.errors.length - 5} more</li>}
            </ul>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative max-w-md mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add Labour Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Add New Labour</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatedInput
                    label="Name *"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    required
                  />
                  <AnimatedInput
                    label="Phone *"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    required
                  />
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Specialization
                    </label>
                    <select
                      value={form.specialization ?? ''}
                      onChange={(e) =>
                        updateField(
                          'specialization',
                          (e.target.value || undefined) as LabourSpecialization | undefined
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-sm"
                    >
                      <option value="">Select...</option>
                      {Object.entries(SPECIALIZATION_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <AnimatedInput
                    label="Daily Rate"
                    type="number"
                    value={form.daily_rate ?? ''}
                    onChange={(e) =>
                      updateField('daily_rate', e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                  <AnimatedInput
                    label="City"
                    value={form.city ?? ''}
                    onChange={(e) => updateField('city', e.target.value || undefined)}
                  />
                  <AnimatedInput
                    label="Experience (years)"
                    type="number"
                    value={form.experience_years ?? ''}
                    onChange={(e) =>
                      updateField(
                        'experience_years',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                  <AnimatedInput
                    label="Email"
                    type="email"
                    value={form.email ?? ''}
                    onChange={(e) => updateField('email', e.target.value || undefined)}
                  />
                  <AnimatedInput
                    label="Address"
                    value={form.address ?? ''}
                    onChange={(e) => updateField('address', e.target.value || undefined)}
                  />
                  <AnimatedInput
                    label="ID Proof Type"
                    placeholder="e.g., Aadhaar, PAN"
                    value={form.id_proof_type ?? ''}
                    onChange={(e) => updateField('id_proof_type', e.target.value || undefined)}
                  />
                  <AnimatedInput
                    label="ID Proof Number"
                    value={form.id_proof_number ?? ''}
                    onChange={(e) => updateField('id_proof_number', e.target.value || undefined)}
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <textarea
                    value={form.notes ?? ''}
                    onChange={(e) => updateField('notes', e.target.value || undefined)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-sm resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <GradientButton
                    type="button"
                    variant="secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </GradientButton>
                  <GradientButton type="submit" isLoading={createMutation.isPending}>
                    Save Labour
                  </GradientButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : labourList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users size={48} strokeWidth={1.2} />
          <p className="mt-4 text-lg font-medium text-gray-500">No labourers found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || activeTab !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first labourer to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {labourList.map((labour) => (
            <LabourCard
              key={labour.id}
              labour={labour}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
