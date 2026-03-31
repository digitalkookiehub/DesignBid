import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, ChevronDown, ChevronRight, Users, FolderKanban } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import api from '@/services/api';
import type { Quotation } from '@/types/quotation';

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  revised: 'bg-orange-100 text-orange-700',
};

interface ClientGroup {
  clientId: number;
  clientName: string;
  clientCode: string;
  projects: ProjectGroup[];
  totalAmount: number;
  quotationCount: number;
}

interface ProjectGroup {
  projectId: number;
  projectName: string;
  quotations: Quotation[];
  totalAmount: number;
}

export default function QuotationListPage() {
  const navigate = useNavigate();
  const [expandedClients, setExpandedClients] = useState<Set<number>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const { data: quotations, isLoading } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: async () => (await api.get('/quotations')).data,
  });

  // Group quotations by Client → Project
  const clientGroups = useMemo<ClientGroup[]>(() => {
    if (!quotations) return [];

    const clientMap = new Map<number, ClientGroup>();

    for (const q of quotations) {
      const cid = q.client_id ?? 0;
      if (!clientMap.has(cid)) {
        clientMap.set(cid, {
          clientId: cid,
          clientName: q.client_name || 'Unknown Client',
          clientCode: q.client_code || `CLT-${cid}`,
          projects: [],
          totalAmount: 0,
          quotationCount: 0,
        });
      }
      const clientGroup = clientMap.get(cid)!;
      clientGroup.totalAmount += q.grand_total;
      clientGroup.quotationCount += 1;

      let projectGroup = clientGroup.projects.find((p) => p.projectId === q.project_id);
      if (!projectGroup) {
        projectGroup = {
          projectId: q.project_id,
          projectName: q.project_name || 'Unknown Project',
          quotations: [],
          totalAmount: 0,
        };
        clientGroup.projects.push(projectGroup);
      }
      projectGroup.quotations.push(q);
      projectGroup.totalAmount += q.grand_total;
    }

    return Array.from(clientMap.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [quotations]);

  const toggleClient = (clientId: number) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const toggleProject = (key: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-500 text-sm">Grouped by Client ID → Project → Quotation</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : clientGroups.length === 0 ? (
        <GlassCard className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No quotations yet</p>
          <p className="text-gray-400 text-sm mt-1">Create a project with rooms, then generate a quotation</p>
          <GradientButton className="mt-4" onClick={() => navigate('/projects')}>
            <Plus className="w-4 h-4" /> Go to Projects
          </GradientButton>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {clientGroups.map((clientGroup) => {
            const isClientExpanded = expandedClients.has(clientGroup.clientId);

            return (
              <div key={clientGroup.clientId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Client Row */}
                <motion.div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleClient(clientGroup.clientId)}
                  whileTap={{ scale: 0.995 }}
                >
                  <div className="flex items-center gap-3">
                    {isClientExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-700 text-sm">{clientGroup.clientCode}</span>
                        <span className="font-semibold text-gray-900">{clientGroup.clientName}</span>
                      </div>
                      <p className="text-xs text-gray-500">{clientGroup.quotationCount} quotation{clientGroup.quotationCount !== 1 ? 's' : ''} · {clientGroup.projects.length} project{clientGroup.projects.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{formatINR(clientGroup.totalAmount)}</span>
                </motion.div>

                {/* Projects under this client */}
                <AnimatePresence>
                  {isClientExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      {clientGroup.projects.map((projectGroup) => {
                        const projKey = `${clientGroup.clientId}-${projectGroup.projectId}`;
                        const isProjectExpanded = expandedProjects.has(projKey);

                        return (
                          <div key={projectGroup.projectId}>
                            {/* Project Row */}
                            <div
                              className="flex items-center justify-between px-5 py-3 pl-14 cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-gray-50"
                              onClick={() => toggleProject(projKey)}
                            >
                              <div className="flex items-center gap-3">
                                {isProjectExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                <FolderKanban className="w-4 h-4 text-blue-500" />
                                <div>
                                  <span className="font-medium text-gray-800 text-sm">{projectGroup.projectName}</span>
                                  <span className="ml-2 text-xs text-gray-400">{projectGroup.quotations.length} quotation{projectGroup.quotations.length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                              <span className="font-semibold text-gray-700 text-sm">{formatINR(projectGroup.totalAmount)}</span>
                            </div>

                            {/* Quotations under this project */}
                            <AnimatePresence>
                              {isProjectExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                >
                                  {projectGroup.quotations.map((q) => (
                                    <motion.div
                                      key={q.id}
                                      whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                                      className="flex items-center justify-between px-5 py-2.5 pl-24 cursor-pointer border-b border-gray-50 transition-colors"
                                      onClick={() => navigate(`/quotations/${q.id}`)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-blue-700 text-sm">{q.quotation_code || `QT-${q.id}`}</span>
                                            <span className="text-sm text-gray-600">v{q.version}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[q.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                              {q.status}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-400">
                                            {q.created_at ? new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="font-semibold text-gray-900 text-sm">{formatINR(q.grand_total)}</span>
                                    </motion.div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
