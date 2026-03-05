"""
add expires at default

Revision ID: 1396f3316b15
Revises: 556de9726319
Create Date: 2026-01-30 18:54:36.650494-06:00
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy.sql import text

revision: str = "1396f3316b15"
down_revision: str | Sequence[str] | None = "556de9726319"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "registration_tokens",
        "expires_at",
        server_default=text("now() + interval '7 days'"),
    )


def downgrade() -> None:
    op.alter_column(
        "registration_tokens",
        "expires_at",
        server_default=None,
    )
