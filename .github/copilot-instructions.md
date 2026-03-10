# RepTrack – Copilot Instructions

RepTrack is a full-stack strength-training tracker. The client is React + Vite (TypeScript), the server is FastAPI (Python 3.14+), and the database is PostgreSQL via SQLAlchemy 2.0 + AsyncPG.

---

## Repository Layout

```
client/          React + Vite frontend
server/          FastAPI backend
config/env/      Environment files (.env.example → .env)
config/infra/    Docker Compose for dev/prod
scripts/         Dev bootstrap (dev.sh) and API generation
```

---

## Commands

### Server (`cd server`)

| Task                       | Command                                                         |
| -------------------------- | --------------------------------------------------------------- |
| Start dev server           | `make dev`                                                      |
| Run all tests              | `make test`                                                     |
| Run tests with coverage    | `make cov`                                                      |
| Run a single test file     | `uv run pytest app/tests/api/auth/test_login.py -v`             |
| Run a single test function | `uv run pytest app/tests/api/auth/test_login.py::test_login -v` |
| Type check                 | `make check`                                                    |
| Generate migration         | `make auto_migration msg="description"`                         |
| Apply migrations           | `make migrate`                                                  |
| Verify migrations          | `make check_migrations`                                         |

### Client (`cd client`)

| Task                  | Command                |
| --------------------- | ---------------------- |
| Start dev server      | `npm run dev`          |
| Build                 | `npm run build`        |
| Lint (auto-fix)       | `npm run lint`         |
| Regenerate API client | `npm run generate-api` |

### Root (monorepo)

| Task              | Command            |
| ----------------- | ------------------ |
| Format all        | `npm run format`   |
| Lint all          | `npm run lint`     |
| Type check server | `npm run check:py` |

---

## Dev Environment

```bash
cp config/env/.env.example config/env/.env    # fill in values
./scripts/dev.sh                              # install deps + start Docker Compose
./scripts/dev.sh -s                           # skip install, just start
./scripts/dev.sh -o                           # omit client/server containers
```

Docker Compose runs postgres, pgadmin, migrations, server (uvicorn), and client (Vite) with hot reload.

---

## Architecture

### Server

- **Entry point:** `server/app/main.py` — creates the FastAPI app, registers routers, exception handlers, and lifespan
- **Routing:** `server/app/api/router.py` composes all routers under `/api`. Each domain lives in `server/app/api/endpoints/{domain}.py`
- **Services:** `server/app/services/{domain}.py` — business logic, called by endpoints. Keep endpoints thin.
- **Database models:** `server/app/models/database/{entity}.py` — SQLAlchemy 2.0 declarative models
- **Schemas:** `server/app/models/schemas/{domain}.py` — Pydantic request/response models
- **Config:** `server/app/core/config.py` — `Settings` loaded via `pydantic-settings` with `__` as nested delimiter (e.g., `DB__HOST`)
- **Auth:** HTTP-only JWT cookies (`ACCESS_JWT_KEY`, `REFRESH_JWT_KEY`). `get_current_user` and `get_current_admin` are FastAPI dependencies in `server/app/core/security.py`
- **Errors:** Custom `HTTPError` subclasses in `server/app/models/errors.py`; raise them directly (e.g., `raise InvalidCredentials()`)

### Client

- **API client:** Auto-generated from OpenAPI spec via `@hey-api/openapi-ts`. Run `npm run generate-api` after server changes. Do **not** hand-edit `src/api/`.
- **Auth guards:** `RequireAuth` / `RequireGuest` components wrap routes in `src/router/`
- **Axios interceptors:** Handle 401 auto-refresh with request queueing (`src/lib/axios.ts`)

---

## Key Conventions

### Endpoints

```python
api_router = APIRouter(prefix="/auth", tags=["Auth"])

@api_router.post(
    "/login",
    operation_id="login", # required — used for OpenAPI client generation
    status_code=status.HTTP_204_NO_CONTENT,
    responses={status.HTTP_401_UNAUTHORIZED: ErrorResponseModel},
)
async def login_endpoint(
    req: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    res: Response,
):
    result = await login(...) # delegate to service
    res.set_cookie(...)
```

Always set `operation_id` — it drives the generated TypeScript client method name.

### Schemas

- Response schemas: `{Entity}Public` (e.g., `UserPublic`)
- Request schemas: `{Action}Request` (e.g., `LoginRequest`, `RegisterRequest`)
- Convert ORM → schema with `Model.model_validate(orm_obj, from_attributes=True)`
- Shared field type aliases (`Name`, `Username`, `Password`, `Email`) live in `server/app/models/schemas/types.py`

### Database Models

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

- Use SQLAlchemy 2.0 `Mapped` annotations throughout
- All models include `created_at` / `updated_at` with `server_default=func.now()`
- Alembic bulk updates must explicitly set `updated_at` (no ORM trigger)
- Table names: lowercase plural; index names: `ix_{table}_{column}`

### Auth in Routes

```python
# Authenticated route
async def endpoint(user: Annotated[UserPublic, Depends(get_current_user)], ...):

# Admin-only route
async def endpoint(user: Annotated[UserPublic, Depends(get_current_admin)], ...):
```

### Error Handling

Define errors as `HTTPError` subclasses; raise without arguments:

```python
class InvalidCredentials(HTTPError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "invalid_credentials"
    detail = "Invalid credentials"

raise InvalidCredentials()
```

### Tests

- Fixtures are in `server/app/tests/fixtures/` and registered in `server/conftest.py`
- Shared helpers go in `server/app/tests/{scope}/utilities.py`, not per-test-file
- Module-private helpers and constants are prefixed with `_`
- Tests use `AsyncClient` from `httpx` against a savepoint-wrapped test DB
- Test settings use `console` email/GitHub backends; admin credentials: `admin` / `admin@example.com` / `password`
- `RegisterRequest` rejects usernames that are email addresses (enforced by `@field_validator`)
- `get_user_by_identifier` resolves login by email OR username

---

## Configuration

Settings use Pydantic nested models with `__` as the env delimiter:

```
DB__HOST, DB__PORT, DB__NAME, DB__USER, DB__PASSWORD
JWT__SECRET_KEY, JWT__ALGORITHM, JWT__ACCESS_TOKEN_EXPIRE_MINUTES
ADMIN__USERNAME, ADMIN__EMAIL, ADMIN__PASSWORD
EMAIL__BACKEND=smtp|local|console|disabled
GH__BACKEND=api|console
```

Production requires `EMAIL__BACKEND=smtp` and `GH__BACKEND=api` (validated at startup).
