import api from '@/services/api';
import type { Quotation, GenerateQuotationRequest } from '@/types/quotation';

export const generateQuotation = async (data: GenerateQuotationRequest): Promise<Quotation> => (await api.post('/quotations/generate', data)).data;
export const getQuotation = async (id: number): Promise<Quotation> => (await api.get(`/quotations/${id}`)).data;
export const getPublicQuotation = async (token: string): Promise<Quotation> => (await api.get(`/quotations/public/${token}`)).data;
export const updateLineItem = async (quotationId: number, itemId: number, data: { rate?: number; quantity?: number; notes?: string }) => (await api.put(`/quotations/${quotationId}/line-items/${itemId}`, data)).data;
export const recalculateQuotation = async (id: number): Promise<Quotation> => (await api.post(`/quotations/${id}/recalculate`)).data;
export const updateQuotationStatus = async (id: number, status: string): Promise<Quotation> => (await api.put(`/quotations/${id}/status`, { status })).data;
