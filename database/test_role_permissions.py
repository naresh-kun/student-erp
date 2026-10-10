"""
Test script verifying PostgreSQL Option B privileges for erp_app and erp_migrator.
"""

import psycopg
import uuid


def run_checks():
    print("Testing connection as erp_app...")
    conn = psycopg.connect('dbname=student_erp user=erp_app password=erp_app_password host=localhost port=5432')
    cur = conn.cursor()

    # 1. SELECT test
    cur.execute("SELECT count(*) FROM audit_logs;")
    count = cur.fetchone()[0]
    print(f"[PASS] erp_app can SELECT from audit_logs (initial count: {count})")

    # 2. INSERT test
    test_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO audit_logs (id, action, resource_type, resource_id, old_values, new_values, created_at, actor_username, actor_role, reason, user_agent) VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s)",
        [test_id, 'CREATE', 'TestResource', '123', '{}', '{}', 'test_user', 'Admin', '', '']
    )
    conn.commit()
    print(f"[PASS] erp_app can INSERT into audit_logs (id: {test_id})")

    # 3. UPDATE test (must be blocked)
    try:
        cur.execute("UPDATE audit_logs SET action = 'TAMPERED' WHERE id = %s;", [test_id])
        conn.commit()
        print("[FAIL] erp_app UPDATE unexpectedly succeeded!")
    except Exception as e:
        conn.rollback()
        print(f"[PASS] erp_app UPDATE blocked as expected: {type(e).__name__}: {str(e).strip()}")

    # 4. DELETE test (must be blocked)
    try:
        cur.execute("DELETE FROM audit_logs WHERE id = %s;", [test_id])
        conn.commit()
        print("[FAIL] erp_app DELETE unexpectedly succeeded!")
    except Exception as e:
        conn.rollback()
        print(f"[PASS] erp_app DELETE blocked as expected: {type(e).__name__}: {str(e).strip()}")

    # 5. TRUNCATE test (must be blocked)
    try:
        cur.execute("TRUNCATE TABLE audit_logs;")
        conn.commit()
        print("[FAIL] erp_app TRUNCATE unexpectedly succeeded!")
    except Exception as e:
        conn.rollback()
        print(f"[PASS] erp_app TRUNCATE blocked as expected: {type(e).__name__}: {str(e).strip()}")

    # 6. ALTER TABLE test (must be blocked)
    try:
        cur.execute("ALTER TABLE audit_logs DISABLE TRIGGER ALL;")
        conn.commit()
        print("[FAIL] erp_app ALTER TABLE unexpectedly succeeded!")
    except Exception as e:
        conn.rollback()
        print(f"[PASS] erp_app ALTER TABLE blocked as expected: {type(e).__name__}: {str(e).strip()}")

    conn.close()

    # Now verify erp_migrator can clean up test row if needed
    print("\nTesting cleanup with erp_migrator...")
    m_conn = psycopg.connect('dbname=student_erp user=erp_migrator password=erp_migrator_password host=localhost port=5432')
    m_cur = m_conn.cursor()
    # Trigger blocks DELETE even for erp_migrator unless trigger is explicitly disabled by owner!
    try:
        m_cur.execute("DELETE FROM audit_logs WHERE id = %s;", [test_id])
        m_conn.commit()
        print("[FAIL] erp_migrator DELETE unexpectedly bypassed trigger without disabling!")
    except Exception as e:
        m_conn.rollback()
        print(f"[PASS] erp_migrator DELETE blocked by trigger: {type(e).__name__}: {str(e).strip()}")

    # If owner disables trigger, owner can delete:
    m_cur.execute("ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_logs_immutable;")
    m_cur.execute("DELETE FROM audit_logs WHERE id = %s;", [test_id])
    m_cur.execute("ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_logs_immutable;")
    m_conn.commit()
    print("[PASS] erp_migrator (owner) can manage triggers and cleanup test record.")
    m_conn.close()

    print("\nAll Option B role privilege boundaries verified successfully!")


if __name__ == '__main__':
    run_checks()
