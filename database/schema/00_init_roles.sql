-- =============================================================================
-- Student ERP — Dual-Role Database Initialization (Option B)
-- Sets up erp_migrator (schema owner) and erp_app (restricted runtime)
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'erp_migrator') THEN
        CREATE ROLE erp_migrator WITH LOGIN PASSWORD 'erp_migrator_password' CREATEDB;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'erp_app') THEN
        CREATE ROLE erp_app WITH LOGIN PASSWORD 'erp_app_password';
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE student_erp TO erp_migrator;
GRANT CONNECT ON DATABASE student_erp TO erp_app;
GRANT USAGE, CREATE ON SCHEMA public TO erp_migrator;
GRANT USAGE ON SCHEMA public TO erp_app;
