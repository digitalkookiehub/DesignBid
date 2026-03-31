import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as rc from '@/services/rateCardService';
import type { DesignerRateCreate } from '@/types/rate-card';

export const useCategories = () => useQuery({ queryKey: ['rate-card', 'categories'], queryFn: rc.getCategories });
export const useMyRates = (categoryId?: number, search?: string) =>
  useQuery({ queryKey: ['rate-card', 'my-rates', categoryId, search], queryFn: () => rc.getMyRates(categoryId, search) });

export const useCreateRate = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: DesignerRateCreate) => rc.createMyRate(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-card'] }) });
};

export const useUpdateRate = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<DesignerRateCreate> }) => rc.updateMyRate(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-card'] }) });
};

export const useDeleteRate = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => rc.deleteMyRate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-card'] }) });
};

export const useBulkUpdate = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ categoryId, percentage }: { categoryId: number; percentage: number }) => rc.bulkUpdateRates(categoryId, percentage), onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-card'] }) });
};

export const useInitializeRates = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: rc.initializeFromDefaults, onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-card'] }) });
};
