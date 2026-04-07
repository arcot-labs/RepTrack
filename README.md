[![CI / Test Server](https://github.com/arcot-labs/RepTrack/actions/workflows/test.yml/badge.svg)](https://github.com/arcot-labs/RepTrack/actions/workflows/test.yml)
[![CI / Build Images](https://github.com/arcot-labs/RepTrack/actions/workflows/build.yml/badge.svg)](https://github.com/arcot-labs/RepTrack/actions/workflows/build.yml)
[![CD / Deploy Application](https://github.com/arcot-labs/RepTrack/actions/workflows/deploy.yml/badge.svg)](https://github.com/arcot-labs/RepTrack/actions/workflows/deploy.yml)

# RepTrack

## Development

Copy `.env.example` to `.env` & populate variables

```bash
cp config/env/.env.example config/env/.env
```

Install dependencies:

```bash
envsubst
pnpm
uv
watchexec
```

Start containers (default containerized client/server):

```bash
./scripts/dev.sh
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
