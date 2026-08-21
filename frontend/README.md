# SC-GIMS — Safe Cities Government Infrastructure Monitoring System

A digital platform for tracking government infrastructure rollouts — CCTV, fiber, networking, and control room deployments — across project sites in Sindh, Punjab, and Balochistan.

SC-GIMS replaces manual, paper/spreadsheet-based tracking with a single system that follows a project from planning all the way through to final handover, so government stakeholders always know exactly where every site stands.

---

## What This System Does

SC-GIMS manages the full lifecycle of an infrastructure project:

1. **BOQ Setup** — The Bill of Quantities (the official list of materials, quantities, and costs for a project) is uploaded, versioned, and tracked.
2. **Daily Progress** — Site engineers and contractors log work completed each day against that BOQ.
3. **Deviations & NCRs** — Any mismatch between planned and actual work (a Non-Conformance Report) is flagged, reviewed, and resolved.
4. **Testing & Commissioning (T&C)** — Completed work goes through a formal, multi-stage testing pipeline (factory tests, site tests, user acceptance, commissioning) before it's considered done.
5. **IPC Payments** — Interim Payment Certificates are generated based on verified progress, so contractors get paid against real, confirmed work.
6. **Final Acceptance & Handover** — Once everything passes, the site is formally signed off and handed over.

Alongside this core lifecycle, the system also tracks approvals (multi-level sign-off from engineers up to directors), contractor and vendor performance, SLA/delay monitoring, and keeps an audit trail of every action for compliance purposes.

**Important design note:** Provinces (Sindh, Punjab, Balochistan) are used purely as a geographic filter for organizing projects — this is **one shared system**, not a separate app per province, and not a multi-tenant / multi-organization product. Everyone works within the same instance, with access controlled by role and assignment rather than by "tenant."

---

## Who Uses This System

| Role | What they do here |
|---|---|
| Executive | Creates work requests, initiates workflows |
| HOD (Head of Department) | Technical review and approval |
| Director | Final approval authority |
| Site Engineer | Logs daily progress, uploads evidence |
| Contractor | Executes assigned work, updates progress |
| QA Inspector | Runs quality inspections and T&C checklists |
| Vendor | Confirms material deliveries |
| System Admin | Manages users, roles, and system configuration |
| Auditor | Read-only access for compliance review |

---

## Project Structure

This is a monorepo — one shared repository containing both applications side by side:

```
sc-gims/
├── frontend/     ← Web application (this is what users interact with)
└── backend/      ← API and business logic
```

Each folder is a self-contained project with its own dependencies and setup steps (see below).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) |
| Frontend Language | TypeScript |
| UI Components | MUI (Material UI) |
| Frontend State | Redux Toolkit + Redux Saga |
| Data Fetching | RTK Query |
| Forms & Validation | React Hook Form + Zod |
| Charts | Recharts |
| Frontend Testing | Playwright (end-to-end) |
| Backend Framework | Django + Django REST Framework |
| Backend Language | Python |
| Database | PostgreSQL |
| Cache / Message Broker | Redis |
| Background Jobs | Celery |
| File Storage | Local (development) / S3-compatible (production) |

---

## Getting Started

> **Prefer Docker?** See the [root README](../README.md#quick-start-docker) for a one-command setup of the whole stack (frontend, backend, PostgreSQL) — no local Node/Python install needed. The steps below are for running natively.

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

### Running the Backend

```bash
cd backend
# follow backend/README.md for Python environment setup, migrations, and running the server
```

The API runs at `http://localhost:8000`.

### Running Both Together

For local development or demos, both need to run at the same time (in two separate terminals), and the backend needs **CORS enabled** (via `django-cors-headers`) so the browser allows requests from the frontend's origin (`localhost:3000`) to reach the API (`localhost:8000`).

---

## Deployment Model

SC-GIMS is built as a **single, non-SaaS, non-multi-tenant system**:
- One deployed instance serves the whole program, not one instance per customer/organization
- No tenant IDs, no organization switcher, no per-tenant databases
- Provinces are a data field for filtering, not a boundary for access or infrastructure

This keeps the system simpler to run and reason about, while still supporting province-level reporting and access control through user roles and assignments.

---

## Branching & Contribution Workflow

- `main` is always the stable, working version of the app. Nobody commits to it directly.
- Every task gets its own branch, prefixed by area:
  - Frontend work: `frontend/<feature-name>` (e.g. `frontend/boq-grid`)
  - Backend work: `backend/<feature-name>` (e.g. `backend/auth-api`)
- Once a feature is complete and working, push the branch and open a Pull Request into `main`.
- Keep commit messages short and descriptive (e.g. `feat: daily progress form with tolerance validation`).

```bash
git checkout main
git pull
git checkout -b frontend/your-feature-name    # or backend/...
# ... make changes ...
git add -A
git commit -m "describe what you did"
git push -u origin frontend/your-feature-name
```

Then open a Pull Request on GitHub against `main`.

---

## Current Status

This project is under active development by an intern team following an 8-week build plan, covering projects/sites setup, BOQ management, daily progress tracking, testing & commissioning, payments, and reporting dashboards — in that order.

Some modules currently run on pre-approved dummy data on the frontend while backend endpoints are finalized; integration points are clearly isolated so the swap to live data is a small, contained change rather than a rewrite.

---

## Reference Documents

- Software Requirements Specification (SRS) — version 2.8
