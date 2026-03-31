import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as clientService from '@/services/clientService';
import type { ClientCreate, ClientUpdate } from '@/types/client';

export function useClients(page = 1, search = '') {
  return useQuery({
    queryKey: ['clients', page, search],
    queryFn: () => clientService.getClients(page, 10, search),
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientService.getClient(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientCreate) => clientService.createClient(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientUpdate }) =>
      clientService.updateClient(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clientService.deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useClientNotes(clientId: number) {
  return useQuery({
    queryKey: ['clients', clientId, 'notes'],
    queryFn: () => clientService.getClientNotes(clientId),
    enabled: !!clientId,
  });
}

export function useAddClientNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, content }: { clientId: number; content: string }) =>
      clientService.addClientNote(clientId, content),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['clients', variables.clientId, 'notes'] }),
  });
}
