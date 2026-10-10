"""
Student ERP — PostgreSQL Role Provisioning Script (Option B: Dual-Role Architecture)
Provisions:
1. erp_migrator: Schema and table owner, runs migrations and triggers (NOCREATEDB).
2. erp_app: Runtime application role with CRUD on domain tables, but strictly restricted on audit_logs.

Consumes secrets strictly from environment variables:
- MIGRATION_DATABASE_PASSWORD (or MIGRATION_DB_PASSWORD)
- RUNTIME_DATABASE_PASSWORD (or RUNTIME_DB_PASSWORD)
"""

import os
import sys
from pathlib import Path

# Add backend to path so we can use Django settings
backend_dir = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()
from django.db import connection


def provision_roles():
    migrator_pw = (
        os.environ.get('MIGRATION_DATABASE_PASSWORD')
        or os.environ.get('MIGRATION_DB_PASSWORD')
    )
    runtime_pw = (
        os.environ.get('RUNTIME_DATABASE_PASSWORD')
        or os.environ.get('RUNTIME_DB_PASSWORD')
    )

    if not migrator_pw or not runtime_pw:
        raise ValueError(
            "Database role passwords must be supplied via environment variables:\n"
            "  - MIGRATION_DATABASE_PASSWORD (or MIGRATION_DB_PASSWORD)\n"
            "  - RUNTIME_DATABASE_PASSWORD (or RUNTIME_DB_PASSWORD)\n"
            "Hard-coded credentials are strictly rejected for security compliance."
        )

    print("[1/5] Connecting to PostgreSQL to verify existing roles...")
    with connection.cursor() as cur:
        cur.execute("SELECT current_user, current_database();")
        user, db = cur.fetchone()
        print(f"Connected as superuser/admin: '{user}' on database: '{db}'")

        # Check existing roles
        cur.execute("SELECT rolname FROM pg_roles WHERE rolname IN ('erp_migrator', 'erp_app');")
        existing = {r[0] for r in cur.fetchall()}

        if 'erp_migrator' not in existing:
            print("Creating role: erp_migrator (NOCREATEDB)...")
            cur.execute("CREATE ROLE erp_migrator WITH LOGIN PASSWORD %s NOCREATEDB;", [migrator_pw])
        else:
            print("Updating role erp_migrator password and ensuring NOCREATEDB...")
            cur.execute("ALTER ROLE erp_migrator WITH PASSWORD %s NOCREATEDB;", [migrator_pw])

        if 'erp_app' not in existing:
            print("Creating role: erp_app (NOCREATEDB)...")
            cur.execute("CREATE ROLE erp_app WITH LOGIN PASSWORD %s NOCREATEDB;", [runtime_pw])
        else:
            print("Updating role erp_app password and ensuring NOCREATEDB...")
            cur.execute("ALTER ROLE erp_app WITH PASSWORD %s NOCREATEDB;", [runtime_pw])

        print("[2/5] Granting schema and database privileges to erp_migrator & erp_app...")
        cur.execute(f'GRANT ALL PRIVILEGES ON DATABASE "{db}" TO erp_migrator;')
        cur.execute(f'GRANT CONNECT ON DATABASE "{db}" TO erp_app;')
        cur.execute("GRANT ALL ON SCHEMA public TO erp_migrator;")
        cur.execute("GRANT USAGE ON SCHEMA public TO erp_app;")

        print("[3/5] Transferring ownership of all existing tables and sequences to erp_migrator...")
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
        tables = [r[0] for r in cur.fetchall()]
        for tbl in tables:
            cur.execute(f'ALTER TABLE public."{tbl}" OWNER TO erp_migrator;')
        print(f"Transferred ownership of {len(tables)} tables to erp_migrator.")

        cur.execute("SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public';")
        sequences = [r[0] for r in cur.fetchall()]
        for seq in sequences:
            cur.execute(f'ALTER SEQUENCE public."{seq}" OWNER TO erp_migrator;')
        print(f"Transferred ownership of {len(sequences)} sequences to erp_migrator.")

        print("[4/5] Establishing runtime grants on public schema objects...")
        cur.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO erp_app;")
        cur.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erp_app;")

        if 'audit_logs' in tables:
            print("Enforcing strict append-only privilege boundary on audit_logs...")
            cur.execute("REVOKE ALL PRIVILEGES ON TABLE audit_logs FROM erp_app;")
            cur.execute("GRANT SELECT, INSERT ON TABLE audit_logs TO erp_app;")

        print("[5/5] Configuring default privileges for future objects created by erp_migrator...")
        cur.execute("ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO erp_migrator;")
        cur.execute("ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO erp_migrator;")
        cur.execute("ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erp_app;")
        cur.execute("ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO erp_app;")

    print("Dual-role provisioning, ownership transfer, and default privileges completed successfully!")


if __name__ == '__main__':
    provision_roles()
