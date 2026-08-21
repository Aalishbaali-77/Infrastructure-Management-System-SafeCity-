# SC-GIMS Backend

Django REST Framework backend for the Safe Cities Government Infrastructure Monitoring System.

> **Prefer Docker?** See the [root README](../README.md#quick-start-docker) for a one-command setup that includes PostgreSQL — no local Python/Postgres install needed. The steps below are for running natively.

## Requirements

- Python 3.12+
- PostgreSQL (running locally — no Docker in this setup)
- Redis (optional for now — see note below)

## 1. Clone and set up a virtual environment

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Create your `.env` file

Copy the example file and fill in real values:

```powershell
copy .env.example .env
```

Edit `.env`:
```
DEBUG=True
SECRET_KEY=<generate-a-real-secret-key>
DB_NAME=sc_gims
DB_USER=<your-postgres-username>
DB_PASSWORD=<your-postgres-password>
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
```

To generate a real `SECRET_KEY`:
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 3. Set up PostgreSQL locally

Make sure PostgreSQL is installed and running locally, then create the database and user referenced in your `.env`:

```sql
CREATE DATABASE sc_gims;
CREATE USER sc_gims_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE sc_gims TO sc_gims_user;
```

(Run this via `psql`, or a GUI tool like pgAdmin — whichever you have installed.)

## 4. Run migrations

```powershell
python manage.py migrate
```

This creates every table for every app (`accounts`, `provinces`, `projects`, `sites`, `boq`, `core`, `audit`, plus Django's own auth/session tables).

## 5. Seed baseline data

Run these **in order** — several depend on data created by the ones before them:

```powershell
python manage.py seed_provinces
python manage.py seed_cities
python manage.py seed_roles
python manage.py seed_permissions
python manage.py seed_rbac
python manage.py seed_users
```

What each does:
- `seed_provinces` / `seed_cities` — creates Sindh/Punjab/Balochistan and their cities (Karachi/Lahore/Quetta)
- `seed_roles` — creates the 9 built-in system roles (`EXEC`, `HOD`, `DIR`, `SITE_ENG`, `CONTRACTOR`, `QA`, `VENDOR`, `SYSTEM_ADMIN`, `AUDITOR`)
- `seed_permissions` — creates the 14 frontend modules and their view/create/update/delete permissions (used by the Permissions matrix)
- `seed_rbac` — creates an older, separate set of baseline permissions (`project.view`, `ncr.resolve`, etc.) used by a few early endpoints; kept for backward compatibility
- `seed_users` — creates one test login per role, password `Test@1234`

**To create a Django superuser** (for `/admin/` access, separate from the app's own roles):
```powershell
python manage.py shell -c "from apps.accounts.models import User; u = User.objects.get(email='admin@scgims.test'); u.is_staff = True; u.is_superuser = True; u.save()"
```

## 6. Run the server

```powershell
python manage.py runserver 0.0.0.0:8000
```

The API is now available at `http://127.0.0.1:8000/` (or `http://192.168.100.129:8000/` on the local network, for the frontend to reach it).

**Note on Redis/Celery:** both are configured in `settings.py` for future background-job use, but nothing currently running requires Redis to be up — password-reset emails are currently sent synchronously and just print to the console (`EMAIL_BACKEND` defaults to the console backend). You can safely skip installing/running Redis for now.

## API documentation

Once the server is running:
- Swagger UI: `http://127.0.0.1:8000/docs/`
- OpenAPI schema: `http://127.0.0.1:8000/api/v1/schema/`

## Running tests

```powershell
pytest
```

## Project structure

```
backend/
├── django_rest_main/   # project settings, root URL config
├── apps/
│   ├── core/            # shared base model, permissions, pagination, exception formatting
│   ├── accounts/        # Users, Roles, auth (login/refresh/logout/password reset)
│   ├── provinces/       # Province + City
│   ├── projects/        # Project
│   ├── sites/           # Site
│   ├── boq/             # BOQ + BOQItem
│   └── audit/           # audit log (not yet implemented)
├── manage.py
└── requirements.txt
```