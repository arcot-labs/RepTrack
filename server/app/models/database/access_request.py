from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import AccessRequestStatus

if TYPE_CHECKING:
    from app.models.database.user import User


class AccessRequest(Base):
    __tablename__ = "access_requests"
    __table_args__ = (
        Index("ix_access_requests_email", "email"),
        Index("ix_access_requests_status", "status"),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    # allow multiple requests from same email
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    first_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    last_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    status: Mapped[AccessRequestStatus] = mapped_column(
        SQLEnum(
            AccessRequestStatus,
            name="access_request_status",
        ),
        nullable=False,
        default=AccessRequestStatus.PENDING,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    reviewer: Mapped[User | None] = relationship(
        "User",
    )
