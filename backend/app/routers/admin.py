import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.auth.jwt import hash_password, validate_password_strength
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import MessageResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


class CreateEmployeeRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: str | None = None
    role: str = "user"  # user or admin


class EmployeeResponse(BaseModel):
    id: int
    email: str
    full_name: str
    company_name: str | None
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class UpdateEmployeeRequest(BaseModel):
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None


@router.get("/employees", response_model=list[EmployeeResponse])
async def list_employees(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users/employees. Admin only."""
    users = db.query(User).order_by(User.created_at).all()
    return users


@router.post("/employees", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    data: CreateEmployeeRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new employee/user. Admin only."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    if not validate_password_strength(data.password):
        raise HTTPException(status_code=400, detail="Password must be 8+ chars with uppercase, lowercase, and number")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        company_name=data.company_name or admin.company_name,
        role=UserRole(data.role) if data.role in ("user", "admin") else UserRole.user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("Employee created by admin %d: %s (role=%s)", admin.id, user.email, user.role.value)
    return user


@router.put("/employees/{user_id}", response_model=EmployeeResponse)
async def update_employee(
    user_id: int,
    data: UpdateEmployeeRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update employee details. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.role is not None and data.role in ("user", "admin"):
        user.role = UserRole(data.role)
    if data.is_active is not None:
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)
    logger.info("Employee updated by admin %d: user %d", admin.id, user_id)
    return user


@router.delete("/employees/{user_id}", response_model=MessageResponse)
async def deactivate_employee(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Deactivate an employee. Admin only."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.commit()
    logger.info("Employee deactivated by admin %d: user %d", admin.id, user_id)
    return MessageResponse(message=f"{user.full_name} has been deactivated")
