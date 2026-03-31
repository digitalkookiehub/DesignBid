export type ProjectType = 'residential' | 'commercial';
export type ProjectStatus = 'discovery' | 'site_visit' | 'design' | 'quotation' | 'proposal_sent' | 'approved' | 'in_progress' | 'completed';
export type RoomType = 'bedroom' | 'kitchen' | 'bathroom' | 'living' | 'dining' | 'study' | 'balcony' | 'pooja' | 'utility' | 'entrance' | 'passage' | 'other';

export interface Room {
  id: number;
  project_id: number;
  name: string;
  room_type: RoomType;
  length: number;
  width: number;
  height: number;
  area_sqft: number;
  perimeter: number;
  wall_area_sqft: number;
  ceiling_area_sqft: number;
  carpet_area_sqft: number | null;
  electrical_points: number;
  plumbing_points: number;
  windows_count: number;
  doors_count: number;
  has_false_ceiling: boolean;
  has_flooring_work: boolean;
  has_painting: boolean;
  has_carpentry: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface RoomCreate {
  name: string;
  room_type?: RoomType;
  length: number;
  width: number;
  height?: number;
  electrical_points?: number;
  plumbing_points?: number;
  windows_count?: number;
  doors_count?: number;
  has_false_ceiling?: boolean;
  has_flooring_work?: boolean;
  has_painting?: boolean;
  has_carpentry?: boolean;
  notes?: string;
}

export interface Project {
  id: number;
  user_id: number;
  client_id: number;
  client_code: string | null;
  client_name: string | null;
  name: string;
  project_type: ProjectType;
  address: string | null;
  total_area_sqft: number | null;
  budget_min: number | null;
  budget_max: number | null;
  status: ProjectStatus;
  style_preferences: string[];
  family_size: number | null;
  special_requirements: string | null;
  notes: string | null;
  rooms: Room[];
  created_at: string;
  updated_at: string | null;
}

export interface ProjectCreate {
  client_id: number;
  name: string;
  project_type?: ProjectType;
  address?: string;
  total_area_sqft?: number;
  budget_min?: number;
  budget_max?: number;
  style_preferences?: string[];
  family_size?: number;
  special_requirements?: string;
  notes?: string;
}
