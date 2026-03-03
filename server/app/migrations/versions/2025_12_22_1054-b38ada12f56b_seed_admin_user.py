"""seed admin user

Revision ID: b38ada12f56b
Revises: 1e1a6b37847d
Create Date: 2025-12-22 10:54:09.798302-06:00

"""

import logging
import os
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import context, op
from dotenv import load_dotenv
from pwdlib import PasswordHash

logger = logging.getLogger(__name__)

# revision identifiers, used by Alembic.
revision: str = "b38ada12f56b"
down_revision: Union[str, Sequence[str], None] = "1e1a6b37847d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

testing = context.config.attributes.get("is_testing", False)
if testing:
    logger.info("Running in testing mode - using test settings for admin user")

    username = "admin"
    email = "admin@example.com"
    first_name = "Admin"
    last_name = "User"
    password = "password"
else:
    logger.info("Running in non-testing mode")

    load_dotenv("../config/env/.env")
    username = os.getenv("ADMIN__USERNAME")
    email = os.getenv("ADMIN__EMAIL")
    first_name = os.getenv("ADMIN__FIRST_NAME")
    last_name = os.getenv("ADMIN__LAST_NAME")
    password = os.getenv("ADMIN__PASSWORD")

if not all([username, email, first_name, last_name, password]):
    raise ValueError("Admin user environment variables are not fully set")

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def upgrade() -> None:
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            INSERT INTO users (username, email, first_name, last_name, password_hash, is_admin)
            VALUES (:username, :email, :first_name, :last_name, :password_hash, true)
            ON CONFLICT (email)
            DO UPDATE SET
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                password_hash = EXCLUDED.password_hash,
                is_admin = true,
                updated_at = NOW()
            """
        ),
        {
            "username": username,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "password_hash": hash_password(password),  # type: ignore
        },
    )


def downgrade() -> None:
    connection = op.get_bind()
    connection.execute(
        sa.text("DELETE FROM users WHERE email = :email"),
        {"email": email},
    )
