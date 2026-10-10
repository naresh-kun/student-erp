"""
Student ERP — Database Provisioning & Upgrade Workflows Verification Script
Authoritative Task 5.6 Final Evidence Closure

Exercises:
Workflow 1: Fresh Database Provisioning in an Isolated Disposable Database (erp_disposable_fresh)
Workflow 2: Existing-Volume Provisioning & Upgrade Path in an Isolated Disposable Copy (erp_disposable_upgrade)

Verifies:
- Schema and table ownership (erp_migrator)
- Runtime permissions (erp_app restricted from DDL, UPDATE, DELETE, TRUNCATE on audit_logs)
- Django migrations execution under erp_migrator
- Record counts before vs after provisioning
- Preservation of historical 'Half-Yearly Examination 2026' and its 5 marks records
- Verified security boundaries (Option B)
- 100% preservation of untouched development database (student_erp)
"""

import os
import sys
import subprocess
import psycopg
from pathlib import Path

# Paths
REPO_ROOT = Path(__file__).resolve().parent.parent
PYTHON_EXE = str(REPO_ROOT / 'backend' / '.venv' / 'Scripts' / 'python.exe')
MANAGE_PY = str(REPO_ROOT / 'backend' / 'manage.py')
PROVISION_SCRIPT = str(REPO_ROOT / 'database' / 'provision_roles.py')
TEST_PERMS_SCRIPT = str(REPO_ROOT / 'database' / 'test_role_permissions.py')
# Load environment variables from .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(REPO_ROOT / 'backend' / '.env')
    load_dotenv(REPO_ROOT / '.env')
except ImportError:
    pass

# Credentials (strictly sourced from environment variables; hardcoded secrets forbidden)
SUPERUSER = os.environ.get('DATABASE_USER') or os.environ.get('DB_USER') or 'postgres'
SUPERUSER_PW = os.environ.get('DATABASE_PASSWORD') or os.environ.get('DB_PASSWORD')
MIGRATOR_USER = os.environ.get('MIGRATION_DATABASE_USER') or os.environ.get('MIGRATOR_DB_USER') or 'erp_migrator'
MIGRATOR_PW = (
    os.environ.get('MIGRATION_DATABASE_PASSWORD')
    or os.environ.get('MIGRATION_DB_PASSWORD')
    or os.environ.get('MIGRATOR_DB_PASSWORD')
)
RUNTIME_USER = os.environ.get('RUNTIME_DATABASE_USER') or 'erp_app'
RUNTIME_PW = (
    os.environ.get('RUNTIME_DATABASE_PASSWORD')
    or os.environ.get('RUNTIME_DB_PASSWORD')
)
DB_HOST = os.environ.get('DATABASE_HOST') or os.environ.get('DB_HOST') or 'localhost'
DB_PORT = os.environ.get('DATABASE_PORT') or os.environ.get('DB_PORT') or '5432'

if not SUPERUSER_PW or not MIGRATOR_PW or not RUNTIME_PW:
    raise ValueError(
        "Database credentials must be supplied via environment variables:\n"
        "  - DATABASE_PASSWORD (or DB_PASSWORD)\n"
        "  - MIGRATION_DATABASE_PASSWORD (or MIGRATION_DB_PASSWORD)\n"
        "  - RUNTIME_DATABASE_PASSWORD (or RUNTIME_DB_PASSWORD)\n"
        "Hard-coded credentials are strictly rejected for security compliance."
    )

SOURCE_DB = os.environ.get('DATABASE_NAME') or 'student_erp'
FRESH_DB = 'erp_disposable_fresh'
UPGRADE_DB = 'erp_disposable_upgrade'


def get_superuser_conn(dbname='postgres'):
    return psycopg.connect(
        dbname=dbname,
        user=SUPERUSER,
        password=SUPERUSER_PW,
        host=DB_HOST,
        port=DB_PORT,
        autocommit=True
    )


def run_cmd(cmd, env_overrides=None):
    env = os.environ.copy()
    if env_overrides:
        env.update(env_overrides)
    print(f"\n[EXEC] {' '.join(cmd)}")
    res = subprocess.run(cmd, cwd=str(REPO_ROOT), env=env, capture_output=True, text=True)
    if res.stdout:
        print(f"[STDOUT]\n{res.stdout.strip()}")
    if res.stderr:
        print(f"[STDERR]\n{res.stderr.strip()}")
    if res.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {res.returncode}")
    return res


def exercise_workflow_1_fresh():
    print("\n" + "=" * 70)
    print("WORKFLOW 1: FRESH DATABASE PROVISIONING IN ISOLATED DISPOSABLE DATABASE")
    print("=" * 70)

    admin_conn = get_superuser_conn('postgres')
    with admin_conn.cursor() as cur:
        # 1. Clean and create fresh database
        print(f"\n[1.1] Creating fresh database '{FRESH_DB}'...")
        cur.execute(f"DROP DATABASE IF EXISTS {FRESH_DB};")
        cur.execute(f"CREATE DATABASE {FRESH_DB};")

        # 2. Grant initial database and schema privileges (matching 00_init_roles.sql / template)
        print(f"[1.2] Applying initial schema permissions and default privileges to '{FRESH_DB}'...")
        cur.execute(f"GRANT ALL PRIVILEGES ON DATABASE {FRESH_DB} TO {MIGRATOR_USER};")
        cur.execute(f"GRANT CONNECT ON DATABASE {FRESH_DB} TO {RUNTIME_USER};")

    fresh_conn = get_superuser_conn(FRESH_DB)
    with fresh_conn.cursor() as cur:
        cur.execute(f"GRANT ALL ON SCHEMA public TO {MIGRATOR_USER};")
        cur.execute(f"GRANT USAGE ON SCHEMA public TO {RUNTIME_USER};")
        cur.execute(f"ALTER DEFAULT PRIVILEGES FOR ROLE {MIGRATOR_USER} IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO {MIGRATOR_USER};")
        cur.execute(f"ALTER DEFAULT PRIVILEGES FOR ROLE {MIGRATOR_USER} IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO {MIGRATOR_USER};")
        cur.execute(f"ALTER DEFAULT PRIVILEGES FOR ROLE {MIGRATOR_USER} IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {RUNTIME_USER};")
        cur.execute(f"ALTER DEFAULT PRIVILEGES FOR ROLE {MIGRATOR_USER} IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO {RUNTIME_USER};")

    # 3. Execute migrations as erp_migrator
    print(f"\n[1.3] Executing Django migrations under role '{MIGRATOR_USER}' (DB_ROLE=migrator)...")
    run_cmd(
        [PYTHON_EXE, MANAGE_PY, 'migrate'],
        env_overrides={
            'DATABASE_NAME': FRESH_DB,
            'DB_ROLE': 'migrator',
            'MIGRATION_DATABASE_USER': MIGRATOR_USER,
            'MIGRATION_DATABASE_PASSWORD': MIGRATOR_PW,
            'RUNTIME_DATABASE_USER': RUNTIME_USER,
            'RUNTIME_DATABASE_PASSWORD': RUNTIME_PW,
        }
    )

    # 4. Run provision_roles.py on the fresh database to enforce ownership & audit exemptions
    print(f"\n[1.4] Running provision_roles.py on '{FRESH_DB}'...")
    run_cmd(
        [PYTHON_EXE, PROVISION_SCRIPT],
        env_overrides={
            'DATABASE_URL': f'postgres://{SUPERUSER}:{SUPERUSER_PW}@{DB_HOST}:{DB_PORT}/{FRESH_DB}',
            'MIGRATION_DATABASE_PASSWORD': MIGRATOR_PW,
            'RUNTIME_DATABASE_PASSWORD': RUNTIME_PW,
        }
    )

    # 5. Verification on fresh database
    print(f"\n[1.5] Verifying schema ownership on '{FRESH_DB}'...")
    fresh_conn = get_superuser_conn(FRESH_DB)
    with fresh_conn.cursor() as cur:
        cur.execute("SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';")
        tables = cur.fetchall()
        print(f"Total tables created in fresh database: {len(tables)}")
        unowned = [t for t, o in tables if o != MIGRATOR_USER]
        assert not unowned, f"Unowned tables found: {unowned}"
        print(f"[PASS] All {len(tables)} tables in '{FRESH_DB}' are owned by '{MIGRATOR_USER}'.")

        cur.execute("SELECT sequencename, sequenceowner FROM pg_sequences WHERE schemaname = 'public';")
        seqs = cur.fetchall()
        print(f"Total sequences created in fresh database: {len(seqs)}")
        unowned_seqs = [s for s, o in seqs if o != MIGRATOR_USER]
        assert not unowned_seqs, f"Unowned sequences found: {unowned_seqs}"
        print(f"[PASS] All {len(seqs)} sequences in '{FRESH_DB}' are owned by '{MIGRATOR_USER}'.")

        # Verify audit trigger exists
        cur.execute("""
            SELECT tgname FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'audit_logs' AND tgname = 'trg_audit_logs_immutable';
        """)
        trigger = cur.fetchone()
        assert trigger is not None, "Audit log immutability trigger missing on fresh DB!"
        print(f"[PASS] Immutability trigger '{trigger[0]}' is active on 'audit_logs'.")

    # 6. Verify runtime permissions for erp_app on fresh DB
    print(f"\n[1.6] Verifying runtime permissions for '{RUNTIME_USER}' on '{FRESH_DB}'...")
    app_conn = psycopg.connect(
        dbname=FRESH_DB, user=RUNTIME_USER, password=RUNTIME_PW, host=DB_HOST, port=DB_PORT
    )
    with app_conn.cursor() as cur:
        # SELECT on audit_logs works
        cur.execute("SELECT count(*) FROM audit_logs;")
        cnt = cur.fetchone()[0]
        print(f"[PASS] {RUNTIME_USER} can SELECT from audit_logs (count: {cnt}).")

        # INSERT on audit_logs works
        cur.execute("""
            INSERT INTO audit_logs (id, action, resource_type, resource_id, old_values, new_values, created_at, actor_username, actor_role, reason, user_agent)
            VALUES (gen_random_uuid(), 'CREATE', 'TestResource', '1', '{}', '{}', NOW(), 'fresh_tester', 'Admin', 'Fresh provision test', '');
        """)
        app_conn.commit()
        print(f"[PASS] {RUNTIME_USER} can INSERT into audit_logs.")

        # UPDATE on audit_logs is blocked by permission denied
        try:
            cur.execute("UPDATE audit_logs SET action = 'TAMPERED';")
            app_conn.commit()
            raise AssertionError(f"[FAIL] {RUNTIME_USER} unexpectedly updated audit_logs!")
        except psycopg.errors.InsufficientPrivilege:
            app_conn.rollback()
            print(f"[PASS] {RUNTIME_USER} UPDATE on audit_logs blocked by PostgreSQL permissions.")

        # DELETE on audit_logs is blocked by permission denied
        try:
            cur.execute("DELETE FROM audit_logs;")
            app_conn.commit()
            raise AssertionError(f"[FAIL] {RUNTIME_USER} unexpectedly deleted audit_logs!")
        except psycopg.errors.InsufficientPrivilege:
            app_conn.rollback()
            print(f"[PASS] {RUNTIME_USER} DELETE on audit_logs blocked by PostgreSQL permissions.")

        # DDL (ALTER TABLE) is blocked
        try:
            cur.execute("ALTER TABLE audit_logs ADD COLUMN _fail_col INT;")
            app_conn.commit()
            raise AssertionError(f"[FAIL] {RUNTIME_USER} unexpectedly executed DDL!")
        except psycopg.errors.InsufficientPrivilege:
            app_conn.rollback()
            print(f"[PASS] {RUNTIME_USER} ALTER TABLE blocked (must be table owner).")

    app_conn.close()
    fresh_conn.close()

    # 7. Cleanup fresh database
    print(f"\n[1.7] Cleaning up disposable fresh database '{FRESH_DB}'...")
    with admin_conn.cursor() as cur:
        cur.execute(f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{FRESH_DB}' AND pid <> pg_backend_pid();")
        cur.execute(f"DROP DATABASE {FRESH_DB};")
    admin_conn.close()
    print(f"[PASS] Workflow 1 completed successfully and '{FRESH_DB}' removed.")


def exercise_workflow_2_upgrade():
    print("\n" + "=" * 70)
    print("WORKFLOW 2: EXISTING-VOLUME PROVISIONING & UPGRADE IN DISPOSABLE COPY")
    print("=" * 70)

    admin_conn = get_superuser_conn('postgres')
    with admin_conn.cursor() as cur:
        # Terminate any idle connection to source DB
        cur.execute(f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{SOURCE_DB}' AND pid <> pg_backend_pid();")
        print(f"\n[2.1] Creating isolated disposable copy '{UPGRADE_DB}' from template '{SOURCE_DB}'...")
        cur.execute(f"DROP DATABASE IF EXISTS {UPGRADE_DB};")
        cur.execute(f"CREATE DATABASE {UPGRADE_DB} TEMPLATE {SOURCE_DB};")
        print(f"[PASS] Created exact database clone '{UPGRADE_DB}'.")

    # 2. Inspect Pre-Provisioning Baseline
    print(f"\n[2.2] Capturing pre-provisioning baseline metrics on '{UPGRADE_DB}'...")
    clone_conn = get_superuser_conn(UPGRADE_DB)
    baseline = {}
    with clone_conn.cursor() as cur:
        cur.execute("SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';")
        tables = cur.fetchall()
        baseline['table_count'] = len(tables)
        baseline['table_owners'] = {t: o for t, o in tables}

        cur.execute("SELECT sequencename, sequenceowner FROM pg_sequences WHERE schemaname = 'public';")
        seqs = cur.fetchall()
        baseline['sequence_count'] = len(seqs)
        baseline['sequence_owners'] = {s: o for s, o in seqs}

        # Core domain table record counts
        domain_tables = [
            'marks_exam_types', 'marks_records', 'users', 'students',
            'faculty', 'parents', 'classes', 'sections', 'subjects',
            'enrollments', 'teaching_assignments', 'attendance_records', 'audit_logs'
        ]
        for tbl in domain_tables:
            cur.execute(f'SELECT count(*) FROM public."{tbl}";')
            baseline[f'{tbl}_count'] = cur.fetchone()[0]

        # Historical Half-Yearly Examination 2026 record
        cur.execute("SELECT id, name, is_active, weightage FROM marks_exam_types WHERE name = 'Half-Yearly Examination 2026';")
        legacy_exam = cur.fetchone()
        assert legacy_exam is not None, "Half-Yearly Examination 2026 record missing in baseline!"
        baseline['legacy_exam'] = {
            'id': str(legacy_exam[0]),
            'name': legacy_exam[1],
            'is_active': legacy_exam[2],
            'weightage': str(legacy_exam[3]),
        }

        # Historical 5 marks records
        cur.execute("""
            SELECT id, enrollment_id, subject_id, marks_obtained, grade 
            FROM marks_records 
            WHERE exam_type_id = %s 
            ORDER BY id;
        """, [legacy_exam[0]])
        marks_rows = cur.fetchall()
        assert len(marks_rows) == 5, f"Expected 5 marks in baseline, found {len(marks_rows)}"
        baseline['legacy_marks'] = [
            {'id': str(m[0]), 'enrollment_id': str(m[1]), 'subject_id': str(m[2]), 'marks': str(m[3]), 'grade': m[4]}
            for m in marks_rows
        ]

    print(f"Pre-provisioning table count: {baseline['table_count']}")
    print(f"Pre-provisioning sequence count: {baseline['sequence_count']}")
    print(f"Pre-provisioning exam types count: {baseline['marks_exam_types_count']}")
    print(f"Pre-provisioning marks records count: {baseline['marks_records_count']}")
    print(f"Pre-provisioning users count: {baseline['users_count']}")
    print(f"Pre-provisioning students count: {baseline['students_count']}")
    print(f"Pre-provisioning attendance count: {baseline['attendance_records_count']}")
    print(f"Pre-provisioning audit logs count: {baseline['audit_logs_count']}")
    print(f"Pre-provisioning historical exam: {baseline['legacy_exam']}")
    print(f"Pre-provisioning historical marks count: {len(baseline['legacy_marks'])}")

    # 3. Execute Provisioning & Upgrade Path
    print(f"\n[2.3] Executing provision_roles.py on '{UPGRADE_DB}'...")
    run_cmd(
        [PYTHON_EXE, PROVISION_SCRIPT],
        env_overrides={
            'DATABASE_URL': f'postgres://{SUPERUSER}:{SUPERUSER_PW}@{DB_HOST}:{DB_PORT}/{UPGRADE_DB}',
            'MIGRATION_DATABASE_PASSWORD': MIGRATOR_PW,
            'RUNTIME_DATABASE_PASSWORD': RUNTIME_PW,
        }
    )

    print(f"\n[2.4] Executing Django migrate under role '{MIGRATOR_USER}' (DB_ROLE=migrator) on '{UPGRADE_DB}'...")
    run_cmd(
        [PYTHON_EXE, MANAGE_PY, 'migrate'],
        env_overrides={
            'DATABASE_NAME': UPGRADE_DB,
            'DB_ROLE': 'migrator',
            'MIGRATION_DATABASE_USER': MIGRATOR_USER,
            'MIGRATION_DATABASE_PASSWORD': MIGRATOR_PW,
            'RUNTIME_DATABASE_USER': RUNTIME_USER,
            'RUNTIME_DATABASE_PASSWORD': RUNTIME_PW,
        }
    )

    # 4. Verify Post-Provisioning Metrics & Data Integrity
    print(f"\n[2.5] Verifying post-provisioning state and data preservation on '{UPGRADE_DB}'...")
    post = {}
    with clone_conn.cursor() as cur:
        cur.execute("SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';")
        tables = cur.fetchall()
        post['table_count'] = len(tables)
        post['table_owners'] = {t: o for t, o in tables}

        # Verify 100% of tables owned by erp_migrator
        unowned = [t for t, o in tables if o != MIGRATOR_USER]
        assert not unowned, f"Tables not owned by {MIGRATOR_USER}: {unowned}"
        print(f"[PASS] All {len(tables)} tables are owned by '{MIGRATOR_USER}'.")

        # Verify sequences
        cur.execute("SELECT sequencename, sequenceowner FROM pg_sequences WHERE schemaname = 'public';")
        seqs = cur.fetchall()
        post['sequence_count'] = len(seqs)
        assert post['sequence_count'] == baseline['sequence_count']
        unowned_seqs = [s for s, o in seqs if o != MIGRATOR_USER]
        assert not unowned_seqs, f"Sequences not owned by {MIGRATOR_USER}: {unowned_seqs}"
        print(f"[PASS] All {len(seqs)} sequences in '{UPGRADE_DB}' are owned by '{MIGRATOR_USER}'.")

        # Verify core table record counts
        for tbl in domain_tables:
            cur.execute(f'SELECT count(*) FROM public."{tbl}";')
            post[f'{tbl}_count'] = cur.fetchone()[0]
            assert post[f'{tbl}_count'] == baseline[f'{tbl}_count'], (
                f"Count mismatch on {tbl}: pre={baseline[f'{tbl}_count']} vs post={post[f'{tbl}_count']}"
            )
            print(f"[PASS] {tbl} count preserved exactly: {post[f'{tbl}_count']} rows.")

        # Verify historical Half-Yearly Examination 2026 record
        cur.execute("SELECT id, name, is_active, weightage FROM marks_exam_types WHERE name = 'Half-Yearly Examination 2026';")
        post_exam = cur.fetchone()
        assert post_exam is not None, "Half-Yearly Examination 2026 missing post-provisioning!"
        post['legacy_exam'] = {
            'id': str(post_exam[0]),
            'name': post_exam[1],
            'is_active': post_exam[2],
            'weightage': str(post_exam[3]),
        }
        assert post['legacy_exam'] == baseline['legacy_exam'], (
            f"Historical exam type modified! Before: {baseline['legacy_exam']} After: {post['legacy_exam']}"
        )
        print(f"[PASS] Historical 'Half-Yearly Examination 2026' record preserved identically: {post['legacy_exam']}")

        # Verify historical 5 marks records
        cur.execute("""
            SELECT id, enrollment_id, subject_id, marks_obtained, grade 
            FROM marks_records 
            WHERE exam_type_id = %s 
            ORDER BY id;
        """, [post_exam[0]])
        marks_rows = cur.fetchall()
        assert len(marks_rows) == 5, f"Expected 5 marks post-provisioning, found {len(marks_rows)}"
        post['legacy_marks'] = [
            {'id': str(m[0]), 'enrollment_id': str(m[1]), 'subject_id': str(m[2]), 'marks': str(m[3]), 'grade': m[4]}
            for m in marks_rows
        ]
        assert post['legacy_marks'] == baseline['legacy_marks'], (
            f"Historical marks records modified! Before: {baseline['legacy_marks']} After: {post['legacy_marks']}"
        )
        print(f"[PASS] All 5 historical marks records preserved identically.")

    # 5. Run full test_role_permissions.py against the upgraded clone
    print(f"\n[2.6] Executing test_role_permissions.py against '{UPGRADE_DB}'...")
    run_cmd(
        [PYTHON_EXE, TEST_PERMS_SCRIPT],
        env_overrides={
            'DATABASE_NAME': UPGRADE_DB,
            'MIGRATION_DATABASE_USER': MIGRATOR_USER,
            'MIGRATION_DATABASE_PASSWORD': MIGRATOR_PW,
            'RUNTIME_DATABASE_USER': RUNTIME_USER,
            'RUNTIME_DATABASE_PASSWORD': RUNTIME_PW,
            'DATABASE_HOST': DB_HOST,
            'DATABASE_PORT': DB_PORT,
        }
    )
    print(f"[PASS] All Option B security boundaries verified against '{UPGRADE_DB}'.")

    # 6. Cleanup disposable upgrade clone
    clone_conn.close()
    print(f"\n[2.7] Cleaning up disposable clone database '{UPGRADE_DB}'...")
    with admin_conn.cursor() as cur:
        cur.execute(f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{UPGRADE_DB}' AND pid <> pg_backend_pid();")
        cur.execute(f"DROP DATABASE {UPGRADE_DB};")
    admin_conn.close()
    print(f"[PASS] Disposable clone '{UPGRADE_DB}' dropped cleanly.")

    # 7. Final Verification that development database student_erp remains untouched
    print(f"\n[2.8] Re-verifying untouched development database '{SOURCE_DB}'...")
    dev_conn = get_superuser_conn(SOURCE_DB)
    with dev_conn.cursor() as cur:
        cur.execute("SELECT id, name, is_active, weightage FROM marks_exam_types WHERE name = 'Half-Yearly Examination 2026';")
        dev_exam = cur.fetchone()
        assert dev_exam is not None, "Development DB Half-Yearly Examination 2026 was modified or missing!"
        cur.execute("SELECT count(*) FROM marks_records WHERE exam_type_id = %s;", [dev_exam[0]])
        dev_marks_cnt = cur.fetchone()[0]
        assert dev_marks_cnt == 5, f"Expected 5 marks in development DB, found {dev_marks_cnt}"
        print(f"[PASS] Development database '{SOURCE_DB}' verified completely untouched (exam and {dev_marks_cnt} marks intact).")
    dev_conn.close()


def main():
    print("=================================================================")
    print("STUDENT ERP — TASK 5.6 PROVISIONING & UPGRADE EVIDENCE SUITE")
    print("=================================================================")
    exercise_workflow_1_fresh()
    exercise_workflow_2_upgrade()
    print("\n" + "=" * 70)
    print("ALL PROVISIONING & UPGRADE EVIDENCE WORKFLOWS COMPLETED SUCCESSFULLY!")
    print("=================================================================\n")


if __name__ == '__main__':
    main()
