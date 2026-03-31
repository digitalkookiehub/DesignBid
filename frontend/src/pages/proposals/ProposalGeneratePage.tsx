import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { generateProposal } from '@/services/proposalService';

export default function ProposalGeneratePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = Number(searchParams.get('project') ?? 0);
  const quotationId = Number(searchParams.get('quotation') ?? 0) || undefined;

  const [title, setTitle] = useState('');
  const [styleNotes, setStyleNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () => generateProposal({
      project_id: projectId,
      quotation_id: quotationId,
      title: title || undefined,
      style_notes: styleNotes || undefined,
    }),
    onSuccess: (proposal) => navigate(`/proposals/${proposal.id}`),
  });

  if (!projectId) {
    return (
      <PageWrapper>
        <div className="text-center py-20 text-gray-500">
          <p>No project specified. Go to a project and click "Generate AI Proposal".</p>
          <GradientButton variant="secondary" className="mt-4" onClick={() => navigate('/projects')}>
            Go to Projects
          </GradientButton>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <GlassCard gradient>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Generate AI Proposal</h1>
            <p className="text-gray-500 mt-2">
              AI will write the scope of work, timeline, terms, and payment schedule.
              <br />
              <span className="text-xs text-gray-400">Powered by local AI (Gemma 3)</span>
            </p>
          </div>

          <div className="space-y-5">
            <AnimatedInput
              label="Proposal Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Interior Design Proposal - 3BHK Whitefield"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes for AI (optional)</label>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none text-sm resize-none"
                rows={4}
                value={styleNotes}
                onChange={(e) => setStyleNotes(e.target.value)}
                placeholder="e.g., Client prefers earthy tones, wants Italian marble in living room, needs child-safe materials in kids bedroom..."
              />
            </div>

            <div className="bg-violet-50 rounded-xl p-4 text-sm text-violet-700">
              <p className="font-medium mb-1">What AI will generate:</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-violet-600">
                <span>• Executive Summary</span>
                <span>• Scope of Work</span>
                <span>• Design Approach</span>
                <span>• Material Specifications</span>
                <span>• Timeline & Phases</span>
                <span>• Terms & Conditions</span>
                <span>• Payment Schedule</span>
              </div>
            </div>

            {mutation.isError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                Failed to generate proposal. Please try again.
              </div>
            )}

            <GradientButton
              className="w-full"
              size="lg"
              onClick={() => mutation.mutate()}
              isLoading={mutation.isPending}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating... (this may take 30-60 seconds)
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Proposal
                </>
              )}
            </GradientButton>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
