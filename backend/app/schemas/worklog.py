from datetime import date, datetime

from pydantic import BaseModel


class WorkLogCreate(BaseModel):
    log_date: date
    status: str = "completed"
    summary: str | None = None
    work_category: str | None = None
    workers_present: int | None = None
    hours_worked: float | None = None
    delay_reason: str | None = None
    notes: str | None = None


class WorkLogUpdate(BaseModel):
    status: str | None = None
    summary: str | None = None
    work_category: str | None = None
    workers_present: int | None = None
    hours_worked: float | None = None
    delay_reason: str | None = None
    notes: str | None = None


class WorkLogResponse(BaseModel):
    id: int
    project_id: int
    log_date: date
    status: str
    summary: str | None
    work_category: str | None
    workers_present: int | None
    hours_worked: float | None
    delay_reason: str | None
    photos_count: int
    notes: str | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class WorkLogSummary(BaseModel):
    total_days: int
    working_days: int
    no_work_days: int
    partial_days: int
    delay_days: int  # rain + material_delay + labour_absent + client_hold
    total_hours: float
