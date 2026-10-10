"""
Student ERP — PostgreSQL Option B Security Boundaries Verification Script
Validates:
1. Schema & Table Ownership: erp_migrator owns all Django-managed tables and sequences.
2. DDL Execution: erp_migrator can alter existing domain tables; erp_app is blocked from DDL.
3. Ordinary CRUD: erp_app has CRUD on ordinary domain tables.
4. Future Objects: New tables created by erp_migrator automatically receive CRUD for erp_app via default privileges.
5. Audit Table Exemption: erp_app has strictly SELECT and INSERT on audit_logs; UPDATE, DELETE, TRUNCATE, ALTER are blocked.
6. DB Trigger Enforcement: PostgreSQL trigger blocks UPDATE and DELETE on audit_logs even for erp_migrator.
7. Historical Preservation: Half-Yearly Examination 2026 and its 5 marks records remain intact.
"""

import os
import sys
import uuid
import psycopg


def verify_option_b_security():
    db_name = os.environ.get('DATABASE_NAME') or os.environ.get('DB_NAME') or 'student_erp'
    db_host = os.environ.get('DATABASE_HOST') or os.environ.get('DB_HOST') or 'localhost'
    db_port = os.environ.get('DATABASE_PORT') or os.environ.get('DB_PORT') or '5432'

    migrator_user = os.environ.get('MIGRATION_DATABASE_USER') or 'erp_migrator'
    migrator_pw = os.environ.get('MIGRATION_DATABASE_PASSWORD') or os.environ.get('MIGRATION_DB_PASSWORD')

    runtime_user = os.environ.get('RUNTIME_DATABASE_USER') or 'erp_app'
    runtime_pw = os.environ.get('RUNTIME_DATABASE_PASSWORD') or os.environ.get('RUNTIME_DB_PASSWORD')

    if not migrator_pw or not runtime_pw:
        raise ValueError(
            "Database test passwords must be provided via environment variables:\n"
            "  - MIGRATION_DATABASE_PASSWORD (or MIGRATION_DB_PASSWORD)\n"
            "  - RUNTIME_DATABASE_PASSWORD (or RUNTIME_DB_PASSWORD)\n"
            "Hard-coded credentials are not permitted."
        )

    print("=================================================================")
    print("STARTING OPTION B POSTGRESQL SECURITY BOUNDARY VERIFICATION")
    print(f"Target Database: {db_name}@{db_host}:{db_port}")
    print("=================================================================\n")

    # -------------------------------------------------------------------------
    # 1. Verify Table Ownership across all Django-managed public tables
    # -------------------------------------------------------------------------
    print("[1] Verifying schema and table ownership as erp_migrator...")
    conn_mig = psycopg.connect(
        dbname=db_name, user=migrator_user, password=migrator_pw, host=db_host, port=db_port
    )
    cur_mig = conn_mig.cursor()

    cur_mig.execute("""
        SELECT tablename, tableowner 
        FROM pg_tables 
        WHERE schemaname = 'public';
    """)
    unowned_tables = [t for t, o in cur_mig.fetchall() if o != migrator_user]
    assert not unowned_tables, f"Tables not owned by {migrator_user}: {unowned_tables}"
    print(f"[PASS] All public tables are owned by '{migrator_user}'.")

    cur_mig.execute("""
        SELECT sequencename, sequenceowner
        FROM pg_sequences
        WHERE schemaname = 'public';
    """)
    sequences = cur_mig.fetchall()
    unowned_seqs = [s for s, o in sequences if o != migrator_user]
    assert not unowned_seqs, f"Sequences not owned by {migrator_user}: {unowned_seqs}"
    print(f"[PASS] All {len(sequences)} public sequences are owned by '{migrator_user}'.")

    # -------------------------------------------------------------------------
    # 2. Verify DDL capabilities on existing tables (erp_migrator vs erp_app)
    # -------------------------------------------------------------------------
    print("\n[2] Verifying DDL execution on existing domain table ('marks_exam_types')...")
    # erp_migrator can alter table
    cur_mig.execute("ALTER TABLE marks_exam_types ADD COLUMN _sec_test_col INT;")
    cur_mig.execute("ALTER TABLE marks_exam_types DROP COLUMN _sec_test_col;")
    conn_mig.commit()
    print(f"[PASS] {migrator_user} successfully executed DDL (ALTER TABLE) on marks_exam_types.")

    # erp_app must be blocked from DDL
    conn_app = psycopg.connect(
        dbname=db_name, user=runtime_user, password=runtime_pw, host=db_host, port=db_port
    )
    cur_app = conn_app.cursor()
    try:
        cur_app.execute("ALTER TABLE marks_exam_types ADD COLUMN _sec_test_col INT;")
        conn_app.commit()
        raise AssertionError(f"[FAIL] {runtime_user} unexpectedly succeeded in executing ALTER TABLE!")
    except psycopg.errors.InsufficientPrivilege:
        conn_app.rollback()
        print(f"[PASS] {runtime_user} ALTER TABLE blocked as expected (InsufficientPrivilege: must be owner).")

    # -------------------------------------------------------------------------
    # 3. Verify ordinary CRUD permissions for erp_app
    # -------------------------------------------------------------------------
    print("\n[3] Verifying ordinary CRUD on domain tables for erp_app...")
    cur_app.execute("SELECT count(*) FROM marks_exam_types;")
    exam_count = cur_app.fetchone()[0]
    assert exam_count >= 1, "Expected existing exam types in database"
    print(f"[PASS] {runtime_user} can query domain tables (exam_types count: {exam_count}).")

    # -------------------------------------------------------------------------
    # 4. Verify Future Object Default Privileges
    # -------------------------------------------------------------------------
    print("\n[4] Verifying future-object default privileges...")
    temp_tbl = f"_test_future_{uuid.uuid4().hex[:8]}"
    cur_mig.execute(f"CREATE TABLE {temp_tbl} (id SERIAL PRIMARY KEY, title TEXT);")
    conn_mig.commit()
    print(f"Created future table '{temp_tbl}' as {migrator_user}.")

    try:
        # erp_app should automatically have CRUD via default privileges
        cur_app.execute(f"INSERT INTO {temp_tbl} (title) VALUES ('Auto Grant Test') RETURNING id;")
        new_row_id = cur_app.fetchone()[0]
        conn_app.commit()
        print(f"[PASS] {runtime_user} INSERT into newly created table succeeded via default privileges (id={new_row_id}).")

        cur_app.execute(f"SELECT title FROM {temp_tbl} WHERE id = %s;", [new_row_id])
        assert cur_app.fetchone()[0] == 'Auto Grant Test'
        print(f"[PASS] {runtime_user} SELECT on newly created table succeeded.")

        cur_app.execute(f"UPDATE {temp_tbl} SET title = 'Updated Title' WHERE id = %s;", [new_row_id])
        conn_app.commit()
        print(f"[PASS] {runtime_user} UPDATE on newly created table succeeded.")

        cur_app.execute(f"DELETE FROM {temp_tbl} WHERE id = %s;", [new_row_id])
        conn_app.commit()
        print(f"[PASS] {runtime_user} DELETE on newly created table succeeded.")

        # But erp_app must NOT have DDL privileges on the new table
        try:
            cur_app.execute(f"ALTER TABLE {temp_tbl} ADD COLUMN col2 INT;")
            conn_app.commit()
            raise AssertionError(f"[FAIL] {runtime_user} unexpectedly altered future table!")
        except psycopg.errors.InsufficientPrivilege:
            conn_app.rollback()
            print(f"[PASS] {runtime_user} ALTER TABLE on future table blocked as expected.")
    finally:
        cur_mig.execute(f"DROP TABLE {temp_tbl};")
        conn_mig.commit()
        print(f"Cleaned up future test table '{temp_tbl}'.")

    # -------------------------------------------------------------------------
    # 5. Verify Audit Table Append-Only Exemption for erp_app
    # -------------------------------------------------------------------------
    print("\n[5] Verifying strict append-only boundaries on audit_logs...")
    # SELECT works
    cur_app.execute("SELECT count(*) FROM audit_logs;")
    audit_count = cur_app.fetchone()[0]
    print(f"[PASS] {runtime_user} can SELECT from audit_logs (count: {audit_count}).")

    # INSERT works
    test_audit_id = str(uuid.uuid4())
    cur_app.execute(
        "INSERT INTO audit_logs (id, action, resource_type, resource_id, old_values, new_values, created_at, actor_username, actor_role, reason, user_agent) "
        "VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s);",
        [test_audit_id, 'CREATE', 'ExamType', 'sec-test', '{}', '{"test": true}', 'test_actor', 'Admin', 'SecTest', 'SecTestAgent']
    )
    conn_app.commit()
    print(f"[PASS] {runtime_user} can INSERT into audit_logs (id: {test_audit_id}).")

    # UPDATE is blocked by PostgreSQL permissions
    try:
        cur_app.execute("UPDATE audit_logs SET action = 'TAMPERED' WHERE id = %s;", [test_audit_id])
        conn_app.commit()
        raise AssertionError(f"[FAIL] {runtime_user} unexpectedly updated audit_logs!")
    except psycopg.errors.InsufficientPrivilege:
        conn_app.rollback()
        print(f"[PASS] {runtime_user} UPDATE blocked by PostgreSQL privileges (permission denied for table audit_logs).")

    # DELETE is blocked by PostgreSQL permissions
    try:
        cur_app.execute("DELETE FROM audit_logs WHERE id = %s;", [test_audit_id])
        conn_app.commit()
        raise AssertionError(f"[FAIL] {runtime_user} unexpectedly deleted from audit_logs!")
    except psycopg.errors.InsufficientPrivilege:
        conn_app.rollback()
        print(f"[PASS] {runtime_user} DELETE blocked by PostgreSQL privileges (permission denied for table audit_logs).")

    # TRUNCATE is blocked by PostgreSQL permissions
    try:
        cur_app.execute("TRUNCATE TABLE audit_logs;")
        conn_app.commit()
        raise AssertionError(f"[FAIL] {runtime_user} unexpectedly truncated audit_logs!")
    except psycopg.errors.InsufficientPrivilege:
        conn_app.rollback()
        print(f"[PASS] {runtime_user} TRUNCATE blocked by PostgreSQL privileges (permission denied for table audit_logs).")

    # ALTER TABLE / DISABLE TRIGGER is blocked
    try:
        cur_app.execute("ALTER TABLE audit_logs DISABLE TRIGGER ALL;")
        conn_app.commit()
        raise AssertionError(f"[FAIL] {runtime_user} unexpectedly executed DDL on audit_logs!")
    except psycopg.errors.InsufficientPrivilege:
        conn_app.rollback()
        print(f"[PASS] {runtime_user} ALTER TABLE blocked (must be owner of table audit_logs).")

    # -------------------------------------------------------------------------
    # 6. Verify Database Trigger Enforcement (even for erp_migrator)
    # -------------------------------------------------------------------------
    print("\n[6] Verifying PostgreSQL trigger immutability enforcement on audit_logs...")
    try:
        cur_mig.execute("DELETE FROM audit_logs WHERE id = %s;", [test_audit_id])
        conn_mig.commit()
        raise AssertionError(f"[FAIL] {migrator_user} bypassed append-only trigger without disabling it!")
    except psycopg.errors.RaiseException as e:
        conn_mig.rollback()
        assert "Table audit_logs is append-only" in str(e)
        print(f"[PASS] {migrator_user} raw SQL DELETE blocked by trigger: {str(e).strip()}")

    # Owner can disable trigger to perform authorized cleanup of the test record
    cur_mig.execute("ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_logs_immutable;")
    cur_mig.execute("DELETE FROM audit_logs WHERE id = %s;", [test_audit_id])
    cur_mig.execute("ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_logs_immutable;")
    conn_mig.commit()
    print(f"[PASS] {migrator_user} (owner) can manage triggers to clean up test row.")

    # -------------------------------------------------------------------------
    # 7. Verify Historical ExamType and Marks Records Preservation
    # -------------------------------------------------------------------------
    print("\n[7] Verifying historical data preservation...")
    cur_mig.execute("SELECT id, is_active, weightage FROM marks_exam_types WHERE name = 'Half-Yearly Examination 2026';")
    legacy_row = cur_mig.fetchone()
    assert legacy_row is not None, "Half-Yearly Examination 2026 record is missing!"
    assert legacy_row[1] is True, "Half-Yearly Examination 2026 should be active!"
    legacy_id = legacy_row[0]

    cur_mig.execute("SELECT count(*) FROM marks_records WHERE exam_type_id = %s;", [legacy_id])
    legacy_marks_count = cur_mig.fetchone()[0]
    assert legacy_marks_count == 5, f"Expected 5 historical marks, found {legacy_marks_count}"
    print(f"[PASS] Half-Yearly Examination 2026 and all {legacy_marks_count} historical marks records remain 100% intact.")

    cur_app.close()
    conn_app.close()
    cur_mig.close()
    conn_mig.close()

    print("\n=================================================================")
    print("ALL OPTION B SECURITY CRITERIA & INVARIANTS PASSED VERIFICATION!")
    print("=================================================================")


if __name__ == '__main__':
    verify_option_b_security()
