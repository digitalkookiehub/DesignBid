import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Sparkles, ExternalLink } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';

export default function ProposalListPage() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Proposals</h1>
          <p className="text-gray-500 mt-1">AI-generated scope of work proposals for your projects</p>
        </div>

        <GlassCard gradient>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Generate Proposals from Quotations</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Go to any quotation and click <strong>"AI Proposal"</strong> to generate a professional scope-of-work document using local AI.
            </p>
            <p className="text-sm text-gray-400">
              The AI writes Executive Summary, Scope of Work, Design Approach, Material Specs, Timeline, Terms, and Payment Schedule.
            </p>

            <div className="flex justify-center gap-4 mt-8">
              <motion.div
                whileHover={{ y: -3 }}
                className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer w-48"
                onClick={() => navigate('/quotations')}
              >
                <FileText className="w-8 h-8 text-orange-500 mb-2" />
                <p className="font-semibold text-gray-800 text-sm">View Quotations</p>
                <p className="text-xs text-gray-400 mt-1">Select a quotation to generate proposal</p>
              </motion.div>
              <motion.div
                whileHover={{ y: -3 }}
                className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer w-48"
                onClick={() => navigate('/projects')}
              >
                <ExternalLink className="w-8 h-8 text-blue-500 mb-2" />
                <p className="font-semibold text-gray-800 text-sm">View Projects</p>
                <p className="text-xs text-gray-400 mt-1">Start from a project to build proposal</p>
              </motion.div>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
