"""
update feedback table columms

Revision ID: 10750c61592f
Revises: 79347a71235f
Create Date: 2026-01-22 10:12:49.042346-06:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "10750c61592f"
down_revision: str | Sequence[str] | None = "79347a71235f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "feedbacks", sa.Column("url", sa.TEXT(), nullable=False, server_default="")
    )
    op.add_column(
        "feedbacks", sa.Column("title", sa.TEXT(), nullable=False, server_default="")
    )
    op.add_column(
        "feedbacks",
        sa.Column("description", sa.TEXT(), nullable=False, server_default=""),
    )
    op.drop_column("feedbacks", "text")


def downgrade() -> None:
    op.add_column(
        "feedbacks",
        sa.Column(
            "text", sa.TEXT(), autoincrement=False, nullable=False, server_default=""
        ),
    )
    op.drop_column("feedbacks", "description")
    op.drop_column("feedbacks", "title")
    op.drop_column("feedbacks", "url")
