-- =============================================================================
-- Student ERP — Dual-Role Database Initialization Template (Option B)
-- Status: Reference Template (NOCREATEDB)
-- 
-- IMPORTANT: Do NOT commit plaintext passwords to this file.
-- In automated environments (Docker / CI / CD), use:
--   - database/schema/00_init_roles.sh (for container init)
--   - database/provision_roles.py (for automated orchestration)
-- Both scripts consume secrets strictly from environment variables:
--   MIGRATION_DATABASE_PASSWORD and RUNTIME_DATABASE_PASSWORD
-- =============================================================================

\getenv MIGRATION_DATABASE_PASSWORD MIGRATION_DATABASE_PASSWORD
\getenv RUNTIME_DATABASE_PASSWORD RUNTIME_DATABASE_PASSWORD

DO $$
DECLARE
    mig_pw text := :'MIGRATION_DATABASE_PASSWORD';
    app_pw text := :'RUNTIME_DATABASE_PASSWORD';
BEGIN
    IF mig_pw IS NULL OR mig_pw = '' OR app_pw IS NULL OR app_pw = '' THEN
        RAISE EXCEPTION 'MIGRATION_DATABASE_PASSWORD and RUNTIME_DATABASE_PASSWORD environment variables are required.';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'erp_migrator') THEN
        EXECUTE format('CREATE ROLE erp_migrator WITH LOGIN PASSWORD %L NOCREATEDB', mig_pw);
    ELSE
        EXECUTE format('ALTER ROLE erp_migrator WITH PASSWORD %L NOCREATEDB', mig_pw);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'erp_app') THEN
        EXECUTE format('CREATE ROLE erp_app WITH LOGIN PASSWORD %L NOCREATEDB', app_pw);
    ELSE
        EXECUTE format('ALTER ROLE erp_app WITH PASSWORD %L NOCREATEDB', app_pw);
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE student_erp TO erp_migrator;
GRANT CONNECT ON DATABASE student_erp TO erp_app;
GRANT ALL ON SCHEMA public TO erp_migrator;
GRANT USAGE ON SCHEMA public TO erp_app;

ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO erp_migrator;
ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO erp_migrator;
ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erp_app;
ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO erp_app;
