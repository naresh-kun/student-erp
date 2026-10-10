"""
Student ERP — PostgreSQL Role Provisioning Script (Option B: Dual-Role Architecture)
Provisions:
1. erp_migrator: Schema owner, runs migrations and triggers.
2. erp_app: Runtime application role with CRUD on domain tables, but restricted on audit_logs.
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
    print("[1/3] Connecting to PostgreSQL to verify existing roles...")
    with connection.cursor() as cur:
        # Check current connection user
        cur.execute("SELECT current_user, current_database();")
        user, db = cur.fetchone()
        print(f"Connected as: {user} on database: {db}")

        # Check existing roles
        cur.execute("SELECT rolname FROM pg_roles WHERE rolname IN ('erp_migrator', 'erp_app');")
        existing = {r[0] for r in cur.fetchall()}

        if 'erp_migrator' not in existing:
            print("Creating role: erp_migrator...")
            cur.execute("CREATE ROLE erp_migrator WITH LOGIN PASSWORD 'erp_migrator_password' CREATEDB;")
        else:
            print("Role erp_migrator already exists.")

        if 'erp_app' not in existing:
            print("Creating role: erp_app...")
            cur.execute("CREATE ROLE erp_app WITH LOGIN PASSWORD 'erp_app_password';")
        else:
            print("Role erp_app already exists.")

        print("[2/3] Granting schema and database privileges...")
        cur.execute(f"GRANT ALL PRIVILEGES ON DATABASE {db} TO erp_migrator;")
        cur.execute(f"GRANT CONNECT ON DATABASE {db} TO erp_app;")
        cur.execute("GRANT USAGE, CREATE ON SCHEMA public TO erp_migrator;")
        cur.execute("GRANT USAGE ON SCHEMA public TO erp_app;")

        print("[3/3] Granting table & sequence privileges on public schema...")
        cur.execute("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO erp_migrator;")
        cur.execute("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO erp_migrator;")
        cur.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO erp_app;")
        cur.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erp_app;")

        # Set default privileges for objects created in future by erp_migrator
        cur.execute("ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO erp_migrator;")
        cur.execute("ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO erp_migrator;")
        cur.execute("ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erp_app;")
        cur.execute("ALTER DEFAULT PRIVILEGES FOR ROLE erp_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO erp_app;")

        # If audit_logs table exists, enforce restricted permissions on erp_app
        cur.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs');")
        if cur.fetchone()[0]:
            print("audit_logs table detected. Enforcing restricted privileges for erp_app...")
            cur.execute("ALTER TABLE audit_logs OWNER TO erp_migrator;")
            cur.execute("REVOKE ALL ON TABLE audit_logs FROM erp_app;")
            cur.execute("GRANT SELECT, INSERT ON TABLE audit_logs TO erp_app;")

    print("Role provisioning completed successfully!")


if __name__ == '__main__':
    provision_roles()
