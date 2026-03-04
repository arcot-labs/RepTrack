"""
update user table, create other tables

Revision ID: 1eac280a80f9
Revises: 1e5e7084d968
Create Date: 2025-12-13 09:47:51.790674-06:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "1eac280a80f9"
down_revision: str | Sequence[str] | None = "1e5e7084d968"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "muscle_groups",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.TEXT(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "exercises",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.TEXT(), nullable=True),
        sa.Column("muscle_group_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["muscle_group_id"], ["muscle_groups.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "workouts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.TEXT(), nullable=True),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workouts_started_at", "workouts", ["started_at"], unique=False)
    op.create_index("ix_workouts_user_id", "workouts", ["user_id"], unique=False)
    op.create_table(
        "workout_exercises",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("workout_id", sa.Integer(), nullable=False),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("notes", sa.TEXT(), nullable=True),
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
        sa.CheckConstraint(
            "position > 0", name="ck_workout_exercises_position_positive"
        ),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workout_id"], ["workouts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workout_id", "position", name="uq_workout_exercises_workout_position"
        ),
    )
    op.create_index(
        "ix_workout_exercises_exercise_id",
        "workout_exercises",
        ["exercise_id"],
        unique=False,
    )
    op.create_index(
        "ix_workout_exercises_workout_id",
        "workout_exercises",
        ["workout_id"],
        unique=False,
    )
    op.create_table(
        "sets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("workout_exercise_id", sa.Integer(), nullable=False),
        sa.Column("set_number", sa.Integer(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column("unit", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.TEXT(), nullable=True),
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
        sa.CheckConstraint(
            "unit IS NULL OR unit IN ('kg', 'lb')", name="ck_sets_unit_valid"
        ),
        sa.CheckConstraint(
            "reps IS NULL OR reps >= 0", name="ck_sets_reps_non_negative"
        ),
        sa.CheckConstraint("set_number > 0", name="ck_sets_set_number_positive"),
        sa.ForeignKeyConstraint(
            ["workout_exercise_id"], ["workout_exercises.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workout_exercise_id",
            "set_number",
            name="uq_sets_workout_exercise_set_number",
        ),
    )
    op.create_index(
        "ix_sets_workout_exercise_id", "sets", ["workout_exercise_id"], unique=False
    )
    op.alter_column(
        "users",
        "username",
        existing_type=sa.VARCHAR(length=50),
        type_=sa.String(length=255),
        existing_nullable=False,
    )
    op.alter_column(
        "users",
        "first_name",
        existing_type=sa.VARCHAR(length=100),
        type_=sa.String(length=255),
        existing_nullable=False,
    )
    op.alter_column(
        "users",
        "last_name",
        existing_type=sa.VARCHAR(length=100),
        type_=sa.String(length=255),
        existing_nullable=False,
    )
    op.alter_column(
        "users",
        "created_at",
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        existing_server_default=sa.text("now()"),
    )
    op.alter_column(
        "users",
        "updated_at",
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        existing_server_default=sa.text("now()"),
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        type_=postgresql.TIMESTAMP(),
        existing_nullable=False,
        existing_server_default=sa.text("now()"),
    )
    op.alter_column(
        "users",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=postgresql.TIMESTAMP(),
        existing_nullable=False,
        existing_server_default=sa.text("now()"),
    )
    op.alter_column(
        "users",
        "last_name",
        existing_type=sa.String(length=255),
        type_=sa.VARCHAR(length=100),
        existing_nullable=False,
    )
    op.alter_column(
        "users",
        "first_name",
        existing_type=sa.String(length=255),
        type_=sa.VARCHAR(length=100),
        existing_nullable=False,
    )
    op.alter_column(
        "users",
        "username",
        existing_type=sa.String(length=255),
        type_=sa.VARCHAR(length=50),
        existing_nullable=False,
    )
    op.drop_index("ix_sets_workout_exercise_id", table_name="sets")
    op.drop_table("sets")
    op.drop_index("ix_workout_exercises_workout_id", table_name="workout_exercises")
    op.drop_index("ix_workout_exercises_exercise_id", table_name="workout_exercises")
    op.drop_table("workout_exercises")
    op.drop_index("ix_workouts_user_id", table_name="workouts")
    op.drop_index("ix_workouts_started_at", table_name="workouts")
    op.drop_table("workouts")
    op.drop_table("exercises")
    op.drop_table("muscle_groups")
