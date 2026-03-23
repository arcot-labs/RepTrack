from datetime import datetime

from sqlalchemy import (
    TEXT,
    DateTime,
    ForeignKey,
    Index,
    func,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.schemas.feedback import FeedbackType
from app.models.schemas.pydantic_json import PydanticJSON
from app.models.schemas.storage import StoredFile


class Feedback(Base):
    __tablename__ = "feedbacks"
    __table_args__ = (
        Index("ix_feedbacks_user_id", "user_id"),
        Index("ix_feedbacks_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    type: Mapped[FeedbackType] = mapped_column(
        SQLEnum(
            FeedbackType,
            name="feedback_type",
        ),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(
        TEXT,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        TEXT,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        TEXT,
        nullable=False,
    )
    files: Mapped[list[StoredFile]] = mapped_column(
        PydanticJSON(StoredFile),
        nullable=False,
        default=list,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
