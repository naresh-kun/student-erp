"""
Student ERP — Phase 5 Task 5.4 Backend Verification Suite
Academic Structure & Administrative Integration: Master Catalogs, Allocation Workflows & RBAC Scoping

Tests:
1. Master Catalogs Retrieval:
   - Academic Years (/api/v1/academics/years/)
   - Classes Hierarchy (/api/v1/academics/classes/)
   - Sections (/api/v1/academics/sections/)
   - Subjects (/api/v1/academics/subjects/)
   - Enrollments (/api/v1/academics/enrollments/)
2. Student Section Allocation:
   - Admin & Principal can list, update, and delete student section allocation.
   - Student ID immutability guaranteed.
   - Faculty is view-only (PATCH/DELETE returns 403 Forbidden).
   - Student & Parent denied access (403 Forbidden).
3. Class Teacher Allocation:
   - Admin & Principal can list, update, and delete class teacher allocation.
   - Cardinality invariant: One section per faculty per academic year enforced (400 Bad Request on duplicate).
   - Faculty is view-only (PATCH/DELETE returns 403 Forbidden).
   - Student & Parent denied access (403 Forbidden).
4. Academic Master Data Mutation RBAC:
   - Admin can mutate academic master data.
   - Principal & Faculty cannot mutate academic master data (403 Forbidden).
5. TeachingAssignment Authority Non-Regression:
   - Class Teacher status does NOT grant marks entry authority for unassigned subjects.
"""

from datetime import date
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Role, User, Faculty, Parent
from apps.students.models import Student
from apps.academics.models import AcademicYear, SchoolClass, Section, Subject, TeachingAssignment, Enrollment
from apps.marks.models import ExamType, Mark


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def task54_setup(db):
    """
    Sets up institutional academic hierarchy:
    - Academic Year 2026-2027 (Active)
    - Admin, Principal, Faculty A (Suresh), Faculty B (Priya), Student (Arun), Parent (Ramanathan)
    - Classes: Grade 11 (Stream: Computer Science A), Grade 10 (No Stream)
    - Sections: XI-A1, XI-A2, X-A
    - Subjects: Computer Science, Mathematics
    - Enrollments: Arun in XI-A1
    """
    role_admin, _ = Role.objects.get_or_create(name='Admin', defaults={'description': 'System Administrator'})
    role_principal, _ = Role.objects.get_or_create(name='Principal', defaults={'description': 'Principal'})
    role_faculty, _ = Role.objects.get_or_create(name='Faculty', defaults={'description': 'Faculty member'})
    role_parent, _ = Role.objects.get_or_create(name='Parent', defaults={'description': 'Parent'})
    role_student, _ = Role.objects.get_or_create(name='Student', defaults={'description': 'Enrolled student'})

    admin_user = User.objects.create_user(
        username='admin_test',
        email='admin@school.edu.in',
        password='password123',
        role=role_admin,
        is_active=True,
    )
    principal_user = User.objects.create_user(
        username='principal_test',
        email='principal@school.edu.in',
        password='password123',
        role=role_principal,
        is_active=True,
    )
    faculty_user_a = User.objects.create_user(
        username='faculty_a',
        email='faculty.a@school.edu.in',
        password='password123',
        role=role_faculty,
        first_name='Suresh',
        last_name='R',
        is_active=True,
    )
    faculty_a = Faculty.objects.create(
        user=faculty_user_a,
        employee_code='FAC-001',
        department='Computer Science',
        designation='PGT Computer Science',
        joining_date=date(2020, 6, 1),
    )

    faculty_user_b = User.objects.create_user(
        username='faculty_b',
        email='faculty.b@school.edu.in',
        password='password123',
        role=role_faculty,
        first_name='Priya',
        last_name='K',
        is_active=True,
    )
    faculty_b = Faculty.objects.create(
        user=faculty_user_b,
        employee_code='FAC-002',
        department='Mathematics',
        designation='PGT Mathematics',
        joining_date=date(2021, 6, 1),
    )

    parent_user = User.objects.create_user(
        username='parent_test',
        email='parent@school.edu.in',
        password='password123',
        role=role_parent,
        first_name='S.',
        last_name='Ramanathan',
        phone='+91-98400-11207',
        is_active=True,
    )
    parent = Parent.objects.create(
        user=parent_user,
        relation='Father',
    )

    student_user = User.objects.create_user(
        username='student_test',
        email='student@school.edu.in',
        password='password123',
        role=role_student,
        first_name='Arun',
        last_name='Kumar',
        is_active=True,
    )
    student = Student.objects.create(
        user=student_user,
        student_id='STU202600001',
        admission_number='ADM2026001',
        roll_number='11-A1-01',
        date_of_birth=date(2009, 5, 14),
        gender='Male',
        parent=parent,
    )

    ay, _ = AcademicYear.objects.get_or_create(
        name='2026-2027',
        defaults={
            'start_date': date(2026, 6, 1),
            'end_date': date(2027, 4, 30),
            'is_current': True,
        }
    )

    class_11 = SchoolClass.objects.create(
        name='Grade 11 - Computer Science',
        code='G11-CS-TEST',
        academic_year=ay,
    )
    sec_11_a1 = Section.objects.create(
        name='A1',
        school_class=class_11,
        capacity=40,
        class_teacher=faculty_a,
        academic_year=ay,
    )
    sec_11_a2 = Section.objects.create(
        name='A2',
        school_class=class_11,
        capacity=40,
        class_teacher=None,
        academic_year=ay,
    )

    class_10 = SchoolClass.objects.create(
        name='Grade 10',
        code='G10-GEN-TEST',
        academic_year=ay,
    )
    sec_10_a = Section.objects.create(
        name='A',
        school_class=class_10,
        capacity=40,
        class_teacher=None,
        academic_year=ay,
    )

    sub_cs = Subject.objects.create(
        code='CS-083',
        name='Computer Science',
        department='Computer Science',
        weekly_periods=6,
    )
    sub_math = Subject.objects.create(
        code='MATH-041',
        name='Mathematics',
        department='Mathematics',
        weekly_periods=6,
    )

    enrollment = Enrollment.objects.create(
        student=student,
        academic_year=ay,
        section=sec_11_a1,
    )

    ta_cs = TeachingAssignment.objects.create(
        faculty=faculty_a,
        section=sec_11_a1,
        subject=sub_cs,
        academic_year=ay,
    )

    return {
        'admin_user': admin_user,
        'principal_user': principal_user,
        'faculty_user_a': faculty_user_a,
        'faculty_a': faculty_a,
        'faculty_user_b': faculty_user_b,
        'faculty_b': faculty_b,
        'student_user': student_user,
        'student': student,
        'parent_user': parent_user,
        'parent': parent,
        'ay': ay,
        'class_11': class_11,
        'sec_11_a1': sec_11_a1,
        'sec_11_a2': sec_11_a2,
        'class_10': class_10,
        'sec_10_a': sec_10_a,
        'sub_cs': sub_cs,
        'sub_math': sub_math,
        'enrollment': enrollment,
        'ta_cs': ta_cs,
    }


def authenticate(client, user):
    token = str(RefreshToken.for_user(user).access_token)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


# ==========================================
# 1. ACADEMIC STRUCTURE RETRIEVAL & FILTERING
# ==========================================

@pytest.mark.django_db
def test_academic_years_list(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    res = api_client.get('/api/v1/academics/years/')
    assert res.status_code == status.HTTP_200_OK
    assert len(res.data['data']) >= 1
    assert res.data['data'][0]['name'] == '2026-2027'


@pytest.mark.django_db
def test_classes_hierarchy_list(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    res = api_client.get('/api/v1/academics/classes/')
    assert res.status_code == status.HTTP_200_OK
    classes = res.data['data']
    assert len(classes) >= 2
    # Verify grade level and sections are included
    g11 = next(c for c in classes if c['grade_level'] == 11)
    assert g11['stream'] == 'Computer Science A'
    assert len(g11['sections']) == 2


@pytest.mark.django_db
def test_sections_list_and_filtering(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    res = api_client.get('/api/v1/academics/sections/', {'class_id': str(task54_setup['class_11'].id)})
    assert res.status_code == status.HTTP_200_OK
    sections = res.data['data']
    assert len(sections) == 2
    assert all(s['grade_level'] == 11 for s in sections)


@pytest.mark.django_db
def test_subjects_list(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    res = api_client.get('/api/v1/academics/subjects/')
    assert res.status_code == status.HTTP_200_OK
    subjects = res.data['data']
    assert len(subjects) >= 2
    codes = [s['code'] for s in subjects]
    assert 'CS-083' in codes
    assert 'MATH-041' in codes


@pytest.mark.django_db
def test_enrollments_list(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    res = api_client.get('/api/v1/academics/enrollments/')
    assert res.status_code == status.HTTP_200_OK
    enrollments = res.data['data']
    assert len(enrollments) >= 1
    enr = enrollments[0]
    assert enr['student_id'] == 'STU202600001'
    assert enr['student_name'] == 'Arun Kumar'


# ==========================================
# 2. STUDENT SECTION ALLOCATION WORKFLOW
# ==========================================

@pytest.mark.django_db
def test_student_allocation_list_admin_and_principal(api_client, task54_setup):
    # Admin access
    authenticate(api_client, task54_setup['admin_user'])
    res = api_client.get('/api/v1/allocation/students/')
    assert res.status_code == status.HTTP_200_OK
    assert len(res.data['data']) >= 1

    # Principal access
    authenticate(api_client, task54_setup['principal_user'])
    res = api_client.get('/api/v1/allocation/students/')
    assert res.status_code == status.HTTP_200_OK
    assert len(res.data['data']) >= 1


@pytest.mark.django_db
def test_student_allocation_faculty_view_only(api_client, task54_setup):
    # Faculty can view allocation
    authenticate(api_client, task54_setup['faculty_user_a'])
    res = api_client.get('/api/v1/allocation/students/')
    assert res.status_code == status.HTTP_200_OK

    # Faculty CANNOT update allocation
    student_id = task54_setup['student'].student_id
    res_patch = api_client.patch(
        f'/api/v1/allocation/students/{student_id}/',
        {'section_id': str(task54_setup['sec_11_a2'].id)}
    )
    assert res_patch.status_code == status.HTTP_403_FORBIDDEN

    # Faculty CANNOT delete allocation
    res_del = api_client.delete(f'/api/v1/allocation/students/{student_id}/')
    assert res_del.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_student_allocation_student_parent_forbidden(api_client, task54_setup):
    # Student forbidden
    authenticate(api_client, task54_setup['student_user'])
    res = api_client.get('/api/v1/allocation/students/')
    assert res.status_code == status.HTTP_403_FORBIDDEN

    # Parent forbidden
    authenticate(api_client, task54_setup['parent_user'])
    res = api_client.get('/api/v1/allocation/students/')
    assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_student_allocation_update_by_admin(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    student = task54_setup['student']
    sec_a2 = task54_setup['sec_11_a2']

    res = api_client.patch(
        f'/api/v1/allocation/students/{student.student_id}/',
        {'section_id': str(sec_a2.id), 'roll_number': '11-A2-05'}
    )
    assert res.status_code == status.HTTP_200_OK
    assert res.data['data']['section_name'] == 'Section A2'
    assert res.data['data']['roll_number'] == '11-A2-05'

    # Verify database persistence
    task54_setup['enrollment'].refresh_from_db()
    assert task54_setup['enrollment'].section == sec_a2
    student.refresh_from_db()
    assert student.roll_number == '11-A2-05'


@pytest.mark.django_db
def test_student_allocation_update_by_principal(api_client, task54_setup):
    authenticate(api_client, task54_setup['principal_user'])
    student = task54_setup['student']
    sec_a2 = task54_setup['sec_11_a2']

    res = api_client.patch(
        f'/api/v1/allocation/students/{student.student_id}/',
        {'section_id': str(sec_a2.id), 'roll_number': '11-A2-09'}
    )
    assert res.status_code == status.HTTP_200_OK
    assert res.data['data']['section_name'] == 'Section A2'


@pytest.mark.django_db
def test_student_id_immutability(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    student = task54_setup['student']

    # Attempt to change student_id
    res = api_client.patch(
        f'/api/v1/allocation/students/{student.student_id}/',
        {'student_id': 'MALICIOUS_ID_999', 'roll_number': '11-A1-10'}
    )
    assert res.status_code == status.HTTP_200_OK
    assert res.data['data']['student_id'] == 'STU202600001'

    student.refresh_from_db()
    assert student.student_id == 'STU202600001'


@pytest.mark.django_db
def test_student_allocation_delete_unassigns_section(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    student = task54_setup['student']

    res = api_client.delete(f'/api/v1/allocation/students/{student.student_id}/')
    assert res.status_code == status.HTTP_200_OK
    assert res.data['data']['student_id'] == student.student_id
    assert res.data['data']['allocation_status'] == 'Unassigned'
    assert res.data['data']['section_name'] == '—'

    # Student record itself is NOT deleted; Student ID remains unchanged
    student.refresh_from_db()
    assert student.student_id == 'STU202600001'
    assert Student.objects.filter(student_id='STU202600001').exists() is True

    # Backend stored status is Unassigned (no semantic Withdrawn state)
    task54_setup['enrollment'].refresh_from_db()
    assert task54_setup['enrollment'].status == 'Unassigned'

    # Persistence after refresh/GET
    get_res = api_client.get('/api/v1/allocation/students/')
    assert get_res.status_code == status.HTTP_200_OK
    record = next(r for r in get_res.data['data'] if r['student_id'] == student.student_id)
    assert record['allocation_status'] == 'Unassigned'
    assert record['section_name'] == '—'
    assert record['status'] == 'Unassigned'
    assert record['section'] is None
    assert 'Withdrawn' not in str(record)


@pytest.mark.django_db
def test_student_allocation_delete_unassigns_section_by_principal(api_client, task54_setup):
    authenticate(api_client, task54_setup['principal_user'])
    student = task54_setup['student']

    res = api_client.delete(f'/api/v1/allocation/students/{student.student_id}/')
    assert res.status_code == status.HTTP_200_OK
    assert res.data['data']['student_id'] == student.student_id
    assert res.data['data']['allocation_status'] == 'Unassigned'
    assert res.data['data']['section_name'] == '—'

    # Persistence verification via GET for Principal
    get_res = api_client.get('/api/v1/allocation/students/')
    assert get_res.status_code == status.HTTP_200_OK
    record = next(r for r in get_res.data['data'] if r['student_id'] == student.student_id)
    assert record['allocation_status'] == 'Unassigned'
    assert record['section_name'] == '—'
    assert record['status'] == 'Unassigned'
    assert 'Withdrawn' not in str(record)


# ==========================================
# 3. CLASS TEACHER ALLOCATION WORKFLOW
# ==========================================

@pytest.mark.django_db
def test_class_teacher_allocation_list_admin_and_principal(api_client, task54_setup):
    # Admin access
    authenticate(api_client, task54_setup['admin_user'])
    res = api_client.get('/api/v1/allocation/class-teachers/')
    assert res.status_code == status.HTTP_200_OK
    assert len(res.data['data']) >= 3

    # Principal access
    authenticate(api_client, task54_setup['principal_user'])
    res = api_client.get('/api/v1/allocation/class-teachers/')
    assert res.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_class_teacher_allocation_faculty_view_only(api_client, task54_setup):
    authenticate(api_client, task54_setup['faculty_user_a'])
    res = api_client.get('/api/v1/allocation/class-teachers/')
    assert res.status_code == status.HTTP_200_OK

    sec_id = str(task54_setup['sec_11_a2'].id)
    # Faculty CANNOT update Class Teacher
    res_patch = api_client.patch(
        f'/api/v1/allocation/class-teachers/{sec_id}/',
        {'faculty_id': str(task54_setup['faculty_b'].id)}
    )
    assert res_patch.status_code == status.HTTP_403_FORBIDDEN

    # Faculty CANNOT delete Class Teacher
    res_del = api_client.delete(f'/api/v1/allocation/class-teachers/{sec_id}/')
    assert res_del.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_class_teacher_allocation_student_parent_forbidden(api_client, task54_setup):
    authenticate(api_client, task54_setup['student_user'])
    res = api_client.get('/api/v1/allocation/class-teachers/')
    assert res.status_code == status.HTTP_403_FORBIDDEN

    authenticate(api_client, task54_setup['parent_user'])
    res = api_client.get('/api/v1/allocation/class-teachers/')
    assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_class_teacher_allocation_update_by_admin(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    sec_a2 = task54_setup['sec_11_a2']
    faculty_b = task54_setup['faculty_b']

    res = api_client.patch(
        f'/api/v1/allocation/class-teachers/{sec_a2.id}/',
        {'faculty_id': str(faculty_b.id)}
    )
    assert res.status_code == status.HTTP_200_OK
    assert res.data['data']['faculty_name'] == 'Priya K'
    assert res.data['data']['assignment_status'] == 'Assigned'

    sec_a2.refresh_from_db()
    assert sec_a2.class_teacher == faculty_b


@pytest.mark.django_db
def test_class_teacher_allocation_update_by_principal(api_client, task54_setup):
    authenticate(api_client, task54_setup['principal_user'])
    sec_a2 = task54_setup['sec_11_a2']
    faculty_b = task54_setup['faculty_b']

    res = api_client.patch(
        f'/api/v1/allocation/class-teachers/{sec_a2.id}/',
        {'faculty_id': str(faculty_b.id)}
    )
    assert res.status_code == status.HTTP_200_OK
    assert res.data['data']['is_assigned'] is True


@pytest.mark.django_db
def test_class_teacher_one_per_academic_year_rule(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    # Faculty A is already Class Teacher for sec_11_a1 in 2026-2027.
    # Attempting to assign Faculty A as Class Teacher for sec_11_a2 MUST be rejected.
    sec_a2 = task54_setup['sec_11_a2']
    faculty_a = task54_setup['faculty_a']

    res = api_client.patch(
        f'/api/v1/allocation/class-teachers/{sec_a2.id}/',
        {'faculty_id': str(faculty_a.id)}
    )
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert 'already assigned as Class Teacher' in res.data['error']['message']


@pytest.mark.django_db
def test_class_teacher_allocation_delete_unassigns(api_client, task54_setup):
    authenticate(api_client, task54_setup['admin_user'])
    sec_a1 = task54_setup['sec_11_a1']

    res = api_client.delete(f'/api/v1/allocation/class-teachers/{sec_a1.id}/')
    assert res.status_code == status.HTTP_200_OK
    assert res.data['data']['is_assigned'] is False
    assert res.data['data']['assignment_status'] == 'Unassigned'

    sec_a1.refresh_from_db()
    assert sec_a1.class_teacher is None


# ==========================================
# 4. ACADEMIC MASTER DATA MUTATION RBAC
# ==========================================

@pytest.mark.django_db
def test_principal_and_faculty_cannot_mutate_academic_master_data(api_client, task54_setup):
    # Principal cannot create school classes
    authenticate(api_client, task54_setup['principal_user'])
    res_p = api_client.post('/api/v1/academics/classes/', {
        'name': 'Grade 12 - Computer Science',
        'code': 'G12-CS-NEW',
        'academic_year_id': str(task54_setup['ay'].id),
    }, format='json')
    assert res_p.status_code == status.HTTP_403_FORBIDDEN

    # Faculty cannot create school classes
    authenticate(api_client, task54_setup['faculty_user_a'])
    res_f = api_client.post('/api/v1/academics/classes/', {
        'name': 'Grade 12 - Computer Science',
        'code': 'G12-CS-NEW2',
        'academic_year_id': str(task54_setup['ay'].id),
    }, format='json')
    assert res_f.status_code == status.HTTP_403_FORBIDDEN


# ==========================================
# 5. TEACHING ASSIGNMENT NON-REGRESSION
# ==========================================

@pytest.mark.django_db
def test_class_teacher_cannot_enter_marks_for_unassigned_subject(api_client, task54_setup):
    """
    Suresh (Faculty A) is Class Teacher of XI-A1.
    Suresh has TeachingAssignment for Computer Science in XI-A1.
    Suresh DOES NOT have TeachingAssignment for Mathematics in XI-A1.
    Suresh MUST be rejected if attempting to enter marks for Mathematics.
    """
    authenticate(api_client, task54_setup['faculty_user_a'])
    exam_type = ExamType.objects.create(name='Mid-Term Examination')

    res = api_client.post('/api/v1/marks/bulk/', {
        'records': [{
            'student_id': str(task54_setup['student'].student_id),
            'subject_id': str(task54_setup['sub_math'].id),
            'exam_type_id': str(exam_type.id),
            'marks_obtained': '85.00',
            'max_marks': '100.00',
        }]
    }, format='json')
    assert res.status_code == status.HTTP_403_FORBIDDEN
