from datetime import datetime
from pydantic import BaseModel, field_validator


class RoomCreate(BaseModel):
    name: str
    room_type: str = "other"
    length: float
    width: float
    height: float = 10.0
    carpet_area_sqft: float | None = None
    electrical_points: int = 0
    plumbing_points: int = 0
    windows_count: int = 0
    doors_count: int = 0
    has_false_ceiling: bool = False
    has_flooring_work: bool = False
    has_painting: bool = False
    has_carpentry: bool = False
    notes: str | None = None
    sort_order: int = 0

    @field_validator("length", "width", "height")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Dimensions must be positive")
        return v


class RoomUpdate(BaseModel):
    name: str | None = None
    room_type: str | None = None
    length: float | None = None
    width: float | None = None
    height: float | None = None
    carpet_area_sqft: float | None = None
    electrical_points: int | None = None
    plumbing_points: int | None = None
    windows_count: int | None = None
    doors_count: int | None = None
    has_false_ceiling: bool | None = None
    has_flooring_work: bool | None = None
    has_painting: bool | None = None
    has_carpentry: bool | None = None
    notes: str | None = None
    sort_order: int | None = None


class RoomResponse(BaseModel):
    id: int
    project_id: int
    name: str
    room_type: str
    length: float
    width: float
    height: float
    area_sqft: float
    perimeter: float
    wall_area_sqft: float
    ceiling_area_sqft: float
    carpet_area_sqft: float | None
    electrical_points: int
    plumbing_points: int
    windows_count: int
    doors_count: int
    has_false_ceiling: bool
    has_flooring_work: bool
    has_painting: bool
    has_carpentry: bool
    notes: str | None
    sort_order: int
    created_at: datetime
    updated_at: datetime | None
    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    client_id: int
    name: str
    project_type: str = "residential"
    address: str | None = None
    total_area_sqft: float | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    style_preferences: list[str] = []
    family_size: int | None = None
    special_requirements: str | None = None
    notes: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    project_type: str | None = None
    address: str | None = None
    total_area_sqft: float | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    style_preferences: list[str] | None = None
    family_size: int | None = None
    special_requirements: str | None = None
    notes: str | None = None


class ProjectStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        valid = {"discovery", "site_visit", "design", "quotation", "proposal_sent", "approved", "in_progress", "completed"}
        if v not in valid:
            raise ValueError(f"Status must be one of: {valid}")
        return v


class ProjectResponse(BaseModel):
    id: int
    user_id: int
    client_id: int
    client_code: str | None = None
    client_name: str | None = None
    name: str
    project_type: str
    address: str | None
    total_area_sqft: float | None
    budget_min: float | None
    budget_max: float | None
    status: str
    style_preferences: list[str]
    family_size: int | None
    special_requirements: str | None
    notes: str | None
    rooms: list[RoomResponse] = []
    created_at: datetime
    updated_at: datetime | None
    class Config:
        from_attributes = True


class PaginatedProjectResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    per_page: int
    pages: int
