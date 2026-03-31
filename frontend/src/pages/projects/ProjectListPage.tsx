import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { useProjects } from '@/hooks/useProjects';
import type { ProjectStatus } from '@/types/project';

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Discovery', value: 'discovery' },
  { label: 'Site Visit', value: 'site_visit' },
  { label: 'Design', value: 'design' },
  { label: 'Quotation', value: 'quotation' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
];

const statusColors: Record<string, string> = {
  discovery: 'bg-gray-100 text-gray-700',
  site_visit: 'bg-blue-100 text-blue-700',
  design: 'bg-purple-100 text-purple-700',
  quotation: 'bg-orange-100 text-orange-700',
  proposal_sent: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-teal-100 text-teal-700',
  in_progress: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

const statusLabels: Record<string, string> = {
  discovery: 'Discovery',
  site_visit: 'Site Visit',
  design: 'Design',
  quotation: 'Quotation',
  proposal_sent: 'Proposal Sent',
  approved: 'Approved',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useProjects(page, search, statusFilter);

  const projects = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <GradientButton onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4" />
          New Project
        </GradientButton>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <AnimatedInput
            placeholder="Search projects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : projects.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16">
          <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">No projects found</p>
          <p className="text-gray-400 text-sm mb-6">Create your first project to get started</p>
          <GradientButton onClick={() => navigate('/projects/new')}>
            <Plus className="w-4 h-4" />
            New Project
          </GradientButton>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Client</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Type</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Area</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Budget Range</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {projects.map((project) => (
                    <motion.tr
                      key={project.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
                            {project.client_code || `CLT-${String(project.client_id).padStart(4, '0')}`}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5">{project.client_name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{project.name}</div>
                      </td>
                      <td className="px-6 py-4 capitalize text-gray-600">{project.project_type}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {project.total_area_sqft ? `${project.total_area_sqft} sqft` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {project.budget_min && project.budget_max
                          ? `${formatINR(project.budget_min)} - ${formatINR(project.budget_max)}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(project.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages} ({data?.total ?? 0} projects)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </PageWrapper>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}
