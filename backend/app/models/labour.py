import enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin


class LabourSpecialization(enum.Enum):
    civil = "civil"
    electrical = "electrical"
    plumbing = "plumbing"
    carpentry = "carpentry"
    painting = "painting"
    false_ceiling = "false_ceiling"
    flooring = "flooring"
    hvac = "hvac"
    modular_kitchen = "modular_kitchen"
    furniture = "furniture"
    supervisor = "supervisor"
    helper = "helper"
    other = "other"


class AssignmentStatus(enum.Enum):
    assigned = "assigned"
    working = "working"
    completed = "completed"
    released = "released"


class Labour(Base, TimestampMixin):
    __tablename__ = "labours"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    alt_phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    specialization = Column(Enum(LabourSpecialization), default=LabourSpecialization.other, nullable=False)
    daily_rate = Column(Numeric(10, 2), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    id_proof_type = Column(String(50), nullable=True)  # Aadhaar, PAN, etc.
    id_proof_number = Column(String(50), nullable=True)
    experience_years = Column(Integer, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", backref="labours")
    assignments = relationship("ProjectLabourAssignment", back_populates="labour", cascade="all, delete-orphan")


class ProjectLabourAssignment(Base, TimestampMixin):
    __tablename__ = "project_labour_assignments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    labour_id = Column(Integer, ForeignKey("labours.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(100), nullable=True)  # e.g., "Lead Carpenter", "Electrician"
    daily_rate = Column(Numeric(10, 2), nullable=True)  # Rate for this project (may differ from default)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.assigned, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    project = relationship("Project", backref="labour_assignments")
    labour = relationship("Labour", back_populates="assignments")

    __table_args__ = (
        Index("ix_project_labour_unique", "project_id", "labour_id", unique=True),
    )
