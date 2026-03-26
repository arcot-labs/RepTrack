# RepTrack Project Overview

## Purpose

RepTrack is a web app for tracking strength training progress. It is a full-stack application with a React client, a FastAPI server, and a Postgres database, packaged for local development and deployment with Docker Compose.

## High-Level Architecture

- **Client (React + Vite)** talks to the **Server (FastAPI)** over HTTP.
- **Server** handles auth, users/admin, workouts, workout exercises, sets, exercises, muscle groups, feedback, and health endpoints.
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
- `config/env/`: `.env` template.
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

## Current Implementation Status

- ✅ Exercise API + client CRUD flow is implemented (`/api/exercises`, `/api/muscle-groups`, `/exercises` page).
- ✅ Workout API (workouts, workout-exercises, sets) is implemented on the server with tests.
- 🚧 Workout client workflow is the primary remaining feature area.

## API Surface (Current)

**Auth & onboarding**

- `POST /api/auth/request-access` — submit an access request (returns a friendly message if already approved).
- `POST /api/auth/register` — consume a registration token and create credentials.
- `POST /api/auth/login` — issue access + refresh tokens (HTTP-only cookies).
- `POST /api/auth/refresh-token` — rotate the access token using the refresh cookie.
- `POST /api/auth/logout` — clear auth cookies.
- `POST /api/auth/forgot-password` + `POST /api/auth/reset-password` — request and fulfill password-reset tokens.

**User / admin**

- `GET /api/users/current` — returns the authenticated user.
- `GET /api/users` — admin-only user list.
- `GET /api/access-requests` — admin-only list of pending/approved access requests.
- `PATCH /api/access-requests/{access_request_id}` — admin-only status update (generates registration token, emails user, etc.).

**Exercise & catalog**

- `GET /api/exercises` — list the current user's exercises.
- `POST /api/exercises` — create a new exercise with optional muscle-group tags.
- `GET /api/exercises/{exercise_id}` — fetch a specific exercise (403 if not owned).
- `PATCH /api/exercises/{exercise_id}` — update exercise metadata.
- `DELETE /api/exercises/{exercise_id}` — delete an exercise (owned-only).
- `GET /api/muscle-groups` — reference data sorted by name.

**Search / indexing**

- `POST /api/search/exercises` — Meilisearch-powered search scoped to the current user.
- `POST /api/search/muscle-groups` — search muscle groups.
- `POST /api/search/reindex` — admin-only reindex of exercises + muscle groups.
- `GET /api/search/tasks/{task_id}` — admin-only Meilisearch task status lookup.

**Feedback & health**

- `POST /api/feedback` — multipart/form-data feedback submission (creates GitHub issue via background task).
- `GET /api/health` and `GET /api/health/db` — basic API and Postgres liveness checks.

**Workouts**

- `GET /api/workouts` — list workouts for the current user.
- `POST /api/workouts` — create a workout shell (started_at, ended_at, notes).
- `GET /api/workouts/{workout_id}` — full workout with exercises and sets.
- `PATCH /api/workouts/{workout_id}` — update metadata (started, ended, notes).
- `DELETE /api/workouts/{workout_id}` — delete a workout (user-owned).

**Workout exercises**

- `POST /api/workouts/{workout_id}/exercises` — attach an exercise to a workout.
- `DELETE /api/workouts/{workout_id}/exercises/{workout_exercise_id}` — remove the workout-specific exercise.

**Sets**

- `POST /api/workouts/{workout_id}/exercises/{workout_exercise_id}/sets` — log a set for the workout exercise.
- `PATCH /api/workouts/{workout_id}/exercises/{workout_exercise_id}/sets/{set_id}` — adjust reps/weight.
- `DELETE /api/workouts/{workout_id}/exercises/{workout_exercise_id}/sets/{set_id}` — delete a set from a workout exercise.

## Infrastructure & Deployment

- **Docker Compose** in `config/infra/` provides:
    - Postgres 18
    - Adminer 5
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
