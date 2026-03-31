import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, UserMinus, Users, Phone } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import {
  useProjectLabours,
  useLabours,
  useAssignLabour,
  useRemoveAssignment,
} from '@/hooks/useLabours';
import type {
  Labour,
  AssignmentStatus,
  AssignLabourRequest,
  ProjectLabourAssignment,
} from '@/types/labour';

const STATUS_STYLES: Record<AssignmentStatus, string> = {
  assigned: 'bg-yellow-100 text-yellow-700',
  working: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  released: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  assigned: 'Assigned',
  working: 'Working',
  completed: 'Completed',
  released: 'Released',
};

interface ProjectLabourSectionProps {
  projectId: number;
}

interface AssignFormState {
  labour_id: number | '';
  role: string;
  daily_rate: number | '';
  start_date: string;
  end_date: string;
  notes: string;
}

const EMPTY_ASSIGN_FORM: AssignFormState = {
  labour_id: '',
  role: '',
  daily_rate: '',
  start_date: '',
  end_date: '',
  notes: '',
};

function AssignmentCard({
  assignment,
  onRemove,
}: {
  assignment: ProjectLabourAssignment;
  onRemove: (id: number) => void;
}) {
  return (
    <GlassCard className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-gray-900 text-sm">
            {assignment.labour_name ?? 'Unknown'}
          </h4>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[assignment.status]}`}
          >
            {STATUS_LABELS[assignment.status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
          {assignment.labour_phone && (
            <span className="flex items-center gap-1">
              <Phone size={12} />
              {assignment.labour_phone}
            </span>
          )}
          {assignment.labour_specialization && (
            <span className="capitalize">{assignment.labour_specialization.replace('_', ' ')}</span>
          )}
          {assignment.role && <span>Role: {assignment.role}</span>}
          {assignment.daily_rate !== null && <span>Rate: {assignment.daily_rate}/day</span>}
        </div>
      </div>
      <button
        onClick={() => onRemove(assignment.id)}
        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
        title="Remove assignment"
      >
        <UserMinus size={16} />
      </button>
    </GlassCard>
  );
}

export default function ProjectLabourSection({ projectId }: ProjectLabourSectionProps) {
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [form, setForm] = useState<AssignFormState>({ ...EMPTY_ASSIGN_FORM });

  const { data: assignments, isLoading: assignmentsLoading } = useProjectLabours(projectId);
  const { data: allLabours } = useLabours();
  const assignMutation = useAssignLabour();
  const removeMutation = useRemoveAssignment();

  const assignmentList = useMemo(
    () => (Array.isArray(assignments) ? assignments : []) as ProjectLabourAssignment[],
    [assignments]
  );

  const allLabourList = useMemo(
    () => (Array.isArray(allLabours) ? allLabours : []) as Labour[],
    [allLabours]
  );

  // Filter out labourers already assigned to this project
  const assignedLabourIds = useMemo(
    () => new Set(assignmentList.map((a) => a.labour_id)),
    [assignmentList]
  );

  const availableLabours = useMemo(
    () => allLabourList.filter((l) => !assignedLabourIds.has(l.id)),
    [allLabourList, assignedLabourIds]
  );

  const handleRemove = (assignmentId: number) => {
    if (confirm('Remove this labour assignment?')) {
      removeMutation.mutate({ projectId, assignmentId });
    }
  };

  const handleLabourSelect = (labourId: number | '') => {
    setForm((prev) => {
      if (labourId === '') return { ...prev, labour_id: '', daily_rate: '' };
      const selected = allLabourList.find((l) => l.id === labourId);
      return {
        ...prev,
        labour_id: labourId,
        daily_rate: selected?.daily_rate ?? '',
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.labour_id === '') return;

    const payload: AssignLabourRequest = {
      labour_id: form.labour_id as number,
      role: form.role || undefined,
      daily_rate: form.daily_rate !== '' ? Number(form.daily_rate) : undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      notes: form.notes || undefined,
    };

    assignMutation.mutate(
      { projectId, data: payload },
      {
        onSuccess: () => {
          setForm({ ...EMPTY_ASSIGN_FORM });
          setShowAssignForm(false);
        },
      }
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Assigned Labour</h2>
        <GradientButton size="sm" onClick={() => setShowAssignForm(true)}>
          <Plus size={16} /> Assign Labour
        </GradientButton>
      </div>

      {/* Assign Labour Modal */}
      <AnimatePresence>
        {showAssignForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAssignForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Assign Labour</h3>
                <button
                  onClick={() => setShowAssignForm(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select Labour *
                  </label>
                  <select
                    value={form.labour_id}
                    onChange={(e) =>
                      handleLabourSelect(e.target.value ? Number(e.target.value) : '')
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-sm"
                  >
                    <option value="">Choose a labourer...</option>
                    {availableLabours.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} - {l.specialization.replace('_', ' ')} ({l.phone})
                      </option>
                    ))}
                  </select>
                  {availableLabours.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      All labourers are already assigned to this project.
                    </p>
                  )}
                </div>
                <AnimatedInput
                  label="Role"
                  placeholder='e.g., "Lead Carpenter"'
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                />
                <AnimatedInput
                  label="Daily Rate"
                  type="number"
                  value={form.daily_rate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      daily_rate: e.target.value ? Number(e.target.value) : '',
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <AnimatedInput
                    label="Start Date"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                  />
                  <AnimatedInput
                    label="End Date"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-sm resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <GradientButton
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAssignForm(false)}
                  >
                    Cancel
                  </GradientButton>
                  <GradientButton
                    type="submit"
                    isLoading={assignMutation.isPending}
                    disabled={form.labour_id === ''}
                  >
                    Assign
                  </GradientButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment list */}
      {assignmentsLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : assignmentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Users size={40} strokeWidth={1.2} />
          <p className="mt-3 text-sm font-medium text-gray-500">No labourers assigned yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignmentList.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
