import api from '@/services/api';
import type { Project, ProjectCreate, Room, RoomCreate } from '@/types/project';

interface Paginated<T> { items: T[]; total: number; page: number; per_page: number; pages: number; }

export const getProjects = async (page = 1, perPage = 10, search = '', status = ''): Promise<Paginated<Project>> => (await api.get('/projects', { params: { page, per_page: perPage, search, status } })).data;
export const getProject = async (id: number): Promise<Project> => (await api.get(`/projects/${id}`)).data;
export const createProject = async (data: ProjectCreate): Promise<Project> => (await api.post('/projects', data)).data;
export const updateProject = async (id: number, data: Partial<ProjectCreate>): Promise<Project> => (await api.put(`/projects/${id}`, data)).data;
export const deleteProject = async (id: number): Promise<void> => { await api.delete(`/projects/${id}`); };
export const updateProjectStatus = async (id: number, status: string): Promise<Project> => (await api.put(`/projects/${id}/status`, { status })).data;
export const addRoom = async (projectId: number, data: RoomCreate): Promise<Room> => (await api.post(`/projects/${projectId}/rooms`, data)).data;
export const getRooms = async (projectId: number): Promise<Room[]> => (await api.get(`/projects/${projectId}/rooms`)).data;
export const updateRoom = async (projectId: number, roomId: number, data: Partial<RoomCreate>): Promise<Room> => (await api.put(`/projects/${projectId}/rooms/${roomId}`, data)).data;
export const deleteRoom = async (projectId: number, roomId: number): Promise<void> => { await api.delete(`/projects/${projectId}/rooms/${roomId}`); };
