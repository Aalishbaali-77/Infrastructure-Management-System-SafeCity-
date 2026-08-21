#!/bin/sh
set -e

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
while ! nc -z "${DB_HOST}" "${DB_PORT}"; do
  sleep 0.5
done
echo "Database is up."

python manage.py migrate --noinput

if [ "${SEED_ON_START}" = "true" ]; then
  echo "Seeding baseline data..."
  python manage.py seed_provinces || true
  python manage.py seed_cities || true
  python manage.py seed_roles || true
  python manage.py seed_permissions || true
  python manage.py seed_rbac || true
  python manage.py seed_users || true
fi

exec "$@"
