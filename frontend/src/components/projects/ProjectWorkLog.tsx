import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Clock, Users, AlertTriangle, CheckCircle, XCircle, CloudRain, Package, UserX, PauseCircle, Trash2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import api from '@/services/api';

interface WorkLog {
  id: number;
  project_id: number;
  log_date: string;
  status: string;
  summary: string | null;
  work_category: string | null;
  workers_present: number | null;
  hours_worked: number | null;
  delay_reason: string | null;
  notes: string | null;
}

interface WorkLogSummary {
  total_days: number;
  working_days: number;
  no_work_days: number;
  partial_days: number;
  delay_days: number;
  total_hours: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  completed: { label: 'Work Done', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  partial: { label: 'Partial Work', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  no_work: { label: 'No Work', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  holiday: { label: 'Holiday', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Calendar },
  rain: { label: 'Rain', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200', icon: CloudRain },
  material_delay: { label: 'Material Delay', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: Package },
  labour_absent: { label: 'Labour Absent', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: UserX },
  client_hold: { label: 'Client Hold', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: PauseCircle },
};

const WORK_CATEGORIES = ['Civil Work', 'Electrical', 'Plumbing', 'Carpentry', 'Painting', 'False Ceiling', 'Flooring', 'Modular Kitchen', 'Furniture', 'Finishing', 'Cleanup', 'Other'];

export default function ProjectWorkLog({ projectId }: { projectId: number }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState('completed');
  const [formSummary, setFormSummary] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formWorkers, setFormWorkers] = useState('');
  const [formHours, setFormHours] = useState('8');
  const [formDelayReason, setFormDelayReason] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const { data: logs, isLoading } = useQuery<WorkLog[]>({
    queryKey: ['worklogs', projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/worklogs`)).data,
  });

  const { data: summary } = useQuery<WorkLogSummary>({
    queryKey: ['worklogs', projectId, 'summary'],
    queryFn: async () => (await api.get(`/projects/${projectId}/worklogs/summary`)).data,
  });

  const { data: missingDates } = useQuery<string[]>({
    queryKey: ['worklogs', projectId, 'missing'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      return (await api.get(`/projects/${projectId}/worklogs/missing-dates?from_date=${thirtyDaysAgo}&to_date=${today}`)).data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => (await api.post(`/projects/${projectId}/worklogs`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worklogs', projectId] });
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (logId: number) => { await api.delete(`/projects/${projectId}/worklogs/${logId}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklogs', projectId] }),
  });

  function resetForm() {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('completed');
    setFormSummary('');
    setFormCategory('');
    setFormWorkers('');
    setFormHours('8');
    setFormDelayReason('');
    setFormNotes('');
  }

  function handleSubmit() {
    createMutation.mutate({
      log_date: formDate,
      status: formStatus,
      summary: formSummary || undefined,
      work_category: formCategory || undefined,
      workers_present: formWorkers ? Number(formWorkers) : undefined,
      hours_worked: formHours ? Number(formHours) : undefined,
      delay_reason: formDelayReason || undefined,
      notes: formNotes || undefined,
    });
  }

  const isNoWork = ['no_work', 'rain', 'material_delay', 'labour_absent', 'client_hold', 'holiday'].includes(formStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Daily Work Log</h3>
        <GradientButton size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Log Today
        </GradientButton>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{summary.working_days}</p>
            <p className="text-[10px] text-emerald-600">Working Days</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{summary.partial_days}</p>
            <p className="text-[10px] text-amber-600">Partial Days</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{summary.no_work_days}</p>
            <p className="text-[10px] text-red-600">No Work Days</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-700">{summary.delay_days}</p>
            <p className="text-[10px] text-orange-600">Delay Days</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{summary.total_hours}</p>
            <p className="text-[10px] text-blue-600">Total Hours</p>
          </div>
        </div>
      )}

      {/* Missing dates alert */}
      {missingDates && missingDates.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">{missingDates.length} days not logged (last 30 days)</p>
            <p className="text-xs text-red-600 mt-0.5">
              {missingDates.slice(0, 5).map((d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })).join(', ')}
              {missingDates.length > 5 ? `, +${missingDates.length - 5} more` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Add Log Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard className="mb-4">
              <h4 className="font-medium mb-4">Add Work Log</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <AnimatedInput label="Date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-violet-500 outline-none text-sm bg-white" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                      <option value="completed">Work Done</option>
                      <option value="partial">Partial Work</option>
                      <option value="no_work">No Work</option>
                      <option value="holiday">Holiday</option>
                      <option value="rain">Rain</option>
                      <option value="material_delay">Material Delay</option>
                      <option value="labour_absent">Labour Absent</option>
                      <option value="client_hold">Client Hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Category</label>
                    <select className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-violet-500 outline-none text-sm bg-white" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                      <option value="">Select...</option>
                      {WORK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {!isNoWork && (
                  <div className="grid grid-cols-2 gap-3">
                    <AnimatedInput label="Workers Present" type="number" value={formWorkers} onChange={(e) => setFormWorkers(e.target.value)} placeholder="e.g., 5" />
                    <AnimatedInput label="Hours Worked" type="number" value={formHours} onChange={(e) => setFormHours(e.target.value)} placeholder="e.g., 8" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{isNoWork ? 'Reason for delay' : 'Work Summary'}</label>
                  <textarea className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-violet-500 outline-none text-sm resize-none" rows={2}
                    value={isNoWork ? formDelayReason : formSummary}
                    onChange={(e) => isNoWork ? setFormDelayReason(e.target.value) : setFormSummary(e.target.value)}
                    placeholder={isNoWork ? 'Why was work stopped...' : 'e.g., Completed false ceiling in master bedroom, started kitchen carpentry...'}
                  />
                </div>

                <div className="flex gap-2">
                  <GradientButton size="sm" onClick={handleSubmit} isLoading={createMutation.isPending}>Save Log</GradientButton>
                  <GradientButton variant="secondary" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</GradientButton>
                </div>
                {createMutation.isError && <p className="text-red-500 text-xs">Failed to save. Entry may already exist for this date.</p>}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Work Log Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-8"><span className="animate-spin h-6 w-6 border-3 border-violet-600 border-t-transparent rounded-full" /></div>
      ) : !logs?.length ? (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No work logs yet. Start tracking daily progress.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.completed;
            const Icon = cfg.icon;
            return (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg}`}>
                <Icon className={`w-5 h-5 ${cfg.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(log.log_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
                    {log.work_category && <span className="text-xs text-gray-500">{log.work_category}</span>}
                  </div>
                  {log.summary && <p className="text-sm text-gray-600 mt-1">{log.summary}</p>}
                  {log.delay_reason && <p className="text-sm text-red-600 mt-1">Reason: {log.delay_reason}</p>}
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    {log.workers_present != null && <span><Users className="w-3 h-3 inline" /> {log.workers_present} workers</span>}
                    {log.hours_worked != null && <span><Clock className="w-3 h-3 inline" /> {log.hours_worked} hrs</span>}
                  </div>
                </div>
                <button onClick={() => deleteMutation.mutate(log.id)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
