# SC-GIMS — Safe Cities Government Infrastructure Monitoring System

A digital platform for tracking government infrastructure rollouts — CCTV, fiber, networking, and control room deployments — across project sites in Sindh, Punjab, and Balochistan.

- [`frontend/`](frontend/) — Next.js 14 + TypeScript + MUI web app
- [`backend/`](backend/) — Django REST Framework API

See [`frontend/README.md`](frontend/README.md) for full product background and [`backend/README.md`](backend/README.md) for backend internals.

## Quick start (Docker)

The fastest way to run the whole stack — no local Python, Node, PostgreSQL, or Redis installation required.

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Docker Compose).

```bash
git clone <this-repo-url>
cd "SC-GIMS (IM system)"
cp backend/.env.docker.example backend/.env.docker
docker compose up --build
```

This starts four containers:

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3001 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs/ |
| PostgreSQL | localhost:5432 |

On first boot the backend container automatically runs migrations and seeds baseline data (provinces, roles, permissions, and one test login per role — password `Test@1234`, e.g. `exec@scgims.test`). See [`backend/README.md`](backend/README.md#5-seed-baseline-data) for the full list of seeded users.

The frontend's default port (3000) is remapped to **3001** on the host to avoid clashing with other local dev servers. Override it if you like:

```bash
FRONTEND_PORT=4000 docker compose up --build
```

Both `backend/` and `frontend/` are mounted as live volumes, so code edits are picked up by the running dev servers without rebuilding the image.

To stop everything:

```bash
docker compose down          # keep the database volume
docker compose down -v       # also wipe the database
```

## Running without Docker

If you'd rather run each app natively (e.g. for IDE debugging), follow:

- [`backend/README.md`](backend/README.md) — Python venv, local PostgreSQL, migrations, seeding
- [`frontend/README.md`](frontend/README.md) — `npm install && npm run dev`

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, MUI, Redux Toolkit + Saga, RTK Query, React Hook Form + Zod, Recharts |
| Backend | Django + Django REST Framework, PostgreSQL, Redis/Celery (background jobs) |
| Auth | JWT (djangorestframework-simplejwt) |
| API docs | drf-spectacular (OpenAPI/Swagger) |
