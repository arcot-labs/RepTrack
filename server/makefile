.PHONY: dev test cov open-cov check check_migrations manual_migration auto_migration migrate

dev:
	uv run uvicorn app.main:app \
		--host 0.0.0.0 \
		--reload \
		--reload-dir 'app' \
		--reload-dir '../config/env' \
		--reload-include '.env'

test:
	uv run pytest

cov:
	uv run pytest --cov --cov-report=term --cov-report=html

open-cov:
	open -a "Google Chrome" htmlcov/index.html

check:
	uv run pyright

check_migrations:
	uv run alembic check

manual_migration:
	@test -n "$(msg)" || (echo "ERROR: msg is required"; exit 1)
	uv run alembic revision -m "$(msg)"

auto_migration:
	@test -n "$(msg)" || (echo "ERROR: msg is required"; exit 1)
	uv run alembic revision --autogenerate -m "$(msg)"

migrate:
	uv run alembic upgrade head
