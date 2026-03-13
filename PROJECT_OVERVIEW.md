# RepTrack Project Overview

## Purpose

RepTrack is a web app for tracking strength training progress. It is a full-stack application with a React client, a FastAPI server, and a Postgres database, packaged for local development and deployment with Docker Compose.

## High-Level Architecture

- **Client (React + Vite)** talks to the **Server (FastAPI)** over HTTP.
- **Server** handles auth, users/admin, exercises, muscle groups, feedback, and health endpoints.
- **Postgres** stores users, workouts, exercises, sets, and feedback.
- **Background tasks** are used for email notifications and GitHub feedback issue creation.
- **API client** for the frontend is generated from the server OpenAPI spec.

```
Browser
  -> Vite React App (client/)
     -> Axios (with refresh handling)
        -> FastAPI (server/)
           -> SQLAlchemy + AsyncPG
           -> Postgres
           -> Email backend (smtp/local/console/disabled)
           -> GitHub backend (api/console)
```

## Repo Layout

- `client/`: React app (Vite, Tailwind). Pages, auth guards, and generated API client.
- `server/`: FastAPI app with SQLAlchemy models, services, and tests.
- `config/infra/`: Docker Compose for local/dev and deployment.
- `config/env/`: `.env` template and PgAdmin config templates.
- `scripts/`: Dev bootstrap and API client generation.

## Client (Frontend)

- **Framework**: React 19 with Vite and TypeScript.
- **Routing**: `react-router-dom` with guarded routes (`RequireAuth`, `RequireGuest`).
- **API Layer**: Generated client via `@hey-api/openapi-ts`, configured in `client/src/api/axios.ts`.
- **Auth State**: `SessionProvider` loads current user and tracks authentication.
- **UI**: Tailwind CSS + Radix UI + shadcn-derived components in `client/src/components/ui/`.

Key entry points:

- `client/src/main.tsx`: Initializes API client, routes, session provider.
- `client/src/AppRoutes.tsx`: Route map with auth/admin gating.
- `client/src/api/axios.ts`: Axios instance with refresh-token queueing.

## Server (Backend)

- **Framework**: FastAPI, async endpoints.
- **DB**: SQLAlchemy 2.0 + AsyncPG.
- **Config**: Pydantic settings with env nested delimiter `__`.
- **Auth**: JWT access + refresh tokens stored as HTTP-only cookies.
- **Services**: Separated business logic in `server/app/services/`.
- **API**: Routers under `server/app/api/endpoints/` with `/api` prefix.

Key files:

- `server/app/__init__.py`: `create_app` and middleware setup.
- `server/app/api/router.py`: API router composition.
- `server/app/core/config.py`: Settings and environment wiring.
- `server/app/core/dependencies.py`: DB session + auth dependencies.

## Domain Model (Database)

Core tables (SQLAlchemy models in `server/app/models/database/`):

- `users`: accounts with `is_admin` flag.
- `access_requests`: request/approval flow for onboarding.
- `registration_tokens` and `password_reset_tokens`: hashed token storage with expirations.
- `workouts`, `workout_exercises`, `sets`: workout logging data.
- `exercises`, `muscle_groups`, `exercise_muscle_groups`: exercise catalog and tagging.
- `feedbacks`: user feedback, optional file attachments stored as JSON payload.

Basic relationships:

- User -> Workouts -> WorkoutExercises -> Sets.
- Exercises optionally owned by a user and tagged with muscle groups.
- AccessRequest -> RegistrationToken for invite-based registration.

## Core Flows

- **Request Access**: Public endpoint creates access request, notifies admins.
- **Admin Approval**: Admin updates access request status, generates registration token.
- **Registration**: User registers using token, creates account.
- **Login/Refresh**: JWT cookies, client handles refresh on 401s.
- **Password Reset**: Request reset, token emailed, token-based reset endpoint.
- **Exercise Library**: Authenticated users can browse system exercises, create their own exercises, and tag them with muscle groups.
- **Feedback**: Authenticated users submit feedback; server stores entry and can open a GitHub issue.

## API Surface (Current)

- `POST /api/auth/*`: request-access, register, login, refresh-token, logout, forgot/reset-password
- `GET /api/users/current`: current user
- `GET/PATCH /api/admin/*`: access request management and user list
- `GET/POST /api/exercises`, `GET/PATCH/DELETE /api/exercises/{id}`: exercise library CRUD
- `GET /api/muscle-groups`: system muscle group reference data
- `POST /api/feedback`: feedback submission
- `GET /api/health`, `GET /api/health/db`: health checks

## API Surface (Planned — Workouts)

**Workouts**

- `GET /api/workouts` — list current user's workouts
- `POST /api/workouts` — create a workout
- `GET /api/workouts/{id}` — get workout with exercises and sets
- `PATCH /api/workouts/{id}` — update workout (started_at, ended_at, notes)
- `DELETE /api/workouts/{id}` — delete workout

**Workout Exercises (nested)**

- `POST /api/workouts/{id}/exercises` — add an exercise to a workout
- `DELETE /api/workouts/{id}/exercises/{workout_exercise_id}` — remove exercise from workout

**Sets (nested)**

- `POST /api/workouts/{id}/exercises/{workout_exercise_id}/sets` — log a set
- `PATCH /api/workouts/{id}/exercises/{workout_exercise_id}/sets/{set_id}` — update a set
- `DELETE /api/workouts/{id}/exercises/{workout_exercise_id}/sets/{set_id}` — delete a set

## Infrastructure & Deployment

- **Docker Compose** in `config/infra/` provides:
    - Postgres 18
    - PgAdmin
    - Server container
    - Client container
    - Migrations job
- **Local Dev** uses `docker compose --profile include-client-server up --watch` via `scripts/dev.sh`.
- **Traefik** labels are present for routing in deployed environments.

## Local Development Workflow

1. Copy env: `cp config/env/.env.example config/env/.env`
2. Run `./scripts/dev.sh` to install deps, watch API spec generation, and start compose.
3. `scripts/generate_api.sh` keeps the client OpenAPI SDK in sync.

## Testing

- Server tests under `server/app/tests/`.
- Uses pytest, pytest-asyncio, testcontainers.
- Coverage configured in `server/pyproject.toml`.

## Notes for Future Agents

- **OpenAPI SDK**: Generated files live under `client/src/api/generated/`.
- **Auth**: Cookies are HTTP-only; the client relies on `/users/current` to resolve session state.
- **Email/GitHub**: Backends are configurable via settings; production expects SMTP + GitHub API.
- **Migrations**: Alembic runs in Docker (service `migrations`).
