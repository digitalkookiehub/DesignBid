import api from '@/services/api';
import type { Labour, LabourCreate, ProjectLabourAssignment, AssignLabourRequest } from '@/types/labour';

export const getLabours = async (specialization?: string, search?: string): Promise<Labour[]> =>
  (await api.get('/labours', { params: { specialization, search } })).data;
export const getLabour = async (id: number): Promise<Labour> => (await api.get(`/labours/${id}`)).data;
export const createLabour = async (data: LabourCreate): Promise<Labour> => (await api.post('/labours', data)).data;
export const updateLabour = async (id: number, data: Partial<LabourCreate>): Promise<Labour> => (await api.put(`/labours/${id}`, data)).data;
export const deleteLabour = async (id: number): Promise<void> => { await api.delete(`/labours/${id}`); };

export const bulkUpload = async (file: File): Promise<{ created: number; skipped: number; errors: string[] }> => {
  const form = new FormData();
  form.append('file', file);
  return (await api.post('/labours/bulk-upload', form)).data;
};

export const downloadTemplate = () => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8003';
  window.open(`${apiBase}/api/v1/labours/template/download`, '_blank');
};

export const exportLabours = () => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8003';
  const token = localStorage.getItem('access_token');
  window.open(`${apiBase}/api/v1/labours/export/excel?token=${token}`, '_blank');
};

export const getProjectLabours = async (projectId: number): Promise<ProjectLabourAssignment[]> =>
  (await api.get(`/labours/project/${projectId}`)).data;
export const assignLabour = async (projectId: number, data: AssignLabourRequest): Promise<ProjectLabourAssignment> =>
  (await api.post(`/labours/project/${projectId}/assign`, data)).data;
export const updateAssignment = async (projectId: number, assignmentId: number, data: Record<string, unknown>): Promise<void> => {
  await api.put(`/labours/project/${projectId}/assignment/${assignmentId}`, data);
};
export const removeAssignment = async (projectId: number, assignmentId: number): Promise<void> => {
  await api.delete(`/labours/project/${projectId}/assignment/${assignmentId}`);
};
