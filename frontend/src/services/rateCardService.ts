import api from '@/services/api';
import type { RateCardCategory, SystemDefaultRate, DesignerRate, DesignerRateCreate } from '@/types/rate-card';

export const getCategories = async (): Promise<RateCardCategory[]> => (await api.get('/rate-cards/categories')).data;
export const getSystemDefaults = async (categoryId?: number): Promise<SystemDefaultRate[]> => (await api.get('/rate-cards/system-defaults', { params: { category_id: categoryId } })).data;
export const getMyRates = async (categoryId?: number, search?: string): Promise<DesignerRate[]> => (await api.get('/rate-cards/my-rates', { params: { category_id: categoryId, search } })).data;
export const createMyRate = async (data: DesignerRateCreate): Promise<DesignerRate> => (await api.post('/rate-cards/my-rates', data)).data;
export const updateMyRate = async (id: number, data: Partial<DesignerRateCreate>): Promise<DesignerRate> => (await api.put(`/rate-cards/my-rates/${id}`, data)).data;
export const deleteMyRate = async (id: number): Promise<void> => { await api.delete(`/rate-cards/my-rates/${id}`); };
export const bulkUpdateRates = async (categoryId: number, percentage: number) => (await api.post('/rate-cards/my-rates/bulk-update', { category_id: categoryId, percentage })).data;
export const initializeFromDefaults = async () => (await api.post('/rate-cards/my-rates/initialize')).data;
export const seedDefaults = async () => (await api.post('/rate-cards/seed-defaults')).data;
