from datetime import datetime

from pydantic import BaseModel, EmailStr


class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    company: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    zip_code: str | None = None
    website: str | None = None
    notes: str | None = None
    tags: list[str] = []
    source: str | None = None
    special_discount: float = 0


class ClientUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    company: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    zip_code: str | None = None
    website: str | None = None
    notes: str | None = None
    tags: list[str] | None = None
    source: str | None = None
    special_discount: float | None = None


class ClientResponse(BaseModel):
    id: int
    client_code: str | None
    user_id: int
    name: str
    email: str
    phone: str | None
    company: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str | None
    zip_code: str | None
    website: str | None
    notes: str | None
    tags: list[str]
    source: str | None
    lifetime_value: float
    special_discount: float
    avatar_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class ClientNoteCreate(BaseModel):
    content: str


class ClientNoteResponse(BaseModel):
    id: int
    client_id: int
    user_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedClientResponse(BaseModel):
    items: list[ClientResponse]
    total: int
    page: int
    per_page: int
    pages: int
