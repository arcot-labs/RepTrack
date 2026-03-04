"""remove feedback table defaults

Revision ID: 5460f1eac74c
Revises: 10750c61592f
Create Date: 2026-01-23 12:47:29.459961-06:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "5460f1eac74c"
down_revision: str | Sequence[str] | None = "10750c61592f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "feedbacks",
        "url",
        existing_type=sa.TEXT(),
        server_default=None,
        existing_nullable=False,
    )
    op.alter_column(
        "feedbacks",
        "title",
        existing_type=sa.TEXT(),
        server_default=None,
        existing_nullable=False,
    )
    op.alter_column(
        "feedbacks",
        "description",
        existing_type=sa.TEXT(),
        server_default=None,
        existing_nullable=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "feedbacks",
        "description",
        existing_type=sa.TEXT(),
        server_default=sa.text("''::text"),
        existing_nullable=False,
    )
    op.alter_column(
        "feedbacks",
        "title",
        existing_type=sa.TEXT(),
        server_default=sa.text("''::text"),
        existing_nullable=False,
    )
    op.alter_column(
        "feedbacks",
        "url",
        existing_type=sa.TEXT(),
        server_default=sa.text("''::text"),
        existing_nullable=False,
    )
