"""
add token prefix columns

Revision ID: 77e3eb282239
Revises: 1b384d4d04c8
Create Date: 2026-02-09 15:45:45.525416-06:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "77e3eb282239"
down_revision: str | Sequence[str] | None = "1b384d4d04c8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("DELETE FROM password_reset_tokens")
    op.add_column(
        "password_reset_tokens",
        sa.Column("token_prefix", sa.String(length=12), nullable=False),
    )
    op.create_index(
        "ix_password_reset_tokens_token_prefix",
        "password_reset_tokens",
        ["token_prefix"],
        unique=False,
    )

    op.execute("DELETE FROM registration_tokens")
    op.add_column(
        "registration_tokens",
        sa.Column("token_prefix", sa.String(length=12), nullable=False),
    )
    op.create_index(
        "ix_registration_tokens_token_prefix",
        "registration_tokens",
        ["token_prefix"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_registration_tokens_token_prefix", table_name="registration_tokens"
    )
    op.drop_column("registration_tokens", "token_prefix")
    op.drop_index(
        "ix_password_reset_tokens_token_prefix", table_name="password_reset_tokens"
    )
    op.drop_column("password_reset_tokens", "token_prefix")
