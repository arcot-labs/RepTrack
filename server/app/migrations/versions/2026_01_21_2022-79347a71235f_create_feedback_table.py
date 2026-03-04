"""create feedback table

Revision ID: 79347a71235f
Revises: b38ada12f56b
Create Date: 2026-01-21 20:22:47.327977-06:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.models.schemas.pydantic_json import PydanticJSON
from app.models.schemas.storage import StoredFile

revision: str = "79347a71235f"
down_revision: str | Sequence[str] | None = "b38ada12f56b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "feedbacks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column(
            "type", sa.Enum("feedback", "feature", name="feedback_type"), nullable=False
        ),
        sa.Column("text", sa.TEXT(), nullable=False),
        sa.Column("files", PydanticJSON(StoredFile), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_feedbacks_created_at", "feedbacks", ["created_at"], unique=False
    )
    op.create_index("ix_feedbacks_user_id", "feedbacks", ["user_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_feedbacks_user_id", table_name="feedbacks")
    op.drop_index("ix_feedbacks_created_at", table_name="feedbacks")
    op.drop_table("feedbacks")
