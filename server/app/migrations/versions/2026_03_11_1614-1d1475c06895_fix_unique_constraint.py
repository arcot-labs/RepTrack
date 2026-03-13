"""
fix unique constraint

Revision ID: 1d1475c06895
Revises: ce0019043daf
Create Date: 2026-03-11 16:14:14.222647-05:00
"""

from collections.abc import Sequence

from alembic import op

revision: str = "1d1475c06895"
down_revision: str | Sequence[str] | None = "ce0019043daf"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(op.f("uq_exercises_user_name"), "exercises", type_="unique")
    op.create_unique_constraint(
        "uq_exercises_user_name",
        "exercises",
        ["user_id", "name"],
        postgresql_nulls_not_distinct=True,
    )


def downgrade() -> None:
    op.drop_constraint("uq_exercises_user_name", "exercises", type_="unique")
    op.create_unique_constraint(
        op.f("uq_exercises_user_name"),
        "exercises",
        ["user_id", "name"],
    )
