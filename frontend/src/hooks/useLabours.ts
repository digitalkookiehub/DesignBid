import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ls from '@/services/labourService';
import type { LabourCreate, AssignLabourRequest } from '@/types/labour';

export const useLabours = (specialization?: string, search?: string) =>
  useQuery({ queryKey: ['labours', specialization, search], queryFn: () => ls.getLabours(specialization, search) });

export const useCreateLabour = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: LabourCreate) => ls.createLabour(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['labours'] }) });
};

export const useUpdateLabour = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<LabourCreate> }) => ls.updateLabour(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['labours'] }) });
};

export const useDeleteLabour = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => ls.deleteLabour(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['labours'] }) });
};

export const useProjectLabours = (projectId: number) =>
  useQuery({ queryKey: ['project-labours', projectId], queryFn: () => ls.getProjectLabours(projectId), enabled: !!projectId });

export const useAssignLabour = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: AssignLabourRequest }) => ls.assignLabour(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-labours'] }),
  });
};

export const useRemoveAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, assignmentId }: { projectId: number; assignmentId: number }) => ls.removeAssignment(projectId, assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-labours'] }),
  });
};
