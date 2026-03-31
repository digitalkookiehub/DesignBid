import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Percent,
  Download,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Package,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import {
  useCategories,
  useMyRates,
  useCreateRate,
  useUpdateRate,
  useDeleteRate,
  useBulkUpdate,
  useInitializeRates,
} from '@/hooks/useRateCard';
import type { RateCardCategory, DesignerRate, DesignerRateCreate } from '@/types/rate-card';

const formatINR = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

interface EditingCell {
  rateId: number;
  field: 'rate_per_unit';
  value: string;
}

interface AddFormData {
  item_name: string;
  unit: string;
  rate_per_unit: string;
  vendor_name: string;
}

const emptyAddForm: AddFormData = {
  item_name: '',
  unit: 'sqft',
  rate_per_unit: '',
  vendor_name: '',
};

export default function RateCardPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddFormData>(emptyAddForm);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState('');

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: rates, isLoading: ratesLoading } = useMyRates(selectedCategoryId, searchTerm || undefined);
  const createRate = useCreateRate();
  const updateRate = useUpdateRate();
  const deleteRate = useDeleteRate();
  const bulkUpdate = useBulkUpdate();
  const initializeRates = useInitializeRates();

  // Auto-select first category
  const activeCategory = selectedCategoryId ?? categories?.[0]?.id;

  const handleCategorySelect = useCallback((id: number) => {
    setSelectedCategoryId(id);
    setSearchTerm('');
    setEditingCell(null);
    setShowAddForm(false);
    setShowBulkUpdate(false);
  }, []);

  const handleInlineEdit = useCallback((rate: DesignerRate) => {
    setEditingCell({
      rateId: rate.id,
      field: 'rate_per_unit',
      value: String(rate.rate_per_unit),
    });
  }, []);

  const handleInlineSave = useCallback(() => {
    if (!editingCell) return;
    const numValue = parseFloat(editingCell.value);
    if (isNaN(numValue) || numValue <= 0) return;
    updateRate.mutate(
      { id: editingCell.rateId, data: { rate_per_unit: numValue } },
      { onSuccess: () => setEditingCell(null) }
    );
  }, [editingCell, updateRate]);

  const handleInlineCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleAddSubmit = useCallback(() => {
    if (!activeCategory) return;
    const rateValue = parseFloat(addForm.rate_per_unit);
    if (!addForm.item_name.trim() || !addForm.unit.trim() || isNaN(rateValue) || rateValue <= 0) return;

    const payload: DesignerRateCreate = {
      category_id: activeCategory,
      item_name: addForm.item_name.trim(),
      unit: addForm.unit.trim(),
      rate_per_unit: rateValue,
      vendor_name: addForm.vendor_name.trim() || undefined,
      is_custom: true,
    };
    createRate.mutate(payload, {
      onSuccess: () => {
        setAddForm(emptyAddForm);
        setShowAddForm(false);
      },
    });
  }, [activeCategory, addForm, createRate]);

  const handleBulkSubmit = useCallback(() => {
    if (!activeCategory) return;
    const pct = parseFloat(bulkPercentage);
    if (isNaN(pct) || pct === 0) return;
    bulkUpdate.mutate(
      { categoryId: activeCategory, percentage: pct },
      {
        onSuccess: () => {
          setShowBulkUpdate(false);
          setBulkPercentage('');
        },
      }
    );
  }, [activeCategory, bulkPercentage, bulkUpdate]);

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm('Delete this rate item?')) {
        deleteRate.mutate(id);
      }
    },
    [deleteRate]
  );

  const getCategoryRateCount = (cat: RateCardCategory): string => {
    if (cat.id === activeCategory && rates) return String(rates.length);
    return '';
  };

  const isLoading = categoriesLoading || ratesLoading;

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rate Card</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your rates for all categories</p>
          </div>
          <div className="flex items-center gap-3">
            <GradientButton
              variant="secondary"
              size="sm"
              onClick={() => initializeRates.mutate()}
              isLoading={initializeRates.isPending}
            >
              <Download className="w-4 h-4" />
              Initialize from Defaults
            </GradientButton>
          </div>
        </div>

        {/* Category Tabs */}
        {categoriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories?.map((cat) => {
              const isActive = cat.id === activeCategory;
              const count = getCategoryRateCount(cat);
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                  {count && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                        isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <GradientButton size="sm" onClick={() => setShowAddForm((v) => !v)}>
              <Plus className="w-4 h-4" />
              Add Custom Item
            </GradientButton>
            <GradientButton
              variant="secondary"
              size="sm"
              onClick={() => setShowBulkUpdate((v) => !v)}
            >
              <Percent className="w-4 h-4" />
              Bulk Update
            </GradientButton>
          </div>
        </div>

        {/* Bulk Update Form */}
        <AnimatePresence>
          {showBulkUpdate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <GlassCard className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <AnimatedInput
                    label="Percentage Change"
                    type="number"
                    placeholder="e.g. 10 for +10%, -5 for -5%"
                    value={bulkPercentage}
                    onChange={(e) => setBulkPercentage(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <GradientButton
                    size="sm"
                    onClick={handleBulkSubmit}
                    isLoading={bulkUpdate.isPending}
                  >
                    Apply
                  </GradientButton>
                  <GradientButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBulkUpdate(false);
                      setBulkPercentage('');
                    }}
                  >
                    Cancel
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Custom Item Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <GlassCard>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Custom Item</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AnimatedInput
                    label="Item Name"
                    placeholder="e.g. Italian Marble"
                    value={addForm.item_name}
                    onChange={(e) => setAddForm((f) => ({ ...f, item_name: e.target.value }))}
                  />
                  <AnimatedInput
                    label="Unit"
                    placeholder="e.g. sqft, rft, nos"
                    value={addForm.unit}
                    onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                  <AnimatedInput
                    label="Rate (per unit)"
                    type="number"
                    placeholder="e.g. 250"
                    value={addForm.rate_per_unit}
                    onChange={(e) => setAddForm((f) => ({ ...f, rate_per_unit: e.target.value }))}
                  />
                  <AnimatedInput
                    label="Vendor Name"
                    placeholder="Optional"
                    value={addForm.vendor_name}
                    onChange={(e) => setAddForm((f) => ({ ...f, vendor_name: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <GradientButton
                    size="sm"
                    onClick={handleAddSubmit}
                    isLoading={createRate.isPending}
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </GradientButton>
                  <GradientButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      setAddForm(emptyAddForm);
                    }}
                  >
                    Cancel
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rate Table */}
        <GlassCard className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : !rates || rates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No rates yet.</p>
              <p className="text-gray-400 text-sm mt-1">
                Click Initialize to load system default rates.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rates.map((rate: DesignerRate) => (
                    <motion.tr
                      key={rate.id}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.03)' }}
                      className="transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {rate.item_name}
                        {rate.is_custom && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-700 font-semibold uppercase">
                            Custom
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{rate.unit}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        {editingCell?.rateId === rate.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              autoFocus
                              value={editingCell.value}
                              onChange={(e) =>
                                setEditingCell((prev) =>
                                  prev ? { ...prev, value: e.target.value } : null
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineSave();
                                if (e.key === 'Escape') handleInlineCancel();
                              }}
                              className="w-24 px-2 py-1 rounded border border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none text-sm text-right"
                            />
                            <button
                              onClick={handleInlineSave}
                              className="p-1 rounded hover:bg-green-50 text-green-600"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleInlineCancel}
                              className="p-1 rounded hover:bg-red-50 text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleInlineEdit(rate)}
                            className="text-gray-900 font-semibold hover:text-blue-600 cursor-pointer transition-colors"
                            title="Click to edit"
                          >
                            {formatINR(rate.rate_per_unit)}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rate.vendor_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleInlineEdit(rate)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit rate"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rate.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
