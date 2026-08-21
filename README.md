# SC-GIMS — Safe Cities Government Infrastructure Monitoring System

A full-stack platform for managing large-scale government infrastructure rollouts (CCTV, fiber, networking, control rooms) across multiple provinces — from BOQ setup through daily execution, deviation tracking, approvals, and reporting.

> **Note:** This is a private organizational project. This repository/README showcases my individual contribution as lead developer and is shared for portfolio purposes. Proprietary business logic, credentials, and internal documentation are not included.

---

## What It Does

SC-GIMS digitizes the full lifecycle of a multi-site infrastructure project:

- **BOQ Management** — Excel-based bill of quantities import, versioning, and variance tracking
- **Daily Progress Tracking** — field engineers log quantity, subtasks, and KPIs per site
- **Deviation / NCR Management** — automatic detection of quantity overruns against plan, plus manual issue reporting, routed through a role-based multi-stage approval workflow
- **Role-Based Dashboards** — tailored views for Executives, HODs, Directors, Site Engineers, Contractors, QA Inspectors, and System Admins
- **Province/Project/Site Hierarchy** — full geographic and organizational drill-down across the entire dataset
- **Real-Time Data Visualization** — variance charts, deviation trends, and progress rollups, all driven by live backend data (no mock/dummy data anywhere in the UI)

---

## My Role

Lead developer on the project — primarily frontend, increasingly full-stack. Responsibilities include:

- Architecting the Next.js frontend (App Router, feature-sliced structure)
- Designing and building the Deviation/NCR module end-to-end: auto-detection engine, approval state machine, RBAC-scoped API, and a full analytics dashboard
- Enforcing data scoping and permissions consistently across every module (backend-verified, not just UI-hidden)
- Collaborating with a backend partner on Django REST API design

---

## Tech Stack

**Frontend**
- Next.js 16 (App Router, Turbopack) + TypeScript
- MUI v6 for component library
- Redux Toolkit + RTK Query for state and API caching
- Redux Saga for complex async flows
- React Hook Form + Zod for form validation
- Recharts for data visualization
- Playwright for E2E testing

**Backend**
- Django REST Framework
- PostgreSQL
- Celery + Redis for background jobs and caching

---

## Architecture Highlights

- **Modular monolith** — feature-sliced modules (`boq`, `progress`, `deviations`, etc.) with clear API boundaries, designed to be microservice-extractable later
- **Server-enforced RBAC** — permissions checked at the API layer (not just hidden in the UI), configurable per role through an admin panel without code changes
- **Signal-driven automation** — e.g. daily progress entries automatically trigger deviation detection via Django signals, comparing logged quantities against BOQ-defined tolerances
- **Province-scoped sequential numbering** — deviation records get human-readable, audit-friendly reference numbers generated safely under concurrent access

---

## Running Locally

Two ways to run the project: **Docker** (one command, nothing to install but Docker itself) or **native** (Python + Node installed directly on your machine, better for IDE debugging).

### Option A — Docker (recommended)

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose).

```bash
git clone https://github.com/Aalishbaali-77/Infrastructure-Management-System-SafeCity-.git
cd Infrastructure-Management-System-SafeCity-
cp backend/.env.docker.example backend/.env.docker
docker compose up --build
```

That single command starts four containers — PostgreSQL, Redis, the Django API, and the Next.js frontend — and on first boot automatically runs migrations and seeds baseline data (provinces, roles, permissions, and one test login per role).

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8000 |
| Swagger / API docs | http://localhost:8000/docs/ |
| PostgreSQL | localhost:5432 |

Log in with any seeded role, e.g. `exec@scgims.test` / `Test@1234` (full list in [`backend/README.md`](backend/README.md#5-seed-baseline-data)).

The frontend's host port is remapped to **3001** to avoid clashing with other local dev servers on 3000 — override with `FRONTEND_PORT=xxxx docker compose up --build` if you'd rather use a different one. Both `backend/` and `frontend/` are mounted as live volumes, so code edits are picked up without rebuilding.

To stop:

```bash
docker compose down          # keep the database
docker compose down -v       # also wipe the database
```

### Option B — Native (Python + Node installed locally)

Requires Python 3.12+, Node 20+, and a local PostgreSQL instance.

**Backend:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # or `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
copy .env.example .env           # then fill in your local DB credentials
python manage.py migrate
python manage.py seed_provinces
python manage.py seed_cities
python manage.py seed_roles
python manage.py seed_permissions
python manage.py seed_rbac
python manage.py seed_users
python manage.py runserver 0.0.0.0:8000
```

**Frontend** (in a second terminal):

```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev
```

The app runs at http://localhost:3000, talking to the API at http://localhost:8000.

Full details — PostgreSQL setup, what each seed command does, running tests, creating a superuser — are in [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md).

---

## Screenshots
<img width="959" height="415" alt="user m" src="https://github.com/user-attachments/assets/36459b4a-59f9-4c36-a7b2-be263908181d" />
<img width="955" height="404" alt="ssy deign" src="https://github.com/user-attachments/assets/49b77d83-08ee-40ce-a864-410ab5544b97" />
<img width="958" height="369" alt="Proj cre" src="https://github.com/user-attachments/assets/865cd63f-c9e9-46af-bbbc-8b971c4bf48f" />
<img width="950" height="400" alt="login" src="https://github.com/user-attachments/assets/a91ded51-7b44-4bc7-b55c-79104ffb7263" />


---

## License

This project is proprietary and developed for an organization. This README is shared for portfolio/demonstration purposes only.
