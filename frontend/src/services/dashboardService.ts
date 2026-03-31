import api from '@/services/api';
import type { DashboardStats } from '@/types/dashboard';

export const getDashboardStats = async (): Promise<DashboardStats> => (await api.get('/dashboard/stats')).data;
