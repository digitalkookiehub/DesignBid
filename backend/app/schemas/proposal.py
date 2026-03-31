from datetime import datetime
from pydantic import BaseModel


class GenerateProposalRequest(BaseModel):
    project_id: int
    quotation_id: int | None = None
    title: str | None = None
    style_notes: str | None = None  # additional context for AI


class ProposalUpdate(BaseModel):
    title: str | None = None
    executive_summary: str | None = None
    scope_of_work: str | None = None
    design_approach: str | None = None
    material_specifications: str | None = None
    timeline_phases: str | None = None
    terms_and_conditions: str | None = None
    payment_schedule: str | None = None


class ProposalResponse(BaseModel):
    id: int
    project_id: int
    quotation_id: int | None
    title: str
    status: str
    executive_summary: str | None
    scope_of_work: str | None
    design_approach: str | None
    material_specifications: str | None
    timeline_phases: str | None
    terms_and_conditions: str | None
    payment_schedule: str | None
    ai_generated: bool
    ai_model_used: str | None
    public_token: str
    sent_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    class Config:
        from_attributes = True


class ProposalStatusUpdate(BaseModel):
    status: str
