"""
change exercise name to case insensitive

Revision ID: e87490ac7ad5
Revises: 4f30fca6e7aa
Create Date: 2026-03-27 23:37:24.333380-05:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e87490ac7ad5"
down_revision: str | Sequence[str] | None = "4f30fca6e7aa"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE EXTENSION IF NOT EXISTS citext
        """
    )
    op.alter_column(
        "exercises",
        "name",
        existing_type=sa.VARCHAR(length=255),
        type_=postgresql.CITEXT(length=255),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "exercises",
        "name",
        existing_type=postgresql.CITEXT(length=255),
        type_=sa.VARCHAR(length=255),
        existing_nullable=False,
    )
