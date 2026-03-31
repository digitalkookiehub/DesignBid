import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FileText, Send, Download, RefreshCw, Sparkles,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { getQuotation } from '@/services/quotationService';
import { updateQuotationStatus } from '@/services/quotationService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  revised: 'bg-orange-100 text-orange-700',
};

const sourceColors: Record<string, string> = {
  designer_master: 'bg-blue-100 text-blue-700',
  project_override: 'bg-green-100 text-green-700',
  manual: 'bg-orange-100 text-orange-700',
};

const sourceLabels: Record<string, string> = {
  designer_master: 'Master',
  project_override: 'Override',
  manual: 'Manual',
};

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quotationId = Number(id);

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotations', quotationId],
    queryFn: () => getQuotation(quotationId),
    enabled: !!quotationId,
  });

  const qc = useQueryClient();
  const sendMutation = useMutation({
    mutationFn: () => updateQuotationStatus(quotationId, 'sent'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations', quotationId] }),
  });

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8003';
  const token = localStorage.getItem('access_token');

  const handleDownloadPdf = () => {
    window.open(`${apiBase}/api/v1/quotations/${quotationId}/export/pdf?token=${token}`, '_blank');
  };

  const handleDownloadXlsx = () => {
    const url = `${apiBase}/api/v1/quotations/${quotationId}/export/xlsx?token=${token}`;
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `quotation_${quotationId}.xlsx`);
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20">
          <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </PageWrapper>
    );
  }

  if (!quotation) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Quotation not found</p>
          <GradientButton variant="secondary" className="mt-4" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </GradientButton>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Quotation v{quotation.version}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[quotation.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Created {new Date(quotation.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              {quotation.valid_until && (
                <> &middot; Valid until {new Date(quotation.valid_until).toLocaleDateString('en-IN')}</>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <GradientButton variant="secondary" size="sm" onClick={() => navigate(`/proposals/generate?project=${quotation.project_id}&quotation=${quotation.id}`)}>
              <Sparkles className="w-3 h-3" /> AI Proposal
            </GradientButton>
            <GradientButton variant="secondary" size="sm" onClick={() => sendMutation.mutate()} isLoading={sendMutation.isPending}>
              <Send className="w-3 h-3" /> {quotation.status === 'sent' ? 'Sent' : 'Send to Client'}
            </GradientButton>
            <GradientButton variant="secondary" size="sm" onClick={handleDownloadPdf}>
              <Download className="w-3 h-3" /> View PDF
            </GradientButton>
            <GradientButton variant="secondary" size="sm" onClick={handleDownloadXlsx}>
              <Download className="w-3 h-3" /> Excel
            </GradientButton>
            <GradientButton variant="ghost" size="sm" onClick={() => navigate(`/quotations/new?project=${quotation.project_id}`)}>
              <RefreshCw className="w-3 h-3" /> Revise
            </GradientButton>
          </div>
        </div>

        {/* Sections */}
        {quotation.sections.map((section) => (
          <GlassCard key={section.id} className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                {section.section_name}
              </h2>
              <span className="text-sm font-semibold text-gray-900">{formatINR(section.section_total)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Room</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Item</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Qty</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Unit</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Rate</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Amount</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">GST%</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">GST Amt</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {section.line_items.map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="py-2.5 px-3 text-gray-600">{item.room_name ?? '-'}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-gray-900">{item.item_name}</div>
                        {item.description && <div className="text-xs text-gray-400">{item.description}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-gray-500">{item.unit}</td>
                      <td className="py-2.5 px-3 text-right text-gray-700">{formatINR(item.rate)}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-gray-900">{formatINR(item.amount)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-medium ${item.gst_rate === 0 ? 'text-gray-400' : 'text-blue-600'}`}>{item.gst_rate}%</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-600 text-xs">{item.gst_amount > 0 ? formatINR(item.gst_amount) : '-'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceColors[item.rate_source] ?? 'bg-gray-100 text-gray-700'}`}>
                          {sourceLabels[item.rate_source] ?? item.rate_source}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        ))}

        {quotation.sections.length === 0 && (
          <GlassCard className="text-center py-12">
            <p className="text-gray-500">No line items in this quotation</p>
          </GlassCard>
        )}

        {/* Footer totals */}
        <GlassCard>
          <div className="max-w-sm ml-auto space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-900">{formatINR(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST ({quotation.tax_rate}%)</span>
              <span className="font-medium text-gray-900">{formatINR(quotation.tax_amount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <span className="text-gray-600 font-medium">Total (incl. GST)</span>
              <span className="font-semibold text-gray-900">{formatINR(quotation.subtotal + quotation.tax_amount)}</span>
            </div>
            {quotation.discount_amount > 0 && (
              <div className="flex justify-between bg-green-50 -mx-2 px-2 py-2 rounded-lg">
                <span className="text-green-700 font-medium">
                  {quotation.discount_type === 'percentage'
                    ? `Special Client Discount (${quotation.discount_value}%)`
                    : 'Discount'}
                </span>
                <span className="font-semibold text-green-700">-{formatINR(quotation.discount_amount)}</span>
              </div>
            )}
            <div className="border-t-2 border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-900 text-base">Grand Total</span>
              <span className="font-bold text-xl text-blue-600">{formatINR(quotation.grand_total)}</span>
            </div>
          </div>

          {quotation.notes && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Notes</h4>
              <p className="text-sm text-gray-500">{quotation.notes}</p>
            </div>
          )}

          {quotation.terms_and_conditions && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</h4>
              <p className="text-sm text-gray-500 whitespace-pre-line">{quotation.terms_and_conditions}</p>
            </div>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
