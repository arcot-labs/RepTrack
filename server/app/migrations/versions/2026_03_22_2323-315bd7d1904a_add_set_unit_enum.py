"""
add set unit enum

Revision ID: 315bd7d1904a
Revises: 3fd5430b243e
Create Date: 2026-03-22 23:23:48.776432-05:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "315bd7d1904a"
down_revision: str | Sequence[str] | None = "3fd5430b243e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    set_unit_enum = sa.Enum("kg", "lb", name="set_unit")
    set_unit_enum.create(op.get_bind(), checkfirst=True)
    op.execute("ALTER TABLE sets ALTER COLUMN unit TYPE set_unit USING unit::set_unit")


def downgrade() -> None:
    set_unit_enum = sa.Enum("kg", "lb", name="set_unit")
    op.execute("ALTER TABLE sets ALTER COLUMN unit TYPE VARCHAR(255) USING unit::text")
    set_unit_enum.drop(op.get_bind(), checkfirst=True)
    set_unit_enum.drop(op.get_bind(), checkfirst=True)
