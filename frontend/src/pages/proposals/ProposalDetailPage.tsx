import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Send, Pencil, Check, Languages, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { getProposal, updateProposal } from '@/services/proposalService';
import type { Proposal } from '@/types/proposal';

const sectionConfig = [
  { key: 'executive_summary', label: 'Executive Summary', icon: '📋', color: 'from-violet-500 to-purple-500' },
  { key: 'scope_of_work', label: 'Scope of Work', icon: '🏗️', color: 'from-blue-500 to-cyan-500' },
  { key: 'design_approach', label: 'Design Approach', icon: '🎨', color: 'from-pink-500 to-rose-500' },
  { key: 'material_specifications', label: 'Material Specifications', icon: '🧱', color: 'from-amber-500 to-orange-500' },
  { key: 'timeline_phases', label: 'Timeline & Phases', icon: '📅', color: 'from-emerald-500 to-teal-500' },
  { key: 'terms_and_conditions', label: 'Terms & Conditions', icon: '📜', color: 'from-indigo-500 to-violet-500' },
  { key: 'payment_schedule', label: 'Payment Schedule', icon: '💰', color: 'from-yellow-500 to-amber-500' },
] as const;

type SectionKey = typeof sectionConfig[number]['key'];

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editText, setEditText] = useState('');

  const { data: proposal, isLoading } = useQuery<Proposal>({
    queryKey: ['proposals', proposalId],
    queryFn: () => getProposal(proposalId),
    enabled: !!proposalId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Proposal>) => updateProposal(proposalId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals', proposalId] });
      setEditingSection(null);
    },
  });

  const [showTranslate, setShowTranslate] = useState(false);
  const [selectedLang, setSelectedLang] = useState('tamil');

  const translateMutation = useMutation({
    mutationFn: async (language: string) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8003'}/api/v1/proposals/${proposalId}/translate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          body: JSON.stringify({ language }),
        }
      );
      if (!res.ok) throw new Error('Translation failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals', proposalId] });
      setShowTranslate(false);
    },
  });

  const languages = [
    { code: 'tamil', name: 'Tamil (தமிழ்)' },
    { code: 'hindi', name: 'Hindi (हिन्दी)' },
    { code: 'telugu', name: 'Telugu (తెలుగు)' },
    { code: 'kannada', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'malayalam', name: 'Malayalam (മലയാളം)' },
    { code: 'marathi', name: 'Marathi (मराठी)' },
    { code: 'bengali', name: 'Bengali (বাংলা)' },
    { code: 'gujarati', name: 'Gujarati (ગુજરાતી)' },
  ];

  const handleEdit = (key: SectionKey) => {
    if (!proposal) return;
    setEditingSection(key);
    setEditText((proposal[key] as string) || '');
  };

  const handleSave = () => {
    if (!editingSection) return;
    saveMutation.mutate({ [editingSection]: editText });
  };

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8003';

  if (isLoading) {
    return <PageWrapper><div className="flex justify-center py-20"><span className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" /></div></PageWrapper>;
  }

  if (!proposal) {
    return <PageWrapper><div className="text-center py-20 text-gray-500">Proposal not found</div></PageWrapper>;
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
              {proposal.ai_generated && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                  <Sparkles className="w-3 h-3" /> AI Generated
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                proposal.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                proposal.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                proposal.status === 'approved' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>{proposal.status}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {proposal.ai_model_used && `Model: ${proposal.ai_model_used} · `}
              {new Date(proposal.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <GradientButton variant="secondary" size="sm" onClick={() => setShowTranslate(!showTranslate)}>
              <Languages className="w-3 h-3" /> Translate
            </GradientButton>
            <GradientButton variant="secondary" size="sm" onClick={() => {
              window.open(`${apiBase}/api/v1/proposals/public/${proposal.public_token}`, '_blank');
            }}>
              <Send className="w-3 h-3" /> Share Link
            </GradientButton>
          </div>
        </div>

        {/* Translation Panel */}
        {showTranslate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <GlassCard className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Languages className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-gray-800">Translate Proposal</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Translate all sections to a local language. Technical terms and brand names stay in English.
                <br />
                <span className="text-amber-600 font-medium">Note: This will replace the current text. Consider duplicating the proposal first.</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {languages.map((lang) => (
                  <button key={lang.code} onClick={() => setSelectedLang(lang.code)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                      selectedLang === lang.code
                        ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                    }`}>
                    {lang.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <GradientButton size="sm" onClick={() => translateMutation.mutate(selectedLang)}
                  isLoading={translateMutation.isPending} disabled={translateMutation.isPending}>
                  {translateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Translating... (1-2 min)</>
                  ) : (
                    <><Languages className="w-4 h-4" /> Translate to {languages.find((l) => l.code === selectedLang)?.name}</>
                  )}
                </GradientButton>
                <GradientButton variant="secondary" size="sm" onClick={() => setShowTranslate(false)}>Cancel</GradientButton>
              </div>
              {translateMutation.isError && <p className="text-red-500 text-xs mt-2">Translation failed. Ollama may be slow — try again.</p>}
            </GlassCard>
          </motion.div>
        )}

        {/* Sections */}
        <div className="space-y-4">
          {sectionConfig.map((section, idx) => {
            const content = proposal[section.key] as string | null;
            const isEditing = editingSection === section.key;

            return (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlassCard>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md text-sm`}>
                        {section.icon}
                      </div>
                      <h3 className="font-semibold text-gray-800">{section.label}</h3>
                    </div>
                    {proposal.status === 'draft' && (
                      isEditing ? (
                        <div className="flex gap-2">
                          <GradientButton variant="ghost" size="sm" onClick={() => setEditingSection(null)}>Cancel</GradientButton>
                          <GradientButton size="sm" onClick={handleSave} isLoading={saveMutation.isPending}>
                            <Check className="w-3 h-3" /> Save
                          </GradientButton>
                        </div>
                      ) : (
                        <GradientButton variant="ghost" size="sm" onClick={() => handleEdit(section.key)}>
                          <Pencil className="w-3 h-3" /> Edit
                        </GradientButton>
                      )
                    )}
                  </div>

                  {isEditing ? (
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none text-sm resize-none min-h-[150px]"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={8}
                    />
                  ) : content ? (
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{content}</div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No content generated for this section</p>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
}
