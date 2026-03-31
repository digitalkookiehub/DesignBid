from datetime import datetime
from pydantic import BaseModel, field_validator


class RateCardCategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None
    sort_order: int
    is_active: bool
    class Config:
        from_attributes = True


class SystemDefaultRateResponse(BaseModel):
    id: int
    category_id: int
    item_name: str
    description: str | None
    unit: str
    rate_per_unit: float
    hsn_code: str | None
    is_active: bool
    class Config:
        from_attributes = True


class DesignerRateCreate(BaseModel):
    category_id: int
    item_name: str
    description: str | None = None
    unit: str
    rate_per_unit: float
    vendor_name: str | None = None
    vendor_contact: str | None = None
    vendor_notes: str | None = None
    system_default_id: int | None = None
    is_custom: bool = False

    @field_validator("rate_per_unit")
    @classmethod
    def rate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Rate must be positive")
        return v


class DesignerRateUpdate(BaseModel):
    item_name: str | None = None
    description: str | None = None
    unit: str | None = None
    rate_per_unit: float | None = None
    vendor_name: str | None = None
    vendor_contact: str | None = None
    vendor_notes: str | None = None
    is_active: bool | None = None


class DesignerRateResponse(BaseModel):
    id: int
    designer_id: int
    category_id: int
    item_name: str
    description: str | None
    unit: str
    rate_per_unit: float
    vendor_name: str | None
    vendor_contact: str | None
    vendor_notes: str | None
    system_default_id: int | None
    is_custom: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime | None
    class Config:
        from_attributes = True


class ProjectRateOverrideCreate(BaseModel):
    designer_rate_id: int
    override_rate: float
    reason: str | None = None

    @field_validator("override_rate")
    @classmethod
    def rate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Rate must be positive")
        return v


class ProjectRateOverrideResponse(BaseModel):
    id: int
    project_id: int
    designer_rate_id: int
    override_rate: float
    reason: str | None
    created_at: datetime
    class Config:
        from_attributes = True


class BulkUpdateRequest(BaseModel):
    category_id: int
    percentage: float  # e.g., 10 for +10%, -5 for -5%


class RateResolutionResponse(BaseModel):
    item_name: str
    rate: float
    unit: str
    source: str  # system_default, designer_master, project_override
    designer_rate_id: int | None = None
