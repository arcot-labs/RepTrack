from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.database.access_request import AccessRequest


class RegistrationToken(Base):
    __tablename__ = "registration_tokens"
    __table_args__ = (
        Index("ix_registration_tokens_access_request_id", "access_request_id"),
        Index("ix_registration_tokens_token_prefix", "token_prefix"),
        Index("ix_registration_tokens_token_hash", "token_hash"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    access_request_id: Mapped[int] = mapped_column(
        ForeignKey(
            "access_requests.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    token_prefix: Mapped[str] = mapped_column(
        String(12),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now() + interval '7 days'"),
        nullable=False,
    )
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
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

    access_request: Mapped[AccessRequest] = relationship(
        "AccessRequest",
    )

    def is_used(self) -> bool:
        return self.used_at is not None

    def is_expired(self) -> bool:
        return datetime.now(UTC) >= self.expires_at
