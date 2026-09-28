"""
Student ERP — Test Common Domain Utilities
Verifies CBSE 8-tier grading, Master Plan Amendment 2 attendance formula,
and permanent Student ID validations.
"""

import pytest
from common.constants import (
    GRADE_A1, GRADE_A2, GRADE_B1, GRADE_B2,
    GRADE_C1, GRADE_C2, GRADE_D, GRADE_E,
    ATTENDANCE_STATUS_PRESENT, ATTENDANCE_STATUS_ABSENT,
    ATTENDANCE_STATUS_ON_DUTY, ATTENDANCE_STATUS_LEAVE
)
from common.utils import (
    calculate_grade,
    calculate_percentage,
    is_passing_grade,
    calculate_cumulative_evaluation,
    calculate_attendance_percentage,
    validate_attendance_status,
    is_attending,
    is_absent,
    validate_student_id,
    format_student_id,
)
from common.exceptions import InvalidAttendanceStatusError


# ============================================================================
# 1. CBSE / ICSE 8-Tier Letter Grading Tests (ADR 008)
# ============================================================================
def test_calculate_grade_authoritative_boundaries():
    # A1 : 91 – 100
    assert calculate_grade(100.0) == GRADE_A1
    assert calculate_grade(95.5) == GRADE_A1
    assert calculate_grade(91.0) == GRADE_A1

    # A2 : 81 – <91
    assert calculate_grade(90.99) == GRADE_A2
    assert calculate_grade(85.0) == GRADE_A2
    assert calculate_grade(81.0) == GRADE_A2

    # B1 : 71 – <81
    assert calculate_grade(80.99) == GRADE_B1
    assert calculate_grade(75.0) == GRADE_B1
    assert calculate_grade(71.0) == GRADE_B1

    # B2 : 61 – <71
    assert calculate_grade(70.99) == GRADE_B2
    assert calculate_grade(65.0) == GRADE_B2
    assert calculate_grade(61.0) == GRADE_B2

    # C1 : 51 – <61
    assert calculate_grade(60.99) == GRADE_C1
    assert calculate_grade(55.0) == GRADE_C1
    assert calculate_grade(51.0) == GRADE_C1

    # C2 : 41 – <51
    assert calculate_grade(50.99) == GRADE_C2
    assert calculate_grade(45.0) == GRADE_C2
    assert calculate_grade(41.0) == GRADE_C2

    # D : 33 – <41 (Passing Threshold)
    assert calculate_grade(40.99) == GRADE_D
    assert calculate_grade(35.0) == GRADE_D
    assert calculate_grade(33.0) == GRADE_D

    # E : <33 (Remedial / Needs Improvement)
    assert calculate_grade(32.99) == GRADE_E
    assert calculate_grade(20.0) == GRADE_E
    assert calculate_grade(0.0) == GRADE_E


def test_calculate_grade_edge_cases():
    assert calculate_grade(None) == GRADE_E
    assert calculate_grade(-10.0) == GRADE_E
    assert calculate_grade(float('nan')) == GRADE_E


def test_calculate_percentage_normal_and_absent():
    assert calculate_percentage(85, 100) == 85.0
    assert calculate_percentage(435, 500) == 87.0
    assert calculate_percentage(33, 100) == 33.0
    # Absent 'AB' returns 0.0
    assert calculate_percentage('AB', 100) == 0.0
    assert calculate_percentage(None, 100) == 0.0
    assert calculate_percentage(50, 0) == 0.0


def test_is_passing_grade():
    for g in [GRADE_A1, GRADE_A2, GRADE_B1, GRADE_B2, GRADE_C1, GRADE_C2, GRADE_D]:
        assert is_passing_grade(g) is True
    assert is_passing_grade(GRADE_E) is False


def test_calculate_cumulative_evaluation():
    subjects = [
        {'marks_obtained': 92, 'max_marks': 100},  # A1
        {'marks_obtained': 85, 'max_marks': 100},  # A2
        {'marks_obtained': 75, 'max_marks': 100},  # B1
        {'marks_obtained': 'AB', 'max_marks': 100}, # Absent
        {'marks_obtained': 80, 'max_marks': 100},  # B1
    ]
    result = calculate_cumulative_evaluation(subjects)
    assert result['total_obtained'] == 332.0
    assert result['total_max'] == 500.0
    assert result['percentage'] == 66.4
    assert result['grade'] == GRADE_B2
    assert result['is_passing'] is True


# ============================================================================
# 2. Canonical 4-Status Attendance Formula Tests (Master Plan Amendment 2)
# ============================================================================
def test_attendance_percentage_formula_adherence():
    # Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
    # 70 present, 10 on_duty, 15 absent, 5 leave -> total 100
    # effective present = 80 -> 80.0%
    pct = calculate_attendance_percentage(present=70, absent=15, on_duty=10, leave=5)
    assert pct == 80.0


def test_attendance_percentage_zero_sessions():
    pct = calculate_attendance_percentage(present=0, absent=0, on_duty=0, leave=0)
    assert pct == 0.0


def test_attendance_on_duty_counts_as_present():
    # 0 present, 10 on_duty, 0 absent, 0 leave -> 100%
    assert calculate_attendance_percentage(present=0, absent=0, on_duty=10, leave=0) == 100.0


def test_attendance_leave_counts_as_absent():
    # 10 present, 0 on_duty, 0 absent, 10 leave -> total 20 -> 50.0%
    assert calculate_attendance_percentage(present=10, absent=0, on_duty=0, leave=10) == 50.0


def test_validate_attendance_status_canonical():
    assert validate_attendance_status('PRESENT') == ATTENDANCE_STATUS_PRESENT
    assert validate_attendance_status('absent') == ATTENDANCE_STATUS_ABSENT
    assert validate_attendance_status('ON_DUTY') == ATTENDANCE_STATUS_ON_DUTY
    assert validate_attendance_status('leave') == ATTENDANCE_STATUS_LEAVE


def test_validate_attendance_status_strictly_prohibits_late_and_excused():
    with pytest.raises(InvalidAttendanceStatusError) as exc_late:
        validate_attendance_status('LATE')
    assert "strictly prohibited" in str(exc_late.value)

    with pytest.raises(InvalidAttendanceStatusError) as exc_excused:
        validate_attendance_status('EXCUSED')
    assert "strictly prohibited" in str(exc_excused.value)

    with pytest.raises(InvalidAttendanceStatusError):
        validate_attendance_status('UNKNOWN_STATUS')


def test_is_attending_and_is_absent():
    assert is_attending('PRESENT') is True
    assert is_attending('ON_DUTY') is True
    assert is_attending('ABSENT') is False
    assert is_attending('LEAVE') is False

    assert is_absent('ABSENT') is True
    assert is_absent('LEAVE') is True
    assert is_absent('PRESENT') is False
    assert is_absent('ON_DUTY') is False


# ============================================================================
# 3. Permanent Student ID Validation Tests
# ============================================================================
def test_student_id_validation_format():
    assert validate_student_id('STU202600001') is True
    assert validate_student_id('STU202400123') is True
    assert validate_student_id('STU202699999') is True

    # Invalid formats
    assert validate_student_id('stu202600001') is False  # Must be uppercase
    assert validate_student_id('STU202601') is False     # Too short
    assert validate_student_id('STD202600001') is False  # Wrong prefix
    assert validate_student_id('') is False
    assert validate_student_id(None) is False


def test_format_student_id_generator():
    assert format_student_id(2026, 1) == 'STU202600001'
    assert format_student_id(2026, 42) == 'STU202600042'
    assert format_student_id(2025, 1250) == 'STU202501250'
