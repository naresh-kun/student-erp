"""
Student ERP — Shared Domain Utilities & Calculations
Provides pure mathematical and validation routines for:
1. CBSE / ICSE 8-tier letter grading and percentage evaluation
2. Canonical 4-status attendance calculations (Master Plan Amendment 2)
3. Student ID generation and format enforcement
"""

import math
import re
from typing import Dict, List, Optional, Union
from common.constants import (
    ALL_GRADES,
    ATTENDANCE_STATUSES,
    ATTENDANCE_STATUS_ABSENT,
    ATTENDANCE_STATUS_LEAVE,
    ATTENDANCE_STATUS_ON_DUTY,
    ATTENDANCE_STATUS_PRESENT,
    FORBIDDEN_ATTENDANCE_STATUSES,
    GRADE_A1,
    GRADE_A2,
    GRADE_B1,
    GRADE_B2,
    GRADE_C1,
    GRADE_C2,
    GRADE_D,
    GRADE_E,
    PASSING_GRADE_THRESHOLD,
)
from common.exceptions import InvalidAttendanceStatusError

# Canonical Student ID regex: "STU" + 4-digit academic year + 5-digit sequence (e.g. STU202600001)
STUDENT_ID_REGEX = re.compile(r'^STU\d{4}\d{5}$')


# ============================================================================
# 1. CBSE / ICSE 8-Tier Academic Evaluation (ADR 008)
# ============================================================================
def calculate_grade(percentage: Union[float, int]) -> str:
    """
    Maps a numerical percentage (0–100) strictly to its authoritative letter grade.
    
    Boundary rules:
    - >= 91: 'A1' (up to 100)
    - >= 81 and < 91: 'A2'
    - >= 71 and < 81: 'B1'
    - >= 61 and < 71: 'B2'
    - >= 51 and < 61: 'C1'
    - >= 41 and < 51: 'C2'
    - >= 33 and < 41: 'D' (Passing threshold)
    - < 33: 'E' (Remedial / Needs Improvement)
    """
    if percentage is None:
        return GRADE_E

    try:
        pct = float(percentage)
    except (ValueError, TypeError):
        return GRADE_E

    if math.isnan(pct) or pct < 0.0:
        return GRADE_E

    if pct >= 91.0:
        return GRADE_A1
    if pct >= 81.0:
        return GRADE_A2
    if pct >= 71.0:
        return GRADE_B1
    if pct >= 61.0:
        return GRADE_B2
    if pct >= 51.0:
        return GRADE_C1
    if pct >= 41.0:
        return GRADE_C2
    if pct >= 33.0:
        return GRADE_D
    return GRADE_E


def calculate_percentage(
    marks_obtained: Union[float, int, str, None],
    max_marks: Union[float, int] = 100.0,
) -> float:
    """
    Calculates academic percentage given marks obtained and maximum marks.
    Handles 'AB' (Absent) explicitly by returning 0.0.
    Rounds to 2 decimal places to avoid floating-point artifacts.
    """
    if marks_obtained is None or marks_obtained == '' or marks_obtained == 'AB':
        return 0.0

    try:
        obtained = float(marks_obtained)
        maximum = float(max_marks)
    except (ValueError, TypeError):
        return 0.0

    if maximum <= 0.0 or obtained < 0.0:
        return 0.0

    pct = (obtained / maximum) * 100.0
    return round(pct, 2)


def is_passing_grade(grade: str) -> bool:
    """Returns True if the grade is passing (A1 through D). Grade E is failing/remedial."""
    return grade in (GRADE_A1, GRADE_A2, GRADE_B1, GRADE_B2, GRADE_C1, GRADE_C2, GRADE_D)


def calculate_cumulative_evaluation(subject_evaluations: List[Dict]) -> Dict:
    """
    Aggregates a list of subject marks into total marks, maximum marks,
    cumulative percentage, and overall letter grade.
    Each item in subject_evaluations is expected to have 'marks_obtained' and 'max_marks'.
    """
    total_obtained = 0.0
    total_max = 0.0

    for item in subject_evaluations:
        obtained = item.get('marks_obtained')
        max_m = item.get('max_marks', 100.0)

        try:
            max_float = float(max_m)
        except (ValueError, TypeError):
            max_float = 100.0

        total_max += max_float

        if obtained != 'AB' and obtained is not None:
            try:
                total_obtained += float(obtained)
            except (ValueError, TypeError):
                pass

    overall_percentage = calculate_percentage(total_obtained, total_max) if total_max > 0 else 0.0
    overall_grade = calculate_grade(overall_percentage)

    return {
        'total_obtained': round(total_obtained, 2),
        'total_max': round(total_max, 2),
        'percentage': overall_percentage,
        'grade': overall_grade,
        'is_passing': is_passing_grade(overall_grade),
    }


# ============================================================================
# 2. Canonical 4-Status Attendance Utilities (Master Plan Amendment 2)
# ============================================================================
def calculate_attendance_percentage(
    present: int = 0,
    absent: int = 0,
    on_duty: int = 0,
    leave: int = 0,
) -> float:
    """
    Calculates attendance percentage strictly according to Master Plan Amendment 2:
    Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
    
    Rules:
    - PRESENT counts in both numerator and denominator.
    - ON_DUTY counts in both numerator and denominator.
    - ABSENT counts in denominator only.
    - LEAVE counts in denominator only.
    - Result is rounded to 1 decimal place.
    - Returns 0.0 if total sessions is 0.
    """
    p = max(0, int(present or 0))
    a = max(0, int(absent or 0))
    od = max(0, int(on_duty or 0))
    lv = max(0, int(leave or 0))

    total = p + a + od + lv
    if total <= 0:
        return 0.0

    effective_present = p + od
    percentage = (effective_present / total) * 100.0
    return round(percentage, 1)


def validate_attendance_status(status_value: str) -> str:
    """
    Validates that the provided attendance status is one of the 4 canonical values.
    Strictly prohibits legacy statuses ('LATE', 'EXCUSED') and raises InvalidAttendanceStatusError.
    """
    if not status_value or not isinstance(status_value, str):
        raise InvalidAttendanceStatusError(str(status_value))

    normalized = status_value.strip().upper()

    if normalized in FORBIDDEN_ATTENDANCE_STATUSES:
        raise InvalidAttendanceStatusError(normalized)

    if normalized not in ATTENDANCE_STATUSES:
        raise InvalidAttendanceStatusError(normalized)

    return normalized


def is_attending(status_value: str) -> bool:
    """Returns True if the status represents student attendance (PRESENT or ON_DUTY)."""
    return status_value in (ATTENDANCE_STATUS_PRESENT, ATTENDANCE_STATUS_ON_DUTY)


def is_absent(status_value: str) -> bool:
    """Returns True if the status represents absence in calculations (ABSENT or LEAVE)."""
    return status_value in (ATTENDANCE_STATUS_ABSENT, ATTENDANCE_STATUS_LEAVE)


# ============================================================================
# 3. Permanent Student ID Validation & Formatting
# ============================================================================
def validate_student_id(student_id: str) -> bool:
    """
    Validates whether a string conforms to the permanent Student ID format:
    'STU' + 4-digit academic year + 5-digit sequence (e.g. 'STU202600001').
    """
    if not student_id or not isinstance(student_id, str):
        return False
    return bool(STUDENT_ID_REGEX.match(student_id.strip()))


def format_student_id(academic_year: int, sequence_number: int) -> str:
    """
    Generates a canonical permanent Student ID.
    Example: format_student_id(2026, 1) -> 'STU202600001'
    """
    return f"STU{academic_year:04d}{sequence_number:05d}"
