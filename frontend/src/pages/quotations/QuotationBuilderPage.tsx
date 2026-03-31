import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ChevronRight, Tag, IndianRupee } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useProject } from '@/hooks/useProjects';
import { useMyRates, useCategories } from '@/hooks/useRateCard';
import { generateQuotation } from '@/services/quotationService';
import type { Room } from '@/types/project';
import type { DesignerRate, RateCardCategory } from '@/types/rate-card';
import type { GenerateQuotationRequest, QuotationItemInput } from '@/types/quotation';

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const GST_OPTIONS = [0, 5, 12, 18, 28];

interface Selection {
  qty: number;
  gstRate: number;
}

function selKey(roomId: number, rateId: number): string {
  return `${roomId}:${rateId}`;
}

function autoQuantity(room: Room, rate: DesignerRate): number {
  const unit = rate.unit.toLowerCase();
  if (unit.includes('sqft') || unit.includes('sq ft')) {
    const name = rate.item_name.toLowerCase();
    if (name.includes('ceiling') || name.includes('false ceiling')) return room.ceiling_area_sqft;
    if (name.includes('wall') || name.includes('paint')) return room.wall_area_sqft;
    if (name.includes('floor')) return room.area_sqft;
    return room.area_sqft;
  }
  if (unit.includes('rft') || unit.includes('running')) return room.perimeter;
  if (unit.includes('point') || unit.includes('nos')) {
    const name = rate.item_name.toLowerCase();
    if (name.includes('electri')) return room.electrical_points;
    if (name.includes('plumb')) return room.plumbing_points;
    return 1;
  }
  return 1;
}

export default function QuotationBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = Number(searchParams.get('project') ?? 0);

  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: rates, isLoading: loadingRates } = useMyRates();
  const { data: categories } = useCategories();

  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [selections, setSelections] = useState<Map<string, Selection>>(new Map());
  const [discountValue, setDiscountValue] = useState(0);

  const rooms = project?.rooms ?? [];
  const allRates = rates ?? [];
  const allCategories = categories ?? [];

  if (activeRoomId === null && rooms.length > 0) {
    setActiveRoomId(rooms[0].id);
  }

  const categorizedRates = useMemo(() => {
    const map = new Map<number, { category: RateCardCategory; items: DesignerRate[] }>();
    for (const cat of allCategories) map.set(cat.id, { category: cat, items: [] });
    for (const rate of allRates) {
      if (!rate.is_active) continue;
      const entry = map.get(rate.category_id);
      if (entry) entry.items.push(rate);
    }
    return Array.from(map.values()).filter((e) => e.items.length > 0);
  }, [allRates, allCategories]);

  function toggleSelection(roomId: number, rate: DesignerRate) {
    const key = selKey(roomId, rate.id);
    setSelections((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        const room = rooms.find((r) => r.id === roomId);
        if (room) next.set(key, { qty: autoQuantity(room, rate), gstRate: 18 });
      }
      return next;
    });
  }

  function updateQty(roomId: number, rateId: number, qty: number) {
    const key = selKey(roomId, rateId);
    setSelections((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (existing && qty > 0) next.set(key, { ...existing, qty });
      return next;
    });
  }

  function updateGst(roomId: number, rateId: number, gstRate: number) {
    const key = selKey(roomId, rateId);
    setSelections((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (existing) next.set(key, { ...existing, gstRate });
      return next;
    });
  }

  // Live preview totals (for display only — exact math is server-side)
  const { subtotal, totalGst } = useMemo(() => {
    let sub = 0;
    let gst = 0;
    for (const [key, sel] of selections) {
      const [, rateIdStr] = key.split(':');
      const rate = allRates.find((r) => r.id === Number(rateIdStr));
      if (rate) {
        const amt = sel.qty * rate.rate_per_unit;
        sub += amt;
        gst += amt * sel.gstRate / 100;
      }
    }
    return { subtotal: Math.round(sub * 100) / 100, totalGst: Math.round(gst * 100) / 100 };
  }, [selections, allRates]);

  const totalBeforeDiscount = subtotal + totalGst;
  const grandTotal = totalBeforeDiscount - discountValue;

  const generateMutation = useMutation({
    mutationFn: (data: GenerateQuotationRequest) => generateQuotation(data),
    onSuccess: (quotation) => navigate(`/quotations/${quotation.id}`),
  });

  function handleGenerate() {
    const items: QuotationItemInput[] = [];
    for (const [key, sel] of selections) {
      const [roomIdStr, rateIdStr] = key.split(':');
      items.push({
        room_id: Number(roomIdStr),
        designer_rate_id: Number(rateIdStr),
        quantity_override: sel.qty,
        gst_rate: sel.gstRate,
      });
    }
    generateMutation.mutate({
      project_id: projectId,
      items,
      tax_rate: 18, // default, actual GST is per-item
      discount_type: discountValue > 0 ? 'fixed' : undefined,
      discount_value: discountValue > 0 ? discountValue : undefined,
    });
  }

  if (loadingProject || loadingRates) {
    return <PageWrapper><div className="flex justify-center py-20"><span className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" /></div></PageWrapper>;
  }

  if (!project) {
    return <PageWrapper><div className="text-center py-20 text-gray-500">Project not found</div></PageWrapper>;
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quotation Builder</h1>
          <p className="text-gray-500">{project.name} &middot; {rooms.length} rooms &middot; {selections.size} items selected</p>
        </div>

        <div className="flex gap-5">
          {/* Left: Rooms */}
          <div className="w-52 flex-shrink-0">
            <GlassCard className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">Rooms ({rooms.length})</h3>
              <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                {rooms.map((room) => {
                  const count = Array.from(selections.keys()).filter((k) => k.startsWith(`${room.id}:`)).length;
                  return (
                    <button key={room.id} onClick={() => setActiveRoomId(room.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                        activeRoomId === room.id ? 'bg-violet-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                      <span className="truncate text-xs">{room.name}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeRoomId === room.id ? 'bg-white/20' : 'bg-violet-100 text-violet-700'}`}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Center: Rate items */}
          <div className="flex-1 min-w-0">
            {activeRoom && (
              <div className="mb-4 p-3 bg-violet-50 rounded-xl text-xs text-violet-800 flex gap-5 flex-wrap">
                <span>Floor: <strong>{activeRoom.area_sqft} sqft</strong></span>
                <span>Wall: <strong>{activeRoom.wall_area_sqft} sqft</strong></span>
                <span>Ceiling: <strong>{activeRoom.ceiling_area_sqft} sqft</strong></span>
                <span>Perimeter: <strong>{activeRoom.perimeter} ft</strong></span>
              </div>
            )}

            <div className="max-h-[68vh] overflow-y-auto space-y-4 pr-1">
              {categorizedRates.map(({ category, items }) => (
                <GlassCard key={category.id} className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-violet-500" /> {category.name}
                    <span className="text-xs text-gray-400 font-normal">({items.length} items)</span>
                  </h3>
                  <div className="space-y-1.5">
                    {items.map((rate) => {
                      if (!activeRoomId) return null;
                      const key = selKey(activeRoomId, rate.id);
                      const sel = selections.get(key);
                      const isSelected = !!sel;
                      const amt = sel ? sel.qty * rate.rate_per_unit : 0;

                      return (
                        <motion.div key={rate.id} layout
                          className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                            isSelected ? 'border-violet-300 bg-violet-50/50' : 'border-gray-100 hover:border-gray-200'
                          }`}>
                          <input type="checkbox" checked={isSelected}
                            onChange={() => toggleSelection(activeRoomId, rate)}
                            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs text-gray-900">{rate.item_name}</div>
                            {rate.description && <div className="text-[10px] text-gray-400 truncate">{rate.description}</div>}
                          </div>
                          <div className="text-[10px] text-gray-500 flex-shrink-0 w-20 text-right">
                            {formatINR(rate.rate_per_unit)}/{rate.unit}
                          </div>
                          {isSelected && sel && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <input type="number" value={sel.qty}
                                onChange={(e) => updateQty(activeRoomId, rate.id, Number(e.target.value))}
                                className="w-16 px-1.5 py-1 text-xs border border-gray-300 rounded-lg text-right focus:border-violet-500 outline-none" min={0} />
                              <select value={sel.gstRate}
                                onChange={(e) => updateGst(activeRoomId, rate.id, Number(e.target.value))}
                                className="w-16 px-1 py-1 text-xs border border-gray-300 rounded-lg focus:border-violet-500 outline-none bg-white">
                                {GST_OPTIONS.map((g) => <option key={g} value={g}>{g}%</option>)}
                              </select>
                              <span className="text-xs font-medium text-gray-900 w-20 text-right">{formatINR(amt)}</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </GlassCard>
              ))}

              {categorizedRates.length === 0 && (
                <GlassCard className="text-center py-12">
                  <p className="text-gray-500">No rate card items. Set up your rate card first.</p>
                  <GradientButton variant="secondary" className="mt-4" onClick={() => navigate('/rate-card')}>Go to Rate Card</GradientButton>
                </GlassCard>
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-6">
              <GlassCard gradient>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                  <IndianRupee className="w-4 h-4" /> Summary
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items</span>
                    <span className="font-medium">{selections.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST (per-item)</span>
                    <span className="font-medium">{formatINR(totalGst)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500">Discount (₹)</span>
                    <input type="number" value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      placeholder="0" min={0}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg text-right focus:border-violet-500 outline-none" />
                  </div>
                  <div className="border-t border-gray-200 pt-2.5 flex justify-between">
                    <span className="font-semibold text-gray-900">Grand Total</span>
                    <span className="font-bold text-base text-violet-600">{formatINR(grandTotal)}</span>
                  </div>
                </div>

                <GradientButton className="w-full mt-5" size="md"
                  onClick={handleGenerate}
                  isLoading={generateMutation.isPending}
                  disabled={selections.size === 0 || generateMutation.isPending}>
                  <FileText className="w-4 h-4" /> Generate Quotation
                </GradientButton>

                {generateMutation.isError && (
                  <p className="text-red-500 text-[10px] mt-2 text-center">Failed. Please try again.</p>
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
