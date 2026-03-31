export type LabourSpecialization = 'civil' | 'electrical' | 'plumbing' | 'carpentry' | 'painting' | 'false_ceiling' | 'flooring' | 'hvac' | 'modular_kitchen' | 'furniture' | 'supervisor' | 'helper' | 'other';
export type AssignmentStatus = 'assigned' | 'working' | 'completed' | 'released';

export interface Labour {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  alt_phone: string | null;
  email: string | null;
  specialization: LabourSpecialization;
  daily_rate: number | null;
  address: string | null;
  city: string | null;
  id_proof_type: string | null;
  id_proof_number: string | null;
  experience_years: number | null;
  rating: number | null;
  notes: string | null;
  is_active: boolean;
  current_project: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface LabourCreate {
  name: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  specialization?: LabourSpecialization;
  daily_rate?: number;
  address?: string;
  city?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  experience_years?: number;
  notes?: string;
}

export interface ProjectLabourAssignment {
  id: number;
  project_id: number;
  labour_id: number;
  labour_name: string | null;
  labour_phone: string | null;
  labour_specialization: string | null;
  role: string | null;
  daily_rate: number | null;
  start_date: string | null;
  end_date: string | null;
  status: AssignmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface AssignLabourRequest {
  labour_id: number;
  role?: string;
  daily_rate?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
}
