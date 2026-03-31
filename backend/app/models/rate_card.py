import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.base import TimestampMixin


class RateCardCategory(Base):
    __tablename__ = "rate_card_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    system_defaults = relationship("SystemDefaultRate", back_populates="category", cascade="all, delete-orphan")
    designer_rates = relationship("DesignerRateCard", back_populates="category")


class UnitType(enum.Enum):
    sqft = "sqft"
    rft = "rft"
    nos = "nos"
    lumpsum = "lumpsum"
    sqm = "sqm"
    set = "set"
    point = "point"
    kg = "kg"
    bag = "bag"


class SystemDefaultRate(Base, TimestampMixin):
    __tablename__ = "system_default_rates"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("rate_card_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    item_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String(20), nullable=False)  # sqft, rft, nos, lumpsum, etc.
    rate_per_unit = Column(Numeric(12, 2), nullable=False)
    hsn_code = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    category = relationship("RateCardCategory", back_populates="system_defaults")


class DesignerRateCard(Base, TimestampMixin):
    __tablename__ = "designer_rate_cards"

    id = Column(Integer, primary_key=True, index=True)
    designer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("rate_card_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    item_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String(20), nullable=False)
    rate_per_unit = Column(Numeric(12, 2), nullable=False)
    vendor_name = Column(String(200), nullable=True)
    vendor_contact = Column(String(100), nullable=True)
    vendor_notes = Column(Text, nullable=True)
    system_default_id = Column(Integer, ForeignKey("system_default_rates.id", ondelete="SET NULL"), nullable=True)
    is_custom = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    designer = relationship("User", backref="rate_cards")
    category = relationship("RateCardCategory", back_populates="designer_rates")
    system_default = relationship("SystemDefaultRate")
    project_overrides = relationship("ProjectRateOverride", back_populates="designer_rate", cascade="all, delete-orphan")


class ProjectRateOverride(Base):
    __tablename__ = "project_rate_overrides"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    designer_rate_id = Column(Integer, ForeignKey("designer_rate_cards.id", ondelete="CASCADE"), nullable=False, index=True)
    override_rate = Column(Numeric(12, 2), nullable=False)
    reason = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    designer_rate = relationship("DesignerRateCard", back_populates="project_overrides")
    project = relationship("Project", backref="rate_overrides")
