export interface Client {
  id: number;
  client_code: string | null;
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip_code: string | null;
  website: string | null;
  notes: string | null;
  tags: string[];
  source: string | null;
  lifetime_value: number;
  special_discount: number;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  website?: string;
  notes?: string;
  tags?: string[];
  source?: string;
  special_discount?: number;
}

export type ClientUpdate = Partial<ClientCreate>;

export interface ClientNote {
  id: number;
  client_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface ClientDocument {
  id: number;
  client_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}
