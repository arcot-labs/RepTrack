"""
add build column

Revision ID: afc6f273d43c
Revises: e87490ac7ad5
Create Date: 2026-04-05 13:52:25.525499-05:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "afc6f273d43c"
down_revision: str | Sequence[str] | None = "e87490ac7ad5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("feedbacks", sa.Column("build", sa.TEXT(), nullable=True))
    op.execute("UPDATE feedbacks SET build = '-' WHERE build IS NULL")
    op.alter_column("feedbacks", "build", nullable=False)


def downgrade() -> None:
    op.drop_column("feedbacks", "build")
