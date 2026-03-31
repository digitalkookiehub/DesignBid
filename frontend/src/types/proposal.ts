export interface Proposal {
  id: number;
  project_id: number;
  quotation_id: number | null;
  title: string;
  status: string;
  executive_summary: string | null;
  scope_of_work: string | null;
  design_approach: string | null;
  material_specifications: string | null;
  timeline_phases: string | null;
  terms_and_conditions: string | null;
  payment_schedule: string | null;
  ai_generated: boolean;
  ai_model_used: string | null;
  public_token: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface GenerateProposalRequest {
  project_id: number;
  quotation_id?: number;
  title?: string;
  style_notes?: string;
}
