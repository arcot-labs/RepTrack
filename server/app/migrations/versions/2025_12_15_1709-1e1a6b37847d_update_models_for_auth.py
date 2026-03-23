"""
update models for auth

Revision ID: 1e1a6b37847d
Revises: e42a259d7b17
Create Date: 2025-12-15 17:09:27.596982-06:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "1e1a6b37847d"
down_revision: str | Sequence[str] | None = "e42a259d7b17"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "access_requests",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=255), nullable=False),
        sa.Column("last_name", sa.String(length=255), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "APPROVED", "REJECTED", name="access_request_status"),
            nullable=False,
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by", sa.Integer(), nullable=True),
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
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_access_requests_email", "access_requests", ["email"], unique=False
    )
    op.create_index(
        "ix_access_requests_status", "access_requests", ["status"], unique=False
    )
    op.create_table(
        "registration_tokens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("access_request_id", sa.Integer(), nullable=True),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["access_request_id"], ["access_requests.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(
        "ix_registration_tokens_access_request_id",
        "registration_tokens",
        ["access_request_id"],
        unique=False,
    )
    op.create_index(
        "ix_registration_tokens_email", "registration_tokens", ["email"], unique=False
    )
    op.create_index(
        "ix_registration_tokens_token_hash",
        "registration_tokens",
        ["token_hash"],
        unique=False,
    )
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False))
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_index("ix_users_username", "users", ["username"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_column("users", "is_admin")
    op.drop_index("ix_registration_tokens_token_hash", table_name="registration_tokens")
    op.drop_index("ix_registration_tokens_email", table_name="registration_tokens")
    op.drop_index(
        "ix_registration_tokens_access_request_id", table_name="registration_tokens"
    )
    op.drop_table("registration_tokens")
    op.drop_index("ix_access_requests_status", table_name="access_requests")
    op.drop_index("ix_access_requests_email", table_name="access_requests")
    op.drop_table("access_requests")
