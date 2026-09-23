-- =============================================================================
-- Student ERP — PostgreSQL 16+ Relational Schema Blueprint
-- Status: Reference Design Specification (Phase 1)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles & Users
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(32) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    phone VARCHAR(32),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Parents, Students, Faculty
CREATE TABLE IF NOT EXISTS parents (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relation VARCHAR(32) NOT NULL,
    occupation VARCHAR(100),
    phone VARCHAR(32),
    email VARCHAR(254),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id VARCHAR(36) REFERENCES parents(id) ON DELETE SET NULL,
    admission_number VARCHAR(64) UNIQUE NOT NULL,
    roll_number VARCHAR(64) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(16) NOT NULL,
    blood_group VARCHAR(8),
    emergency_contact VARCHAR(32) NOT NULL,
    address TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculty (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_code VARCHAR(64) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    qualification VARCHAR(255),
    specialization TEXT,
    office_room VARCHAR(64),
    joining_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Academic Structure
CREATE TABLE IF NOT EXISTS academic_years (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(32) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(36) PRIMARY KEY,
    academic_year_id VARCHAR(36) NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sections (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(36) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(32) NOT NULL,
    room VARCHAR(64),
    capacity INTEGER NOT NULL DEFAULT 35,
    class_teacher_id VARCHAR(36) REFERENCES faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_class_section UNIQUE (class_id, name)
);

CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    section_id VARCHAR(36) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    academic_year_id VARCHAR(36) NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    enrolled_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(32) DEFAULT 'Enrolled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_academic_year UNIQUE (student_id, academic_year_id)
);

-- 4. Operations: Timetable, Attendance, Marks
CREATE TABLE IF NOT EXISTS timetables (
    id VARCHAR(36) PRIMARY KEY,
    section_id VARCHAR(36) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    faculty_id VARCHAR(36) NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    day_of_week VARCHAR(16) NOT NULL,
    period_number SMALLINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_section_slot UNIQUE (section_id, day_of_week, period_number),
    CONSTRAINT uq_faculty_slot UNIQUE (faculty_id, day_of_week, period_number)
);

CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(36) PRIMARY KEY,
    enrollment_id VARCHAR(36) NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    timetable_id VARCHAR(36) REFERENCES timetables(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    session_period SMALLINT,
    status VARCHAR(16) NOT NULL,
    remarks TEXT,
    recorded_by VARCHAR(36) REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(enrollment_id, date);

CREATE TABLE IF NOT EXISTS exam_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    weightage DECIMAL(5, 2) DEFAULT 100.00
);

CREATE TABLE IF NOT EXISTS marks (
    id VARCHAR(36) PRIMARY KEY,
    enrollment_id VARCHAR(36) NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    exam_type_id VARCHAR(36) NOT NULL REFERENCES exam_types(id) ON DELETE RESTRICT,
    marks_obtained DECIMAL(5, 2) NOT NULL,
    max_marks DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    grade VARCHAR(8) NOT NULL,
    remarks TEXT,
    evaluated_by VARCHAR(36) REFERENCES faculty(id) ON DELETE SET NULL,
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_marks_range CHECK (marks_obtained >= 0 AND marks_obtained <= max_marks)
);

-- 5. Audit & Events
CREATE TABLE IF NOT EXISTS calendar_events (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    target_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    location VARCHAR(255),
    is_holiday BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    target_table VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
