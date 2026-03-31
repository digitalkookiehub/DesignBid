import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ps from '@/services/projectService';
import type { ProjectCreate, RoomCreate } from '@/types/project';

export const useProjects = (page = 1, search = '', status = '') =>
  useQuery({ queryKey: ['projects', page, search, status], queryFn: () => ps.getProjects(page, 10, search, status) });

export const useProject = (id: number) =>
  useQuery({ queryKey: ['projects', id], queryFn: () => ps.getProject(id), enabled: !!id });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: ProjectCreate) => ps.createProject(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }) });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => ps.deleteProject(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }) });
};

export const useAddRoom = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ projectId, data }: { projectId: number; data: RoomCreate }) => ps.addRoom(projectId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }) });
};

export const useDeleteRoom = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ projectId, roomId }: { projectId: number; roomId: number }) => ps.deleteRoom(projectId, roomId), onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }) });
};
