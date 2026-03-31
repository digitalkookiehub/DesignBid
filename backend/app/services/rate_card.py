import json
import logging
import os
from decimal import Decimal

from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models.rate_card import (
    DesignerRateCard,
    ProjectRateOverride,
    RateCardCategory,
    SystemDefaultRate,
)
from app.schemas.rate_card import (
    DesignerRateCreate,
    DesignerRateUpdate,
    RateResolutionResponse,
)

logger = logging.getLogger(__name__)


def get_categories(db: Session) -> list:
    return (
        db.query(RateCardCategory)
        .filter(RateCardCategory.is_active == True)
        .order_by(RateCardCategory.sort_order)
        .all()
    )


def get_system_defaults(db: Session, category_id: int | None = None) -> list:
    query = db.query(SystemDefaultRate).filter(SystemDefaultRate.is_active == True)
    if category_id:
        query = query.filter(SystemDefaultRate.category_id == category_id)
    return query.order_by(SystemDefaultRate.item_name).all()


def get_designer_rates(
    db: Session, designer_id: int, category_id: int | None = None, search: str = ""
) -> list:
    query = db.query(DesignerRateCard).filter(
        DesignerRateCard.designer_id == designer_id,
        DesignerRateCard.is_active == True,
    )
    if category_id:
        query = query.filter(DesignerRateCard.category_id == category_id)
    if search:
        query = query.filter(DesignerRateCard.item_name.ilike(f"%{search}%"))
    return query.order_by(DesignerRateCard.category_id, DesignerRateCard.item_name).all()


def create_designer_rate(db: Session, designer_id: int, data: DesignerRateCreate) -> DesignerRateCard:
    rate = DesignerRateCard(
        designer_id=designer_id,
        category_id=data.category_id,
        item_name=data.item_name,
        description=data.description,
        unit=data.unit,
        rate_per_unit=Decimal(str(data.rate_per_unit)),
        vendor_name=data.vendor_name,
        vendor_contact=data.vendor_contact,
        vendor_notes=data.vendor_notes,
        system_default_id=data.system_default_id,
        is_custom=data.is_custom,
    )
    db.add(rate)
    db.commit()
    db.refresh(rate)
    logger.info("Designer rate created: %s (id=%d)", rate.item_name, rate.id)
    return rate


def update_designer_rate(
    db: Session, designer_id: int, rate_id: int, data: DesignerRateUpdate
) -> DesignerRateCard:
    rate = (
        db.query(DesignerRateCard)
        .filter(
            DesignerRateCard.id == rate_id,
            DesignerRateCard.designer_id == designer_id,
        )
        .first()
    )
    if not rate:
        raise NotFoundError("Rate card item")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "rate_per_unit" and value is not None:
            value = Decimal(str(value))
        setattr(rate, key, value)
    db.commit()
    db.refresh(rate)
    logger.info("Designer rate updated: id=%d", rate_id)
    return rate


def delete_designer_rate(db: Session, designer_id: int, rate_id: int) -> None:
    rate = (
        db.query(DesignerRateCard)
        .filter(
            DesignerRateCard.id == rate_id,
            DesignerRateCard.designer_id == designer_id,
        )
        .first()
    )
    if not rate:
        raise NotFoundError("Rate card item")
    rate.is_active = False
    db.commit()
    logger.info("Designer rate deactivated: id=%d", rate_id)


def bulk_update_rates(db: Session, designer_id: int, category_id: int, percentage: float) -> int:
    """Adjust all rates in a category by a percentage. Returns count of updated items."""
    rates = (
        db.query(DesignerRateCard)
        .filter(
            DesignerRateCard.designer_id == designer_id,
            DesignerRateCard.category_id == category_id,
            DesignerRateCard.is_active == True,
        )
        .all()
    )
    multiplier = Decimal(str(1 + percentage / 100))
    for rate in rates:
        rate.rate_per_unit = (rate.rate_per_unit * multiplier).quantize(Decimal("0.01"))
    db.commit()
    logger.info(
        "Bulk updated %d rates in category %d by %s%%", len(rates), category_id, percentage
    )
    return len(rates)


def resolve_rate(
    db: Session, designer_id: int, project_id: int | None, designer_rate_id: int
) -> RateResolutionResponse:
    """3-layer rate resolution: Project Override -> Designer Master -> System Default."""
    designer_rate = db.query(DesignerRateCard).filter(DesignerRateCard.id == designer_rate_id).first()
    if not designer_rate:
        raise NotFoundError("Rate card item")

    # Check for project override first
    if project_id:
        override = (
            db.query(ProjectRateOverride)
            .filter(
                ProjectRateOverride.project_id == project_id,
                ProjectRateOverride.designer_rate_id == designer_rate_id,
            )
            .first()
        )
        if override:
            return RateResolutionResponse(
                item_name=designer_rate.item_name,
                rate=float(override.override_rate),
                unit=designer_rate.unit,
                source="project_override",
                designer_rate_id=designer_rate.id,
            )

    # Designer master rate
    return RateResolutionResponse(
        item_name=designer_rate.item_name,
        rate=float(designer_rate.rate_per_unit),
        unit=designer_rate.unit,
        source="designer_master",
        designer_rate_id=designer_rate.id,
    )


def seed_system_defaults(db: Session) -> int:
    """Load system default rates from JSON. Returns count of items created."""
    data_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "system_defaults.json"
    )
    with open(data_path, "r") as f:
        data = json.load(f)

    count = 0
    for cat_data in data["categories"]:
        # Create or get category
        category = (
            db.query(RateCardCategory)
            .filter(RateCardCategory.name == cat_data["name"])
            .first()
        )
        if not category:
            category = RateCardCategory(
                name=cat_data["name"],
                description=cat_data.get("description"),
                sort_order=cat_data.get("sort_order", 0),
            )
            db.add(category)
            db.flush()

        # Create items
        for item in cat_data["items"]:
            existing = (
                db.query(SystemDefaultRate)
                .filter(
                    SystemDefaultRate.category_id == category.id,
                    SystemDefaultRate.item_name == item["item_name"],
                )
                .first()
            )
            if not existing:
                rate = SystemDefaultRate(
                    category_id=category.id,
                    item_name=item["item_name"],
                    description=item.get("description"),
                    unit=item["unit"],
                    rate_per_unit=Decimal(str(item["rate"])),
                )
                db.add(rate)
                count += 1

    db.commit()
    logger.info("Seeded %d system default rates", count)
    return count


def initialize_designer_rates_from_defaults(db: Session, designer_id: int) -> int:
    """Copy all system defaults as the designer's master rate card. Called during onboarding."""
    defaults = db.query(SystemDefaultRate).filter(SystemDefaultRate.is_active == True).all()
    count = 0
    for sd in defaults:
        existing = (
            db.query(DesignerRateCard)
            .filter(
                DesignerRateCard.designer_id == designer_id,
                DesignerRateCard.system_default_id == sd.id,
            )
            .first()
        )
        if not existing:
            rate = DesignerRateCard(
                designer_id=designer_id,
                category_id=sd.category_id,
                item_name=sd.item_name,
                description=sd.description,
                unit=sd.unit,
                rate_per_unit=sd.rate_per_unit,
                system_default_id=sd.id,
                is_custom=False,
            )
            db.add(rate)
            count += 1
    db.commit()
    logger.info("Initialized %d rates for designer %d from defaults", count, designer_id)
    return count
