"""
fix muscle groups id sequence

Revision ID: 9b0d6eab4c1f
Revises: 77e3eb282239
Create Date: 2026-03-11 11:20:00.000000-06:00
"""

from collections.abc import Sequence

from alembic import op

revision: str = "9b0d6eab4c1f"
down_revision: str | Sequence[str] | None = "77e3eb282239"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        SELECT setval(
            pg_get_serial_sequence('muscle_groups', 'id'),
            COALESCE(MAX(id), 1),
            MAX(id) IS NOT NULL
        )
        FROM muscle_groups
        """
    )


def downgrade() -> None:
    pass
