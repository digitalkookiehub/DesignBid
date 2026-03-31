export interface QuotationLineItem {
  id: number;
  item_name: string;
  description: string | null;
  room_name: string | null;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  gst_rate: number;
  gst_amount: number;
  rate_source: string;
  notes: string | null;
  sort_order: number;
}

export interface QuotationSection {
  id: number;
  section_name: string;
  sort_order: number;
  section_total: number;
  line_items: QuotationLineItem[];
}

export interface Quotation {
  id: number;
  quotation_code?: string;
  project_id: number;
  version: number;
  status: string;
  project_name?: string;
  client_id?: number;
  client_name?: string;
  client_code?: string;
  subtotal: number;
  discount_type: string | null;
  discount_value: number;
  discount_amount: number;
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  valid_until: string | null;
  notes: string | null;
  terms_and_conditions: string | null;
  public_token: string;
  sections: QuotationSection[];
  created_at: string;
  updated_at: string | null;
}

export interface QuotationItemInput {
  room_id: number;
  designer_rate_id: number;
  quantity_override?: number;
  gst_rate?: number;  // per-item GST %, default 18, 0 for exempt
  notes?: string;
}

export interface GenerateQuotationRequest {
  project_id: number;
  items: QuotationItemInput[];
  tax_rate?: number;
  discount_type?: string;
  discount_value?: number;
  notes?: string;
}
