# PHASE 3 — TASK 3.3
# Core Database Models & PostgreSQL Schema Specification

**Project:** Student ERP — Enterprise Educational Management System  
**Phase:** Phase 3 (Backend Foundation + Database)  
**Task:** Task 3.3 (Core Database Models & PostgreSQL Schema)  
**Status:** **COMPLETED**  
**Prerequisites:** Task 3.1 completed + Task 3.2 completed and verified  

---

## 1. Task Objective

Design, implement, and migrate concrete 3NF relational database models across the core domain applications (`accounts`, `students`, and `academics`) adhering to `docs/DATABASE_SCHEMA.md` and `docs/DECISIONS.md`.

The implementation establishes:
1. Core entity models with UUID primary keys.
2. Relational integrity with explicit foreign key deletion behaviors (`RESTRICT`, `PROTECT`, `SET_NULL`, `CASCADE`).
3. Permanent, immutable, system-generated Student IDs (`STUYYYYNNNNN`) with mutation prevention.
4. Non-evaluative descriptive faculty staff profiles.
5. Indian school senior secondary academic structure with approved streams and weekly periods (university credits purged).
6. Initial migrations for `accounts`, `students`, and `academics`.
7. Comprehensive Pytest model validation test suite.

---

## 2. In Scope Deliverables

### 2.1 Identity & Access (`apps/accounts/models.py`)
- **`Role`**: UUID PK, unique name (`Admin`, `Principal`, `Faculty`, `Student`, `Parent`), description.
- **`User`**: Custom user model (`AbstractUser`), UUID PK, `AUTH_USER_MODEL = 'accounts.User'`, `role` FK (`RESTRICT`), unique email.
- **`Faculty`**: UUID PK, 1-to-1 to `User` (`CASCADE`), unique `employee_code`, department, designation, joining date, qualification, strictly descriptive profile (no evaluation ratings/grades).
- **`Parent`**: UUID PK, 1-to-1 to `User` (`CASCADE`), relation (`Father`, `Mother`, `Legal Guardian`), occupation, address.

### 2.2 Student Records (`apps/students/models.py`)
- **`Student`**: UUID PK, 1-to-1 to `User` (`CASCADE`), `parent` FK (`PROTECT`, nullable), permanent `student_id` (format `STUYYYYNNNNN`, regex validated, unique, immutable after creation raising `ImmutableFieldMutationError` on update), unique `admission_number`, `roll_number`, `date_of_birth`, `gender`, `blood_group`, `emergency_contact`, `address`, `status`.

### 2.3 Academics & Enrollment (`apps/academics/models.py`)
- **`AcademicYear`**: UUID PK, unique `name` (e.g. `2026-2027`), `start_date`, `end_date`, `is_current`.
- **`SchoolClass`**: UUID PK, `academic_year` FK (`PROTECT`), `name` (e.g. `Grade 11 - Computer Science`), `code`, unique together `(academic_year, code)`.
- **`Section`**: UUID PK, `school_class` FK (`CASCADE`), `name` (e.g. `A`, `B`), `room`, `class_teacher` FK (`SET_NULL`, nullable), unique together `(school_class, name)`.
- **`Subject`**: UUID PK, `name`, unique `code`, `department`, `weekly_periods` (integer default 5; university credits strictly purged), `is_elective`.
- **`Enrollment`**: UUID PK, `student` FK (`CASCADE`), `section` FK (`CASCADE`), `academic_year` FK (`CASCADE`), `enrolled_date`, `status`, unique together `(student, academic_year)`.

### 2.4 Database Migrations
- `apps/accounts/migrations/0001_initial.py`
- `apps/students/migrations/0001_initial.py`
- `apps/academics/migrations/0001_initial.py`
- `apps/academics/migrations/0002_initial.py`

### 2.5 Unit & Model Tests
- Authored `backend/tests/test_models_task33.py` verifying migration graph integrity, model constraints, UUID PKs, deletion behaviors, CBSE rules, and Student ID immutability.

---

## 3. Scope Boundaries & Deferred Items

- Attendance and Marks domain models belong strictly to Task 3.4.
- Database hardening and seed data belong to Task 3.5.
- REST API views and serializers belong to Task 3.6.
- Deferred domain apps (`timetable`, `calendar`, `allocation`, `reports`, `notifications`, `audit`) retain zero concrete models and zero migrations in Task 3.3.
- Authentication/login implementation belongs to Phase 4.
