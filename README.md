[![Coverage](https://codecov.io/gh/arcot-labs/RepTrack/graph/badge.svg?token=3YVNF9OHS7)](https://codecov.io/gh/arcot-labs/RepTrack)

[![CI / Test Server](https://github.com/arcot-labs/RepTrack/actions/workflows/test.yml/badge.svg)](https://github.com/arcot-labs/RepTrack/actions/workflows/test.yml)

[![CI / Build Images](https://github.com/arcot-labs/RepTrack/actions/workflows/build.yml/badge.svg)](https://github.com/arcot-labs/RepTrack/actions/workflows/build.yml)

[![CD / Deploy Application](https://github.com/arcot-labs/RepTrack/actions/workflows/deploy.yml/badge.svg)](https://github.com/arcot-labs/RepTrack/actions/workflows/deploy.yml)

# RepTrack

## Development

### Prerequisites

Copy the template and populate the environment variables:

```bash
cp config/env/.env.example config/env/.env
```

Install the required utilities for your platform:

- `docker` (container runtime)
- `watchexec` (file watcher for API regeneration)
- `uv` (Python dependency manager)
- `pnpm` (JavaScript package manager)
- `zizmor` (GitHub Actions workflow linter used by the pre-commit hook)

On Linux, ensure the system `getopt` is GNU `getopt`.

On macOS, install `gnu-getopt` as well. `./scripts/dev.sh` will use the system `getopt` when it already supports GNU-style flags, and otherwise falls back to the Homebrew-installed `gnu-getopt` binary.

### Running the development environment

`./scripts/dev.sh` orchestrates infrastructure + optional client/server processes. By default it:

- verifies the `.env` file exists under `config/env`
- installs backend dependencies via `uv sync` and frontend dependencies via `pnpm i`
- runs `watchexec` on `server/app` to regenerate the OpenAPI spec + client whenever Python files change
- starts Docker Compose for the required infrastructure services while watching for termination

Options you can pass:

- `--skip-install-deps` – skip `uv sync` / `pnpm i` (useful when dependencies already installed)
- `--mode docker` (default) – run client and server containers along with infrastructure services
- `--mode local` – only runs infrastructure containers, but runs `make dev` and `pnpm run dev` directly on your host
- `--mode none` or `-n` – only runs infrastructure containers (no client/server)

For example, to keep your host client/server running directly while still using the infra containers:

```bash
./scripts/dev.sh --mode local
```

`dev.sh` traps SIGINT/TERM and tears down running `compose`, `watchexec`, and local processes automatically.

## Regenerating the API spec & client

`scripts/generate_api.sh` dumps the FastAPI OpenAPI spec, copies it to `config/openapi_spec.json`, and runs `pnpm run generate-api` in `client`. It skips client generation when the spec is unchanged unless you force it.

```bash
./scripts/generate_api.sh        # regenerate when FastAPI changes
./scripts/generate_api.sh -f     # force regeneration even if the spec already matches
```

## Testing GitHub Actions Workflows

Use `act` to run workflows locally for quick validation.

List all workflows:

```bash
act -l
```

Run a specific job:

```bash
act -j {job-id}
```

## Shadcn Components

shadcn adds components under `client/src/components/ui/`

To ensure custom styles & behavior survive component updates, follow these conventions:

- Create custom component overrides under `client/src/components/ui/overrides/`
- Import override components in app code instead of generated shadcn components
- Add ESLint rules to prevent direct imports of generated components & point to override paths

## Database

### Conventions

All writes should go through SQLAlchemy

Alembic updates & bulk SQLAlchemy updates must explicitly set `updated_at`

### Database ER Diagram

![diagram](db_erd.png 'Database ER Diagram')
