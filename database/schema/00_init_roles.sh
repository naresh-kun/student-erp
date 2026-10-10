#!/bin/sh
# =============================================================================
# Student ERP — Dual-Role Database Initialization (Option B)
# Executed by PostgreSQL container on fresh volume initialization.
# Consumes secrets strictly from container environment variables.
# =============================================================================
set -e

if [ -z "$MIGRATION_DATABASE_PASSWORD" ] || [ -z "$RUNTIME_DATABASE_PASSWORD" ]; then
    echo "ERROR: MIGRATION_DATABASE_PASSWORD and RUNTIME_DATABASE_PASSWORD environment variables are required."
    exit 1
fi

MIG_USER="${MIGRATION_DATABASE_USER:-erp_migrator}"
APP_USER="${RUNTIME_DATABASE_USER:-erp_app}"
TARGET_DB="${POSTGRES_DB:-student_erp}"

echo "Configuring Option B roles: '$MIG_USER' and '$APP_USER' on database '$TARGET_DB'..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$TARGET_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${MIG_USER}') THEN
            CREATE ROLE ${MIG_USER} WITH LOGIN PASSWORD '${MIGRATION_DATABASE_PASSWORD}' NOCREATEDB;
        ELSE
            ALTER ROLE ${MIG_USER} WITH PASSWORD '${MIGRATION_DATABASE_PASSWORD}' NOCREATEDB;
        END IF;

        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${APP_USER}') THEN
            CREATE ROLE ${APP_USER} WITH LOGIN PASSWORD '${RUNTIME_DATABASE_PASSWORD}' NOCREATEDB;
        ELSE
            ALTER ROLE ${APP_USER} WITH PASSWORD '${RUNTIME_DATABASE_PASSWORD}' NOCREATEDB;
        END IF;
    END
    \$\$;

    GRANT ALL PRIVILEGES ON DATABASE ${TARGET_DB} TO ${MIG_USER};
    GRANT CONNECT ON DATABASE ${TARGET_DB} TO ${APP_USER};
    GRANT ALL ON SCHEMA public TO ${MIG_USER};
    GRANT USAGE ON SCHEMA public TO ${APP_USER};

    ALTER DEFAULT PRIVILEGES FOR ROLE ${MIG_USER} IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ${MIG_USER};
    ALTER DEFAULT PRIVILEGES FOR ROLE ${MIG_USER} IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ${MIG_USER};
    ALTER DEFAULT PRIVILEGES FOR ROLE ${MIG_USER} IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_USER};
    ALTER DEFAULT PRIVILEGES FOR ROLE ${MIG_USER} IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_USER};
EOSQL

echo "Dual-role initialization script completed successfully."
