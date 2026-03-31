from datetime import date, datetime
from pydantic import BaseModel


class QuotationLineItemResponse(BaseModel):
    id: int
    item_name: str
    description: str | None
    room_name: str | None
    quantity: float
    unit: str
    rate: float
    amount: float
    gst_rate: float = 18.0
    gst_amount: float = 0.0
    rate_source: str
    notes: str | None
    sort_order: int
    class Config:
        from_attributes = True


class QuotationSectionResponse(BaseModel):
    id: int
    section_name: str
    sort_order: int
    section_total: float
    line_items: list[QuotationLineItemResponse] = []
    class Config:
        from_attributes = True


class QuotationResponse(BaseModel):
    id: int
    quotation_code: str | None = None
    project_id: int
    version: int
    status: str
    project_name: str | None = None
    client_id: int | None = None
    client_name: str | None = None
    client_code: str | None = None
    subtotal: float
    discount_type: str | None
    discount_value: float
    discount_amount: float
    taxable_amount: float
    tax_rate: float
    tax_amount: float
    grand_total: float
    valid_until: date | None
    notes: str | None
    terms_and_conditions: str | None
    public_token: str
    sections: list[QuotationSectionResponse] = []
    created_at: datetime
    updated_at: datetime | None
    class Config:
        from_attributes = True


class QuotationItemInput(BaseModel):
    """Input for selecting a rate card item for a specific room."""
    room_id: int
    designer_rate_id: int
    quantity_override: float | None = None  # if None, auto-calculate from room measurements
    gst_rate: float = 18.0  # per-item GST %, 0 for exempt
    notes: str | None = None


class GenerateQuotationRequest(BaseModel):
    project_id: int
    items: list[QuotationItemInput]
    tax_rate: float = 18.0
    discount_type: str | None = None  # percentage or fixed
    discount_value: float = 0
    notes: str | None = None
    terms_and_conditions: str | None = None


class UpdateLineItemRequest(BaseModel):
    rate: float | None = None
    quantity: float | None = None
    gst_rate: float | None = None  # per-item GST %
    notes: str | None = None


class QuotationStatusUpdate(BaseModel):
    status: str
