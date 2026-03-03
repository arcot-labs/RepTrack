.PHONY: dev test check check_migrations manual_migration auto_migration run_migrations

dev:
	uv run uvicorn app.main:app \
		--host 0.0.0.0 \
		--reload \
		--reload-dir 'app' \
		--reload-dir '../config/env' \
		--reload-include '.env'

test:
	uv run pytest -v

open-coverage:
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

run_migrations:
	uv run alembic upgrade head
