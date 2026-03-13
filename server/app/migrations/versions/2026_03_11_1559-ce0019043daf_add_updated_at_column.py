"""
add updated at column

Revision ID: ce0019043daf
Revises: 9b0d6eab4c1f
Create Date: 2026-03-11 15:59:42.603721-05:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "ce0019043daf"
down_revision: str | Sequence[str] | None = "9b0d6eab4c1f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "muscle_groups",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("muscle_groups", "updated_at")
