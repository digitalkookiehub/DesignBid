from datetime import date, datetime

from pydantic import BaseModel, field_validator


class LabourCreate(BaseModel):
    name: str
    phone: str
    alt_phone: str | None = None
    email: str | None = None
    specialization: str = "other"
    daily_rate: float | None = None
    address: str | None = None
    city: str | None = None
    id_proof_type: str | None = None
    id_proof_number: str | None = None
    experience_years: int | None = None
    notes: str | None = None


class LabourUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    alt_phone: str | None = None
    email: str | None = None
    specialization: str | None = None
    daily_rate: float | None = None
    address: str | None = None
    city: str | None = None
    id_proof_type: str | None = None
    id_proof_number: str | None = None
    experience_years: int | None = None
    rating: int | None = None
    notes: str | None = None
    is_active: bool | None = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Rating must be between 1 and 5")
        return v


class LabourResponse(BaseModel):
    id: int
    user_id: int
    name: str
    phone: str
    alt_phone: str | None
    email: str | None
    specialization: str
    daily_rate: float | None
    address: str | None
    city: str | None
    id_proof_type: str | None
    id_proof_number: str | None
    experience_years: int | None
    rating: int | None
    notes: str | None
    is_active: bool
    current_project: str | None = None  # populated in service
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class AssignLabourRequest(BaseModel):
    labour_id: int
    role: str | None = None
    daily_rate: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None


class UpdateAssignmentRequest(BaseModel):
    role: str | None = None
    daily_rate: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None
    notes: str | None = None


class ProjectLabourResponse(BaseModel):
    id: int
    project_id: int
    labour_id: int
    labour_name: str | None = None
    labour_phone: str | None = None
    labour_specialization: str | None = None
    role: str | None
    daily_rate: float | None
    start_date: date | None
    end_date: date | None
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True
