"""update registration token columns

Revision ID: 556de9726319
Revises: 5460f1eac74c
Create Date: 2026-01-30 12:00:41.175900-06:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "556de9726319"
down_revision: str | Sequence[str] | None = "5460f1eac74c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

FK_NAME = "registration_tokens_access_request_id_fkey"


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "registration_tokens",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        """
        UPDATE registration_tokens
        SET expires_at = created_at + interval '7 days'
        """
    )
    op.alter_column(
        "registration_tokens",
        "expires_at",
        nullable=False,
    )

    op.alter_column(
        "registration_tokens",
        "access_request_id",
        existing_type=sa.INTEGER(),
        nullable=False,
    )
    op.drop_index(
        op.f("ix_registration_tokens_email"), table_name="registration_tokens"
    )
    op.drop_constraint(
        op.f("registration_tokens_access_request_id_fkey"),
        "registration_tokens",
        type_="foreignkey",
    )
    op.create_foreign_key(
        FK_NAME,
        "registration_tokens",
        "access_requests",
        ["access_request_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_column("registration_tokens", "email")


def downgrade() -> None:
    """Downgrade schema."""

    op.add_column(
        "registration_tokens",
        sa.Column("email", sa.VARCHAR(length=255), autoincrement=False, nullable=False),
    )
    op.drop_constraint(FK_NAME, "registration_tokens", type_="foreignkey")
    op.alter_column(
        "registration_tokens",
        "access_request_id",
        existing_type=sa.INTEGER(),
        nullable=True,
    )
    op.create_foreign_key(
        op.f("registration_tokens_access_request_id_fkey"),
        "registration_tokens",
        "access_requests",
        ["access_request_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_registration_tokens_email"),
        "registration_tokens",
        ["email"],
        unique=False,
    )
    op.drop_column("registration_tokens", "expires_at")
