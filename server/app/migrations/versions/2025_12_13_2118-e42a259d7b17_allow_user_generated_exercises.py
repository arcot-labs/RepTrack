"""
allow user-generated exercises

Revision ID: e42a259d7b17
Revises: c97f0fb64caa
Create Date: 2025-12-13 21:18:51.722106-06:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e42a259d7b17"
down_revision: str | Sequence[str] | None = "c97f0fb64caa"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # new table
    op.create_table(
        "exercise_muscle_groups",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("muscle_group_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["muscle_group_id"], ["muscle_groups.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "exercise_id",
            "muscle_group_id",
            name="uq_exercise_muscle_groups_exercise_muscle_group",
        ),
    )

    # backfill
    op.execute("""
        INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
        SELECT id, muscle_group_id
        FROM exercises
    """)

    # add columns
    op.add_column("exercises", sa.Column("user_id", sa.Integer(), nullable=True))
    op.add_column(
        "exercises",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # replace unique constraint
    op.drop_constraint(op.f("exercises_name_key"), "exercises", type_="unique")
    op.create_unique_constraint(
        "uq_exercises_user_name", "exercises", ["user_id", "name"]
    )

    # update fkey
    op.drop_constraint(
        op.f("exercises_muscle_group_id_fkey"), "exercises", type_="foreignkey"
    )
    op.create_foreign_key(
        None, "exercises", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )

    # drop column
    op.drop_column("exercises", "muscle_group_id")

    op.create_index(
        "ix_exercise_muscle_groups_muscle_group_id",
        "exercise_muscle_groups",
        ["muscle_group_id"],
        unique=False,
    )
    op.create_index("ix_exercises_user_id", "exercises", ["user_id"], unique=False)


def downgrade() -> None:
    raise RuntimeError(
        "Automatic downgrade not supported - exercise_muscle_groups cannot be safely collapsed"
    )
