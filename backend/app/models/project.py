import enum
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin


class ProjectType(enum.Enum):
    residential = "residential"
    commercial = "commercial"


class ProjectStatus(enum.Enum):
    discovery = "discovery"
    site_visit = "site_visit"
    design = "design"
    quotation = "quotation"
    proposal_sent = "proposal_sent"
    approved = "approved"
    in_progress = "in_progress"
    completed = "completed"


class RoomType(enum.Enum):
    bedroom = "bedroom"
    kitchen = "kitchen"
    bathroom = "bathroom"
    living = "living"
    dining = "dining"
    study = "study"
    balcony = "balcony"
    pooja = "pooja"
    utility = "utility"
    entrance = "entrance"
    passage = "passage"
    other = "other"


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    project_type = Column(Enum(ProjectType), default=ProjectType.residential, nullable=False)
    address = Column(Text, nullable=True)
    total_area_sqft = Column(Numeric(10, 2), nullable=True)
    budget_min = Column(Numeric(12, 2), nullable=True)
    budget_max = Column(Numeric(12, 2), nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.discovery, nullable=False)
    style_preferences = Column(JSON, default=list, nullable=False)
    family_size = Column(Integer, nullable=True)
    special_requirements = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="projects")
    client = relationship("Client", back_populates="projects")
    rooms = relationship("Room", back_populates="project", cascade="all, delete-orphan", order_by="Room.sort_order")
    quotations = relationship("Quotation", back_populates="project", cascade="all, delete-orphan")
    proposals = relationship("Proposal", back_populates="project", cascade="all, delete-orphan")


class Room(Base, TimestampMixin):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    room_type = Column(Enum(RoomType), default=RoomType.other, nullable=False)
    length = Column(Numeric(8, 2), nullable=False)  # in feet
    width = Column(Numeric(8, 2), nullable=False)   # in feet
    height = Column(Numeric(8, 2), default=10, nullable=False)  # in feet
    carpet_area_sqft = Column(Numeric(10, 2), nullable=True)
    electrical_points = Column(Integer, default=0, nullable=False)
    plumbing_points = Column(Integer, default=0, nullable=False)
    windows_count = Column(Integer, default=0, nullable=False)
    doors_count = Column(Integer, default=0, nullable=False)
    has_false_ceiling = Column(Boolean, default=False, nullable=False)
    has_flooring_work = Column(Boolean, default=False, nullable=False)
    has_painting = Column(Boolean, default=False, nullable=False)
    has_carpentry = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="rooms")

    @property
    def area_sqft(self) -> Decimal:
        """Floor area = length × width, rounded to 2 decimals."""
        return (self.length * self.width).quantize(Decimal("0.01"))

    @property
    def perimeter(self) -> Decimal:
        """Perimeter = 2 × (length + width), rounded to 2 decimals."""
        return (2 * (self.length + self.width)).quantize(Decimal("0.01"))

    @property
    def wall_area_sqft(self) -> Decimal:
        """Total wall area = perimeter × height, rounded to 2 decimals."""
        return (self.perimeter * self.height).quantize(Decimal("0.01"))

    @property
    def ceiling_area_sqft(self) -> Decimal:
        """Ceiling area = floor area."""
        return self.area_sqft
