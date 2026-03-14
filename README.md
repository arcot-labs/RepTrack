[![CI / Test Server](https://github.com/arcot-labs/RepTrack/actions/workflows/test-server.yml/badge.svg)](https://github.com/arcot-labs/RepTrack/actions/workflows/test-server.yml)
[![CI / Build Images](https://github.com/arcot-labs/RepTrack/actions/workflows/build.yml/badge.svg)](https://github.com/arcot-labs/RepTrack/actions/workflows/build.yml)
[![CD / Deploy Application](https://github.com/arcot-labs/RepTrack/actions/workflows/deploy.yml/badge.svg)](https://github.com/arcot-labs/RepTrack/actions/workflows/deploy.yml)

# RepTrack

## Local Development

Copy `.env.example` to `.env` & populate variables

```bash
cp config/env/.env.example config/env/.env
```

Install dependencies:

```bash
envsubst
npm
uv
watchexec
```

Start containers:

```bash
./scripts/dev.sh
```

## Local GitHub Actions Testing

Use `act` to run workflows locally for quick validation.

List all workflows:

```bash
act -l
```

Run a specific job:

```bash
act -j {job-id}
```

## Database

All writes should go through SQLAlchemy

Alembic updates & bulk SQLAlchemy updates must explicitly set `updated_at`
