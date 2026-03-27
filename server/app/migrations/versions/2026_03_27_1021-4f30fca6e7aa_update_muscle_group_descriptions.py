"""
update muscle group descriptions

Revision ID: 4f30fca6e7aa
Revises: 95ee94cb9cfc
Create Date: 2026-03-27 10:21:13.316024-05:00
"""

from collections.abc import Sequence

from alembic import op

revision: str = "4f30fca6e7aa"
down_revision: str | Sequence[str] | None = "95ee94cb9cfc"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE muscle_groups
        SET description = LEFT(description, LENGTH(description) - 1),
        updated_at = NOW()
        WHERE RIGHT(description, 1) = '.'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE muscle_groups
        SET description = description || '.',
        updated_at = NOW()
        WHERE RIGHT(description, 1) <> '.'
        """
    )
