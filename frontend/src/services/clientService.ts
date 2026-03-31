import api from '@/services/api';
import type { Client, ClientCreate, ClientUpdate, ClientNote } from '@/types/client';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export async function getClients(
  page = 1,
  perPage = 10,
  search = ''
): Promise<PaginatedResponse<Client>> {
  const res = await api.get('/clients', { params: { page, per_page: perPage, search } });
  return res.data;
}

export async function getClient(id: number): Promise<Client> {
  const res = await api.get(`/clients/${id}`);
  return res.data;
}

export async function createClient(data: ClientCreate): Promise<Client> {
  const res = await api.post('/clients', data);
  return res.data;
}

export async function updateClient(id: number, data: ClientUpdate): Promise<Client> {
  const res = await api.put(`/clients/${id}`, data);
  return res.data;
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/clients/${id}`);
}

export async function getClientNotes(clientId: number): Promise<ClientNote[]> {
  const res = await api.get(`/clients/${clientId}/notes`);
  return res.data;
}

export async function addClientNote(clientId: number, content: string): Promise<ClientNote> {
  const res = await api.post(`/clients/${clientId}/notes`, { content });
  return res.data;
}

export async function uploadClientDocument(clientId: number, file: File): Promise<unknown> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post(`/clients/${clientId}/documents`, form);
  return res.data;
}

export async function getClientDocuments(clientId: number): Promise<unknown[]> {
  const res = await api.get(`/clients/${clientId}/documents`);
  return res.data;
}
