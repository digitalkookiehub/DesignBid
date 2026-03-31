import api from '@/services/api';
import type { Proposal, GenerateProposalRequest } from '@/types/proposal';

export const generateProposal = async (data: GenerateProposalRequest): Promise<Proposal> => (await api.post('/proposals/generate', data)).data;
export const getProposal = async (id: number): Promise<Proposal> => (await api.get(`/proposals/${id}`)).data;
export const getPublicProposal = async (token: string): Promise<Proposal> => (await api.get(`/proposals/public/${token}`)).data;
export const updateProposal = async (id: number, data: Partial<Proposal>): Promise<Proposal> => (await api.put(`/proposals/${id}`, data)).data;
export const updateProposalStatus = async (id: number, status: string): Promise<Proposal> => (await api.put(`/proposals/${id}/status`, { status })).data;
