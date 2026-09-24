/**
 * Student ERP — Mock Service Abstraction Layer
 * Provides clean async interfaces that load from synthetic mock-data datasets.
 * In future phases, these same interfaces are fulfilled by Django REST API clients.
 */

import type {
  User,
  Student,
  Parent,
  Faculty,
  ClassEntity,
  Subject,
  AttendanceRecord,
  AttendanceStatus,
  MarkRecord,
  TimetableSlot,
  CalendarEvent,
} from '@/types';

// Statically imported synthetic datasets ensuring zero network failure in mock mode
import usersData from '../../../mock-data/users.json';
import studentsData from '../../../mock-data/students.json';
import parentsData from '../../../mock-data/parents.json';
import facultyData from '../../../mock-data/faculty.json';
import classesData from '../../../mock-data/classes.json';
import subjectsData from '../../../mock-data/subjects.json';
import attendanceData from '../../../mock-data/attendance.json';
import marksData from '../../../mock-data/marks.json';
import timetableData from '../../../mock-data/timetable.json';
import eventsData from '../../../mock-data/events.json';

// Helper to simulate asynchronous service behavior (like a future API call)
const delay = (ms = 35) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// MASTER DOMAIN & PROTOTYPE INTERFACES
// ==========================================

export interface StudentDirectoryItem {
  id: string;
  admission_number: string;
  roll_number: string;
  name: string;
  class_name: string;
  gender: string;
  attendance_rate: number;
  gpa: number;
  parent_name: string;
  parent_contact: string;
  status: 'Active' | 'Inactive';
}

export interface FacultyDirectoryItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  assigned_classes: string[];
  workload_hours: number;
  rating: number;
  status: 'Active' | 'On Leave';
}

export interface ParentDirectoryItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  children: { id: string; name: string; class_name: string }[];
  address: string;
  status: 'Active' | 'Inactive';
}

export interface AllocationPreviewItem {
  student_id: string;
  student_name: string;
  current_grade: string;
  merit_rank: number;
  score: number;
  gender: string;
  allocated_section: string;
  status: 'Allocated' | 'Waitlisted';
}

export interface StudentAttendanceSessionLog {
  date: string;
  subject: string;
  period: string;
  status: AttendanceStatus;
  faculty: string;
  note?: string;
}

export interface StudentExamRecord {
  subject: string;
  code: string;
  exam: string;
  score: number;
  max: number;
  grade: string;
  credits: number;
  remarks: string;
}

export interface CalendarEventItem {
  title: string;
  category: string;
  date: string;
  time: string;
  venue?: string;
  location?: string;
  desc: string;
}

export interface ParentChildCardItem {
  name: string;
  grade: string;
  stream: string;
  rollNo: string;
  admNo: string;
  attendance: number;
  gpa: number;
  teacher: string;
  avatar: string;
}

export interface StudentAbsenceAdvisoryRecord {
  date: string;
  period: string;
  status: 'ABSENT' | 'LEAVE';
  faculty: string;
  note?: string;
}

export interface SubjectEvaluationRecord {
  subject: string;
  faculty: string;
  score: string;
  grade: string;
  remarks: string;
}

export interface FacultyTodayLectureItem {
  period: string;
  class: string;
  subject: string;
  room: string;
  students: number;
  attendanceDone: boolean;
}

export interface FacultyAssignedClassSummary {
  name: string;
  avgScore: string;
  studentCount: number;
  periodsPerWeek: number;
}

export interface FacultyGradeDistributionItem {
  grade: string;
  count: number;
}

export interface FacultyStudentGradeItem {
  roll: string;
  name: string;
  score: number;
  grade: string;
  feedback: string;
}

export interface FacultyTimetableSlotItem {
  period: string;
  class: string;
  subject: string;
  room: string;
  type: string;
}

export interface AdminClassSectionItem {
  name: string;
  stream: string;
  teacher: string;
  room: string;
  enrolled: number;
  capacity: number;
}

export interface AdminSubjectCatalogItem {
  code: string;
  name: string;
  department: string;
  credits: number;
  facultyCount: number;
  status: string;
}

export interface AdminAttendanceAuditRecord {
  date: string;
  class: string;
  total: number;
  present: number;
  onDuty: number;
  absent: number;
  leave: number;
  rate: string;
  verifiedBy: string;
}

export interface PrincipalAttendanceDistributionItem {
  status: AttendanceStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
  countsAs: 'Presence' | 'Absence';
  description: string;
}

export interface AdminExamSummaryRecord {
  class: string;
  exam: string;
  students: number;
  avg: string;
  highest: string;
  passRate: string;
}

export interface AdminMasterTimetableEntry {
  class: string;
  period1: string;
  period2: string;
  period3: string;
  period4: string;
}

export interface AdminCalendarNoticeItem {
  title: string;
  category: string;
  date: string;
  target: string;
  location?: string;
}

export interface PrincipalClassGpaItem {
  grade: string;
  gpa: number;
  passRate: number;
}

export interface PrincipalGradeAttendanceTrend {
  month: string;
  gr9: number;
  gr10: number;
  gr11: number;
  gr12: number;
}

export interface PrincipalReportItem {
  title: string;
  date: string;
  format: string;
  size: string;
  desc: string;
}

// ==========================================
// MOCK DATA SERVICE IMPLEMENTATION
// ==========================================

export class MockDataService {
  // 1. User & Identity Service
  static async getUsers(): Promise<User[]> {
    await delay();
    return usersData as unknown as User[];
  }

  static async getUserById(id: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find((u) => u.id === id);
  }

  static async getUserByRole(role: string): Promise<User[]> {
    const users = await this.getUsers();
    return users.filter((u) => u.role === role);
  }

  // 2. Students Service
  static async getStudents(): Promise<Student[]> {
    await delay();
    return studentsData as unknown as Student[];
  }

  static async getStudentById(id: string): Promise<Student | undefined> {
    const students = await this.getStudents();
    return students.find((s) => s.id === id);
  }

  static async getStudentByUserId(userId: string): Promise<Student | undefined> {
    const students = await this.getStudents();
    return students.find((s) => s.user_id === userId);
  }

  // Extended Student Directory
  static async getStudentDirectory(): Promise<StudentDirectoryItem[]> {
    await delay();
    return [
      {
        id: 'stu_001',
        admission_number: 'ADM-2024-0091',
        roll_number: 'CS2026-042',
        name: 'Alex Morgan',
        class_name: 'Grade 11 - Section A',
        gender: 'Non-Binary',
        attendance_rate: 94.2,
        gpa: 3.85,
        parent_name: 'Robert Morgan',
        parent_contact: '+1-555-0106',
        status: 'Active',
      },
      {
        id: 'stu_002',
        admission_number: 'ADM-2024-0092',
        roll_number: 'CS2026-043',
        name: 'Maya Patel',
        class_name: 'Grade 11 - Section A',
        gender: 'Female',
        attendance_rate: 97.5,
        gpa: 3.92,
        parent_name: 'Priya Patel',
        parent_contact: '+1-555-0107',
        status: 'Active',
      },
      {
        id: 'stu_003',
        admission_number: 'ADM-2024-0105',
        roll_number: 'CS2026-044',
        name: 'Rohan Gupta',
        class_name: 'Grade 11 - Section A',
        gender: 'Male',
        attendance_rate: 91.0,
        gpa: 3.65,
        parent_name: 'Rajiv Gupta',
        parent_contact: '+1-555-0112',
        status: 'Active',
      },
      {
        id: 'stu_004',
        admission_number: 'ADM-2024-0118',
        roll_number: 'CS2026-045',
        name: 'Chloe Bennett',
        class_name: 'Grade 11 - Section A',
        gender: 'Female',
        attendance_rate: 96.0,
        gpa: 3.78,
        parent_name: 'Catherine Bennett',
        parent_contact: '+1-555-0115',
        status: 'Active',
      },
      {
        id: 'stu_005',
        admission_number: 'ADM-2023-0044',
        roll_number: 'CS2025-012',
        name: 'Lucas Chen',
        class_name: 'Grade 12 - Section A',
        gender: 'Male',
        attendance_rate: 93.4,
        gpa: 3.88,
        parent_name: 'David Chen',
        parent_contact: '+1-555-0120',
        status: 'Active',
      },
      {
        id: 'stu_006',
        admission_number: 'ADM-2023-0051',
        roll_number: 'CS2025-019',
        name: 'Emily Davis',
        class_name: 'Grade 12 - Section A',
        gender: 'Female',
        attendance_rate: 89.2,
        gpa: 3.45,
        parent_name: 'Sarah Davis',
        parent_contact: '+1-555-0125',
        status: 'Active',
      },
      {
        id: 'stu_007',
        admission_number: 'ADM-2024-0130',
        roll_number: 'CS2026-050',
        name: 'Zara Khan',
        class_name: 'Grade 11 - Section B',
        gender: 'Female',
        attendance_rate: 98.1,
        gpa: 3.96,
        parent_name: 'Imran Khan',
        parent_contact: '+1-555-0132',
        status: 'Active',
      },
    ];
  }

  // 3. Student Contextual Services
  static async getStudentAttendanceHistory(_studentId?: string): Promise<StudentAttendanceSessionLog[]> {
    await delay();
    return [
      { date: '2026-02-16', subject: 'Mathematics', period: 'Period 1', status: 'PRESENT', faculty: 'Dr. Anita Desai' },
      { date: '2026-02-16', subject: 'Computer Science', period: 'Period 2', status: 'PRESENT', faculty: 'David Ross' },
      { date: '2026-02-15', subject: 'Physics', period: 'Period 3', status: 'ON_DUTY', faculty: 'Dr. Marcus Vance', note: 'State Science Olympiad Representation' },
      { date: '2026-02-14', subject: 'English', period: 'Period 4', status: 'PRESENT', faculty: 'Elena Rostova' },
      { date: '2026-02-13', subject: 'Physics Lab', period: 'Period 1', status: 'LEAVE', faculty: 'Dr. Marcus Vance', note: 'Medical leave approved by faculty' },
      { date: '2026-02-12', subject: 'Mathematics', period: 'Period 2', status: 'ABSENT', faculty: 'Dr. Anita Desai', note: 'Unreported absence' },
    ];
  }

  static async getStudentExamRecords(_studentId?: string): Promise<StudentExamRecord[]> {
    await delay();
    return [
      { subject: 'Advanced Mathematics', code: 'MATH101', exam: 'Midterm Examination', score: 92, max: 100, grade: 'A+', credits: 4, remarks: 'Distinction' },
      { subject: 'Computer Science (Data Structures)', code: 'CS102', exam: 'Midterm Examination', score: 98, max: 100, grade: 'A+', credits: 4, remarks: 'Class Highest' },
      { subject: 'Classical Physics & Mechanics', code: 'PHY101', exam: 'Midterm Examination', score: 85, max: 100, grade: 'A', credits: 4, remarks: 'Very Good' },
      { subject: 'English Composition & Literature', code: 'ENG101', exam: 'Midterm Examination', score: 89, max: 100, grade: 'A', credits: 4, remarks: 'Well Written' },
    ];
  }

  static async getAcademicCalendarEvents(_role?: string): Promise<CalendarEventItem[]> {
    await delay();
    return [
      { title: 'Term 1 Final Examination Series', category: 'Examination', date: 'March 15 - March 24, 2026', time: '09:00 AM - 12:00 PM', venue: 'Main Academic Halls', desc: 'Comprehensive cumulative examinations across all core curriculum subjects.' },
      { title: 'Spring Mid-Term Recess & Campus Closure', category: 'Holiday', date: 'March 25 - April 2, 2026', time: 'All Day', venue: 'Campus Wide', desc: 'Institutional spring break. Campus libraries and sports centers operate on holiday schedules.' },
      { title: 'Parent-Teacher Academic Conference', category: 'Academic', date: 'April 10, 2026', time: '01:00 PM - 05:00 PM', venue: 'Auditorium & Classrooms', desc: 'Individual parent consultations with subject faculty regarding Term 1 performance.' },
      { title: 'Inter-School STEM & Robotics Fair', category: 'Extracurricular', date: 'April 18, 2026', time: '10:00 AM - 04:00 PM', venue: 'STEM Innovation Center', desc: 'Student robotics exhibits and software showcases with university judges.' },
    ];
  }

  // 4. Parents Service
  static async getParents(): Promise<Parent[]> {
    await delay();
    return parentsData as unknown as Parent[];
  }

  static async getParentByUserId(userId: string): Promise<Parent | undefined> {
    const parents = await this.getParents();
    return parents.find((p) => p.user_id === userId);
  }

  static async getParentDirectory(): Promise<ParentDirectoryItem[]> {
    await delay();
    return [
      {
        id: 'par_001',
        name: 'Robert Morgan',
        email: 'robert.morgan@gmail.com',
        phone: '+1-555-0106',
        children: [{ id: 'stu_001', name: 'Alex Morgan', class_name: 'Grade 11 - Section A' }],
        address: '742 Evergreen Terrace, Springfield',
        status: 'Active',
      },
      {
        id: 'par_002',
        name: 'Priya Patel',
        email: 'priya.patel@gmail.com',
        phone: '+1-555-0107',
        children: [{ id: 'stu_002', name: 'Maya Patel', class_name: 'Grade 11 - Section A' }],
        address: '124 Conch Street, Springfield',
        status: 'Active',
      },
      {
        id: 'par_003',
        name: 'Rajiv Gupta',
        email: 'rajiv.gupta@outlook.com',
        phone: '+1-555-0112',
        children: [{ id: 'stu_003', name: 'Rohan Gupta', class_name: 'Grade 11 - Section A' }],
        address: '45 Elm Street, Springfield',
        status: 'Active',
      },
      {
        id: 'par_004',
        name: 'Catherine Bennett',
        email: 'c.bennett@example.com',
        phone: '+1-555-0115',
        children: [{ id: 'stu_004', name: 'Chloe Bennett', class_name: 'Grade 11 - Section A' }],
        address: '88 Oak Avenue, Springfield',
        status: 'Active',
      },
      {
        id: 'par_005',
        name: 'David Chen',
        email: 'david.chen@gmail.com',
        phone: '+1-555-0120',
        children: [{ id: 'stu_005', name: 'Lucas Chen', class_name: 'Grade 12 - Section A' }],
        address: '12 Maple Boulevard, Springfield',
        status: 'Active',
      },
    ];
  }

  static async getParentChildrenCards(_parentId?: string): Promise<ParentChildCardItem[]> {
    await delay();
    return [
      {
        name: 'Alex Morgan',
        grade: 'Grade 11 - Section A',
        stream: 'Science & Technology',
        rollNo: 'CS2026-042',
        admNo: 'ADM-2024-0091',
        attendance: 94.2,
        gpa: 3.85,
        teacher: 'Dr. Anita Desai',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      },
      {
        name: 'Leo Morgan',
        grade: 'Grade 8 - Section B',
        stream: 'Middle School Standard',
        rollNo: 'MS2028-019',
        admNo: 'ADM-2022-0144',
        attendance: 96.5,
        gpa: 3.90,
        teacher: 'Mr. Paul Higgins',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      },
    ];
  }

  static async getStudentAbsenceLogs(_studentId?: string): Promise<StudentAbsenceAdvisoryRecord[]> {
    await delay();
    return [
      { date: '2026-02-13', period: 'Full Day', status: 'LEAVE', faculty: 'Office Registrar', note: 'Medical certificate approved by class faculty' },
      { date: '2026-02-12', period: 'Period 2 (Mathematics)', status: 'ABSENT', faculty: 'Dr. Anita Desai', note: 'Unapproved absence — excuse submission required' },
    ];
  }

  static async getParentStudentEvaluations(_studentId?: string): Promise<SubjectEvaluationRecord[]> {
    await delay();
    return [
      { subject: 'Mathematics', faculty: 'Dr. Anita Desai', score: '92/100', grade: 'A+', remarks: 'Exceptional analytical thinking in calculus.' },
      { subject: 'Computer Science', faculty: 'David Ross', score: '98/100', grade: 'A+', remarks: 'Outstanding algorithm development. Top of section.' },
      { subject: 'Physics', faculty: 'Dr. Marcus Vance', score: '85/100', grade: 'A', remarks: 'Consistent effort in mechanics laboratory sessions.' },
    ];
  }

  static async getParentCalendarEvents(): Promise<CalendarEventItem[]> {
    await delay();
    return [
      { title: 'Term 1 Parent-Teacher Academic Consultations', date: 'April 10, 2026', time: '01:00 PM - 05:00 PM', location: 'Main Auditorium', category: 'Conference', desc: '10-minute 1-on-1 progress reviews with subject faculty. Appointment booking open.' },
      { title: 'Spring Mid-Term Recess (School Closed)', date: 'March 25 - April 2, 2026', time: 'All Day', location: 'Campus Closed', category: 'Holiday', desc: 'School closed for spring vacation. All academic instruction resumes on April 3.' },
      { title: 'Final Term Examination Series', date: 'March 15 - March 24, 2026', time: '08:30 AM - 12:30 PM', location: 'Examination Halls', category: 'Examination', desc: 'Comprehensive final testing for Grade 11. Early dismissal daily at 12:45 PM.' },
      { title: 'Annual School Science & Arts Exhibition', date: 'April 25, 2026', time: '09:00 AM - 02:00 PM', location: 'School Grounds', category: 'Event', desc: 'Parents and guardians warmly invited to view student exhibits and musical performances.' },
    ];
  }

  // 5. Faculty Service
  static async getFaculty(): Promise<Faculty[]> {
    await delay();
    return facultyData as unknown as Faculty[];
  }

  static async getFacultyByUserId(userId: string): Promise<Faculty | undefined> {
    const faculty = await this.getFaculty();
    return faculty.find((f) => f.user_id === userId);
  }

  static async getFacultyDirectory(): Promise<FacultyDirectoryItem[]> {
    await delay();
    return [
      {
        id: 'fac_001',
        name: 'Dr. Anita Desai',
        email: 'anita.desai@studenterp.edu',
        phone: '+1-555-0102',
        department: 'Mathematics',
        designation: 'Senior Faculty & Dept Head',
        assigned_classes: ['Grade 11-A', 'Grade 12-A'],
        workload_hours: 18,
        rating: 4.9,
        status: 'Active',
      },
      {
        id: 'fac_002',
        name: 'David Ross',
        email: 'david.ross@studenterp.edu',
        phone: '+1-555-0103',
        department: 'Computer Science',
        designation: 'Associate Professor',
        assigned_classes: ['Grade 11-A', 'Grade 12-A'],
        workload_hours: 20,
        rating: 4.8,
        status: 'Active',
      },
      {
        id: 'fac_003',
        name: 'Dr. Marcus Vance',
        email: 'marcus.vance@studenterp.edu',
        phone: '+1-555-0114',
        department: 'Physics',
        designation: 'Professor',
        assigned_classes: ['Grade 11-A', 'Grade 11-B'],
        workload_hours: 16,
        rating: 4.7,
        status: 'Active',
      },
      {
        id: 'fac_004',
        name: 'Elena Rostova',
        email: 'elena.rostova@studenterp.edu',
        phone: '+1-555-0118',
        department: 'Humanities & English',
        designation: 'Assistant Professor',
        assigned_classes: ['Grade 11-A', 'Grade 10-A'],
        workload_hours: 18,
        rating: 4.85,
        status: 'Active',
      },
    ];
  }

  static async getFacultyTodayLectures(_facultyId?: string): Promise<FacultyTodayLectureItem[]> {
    await delay();
    return [
      { period: 'Period 1 (08:30 - 09:20)', class: 'Grade 11-A', subject: 'Mathematics (Calculus)', room: 'Room 101', students: 32, attendanceDone: true },
      { period: 'Period 2 (09:30 - 10:20)', class: 'Grade 12-A', subject: 'Advanced Calculus', room: 'Room 104', students: 28, attendanceDone: false },
      { period: 'Period 4 (11:40 - 12:30)', class: 'Grade 10-B', subject: 'Foundations of Algebra', room: 'Room 202', students: 28, attendanceDone: false },
    ];
  }

  static async getFacultyAssignedClassesSummary(_facultyId?: string): Promise<FacultyAssignedClassSummary[]> {
    await delay();
    return [
      { name: 'Grade 11 - Section A', avgScore: '84.5%', studentCount: 32, periodsPerWeek: 4 },
      { name: 'Grade 12 - Section A', avgScore: '88.2%', studentCount: 28, periodsPerWeek: 5 },
      { name: 'Grade 10 - Section B', avgScore: '79.8%', studentCount: 28, periodsPerWeek: 4 },
    ];
  }

  static async getFacultyGradeDistribution(_classId?: string): Promise<FacultyGradeDistributionItem[]> {
    await delay();
    return [
      { grade: 'A+ (90-100)', count: 8 },
      { grade: 'A (80-89)', count: 14 },
      { grade: 'B (70-79)', count: 7 },
      { grade: 'C (60-69)', count: 3 },
    ];
  }

  static async getFacultyClassGrades(_classId?: string): Promise<FacultyStudentGradeItem[]> {
    await delay();
    return [
      { roll: 'CS2026-042', name: 'Alex Morgan', score: 92, grade: 'A+', feedback: 'Superb calculus proof structure.' },
      { roll: 'CS2026-043', name: 'Maya Patel', score: 98, grade: 'A+', feedback: 'Flawless score on derivatives.' },
      { roll: 'CS2026-044', name: 'Rohan Gupta', score: 84, grade: 'A', feedback: 'Consistent numerical precision.' },
      { roll: 'CS2026-045', name: 'Chloe Bennett', score: 88, grade: 'A', feedback: 'Good comprehension of limits.' },
    ];
  }

  static async getFacultyTimetableSlots(_facultyId?: string): Promise<FacultyTimetableSlotItem[]> {
    await delay();
    return [
      { period: 'Period 1 (08:30 - 09:20)', class: 'Grade 11-A', subject: 'Mathematics (Calculus)', room: 'Room 101', type: 'Lecture' },
      { period: 'Period 2 (09:30 - 10:20)', class: 'Grade 12-A', subject: 'Advanced Calculus', room: 'Room 104', type: 'Lecture' },
      { period: 'Period 3 (10:40 - 11:30)', class: '—', subject: 'Office Hours & Student Advisory', room: 'Faculty Room 101-B', type: 'Advisory' },
      { period: 'Period 4 (11:40 - 12:30)', class: 'Grade 10-B', subject: 'Foundations of Algebra', room: 'Room 202', type: 'Lecture' },
    ];
  }

  // 6. Admin Service
  static async getClassSections(): Promise<AdminClassSectionItem[]> {
    await delay();
    return [
      { name: 'Grade 11 - Section A', stream: 'Science & Technology', teacher: 'Dr. Anita Desai', room: 'Room 101', enrolled: 32, capacity: 35 },
      { name: 'Grade 11 - Section B', stream: 'Commerce & Economics', teacher: 'Dr. Marcus Vance', room: 'Room 102', enrolled: 34, capacity: 35 },
      { name: 'Grade 12 - Section A', stream: 'Science & Technology', teacher: 'David Ross', room: 'Room 104', enrolled: 28, capacity: 30 },
      { name: 'Grade 10 - Section A', stream: 'Secondary Core', teacher: 'Elena Rostova', room: 'Room 201', enrolled: 30, capacity: 30 },
      { name: 'Grade 10 - Section B', stream: 'Secondary Core', teacher: 'Paul Higgins', room: 'Room 202', enrolled: 28, capacity: 30 },
    ];
  }

  static async getSubjectsCatalog(): Promise<AdminSubjectCatalogItem[]> {
    await delay();
    return [
      { code: 'MATH101', name: 'Advanced Mathematics & Calculus', department: 'Mathematics', credits: 4, facultyCount: 4, status: 'Active' },
      { code: 'CS102', name: 'Computer Science (Data Structures & Python)', department: 'Computer Science', credits: 4, facultyCount: 3, status: 'Active' },
      { code: 'PHY101', name: 'Classical Mechanics & Physics Lab', department: 'Physics', credits: 4, facultyCount: 3, status: 'Active' },
      { code: 'ENG101', name: 'English Literature & Composition', department: 'Humanities', credits: 3, facultyCount: 4, status: 'Active' },
      { code: 'CHEM101', name: 'General Chemistry & Laboratory', department: 'Chemistry', credits: 4, facultyCount: 2, status: 'Active' },
    ];
  }

  static async getAttendanceAuditLogs(): Promise<AdminAttendanceAuditRecord[]> {
    await delay();
    return [
      { date: '2026-02-16', class: 'Grade 11-A', total: 32, present: 28, onDuty: 2, absent: 1, leave: 1, rate: '93.8%', verifiedBy: 'Dr. Anita Desai' },
      { date: '2026-02-16', class: 'Grade 11-B', total: 34, present: 31, onDuty: 2, absent: 1, leave: 0, rate: '97.1%', verifiedBy: 'Dr. Marcus Vance' },
      { date: '2026-02-16', class: 'Grade 12-A', total: 28, present: 25, onDuty: 2, absent: 0, leave: 1, rate: '96.4%', verifiedBy: 'David Ross' },
      { date: '2026-02-16', class: 'Grade 10-A', total: 30, present: 27, onDuty: 2, absent: 1, leave: 0, rate: '96.7%', verifiedBy: 'Elena Rostova' },
    ];
  }

  static async getExamSummaries(): Promise<AdminExamSummaryRecord[]> {
    await delay();
    return [
      { class: 'Grade 11 - Section A', exam: 'Midterm 2025', students: 32, avg: '84.5%', highest: '98%', passRate: '96.8%' },
      { class: 'Grade 11 - Section B', exam: 'Midterm 2025', students: 34, avg: '81.2%', highest: '95%', passRate: '94.1%' },
      { class: 'Grade 12 - Section A', exam: 'Midterm 2025', students: 28, avg: '88.2%', highest: '100%', passRate: '100%' },
      { class: 'Grade 10 - Section A', exam: 'Midterm 2025', students: 30, avg: '79.5%', highest: '94%', passRate: '93.3%' },
    ];
  }

  static async getMasterTimetableEntries(): Promise<AdminMasterTimetableEntry[]> {
    await delay();
    return [
      { class: 'Grade 11-A', period1: 'Mathematics (Room 101)', period2: 'Computer Science (Lab 2)', period3: 'Physics (Room 203)', period4: 'English (Room 101)' },
      { class: 'Grade 12-A', period1: 'Physics (Room 203)', period2: 'Mathematics (Room 104)', period3: 'Chemistry (Chem Lab 1)', period4: 'Computer Science (Lab 2)' },
    ];
  }

  static async getCalendarNotices(): Promise<AdminCalendarNoticeItem[]> {
    await delay();
    return [
      { title: 'Term 1 Final Examination Window', category: 'Examination', date: 'March 15 - 24, 2026', target: 'All Students & Faculty • Main Academic Hall' },
      { title: 'Spring Break Recess', category: 'Campus Holiday', date: 'March 25 - April 2, 2026', target: 'Campus Wide • Administrative Offices on reduced hours' },
    ];
  }

  static async getAllocationPreview(): Promise<AllocationPreviewItem[]> {
    await delay();
    return [
      { student_id: 'stu_001', student_name: 'Alex Morgan', current_grade: 'Grade 10', merit_rank: 4, score: 96.5, gender: 'Non-Binary', allocated_section: 'Section 11-A (Science/Tech)', status: 'Allocated' },
      { student_id: 'stu_002', student_name: 'Maya Patel', current_grade: 'Grade 10', merit_rank: 1, score: 98.2, gender: 'Female', allocated_section: 'Section 11-A (Science/Tech)', status: 'Allocated' },
      { student_id: 'stu_003', student_name: 'Rohan Gupta', current_grade: 'Grade 10', merit_rank: 12, score: 88.0, gender: 'Male', allocated_section: 'Section 11-A (Science/Tech)', status: 'Allocated' },
      { student_id: 'stu_004', student_name: 'Chloe Bennett', current_grade: 'Grade 10', merit_rank: 8, score: 91.4, gender: 'Female', allocated_section: 'Section 11-B (Commerce)', status: 'Allocated' },
      { student_id: 'stu_007', student_name: 'Zara Khan', current_grade: 'Grade 10', merit_rank: 2, score: 97.8, gender: 'Female', allocated_section: 'Section 11-A (Science/Tech)', status: 'Allocated' },
      { student_id: 'stu_008', student_name: 'Ethan Hunt', current_grade: 'Grade 10', merit_rank: 29, score: 79.5, gender: 'Male', allocated_section: 'Section 11-B (Commerce)', status: 'Waitlisted' },
    ];
  }

  // 7. Principal Service
  static async getClassGpaComparisons(): Promise<PrincipalClassGpaItem[]> {
    await delay();
    return [
      { grade: 'Grade 9', gpa: 3.52, passRate: 93.4 },
      { grade: 'Grade 10', gpa: 3.58, passRate: 94.1 },
      { grade: 'Grade 11', gpa: 3.72, passRate: 96.8 },
      { grade: 'Grade 12', gpa: 3.78, passRate: 98.2 },
    ];
  }

  static async getGradeAttendanceTrends(): Promise<PrincipalGradeAttendanceTrend[]> {
    await delay();
    return [
      { month: 'Oct', gr9: 94.2, gr10: 95.1, gr11: 96.0, gr12: 96.8 },
      { month: 'Nov', gr9: 91.5, gr10: 93.0, gr11: 94.2, gr12: 95.5 },
      { month: 'Dec', gr9: 93.8, gr10: 94.5, gr11: 95.8, gr12: 96.2 },
      { month: 'Jan', gr9: 95.0, gr10: 95.8, gr11: 96.5, gr12: 97.4 },
    ];
  }

  static async getPrincipalAttendanceDistribution(): Promise<PrincipalAttendanceDistributionItem[]> {
    await delay();
    return [
      { status: 'PRESENT', label: 'Present', count: 1120, percentage: 90.3, color: '#10b981', countsAs: 'Presence', description: 'In-person lecture presence' },
      { status: 'ON_DUTY', label: 'On Duty', count: 48, percentage: 3.9, color: '#3b82f6', countsAs: 'Presence', description: 'Institutional duty representation (counts as present)' },
      { status: 'LEAVE', label: 'Approved Leave', count: 42, percentage: 3.4, color: '#8b5cf6', countsAs: 'Absence', description: 'Faculty-approved leave (counts in absence denominator)' },
      { status: 'ABSENT', label: 'Unapproved Absent', count: 30, percentage: 2.4, color: '#f43f5e', countsAs: 'Absence', description: 'Unapproved absence' },
    ];
  }

  static async getReportMetadata(): Promise<PrincipalReportItem[]> {
    await delay();
    return [
      { title: 'Annual Institutional Review & Accreditation Dossier', date: 'Session 2025-2026', format: 'PDF', size: '4.8 MB', desc: 'Comprehensive governance report including financial stewardship, retention, and student outcomes.' },
      { title: 'Board Examination Performance & State Benchmarking', date: 'Term 1 Analysis', format: 'PDF', size: '2.4 MB', desc: 'Comparative examination analytics against regional and national academic standards.' },
      { title: 'Faculty Workload, Publications & Development Audit', date: 'Annual 2025', format: 'PDF', size: '1.9 MB', desc: 'Appraisal records, peer reviews, research publications, and professional training milestones.' },
      { title: 'School-Wide Attendance & Student Retention Audit', date: 'Monthly Audit', format: 'XLSX', size: '850 KB', desc: 'Granular attendance registry across all grades, absence reasons, and counselor interventions.' },
    ];
  }

  // 8. General Analytics & Classes
  static async getClasses(): Promise<ClassEntity[]> {
    await delay();
    return classesData as unknown as ClassEntity[];
  }

  static async getClassById(id: string): Promise<ClassEntity | undefined> {
    const classes = await this.getClasses();
    return classes.find((c) => c.id === id);
  }

  static async getSubjects(): Promise<Subject[]> {
    await delay();
    return subjectsData as unknown as Subject[];
  }

  static async getAttendance(studentId?: string): Promise<AttendanceRecord[]> {
    await delay();
    const records = attendanceData as unknown as AttendanceRecord[];
    if (studentId) {
      return records.filter((r) => r.student_id === studentId);
    }
    return records;
  }

  static async getMonthlyAttendanceTrend(): Promise<{ month: string; attendance: number; target: number }[]> {
    await delay();
    return [
      { month: 'Aug', attendance: 96.2, target: 90 },
      { month: 'Sep', attendance: 93.8, target: 90 },
      { month: 'Oct', attendance: 95.5, target: 90 },
      { month: 'Nov', attendance: 92.1, target: 90 },
      { month: 'Dec', attendance: 94.2, target: 90 },
      { month: 'Jan', attendance: 95.8, target: 90 },
    ];
  }

  static async getSubjectAttendance(): Promise<{ subject: string; present: number; total: number; percentage: number }[]> {
    await delay();
    return [
      { subject: 'Mathematics', present: 24, total: 25, percentage: 96 },
      { subject: 'Computer Science', present: 20, total: 20, percentage: 100 },
      { subject: 'Physics', present: 21, total: 24, percentage: 87.5 },
      { subject: 'English', present: 19, total: 20, percentage: 95 },
    ];
  }

  static async getMarks(studentId?: string): Promise<MarkRecord[]> {
    await delay();
    const marks = marksData as unknown as MarkRecord[];
    if (studentId) {
      return marks.filter((m) => m.student_id === studentId);
    }
    return marks;
  }

  static async getSubjectMarksComparison(): Promise<{ subject: string; studentScore: number; classAverage: number; maxScore: number }[]> {
    await delay();
    return [
      { subject: 'Mathematics', studentScore: 92, classAverage: 78, maxScore: 100 },
      { subject: 'Computer Science', studentScore: 98, classAverage: 82, maxScore: 100 },
      { subject: 'Physics', studentScore: 85, classAverage: 74, maxScore: 100 },
      { subject: 'English', studentScore: 89, classAverage: 81, maxScore: 100 },
    ];
  }

  static async getTimetable(classId?: string, facultyId?: string): Promise<TimetableSlot[]> {
    await delay();
    const slots = timetableData as unknown as TimetableSlot[];
    if (classId) {
      return slots.filter((t) => t.class_id === classId);
    }
    if (facultyId) {
      return slots.filter((t) => t.faculty_id === facultyId);
    }
    return slots;
  }

  static async getWeeklyTimetableGrid() {
    await delay();
    return [
      {
        day: 'Monday',
        periods: [
          { period: 'Period 1 (08:30 - 09:20)', subject: 'Mathematics', teacher: 'Dr. Anita Desai', room: 'Room 101', type: 'Lecture' },
          { period: 'Period 2 (09:30 - 10:20)', subject: 'Computer Science', teacher: 'David Ross', room: 'Lab 2', type: 'Lab' },
          { period: 'Period 3 (10:40 - 11:30)', subject: 'Physics', teacher: 'Dr. Marcus Vance', room: 'Room 203', type: 'Lecture' },
          { period: 'Period 4 (11:40 - 12:30)', subject: 'English', teacher: 'Elena Rostova', room: 'Room 101', type: 'Lecture' },
          { period: 'Period 5 (01:15 - 02:05)', subject: 'Physical Education', teacher: 'Coach Miller', room: 'Field', type: 'Activity' },
        ],
      },
      {
        day: 'Tuesday',
        periods: [
          { period: 'Period 1 (08:30 - 09:20)', subject: 'Physics Lab', teacher: 'Dr. Marcus Vance', room: 'Physics Lab', type: 'Lab' },
          { period: 'Period 2 (09:30 - 10:20)', subject: 'Mathematics', teacher: 'Dr. Anita Desai', room: 'Room 101', type: 'Lecture' },
          { period: 'Period 3 (10:40 - 11:30)', subject: 'Computer Science', teacher: 'David Ross', room: 'Room 101', type: 'Lecture' },
          { period: 'Period 4 (11:40 - 12:30)', subject: 'Library & Research', teacher: 'Elena Rostova', room: 'Central Library', type: 'Self Study' },
          { period: 'Period 5 (01:15 - 02:05)', subject: 'Chemistry', teacher: 'Dr. Aris Thorne', room: 'Room 204', type: 'Lecture' },
        ],
      },
      {
        day: 'Wednesday',
        periods: [
          { period: 'Period 1 (08:30 - 09:20)', subject: 'English Literature', teacher: 'Elena Rostova', room: 'Room 101', type: 'Lecture' },
          { period: 'Period 2 (09:30 - 10:20)', subject: 'Advanced CS Project', teacher: 'David Ross', room: 'Lab 2', type: 'Lab' },
          { period: 'Period 3 (10:40 - 11:30)', subject: 'Mathematics Seminar', teacher: 'Dr. Anita Desai', room: 'Room 101', type: 'Seminar' },
          { period: 'Period 4 (11:40 - 12:30)', subject: 'Physics', teacher: 'Dr. Marcus Vance', room: 'Room 203', type: 'Lecture' },
          { period: 'Period 5 (01:15 - 02:05)', subject: 'Extracurricular Club', teacher: 'Various', room: 'Auditorium', type: 'Activity' },
        ],
      },
      {
        day: 'Thursday',
        periods: [
          { period: 'Period 1 (08:30 - 09:20)', subject: 'Computer Science', teacher: 'David Ross', room: 'Lab 2', type: 'Lecture' },
          { period: 'Period 2 (09:30 - 10:20)', subject: 'Mathematics', teacher: 'Dr. Anita Desai', room: 'Room 101', type: 'Lecture' },
          { period: 'Period 3 (10:40 - 11:30)', subject: 'English', teacher: 'Elena Rostova', room: 'Room 101', type: 'Lecture' },
          { period: 'Period 4 (11:40 - 12:30)', subject: 'Chemistry Lab', teacher: 'Dr. Aris Thorne', room: 'Chem Lab 1', type: 'Lab' },
          { period: 'Period 5 (01:15 - 02:05)', subject: 'Guidance & Advisory', teacher: 'Dr. Anita Desai', room: 'Room 101', type: 'Mentorship' },
        ],
      },
      {
        day: 'Friday',
        periods: [
          { period: 'Period 1 (08:30 - 09:20)', subject: 'Physics Problem Solving', teacher: 'Dr. Marcus Vance', room: 'Room 203', type: 'Lecture' },
          { period: 'Period 2 (09:30 - 10:20)', subject: 'Mathematics Quiz', teacher: 'Dr. Anita Desai', room: 'Room 101', type: 'Evaluation' },
          { period: 'Period 3 (10:40 - 11:30)', subject: 'Computer Science Lab', teacher: 'David Ross', room: 'Lab 2', type: 'Lab' },
          { period: 'Period 4 (11:40 - 12:30)', subject: 'Weekly Assembly', teacher: 'Principal Sharma', room: 'Main Hall', type: 'Assembly' },
          { period: 'Period 5 (01:15 - 02:05)', subject: 'Sports & Wellness', teacher: 'Coach Miller', room: 'Gymnasium', type: 'Activity' },
        ],
      },
    ];
  }

  static async getEvents(role?: string): Promise<CalendarEvent[]> {
    await delay();
    const events = eventsData as unknown as CalendarEvent[];
    if (role) {
      return events.filter((e) => e.target_roles.includes(role as any));
    }
    return events;
  }

  static async getSchoolKPIs() {
    await delay();
    return {
      total_students: 1248,
      total_faculty: 78,
      active_classes: 24,
      overall_attendance_rate: 95.1,
      school_gpa_average: 3.64,
      student_teacher_ratio: '16:1',
      accreditation_standing: 'Tier 1 Exemplary',
    };
  }

  static async getDepartmentalPerformance() {
    await delay();
    return [
      { department: 'Computer Science', passRate: 98.5, gpaAvg: 3.82, facultyCount: 14, completionRate: 94 },
      { department: 'Mathematics', passRate: 94.2, gpaAvg: 3.65, facultyCount: 18, completionRate: 92 },
      { department: 'Physics & Sciences', passRate: 92.0, gpaAvg: 3.58, facultyCount: 20, completionRate: 88 },
      { department: 'Humanities & Languages', passRate: 96.8, gpaAvg: 3.74, facultyCount: 16, completionRate: 95 },
      { department: 'Commerce & Economics', passRate: 91.5, gpaAvg: 3.52, facultyCount: 10, completionRate: 90 },
    ];
  }
}
