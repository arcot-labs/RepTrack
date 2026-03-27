import logging

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase

UNIQUE_VIOLATION_CODE = "23505"


logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


def is_unique_violation(
    error: IntegrityError,
    constraint_name: str,
) -> bool:
    sqlstate = getattr(getattr(error, "orig", None), "sqlstate", None)
    if sqlstate != UNIQUE_VIOLATION_CODE:
        logger.info(f"SQL state {sqlstate} does not indicate unique violation")
        return False

    logger.info("SQL state indicates unique violation, checking constraint name")
    if constraint_name in str(error):
        logger.info(f"Constraint name {constraint_name} found in error message")
        return True
    logger.info(f"Constraint name {constraint_name} not found in error message")
    return False
