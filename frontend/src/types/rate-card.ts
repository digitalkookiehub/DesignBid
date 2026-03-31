export interface RateCardCategory {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SystemDefaultRate {
  id: number;
  category_id: number;
  item_name: string;
  description: string | null;
  unit: string;
  rate_per_unit: number;
  hsn_code: string | null;
  is_active: boolean;
}

export interface DesignerRate {
  id: number;
  designer_id: number;
  category_id: number;
  item_name: string;
  description: string | null;
  unit: string;
  rate_per_unit: number;
  vendor_name: string | null;
  vendor_contact: string | null;
  vendor_notes: string | null;
  system_default_id: number | null;
  is_custom: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DesignerRateCreate {
  category_id: number;
  item_name: string;
  description?: string;
  unit: string;
  rate_per_unit: number;
  vendor_name?: string;
  vendor_contact?: string;
  vendor_notes?: string;
  system_default_id?: number;
  is_custom?: boolean;
}

export interface RateResolution {
  item_name: string;
  rate: number;
  unit: string;
  source: string;
  designer_rate_id: number | null;
}
