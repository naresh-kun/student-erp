"""
Live E2E Verification Script for Phase 5 Task 5.6
Tests all 5 roles against the running Django REST Framework dev server at http://127.0.0.1:8000/
"""

import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def post_json(endpoint, data, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed

def get_json(endpoint, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"} if token else {},
        method="GET"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed

def patch_json(endpoint, data, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed

def login(username, password="demo123"):
    status, res = post_json("/api/v1/auth/login/", {"username": username, "password": password})
    if status == 200:
        token = res["data"]["access"]
        role = res["data"]["user"]["role"]
        return token, role, res["data"]["user"]
    raise RuntimeError(f"Login failed for {username}: status={status}, response={res}")

def run_verification():
    print("=== STARTING PHASE 5.6 LIVE E2E ROLE VERIFICATION ===")

    # 1. ADMIN FLOW
    print("\n[1] ADMIN ROLE VERIFICATION (admin_demo)")
    admin_token, admin_role, admin_user = login("admin_demo")
    print(f" -> Logged in as: {admin_user['username']} (Role: {admin_role})")
    assert admin_role == "Admin"

    # Admin marks summary list
    s, res = get_json("/api/v1/marks/summary/", admin_token)
    assert s == 200, f"Expected 200, got {s}: {res}"
    summary_list = res["data"]
    print(f" -> Marks summary roll-up items count: {len(summary_list)}")
    assert isinstance(summary_list, list)
    if len(summary_list) > 0:
        first = summary_list[0]
        print(f"    Sample section rollup: class='{first.get('class_name')}', subject='{first.get('subject_name')}', "
              f"avg={first.get('average_percentage')}%, pass={first.get('pass_percentage')}%")
        assert "grade_distribution" in first

    # Admin exam types
    s, res = get_json("/api/v1/marks/exam-types/", admin_token)
    assert s == 200
    exam_types = res["data"]
    print(f" -> Exam types count: {len(exam_types)}")
    assert len(exam_types) >= 4
    cycle_test = next(et for et in exam_types if "Cycle Test" in et["name"])

    # Admin exam type detail GET /api/v1/marks/exam-types/{id}/
    s, res_detail = get_json(f"/api/v1/marks/exam-types/{cycle_test['id']}/", admin_token)
    assert s == 200, f"Expected 200 for exam type detail, got {s}: {res_detail}"
    assert res_detail["data"]["id"] == cycle_test["id"]
    assert "Cycle Test" in res_detail["data"]["name"]
    print(f" -> GET /api/v1/marks/exam-types/{cycle_test['id']}/ verified (HTTP 200)")

    # Admin patch exam type
    s, res = patch_json(f"/api/v1/marks/exam-types/{cycle_test['id']}/", {"weightage": "10.00"}, admin_token)
    assert s == 200
    print(f" -> Admin exam type patch verified (weightage=10.00)")

    # 2. FACULTY FLOW
    print("\n[2] FACULTY ROLE VERIFICATION (faculty_suresh)")
    faculty_token, faculty_role, faculty_user = login("faculty_suresh")
    print(f" -> Logged in as: {faculty_user['username']} (Role: {faculty_role})")
    assert faculty_role == "Faculty"

    # Faculty scoped marks list
    s, res = get_json("/api/v1/marks/", faculty_token)
    assert s == 200
    print(f" -> Faculty marks list accessible, count={len(res.get('data', []))}")

    # Faculty bulk entry in assigned scope
    student_arun_id = "STU202600001"
    bulk_payload = {
        "records": [
            {
                "student_id": student_arun_id,
                "subject_id": "CS101",
                "exam_type_id": "Cycle Test",
                "marks_obtained": "92.00",
                "max_marks": 100,
                "remarks": "Excellent live demo submission"
            }
        ]
    }
    s, res = post_json("/api/v1/marks/bulk/", bulk_payload, faculty_token)
    assert s in (200, 201), f"Faculty marks bulk failed: {s}, {res}"
    print(f" -> Faculty bulk marks entry in assigned subject CS101: SUCCESS ({res['data']['saved_count']} saved)")

    # Faculty bulk entry with 'AB' (Absent)
    bulk_ab_payload = {
        "records": [
            {
                "student_id": student_arun_id,
                "subject_id": "CS101",
                "exam_type_id": "Quarterly Examination",
                "marks_obtained": "AB",
                "max_marks": 100,
                "remarks": "Medical absence"
            }
        ]
    }
    s, res = post_json("/api/v1/marks/bulk/", bulk_ab_payload, faculty_token)
    assert s in (200, 201), f"Faculty AB marks entry failed: {s}, {res}"
    print(f" -> Faculty 'AB' (Absent) submission in CS101: SUCCESS ({res['data']['saved_count']} saved)")

    # Faculty attempting unassigned subject (MATH) should be REJECTED with 403
    bulk_unassigned_payload = {
        "records": [
            {
                "student_id": student_arun_id,
                "subject_id": "MATH101",
                "exam_type_id": "Cycle Test",
                "marks_obtained": "85.00"
            }
        ]
    }
    s, res = post_json("/api/v1/marks/bulk/", bulk_unassigned_payload, faculty_token)
    assert s == 403, f"Expected 403 for unassigned subject, got {s}: {res}"
    print(f" -> Faculty unassigned subject submission correctly blocked with HTTP 403 Forbidden")

    # 3. STUDENT FLOW
    print("\n[3] STUDENT ROLE VERIFICATION (student_arun)")
    student_token, student_role, student_user = login("student_arun")
    print(f" -> Logged in as: {student_user['username']} (Role: {student_role})")
    assert student_role == "Student"

    # Student own report card using STU202600001
    s, res = get_json(f"/api/v1/marks/report-card/{student_arun_id}/", student_token)
    assert s == 200, f"Student report card failed: {s}, {res}"
    rc = res["data"]
    print(f" -> Student own report card: cumulative={rc.get('total_marks_obtained')}/{rc.get('total_max_marks')}, "
          f"percentage={rc.get('overall_percentage')}%, grade={rc.get('overall_grade')}")
    assert "marks" in rc
    assert "total_marks_obtained" in rc
    assert "overall_grade" in rc

    # Student mutation blocked (403)
    s, res = post_json("/api/v1/marks/bulk/", bulk_payload, student_token)
    assert s == 403, f"Expected 403 for student mark mutation, got {s}"
    print(f" -> Student marks mutation correctly blocked with HTTP 403 Forbidden")

    # 4. PARENT FLOW
    print("\n[4] PARENT ROLE VERIFICATION (parent_ramanathan)")
    parent_token, parent_role, parent_user = login("parent_ramanathan")
    print(f" -> Logged in as: {parent_user['username']} (Role: {parent_role})")
    assert parent_role == "Parent"

    # Parent reading ward report card
    s, res = get_json(f"/api/v1/marks/report-card/{student_arun_id}/", parent_token)
    assert s == 200, f"Parent ward report card failed: {s}, {res}"
    print(f" -> Parent ward report card retrieved successfully: overall_grade={res['data'].get('overall_grade')}")

    # Parent marks mutation blocked (403)
    s, res = post_json("/api/v1/marks/bulk/", bulk_payload, parent_token)
    assert s == 403, f"Expected 403 for parent mark mutation, got {s}"
    print(f" -> Parent marks mutation correctly blocked with HTTP 403 Forbidden")

    # 5. PRINCIPAL FLOW
    print("\n[5] PRINCIPAL ROLE VERIFICATION (principal_demo)")
    principal_token, principal_role, principal_user = login("principal_demo")
    print(f" -> Logged in as: {principal_user['username']} (Role: {principal_role})")
    assert principal_role == "Principal"

    # Principal marks summary (institutional oversight)
    s, res = get_json("/api/v1/marks/summary/", principal_token)
    assert s == 200, f"Principal marks summary failed: {s}, {res}"
    print(f" -> Principal institutional summary retrieved: {len(res['data'])} rollups")

    # Principal academic analytics
    s, res = get_json("/api/v1/marks/analytics/", principal_token)
    assert s == 200, f"Principal academic analytics failed: {s}, {res}"
    analytics = res["data"]
    print(f" -> Principal analytics retrieved: cohorts={len(analytics.get('cohorts', []))}, "
          f"subject_metrics={len(analytics.get('subject_metrics', []))}")
    # Invariant: No faculty rankings or teacher performance
    analytics_str = json.dumps(analytics).lower()
    assert "ranking" not in analytics_str
    assert "teacher_performance" not in analytics_str
    print(f" -> Governance Invariant Verified: strictly zero faculty rankings or teacher evaluations")

    # Principal mark mutation blocked (403)
    s, res = post_json("/api/v1/marks/bulk/", bulk_payload, principal_token)
    assert s == 403, f"Expected 403 for principal mark mutation, got {s}"
    print(f" -> Principal marks mutation correctly blocked with HTTP 403 Forbidden (Read-only oversight)")

    print("\n========================================================")
    print("ALL 5 ROLES PASSED LIVE OPERATIONAL & SECURITY CRITERIA!")
    print("========================================================")

if __name__ == "__main__":
    run_verification()
