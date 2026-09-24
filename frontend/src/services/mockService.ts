/**
 * Student ERP — Mock Service Abstraction Layer
 * Provides clean async interfaces loading from synthetic Indian school datasets.
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
  student_id: string;
  admission_number: string;
  roll_number: string;
  name: string;
  class_name: string;
  stream?: string;
  gender: string;
  attendance_rate: number;
  percentage: number;
  grade: string;
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
  workload_hours: number; // Weekly periods/workload
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
  percentage: number;
  grade: string;
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
  student_id: string;
  grade: string;
  stream: string;
  rollNo: string;
  admNo: string;
  attendance: number;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  gradeValue: string;
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
  score: number | 'AB';
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
  weekly_periods: number;
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

export interface PrincipalClassAcademicItem {
  grade: string;
  academicAverage: number;
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

export interface PrincipalKPIs {
  total_students: number;
  total_faculty: number;
  active_classes: number;
  overall_attendance_rate: number;
  overall_academic_percentage: number;
  student_teacher_ratio: string;
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
    return students.find((s) => s.id === id || s.student_id === id);
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
        id: 'STU202600001',
        student_id: 'STU202600001',
        admission_number: 'ADM20240091',
        roll_number: '11-A2-04',
        name: 'Arun Kumar',
        class_name: 'Grade 11 - Section A2',
        stream: 'Computer Science A',
        gender: 'Male',
        attendance_rate: 94.3,
        percentage: 87.0,
        grade: 'A2',
        parent_name: 'S. Ramanathan',
        parent_contact: '+91-98400-11207',
        status: 'Active',
      },
      {
        id: 'STU202600002',
        student_id: 'STU202600002',
        admission_number: 'ADM20240092',
        roll_number: '11-A2-18',
        name: 'Priya S',
        class_name: 'Grade 11 - Section A2',
        stream: 'Computer Science A',
        gender: 'Female',
        attendance_rate: 97.5,
        percentage: 88.0,
        grade: 'A2',
        parent_name: 'M. Selvam',
        parent_contact: '+91-98400-11208',
        status: 'Active',
      },
      {
        id: 'STU202600003',
        student_id: 'STU202600003',
        admission_number: 'ADM20240093',
        roll_number: '12-C1-08',
        name: 'Rahul Raj',
        class_name: 'Grade 12 - Section C1',
        stream: 'Commerce C',
        gender: 'Male',
        attendance_rate: 91.0,
        percentage: 82.5,
        grade: 'A2',
        parent_name: 'Rajesh Raj',
        parent_contact: '+91-98400-11212',
        status: 'Active',
      },
      {
        id: 'STU202600004',
        student_id: 'STU202600004',
        admission_number: 'ADM20240094',
        roll_number: '10-A-12',
        name: 'Keerthana M',
        class_name: 'Grade 10 - Section A',
        gender: 'Female',
        attendance_rate: 96.0,
        percentage: 91.2,
        grade: 'A1',
        parent_name: 'Murugan K',
        parent_contact: '+91-98400-11215',
        status: 'Active',
      },
      {
        id: 'STU202600005',
        student_id: 'STU202600005',
        admission_number: 'ADM20240095',
        roll_number: '11-B1-06',
        name: 'Aditya Sharma',
        class_name: 'Grade 11 - Section B1',
        stream: 'Bio-Maths B',
        gender: 'Male',
        attendance_rate: 93.4,
        percentage: 85.0,
        grade: 'A2',
        parent_name: 'Sunil Sharma',
        parent_contact: '+91-98400-11220',
        status: 'Active',
      },
      {
        id: 'STU202600006',
        student_id: 'STU202600006',
        admission_number: 'ADM20240096',
        roll_number: '11-D2-14',
        name: 'Ananya R',
        class_name: 'Grade 11 - Section D2',
        stream: 'Pure Science D',
        gender: 'Female',
        attendance_rate: 89.2,
        percentage: 78.4,
        grade: 'B1',
        parent_name: 'Ramesh N',
        parent_contact: '+91-98400-11225',
        status: 'Active',
      },
      {
        id: 'STU202600007',
        student_id: 'STU202600007',
        admission_number: 'ADM20240097',
        roll_number: '12-A1-02',
        name: 'Vishnu Prakash',
        class_name: 'Grade 12 - Section A1',
        stream: 'Computer Science A',
        gender: 'Male',
        attendance_rate: 98.1,
        percentage: 95.5,
        grade: 'A1',
        parent_name: 'Prakash V',
        parent_contact: '+91-98400-11232',
        status: 'Active',
      },
    ];
  }

  // 3. Student Contextual Services
  static async getStudentAttendanceHistory(_studentId?: string): Promise<StudentAttendanceSessionLog[]> {
    await delay();
    return [
      { date: '2026-09-24', subject: 'Mathematics', period: 'Period 1', status: 'PRESENT', faculty: 'R. Suresh' },
      { date: '2026-09-24', subject: 'Computer Science', period: 'Period 2', status: 'PRESENT', faculty: 'Priya Krishnan' },
      { date: '2026-09-23', subject: 'Physics', period: 'Period 3', status: 'ON_DUTY', faculty: 'Karthik Raman', note: 'Zonal Science Exhibition representation' },
      { date: '2026-09-23', subject: 'English Core', period: 'Period 4', status: 'PRESENT', faculty: 'Meena Devi' },
      { date: '2026-09-22', subject: 'Chemistry Lab', period: 'Period 5', status: 'LEAVE', faculty: 'Anitha Joseph', note: 'Sanctioned leave approved by class teacher' },
      { date: '2026-09-21', subject: 'Mathematics', period: 'Period 1', status: 'ABSENT', faculty: 'R. Suresh', note: 'Unreported morning absence' },
    ];
  }

  static async getStudentExamRecords(_studentId?: string): Promise<StudentExamRecord[]> {
    await delay();
    return [
      { subject: 'Mathematics', code: 'MATH-041', exam: 'Half-Yearly Examination', score: 92, max: 100, percentage: 92.0, grade: 'A1', remarks: 'Outstanding analytical proofs and vector geometry' },
      { subject: 'Computer Science', code: 'CS-083', exam: 'Half-Yearly Examination', score: 96, max: 100, percentage: 96.0, grade: 'A1', remarks: 'Exemplary Python programming and modular problem-solving' },
      { subject: 'Physics', code: 'PHY-042', exam: 'Half-Yearly Examination', score: 84, max: 100, percentage: 84.0, grade: 'A2', remarks: 'Solid conceptual understanding of mechanics' },
      { subject: 'English Core', code: 'ENG-301', exam: 'Half-Yearly Examination', score: 88, max: 100, percentage: 88.0, grade: 'A2', remarks: 'Well-structured essays and articulate expression' },
      { subject: 'Chemistry', code: 'CHEM-043', exam: 'Half-Yearly Examination', score: 75, max: 100, percentage: 75.0, grade: 'B1', remarks: 'Good practical accuracy; revise organic transformations' },
    ];
  }

  static async getAcademicCalendarEvents(_role?: string): Promise<CalendarEventItem[]> {
    await delay();
    return [
      { title: 'Half-Yearly Examination 2026', category: 'Examination', date: 'October 12 - October 22, 2026', time: '08:30 AM - 11:30 AM', venue: 'Main Examination Halls', desc: 'Comprehensive term examinations across all grades (Class 10, 11 & 12).' },
      { title: 'Annual Science & Technology Exhibition', category: 'Academic', date: 'October 28, 2026', time: '09:00 AM - 03:30 PM', venue: 'Auditorium & Labs', desc: 'Student science working models, coding projects, and mathematics olympiad showcase.' },
      { title: 'Diwali & Autumn School Holidays', category: 'Holiday', date: 'November 01 - November 05, 2026', time: 'All Day', venue: 'All Campuses', desc: 'School closed for festive break; academic and office sessions resume on Nov 6.' },
      { title: 'Parent-Teacher Meeting (Term 1 Review)', category: 'Meeting', date: 'November 14, 2026', time: '09:00 AM - 02:00 PM', venue: 'Respective Classrooms', desc: 'Term 1 progress report card distribution and one-on-one consultation with class teachers.' },
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
        name: 'S. Ramanathan',
        email: 'ramanathan@gmail.com',
        phone: '+91-98400-11207',
        children: [{ id: 'STU202600001', name: 'Arun Kumar', class_name: 'Grade 11 - Section A2' }],
        address: 'No. 42, Temple View Avenue, Sector 12, RK Puram, New Delhi - 110022',
        status: 'Active',
      },
      {
        id: 'par_002',
        name: 'M. Selvam',
        email: 'selvam@gmail.com',
        phone: '+91-98400-11208',
        children: [{ id: 'STU202600002', name: 'Priya S', class_name: 'Grade 11 - Section A2' }],
        address: 'Flat 3B, Shanti Enclave, Vasant Vihar, New Delhi - 110057',
        status: 'Active',
      },
      {
        id: 'par_003',
        name: 'Rajesh Raj',
        email: 'rajesh.raj@outlook.com',
        phone: '+91-98400-11212',
        children: [{ id: 'STU202600003', name: 'Rahul Raj', class_name: 'Grade 12 - Section C1' }],
        address: '45 Green Park Extension, New Delhi - 110016',
        status: 'Active',
      },
      {
        id: 'par_004',
        name: 'Murugan K',
        email: 'murugan.k@example.com',
        phone: '+91-98400-11215',
        children: [{ id: 'STU202600004', name: 'Keerthana M', class_name: 'Grade 10 - Section A' }],
        address: '88 Hauz Khas Enclave, New Delhi - 110016',
        status: 'Active',
      },
    ];
  }

  static async getParentChildrenCards(_parentId?: string): Promise<ParentChildCardItem[]> {
    await delay();
    return [
      {
        name: 'Arun Kumar',
        student_id: 'STU202600001',
        grade: 'Grade 11',
        stream: 'Computer Science A',
        rollNo: '11-A2-04',
        admNo: 'ADM20240091',
        attendance: 94.3,
        marksObtained: 435,
        totalMarks: 500,
        percentage: 87.0,
        gradeValue: 'A2',
        teacher: 'R. Suresh (Class Teacher XI-A2)',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
      },
      {
        name: 'Keerthana M',
        student_id: 'STU202600004',
        grade: 'Grade 10',
        stream: 'Secondary Core',
        rollNo: '10-A-12',
        admNo: 'ADM20240094',
        attendance: 96.0,
        marksObtained: 456,
        totalMarks: 500,
        percentage: 91.2,
        gradeValue: 'A1',
        teacher: 'Meena Devi (Class Teacher X-A)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      },
    ];
  }

  static async getStudentAbsenceLogs(_studentId?: string): Promise<StudentAbsenceAdvisoryRecord[]> {
    await delay();
    return [
      { date: '2026-09-22', period: 'Period 5 (Chemistry Lab)', status: 'LEAVE', faculty: 'Anitha Joseph', note: 'Sanctioned leave approved by class teacher' },
      { date: '2026-09-21', period: 'Period 1 (Mathematics)', status: 'ABSENT', faculty: 'R. Suresh', note: 'Unreported morning absence — justification required' },
    ];
  }

  static async getParentStudentEvaluations(_studentId?: string): Promise<SubjectEvaluationRecord[]> {
    await delay();
    return [
      { subject: 'Mathematics', faculty: 'R. Suresh', score: '92 / 100', grade: 'A1', remarks: 'Outstanding analytical proofs and vector geometry.' },
      { subject: 'Computer Science', faculty: 'Priya Krishnan', score: '96 / 100', grade: 'A1', remarks: 'Top of class in Python algorithms and database queries.' },
      { subject: 'Physics', faculty: 'Karthik Raman', score: '84 / 100', grade: 'A2', remarks: 'Good grasp of thermodynamics; diligent lab work.' },
      { subject: 'English Core', faculty: 'Meena Devi', score: '88 / 100', grade: 'A2', remarks: 'Well-structured essays and articulate expression.' },
      { subject: 'Chemistry', faculty: 'Anitha Joseph', score: '75 / 100', grade: 'B1', remarks: 'Satisfactory progress; practice organic synthesis reactions.' },
    ];
  }

  static async getParentCalendarEvents(): Promise<CalendarEventItem[]> {
    await delay();
    return [
      { title: 'Parent-Teacher Meeting (Term 1 Review)', date: 'November 14, 2026', time: '09:00 AM - 02:00 PM', location: 'Respective Classrooms', category: 'Meeting', desc: 'Term 1 progress report card distribution and one-on-one consultation with class teachers.' },
      { title: 'Diwali & Autumn School Holidays', date: 'November 01 - November 05, 2026', time: 'All Day', location: 'Campus Closed', category: 'Holiday', desc: 'School closed for festive break; academic sessions resume on November 6.' },
      { title: 'Half-Yearly Examination 2026', date: 'October 12 - October 22, 2026', time: '08:30 AM - 11:30 AM', location: 'Examination Halls', category: 'Examination', desc: 'Comprehensive term examinations across all subjects. School closes early at 12:00 PM.' },
      { title: 'Annual Science & Technology Exhibition', date: 'October 28, 2026', time: '09:00 AM - 03:30 PM', location: 'School Auditorium', category: 'Academic', desc: 'Parents and guardians cordially invited to view student working models and demonstrations.' },
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
        name: 'R. Suresh',
        email: 'suresh.r@schoolerp.edu.in',
        phone: '+91-98400-11203',
        department: 'Mathematics',
        designation: 'Senior PGT & Department Head',
        assigned_classes: ['Grade 11 - Computer Science A (Sec A2)', 'Grade 12 - Computer Science A (Sec A1)'],
        workload_hours: 24, // 24 periods per week
        status: 'Active',
      },
      {
        id: 'fac_002',
        name: 'Priya Krishnan',
        email: 'priya.k@schoolerp.edu.in',
        phone: '+91-98400-11204',
        department: 'Computer Science',
        designation: 'PGT Computer Science',
        assigned_classes: ['Grade 11 - Computer Science A (Sec A2)', 'Grade 12 - Computer Science A (Sec A1)'],
        workload_hours: 22,
        status: 'Active',
      },
      {
        id: 'fac_003',
        name: 'Karthik Raman',
        email: 'karthik.r@schoolerp.edu.in',
        phone: '+91-98400-11214',
        department: 'Physics',
        designation: 'PGT Physics',
        assigned_classes: ['Grade 11 - Computer Science A (Sec A2)', 'Grade 11 - Pure Science D (Sec D1)'],
        workload_hours: 20,
        status: 'Active',
      },
      {
        id: 'fac_004',
        name: 'Meena Devi',
        email: 'meena.d@schoolerp.edu.in',
        phone: '+91-98400-11218',
        department: 'English & Languages',
        designation: 'Senior PGT English',
        assigned_classes: ['Grade 11 - Computer Science A (Sec A2)', 'Grade 10 - Section A'],
        workload_hours: 22,
        status: 'Active',
      },
      {
        id: 'fac_005',
        name: 'Anitha Joseph',
        email: 'anitha.j@schoolerp.edu.in',
        phone: '+91-98400-11222',
        department: 'Chemistry',
        designation: 'PGT Chemistry',
        assigned_classes: ['Grade 11 - Computer Science A (Sec A2)', 'Grade 11 - Bio-Maths B (Sec B1)'],
        workload_hours: 20,
        status: 'Active',
      },
    ];
  }

  static async getFacultyTodayLectures(_facultyId?: string): Promise<FacultyTodayLectureItem[]> {
    await delay();
    return [
      { period: 'Period 1 (08:30 - 09:15)', class: 'Grade 11-A2 (Comp Sci)', subject: 'Mathematics (Calculus)', room: 'Room XI-A2', students: 30, attendanceDone: true },
      { period: 'Period 3 (10:15 - 11:00)', class: 'Grade 12-A1 (Comp Sci)', subject: 'Mathematics (Vectors)', room: 'Room XII-A1', students: 31, attendanceDone: false },
      { period: 'Period 5 (12:30 - 13:15)', class: 'Grade 10-A', subject: 'Mathematics (Trigonometry)', room: 'Room X-A', students: 38, attendanceDone: false },
    ];
  }

  static async getFacultyAssignedClassesSummary(_facultyId?: string): Promise<FacultyAssignedClassSummary[]> {
    await delay();
    return [
      { name: 'Grade 11 — Computer Science A (Sec A2)', avgScore: '87.0%', studentCount: 30, periodsPerWeek: 6 },
      { name: 'Grade 12 — Computer Science A (Sec A1)', avgScore: '89.2%', studentCount: 31, periodsPerWeek: 6 },
      { name: 'Grade 10 — Section A', avgScore: '83.4%', studentCount: 38, periodsPerWeek: 6 },
    ];
  }

  static async getFacultyGradeDistribution(_classId?: string): Promise<FacultyGradeDistributionItem[]> {
    await delay();
    return [
      { grade: 'A1 (91–100)', count: 7 },
      { grade: 'A2 (81–<91)', count: 12 },
      { grade: 'B1 (71–<81)', count: 6 },
      { grade: 'B2 (61–<71)', count: 3 },
      { grade: 'C1 (51–<61)', count: 2 },
      { grade: 'C2 (41–<51)', count: 0 },
      { grade: 'D (33–<41)', count: 0 },
      { grade: 'E (<33)', count: 0 },
    ];
  }

  static async getFacultyClassGrades(_classId?: string): Promise<FacultyStudentGradeItem[]> {
    await delay();
    return [
      { roll: '11-A2-04', name: 'Arun Kumar', score: 92, grade: 'A1', feedback: 'Outstanding analytical proofs and vector geometry.' },
      { roll: '11-A2-18', name: 'Priya S', score: 82, grade: 'A2', feedback: 'Consistent problem-solving; practice probability.' },
      { roll: '11-A2-07', name: 'Rohan Gupta', score: 84, grade: 'A2', feedback: 'Solid comprehension of calculus.' },
      { roll: '11-A2-11', name: 'Keerthana R', score: 96, grade: 'A1', feedback: 'Top marks on three-dimensional geometry.' },
    ];
  }

  static async getFacultyTimetableSlots(_facultyId?: string): Promise<FacultyTimetableSlotItem[]> {
    await delay();
    return [
      { period: 'Period 1 (08:30 - 09:15)', class: 'Grade 11-A2', subject: 'Mathematics (Calculus)', room: 'Room XI-A2', type: 'Class Lecture' },
      { period: 'Period 3 (10:15 - 11:00)', class: 'Grade 12-A1', subject: 'Mathematics (Vectors)', room: 'Room XII-A1', type: 'Class Lecture' },
      { period: 'Period 4 (11:00 - 11:45)', class: '—', subject: 'Department Coordination & Remedial Support', room: 'Staff Room B', type: 'Faculty Planning' },
      { period: 'Period 5 (12:30 - 13:15)', class: 'Grade 10-A', subject: 'Mathematics (Trigonometry)', room: 'Room X-A', type: 'Class Lecture' },
    ];
  }

  // 6. Admin Service
  static async getClassSections(): Promise<AdminClassSectionItem[]> {
    await delay();
    return [
      { name: 'Grade 11 — Computer Science A (Sec A1)', stream: 'Computer Science A', teacher: 'R. Suresh', room: 'Room 201', enrolled: 32, capacity: 35 },
      { name: 'Grade 11 — Computer Science A (Sec A2)', stream: 'Computer Science A', teacher: 'R. Suresh', room: 'Room 202', enrolled: 30, capacity: 35 },
      { name: 'Grade 11 — Bio-Maths B (Sec B1)', stream: 'Bio-Maths B', teacher: 'Priya Krishnan', room: 'Room 204', enrolled: 34, capacity: 35 },
      { name: 'Grade 11 — Commerce C (Sec C1)', stream: 'Commerce C', teacher: 'Meena Devi', room: 'Room 207', enrolled: 35, capacity: 35 },
      { name: 'Grade 11 — Pure Science D (Sec D1)', stream: 'Pure Science D', teacher: 'Karthik Raman', room: 'Room 210', enrolled: 30, capacity: 35 },
      { name: 'Grade 12 — Computer Science A (Sec A1)', stream: 'Computer Science A', teacher: 'Priya Krishnan', room: 'Room 301', enrolled: 31, capacity: 35 },
      { name: 'Grade 10 — Section A', stream: 'Secondary Core (No Stream)', teacher: 'Meena Devi', room: 'Room 101', enrolled: 38, capacity: 40 },
      { name: 'Grade 10 — Section B', stream: 'Secondary Core (No Stream)', teacher: 'Anitha Joseph', room: 'Room 102', enrolled: 36, capacity: 40 },
    ];
  }

  static async getSubjectsCatalog(): Promise<AdminSubjectCatalogItem[]> {
    await delay();
    return [
      { code: 'MATH-041', name: 'Mathematics', department: 'Mathematics', weekly_periods: 6, facultyCount: 4, status: 'Active' },
      { code: 'CS-083', name: 'Computer Science (Python & SQL)', department: 'Computer Science', weekly_periods: 6, facultyCount: 3, status: 'Active' },
      { code: 'PHY-042', name: 'Physics & Laboratory Practicals', department: 'Physics', weekly_periods: 5, facultyCount: 4, status: 'Active' },
      { code: 'ENG-301', name: 'English Core & Advanced Composition', department: 'English & Languages', weekly_periods: 5, facultyCount: 4, status: 'Active' },
      { code: 'CHEM-043', name: 'Chemistry & Laboratory Practicals', department: 'Chemistry', weekly_periods: 5, facultyCount: 3, status: 'Active' },
    ];
  }

  static async getAttendanceAuditLogs(): Promise<AdminAttendanceAuditRecord[]> {
    await delay();
    return [
      { date: '2026-09-24', class: 'Grade 11-A2 (Comp Sci)', total: 30, present: 27, onDuty: 2, absent: 0, leave: 1, rate: '96.7%', verifiedBy: 'R. Suresh' },
      { date: '2026-09-24', class: 'Grade 11-B1 (Bio-Maths)', total: 34, present: 31, onDuty: 1, absent: 1, leave: 1, rate: '94.1%', verifiedBy: 'Priya Krishnan' },
      { date: '2026-09-24', class: 'Grade 12-A1 (Comp Sci)', total: 31, present: 29, onDuty: 1, absent: 0, leave: 1, rate: '96.8%', verifiedBy: 'Priya Krishnan' },
      { date: '2026-09-24', class: 'Grade 10-A', total: 38, present: 35, onDuty: 1, absent: 1, leave: 1, rate: '94.7%', verifiedBy: 'Meena Devi' },
    ];
  }

  static async getExamSummaries(): Promise<AdminExamSummaryRecord[]> {
    await delay();
    return [
      { class: 'Grade 11 — Computer Science A (Sec A2)', exam: 'Half-Yearly 2026', students: 30, avg: '87.0%', highest: '98%', passRate: '100%' },
      { class: 'Grade 11 — Bio-Maths B (Sec B1)', exam: 'Half-Yearly 2026', students: 34, avg: '84.2%', highest: '96%', passRate: '97.1%' },
      { class: 'Grade 12 — Computer Science A (Sec A1)', exam: 'Half-Yearly 2026', students: 31, avg: '89.5%', highest: '100%', passRate: '100%' },
      { class: 'Grade 10 — Section A', exam: 'Half-Yearly 2026', students: 38, avg: '83.4%', highest: '97%', passRate: '97.4%' },
    ];
  }

  static async getMasterTimetableEntries(): Promise<AdminMasterTimetableEntry[]> {
    await delay();
    return [
      { class: 'Grade 11-A2', period1: 'Mathematics (XI-A2)', period2: 'Computer Science (Lab 2)', period3: 'Physics (Phys Lab)', period4: 'English Core (XI-A2)' },
      { class: 'Grade 12-A1', period1: 'Physics (Phys Lab)', period2: 'Mathematics (XII-A1)', period3: 'Chemistry (Chem Lab)', period4: 'Computer Science (Lab 2)' },
    ];
  }

  static async getCalendarNotices(): Promise<AdminCalendarNoticeItem[]> {
    await delay();
    return [
      { title: 'Half-Yearly Examination Schedule', category: 'Examination', date: 'October 12 - 22, 2026', target: 'All Secondary & Senior Secondary Students' },
      { title: 'Diwali & Autumn Festive Vacation', category: 'School Holiday', date: 'November 01 - 05, 2026', target: 'School Wide • Administrative Offices on holiday schedule' },
    ];
  }

  static async getAllocationPreview(): Promise<AllocationPreviewItem[]> {
    await delay();
    return [
      { student_id: 'STU202600001', student_name: 'Arun Kumar', current_grade: 'Grade 10', merit_rank: 4, score: 96.5, gender: 'Male', allocated_section: 'Grade 11 — Computer Science A (Sec A2)', status: 'Allocated' },
      { student_id: 'STU202600002', student_name: 'Priya S', current_grade: 'Grade 10', merit_rank: 1, score: 98.2, gender: 'Female', allocated_section: 'Grade 11 — Computer Science A (Sec A2)', status: 'Allocated' },
      { student_id: 'STU202600003', student_name: 'Rahul Raj', current_grade: 'Grade 10', merit_rank: 12, score: 88.0, gender: 'Male', allocated_section: 'Grade 11 — Commerce C (Sec C1)', status: 'Allocated' },
      { student_id: 'STU202600004', student_name: 'Keerthana M', current_grade: 'Grade 9', merit_rank: 8, score: 91.4, gender: 'Female', allocated_section: 'Grade 10 — Section A', status: 'Allocated' },
      { student_id: 'STU202600005', student_name: 'Aditya Sharma', current_grade: 'Grade 10', merit_rank: 2, score: 97.8, gender: 'Male', allocated_section: 'Grade 11 — Bio-Maths B (Sec B1)', status: 'Allocated' },
      { student_id: 'STU202600006', student_name: 'Ananya R', current_grade: 'Grade 10', merit_rank: 29, score: 79.5, gender: 'Female', allocated_section: 'Grade 11 — Pure Science D (Sec D1)', status: 'Allocated' },
    ];
  }

  // 7. Principal Service
  static async getClassAcademicComparisons(): Promise<PrincipalClassAcademicItem[]> {
    await delay();
    return [
      { grade: 'Grade 9', academicAverage: 81.2, passRate: 94.4 },
      { grade: 'Grade 10', academicAverage: 83.5, passRate: 96.1 },
      { grade: 'Grade 11', academicAverage: 86.8, passRate: 98.2 },
      { grade: 'Grade 12', academicAverage: 89.4, passRate: 99.1 },
    ];
  }


  static async getGradeAttendanceTrends(): Promise<PrincipalGradeAttendanceTrend[]> {
    await delay();
    return [
      { month: 'Jul', gr9: 94.2, gr10: 95.1, gr11: 96.0, gr12: 96.8 },
      { month: 'Aug', gr9: 92.5, gr10: 93.8, gr11: 95.2, gr12: 96.0 },
      { month: 'Sep', gr9: 93.8, gr10: 94.5, gr11: 95.8, gr12: 96.2 },
      { month: 'Oct', gr9: 94.5, gr10: 95.2, gr11: 96.1, gr12: 97.0 },
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
      { title: 'Annual School Academic Performance & CBSE / ICSE Benchmark Dossier', date: 'Session 2026–27', format: 'PDF', size: '3.8 MB', desc: 'Comprehensive governance report including curriculum delivery, board examinations, and student outcomes.' },
      { title: 'Term 1 Examination Analysis & Section Benchmarking', date: 'Half-Yearly 2026', format: 'PDF', size: '2.1 MB', desc: 'Subject-wise score analysis, pass percentage aggregates, and stream distributions.' },
      { title: 'Faculty Teaching Load & Timetable Allocation Summary', date: 'Session 2026–27', format: 'PDF', size: '1.4 MB', desc: 'Staff period allocations, departmental responsibilities, and class teacher assignments.' },
      { title: 'School-Wide Attendance & Leave Registry Audit', date: 'Monthly Audit', format: 'XLSX', size: '750 KB', desc: 'Institutional attendance registry across all classes, faculty leave approvals, and student retention.' },
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
      { month: 'Jun', attendance: 96.2, target: 90 },
      { month: 'Jul', attendance: 94.8, target: 90 },
      { month: 'Aug', attendance: 95.5, target: 90 },
      { month: 'Sep', attendance: 94.3, target: 90 },
      { month: 'Oct', attendance: 95.0, target: 90 },
    ];
  }

  static async getSubjectAttendance(): Promise<{ subject: string; present: number; total: number; percentage: number }[]> {
    await delay();
    return [
      { subject: 'Mathematics', present: 24, total: 25, percentage: 96.0 },
      { subject: 'Computer Science', present: 20, total: 20, percentage: 100.0 },
      { subject: 'Physics', present: 21, total: 24, percentage: 87.5 },
      { subject: 'English Core', present: 19, total: 20, percentage: 95.0 },
      { subject: 'Chemistry', present: 18, total: 20, percentage: 90.0 },
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
      { subject: 'Computer Science', studentScore: 96, classAverage: 82, maxScore: 100 },
      { subject: 'Physics', studentScore: 84, classAverage: 74, maxScore: 100 },
      { subject: 'English Core', studentScore: 88, classAverage: 80, maxScore: 100 },
      { subject: 'Chemistry', studentScore: 75, classAverage: 72, maxScore: 100 },
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
          { period: 'Period 1 (08:30 - 09:15)', subject: 'Mathematics', teacher: 'R. Suresh', room: 'XI-A2', type: 'Class' },
          { period: 'Period 2 (09:15 - 10:00)', subject: 'Computer Science', teacher: 'Priya Krishnan', room: 'Comp Lab 2', type: 'Lab' },
          { period: 'Period 3 (10:15 - 11:00)', subject: 'Physics', teacher: 'Karthik Raman', room: 'Physics Lab', type: 'Lab' },
          { period: 'Period 4 (11:00 - 11:45)', subject: 'English Core', teacher: 'Meena Devi', room: 'XI-A2', type: 'Class' },
          { period: 'Period 5 (12:30 - 13:15)', subject: 'Chemistry', teacher: 'Anitha Joseph', room: 'Chem Lab', type: 'Lab' },
        ],
      },
      {
        day: 'Tuesday',
        periods: [
          { period: 'Period 1 (08:30 - 09:15)', subject: 'Mathematics', teacher: 'R. Suresh', room: 'XI-A2', type: 'Class' },
          { period: 'Period 2 (09:15 - 10:00)', subject: 'Computer Science', teacher: 'Priya Krishnan', room: 'Comp Lab 2', type: 'Lab' },
          { period: 'Period 3 (10:15 - 11:00)', subject: 'Chemistry', teacher: 'Anitha Joseph', room: 'XI-A2', type: 'Class' },
          { period: 'Period 4 (11:00 - 11:45)', subject: 'English Core', teacher: 'Meena Devi', room: 'XI-A2', type: 'Class' },
          { period: 'Period 5 (12:30 - 13:15)', subject: 'Library & Reading', teacher: 'Meena Devi', room: 'Library', type: 'Activity' },
        ],
      },
      {
        day: 'Wednesday',
        periods: [
          { period: 'Period 1 (08:30 - 09:15)', subject: 'Physics', teacher: 'Karthik Raman', room: 'XI-A2', type: 'Class' },
          { period: 'Period 2 (09:15 - 10:00)', subject: 'Mathematics', teacher: 'R. Suresh', room: 'XI-A2', type: 'Class' },
          { period: 'Period 3 (10:15 - 11:00)', subject: 'Computer Science', teacher: 'Priya Krishnan', room: 'Comp Lab 2', type: 'Lab' },
          { period: 'Period 4 (11:00 - 11:45)', subject: 'English Core', teacher: 'Meena Devi', room: 'XI-A2', type: 'Class' },
          { period: 'Period 5 (12:30 - 13:15)', subject: 'Physical Education / Games', teacher: 'Staff', room: 'Playground', type: 'Activity' },
        ],
      },
      {
        day: 'Thursday',
        periods: [
          { period: 'Period 1 (08:30 - 09:15)', subject: 'Computer Science', teacher: 'Priya Krishnan', room: 'Comp Lab 2', type: 'Lab' },
          { period: 'Period 2 (09:15 - 10:00)', subject: 'Mathematics', teacher: 'R. Suresh', room: 'XI-A2', type: 'Class' },
          { period: 'Period 3 (10:15 - 11:00)', subject: 'Physics', teacher: 'Karthik Raman', room: 'XI-A2', type: 'Class' },
          { period: 'Period 4 (11:00 - 11:45)', subject: 'Chemistry', teacher: 'Anitha Joseph', room: 'Chem Lab', type: 'Lab' },
          { period: 'Period 5 (12:30 - 13:15)', subject: 'Remedial & Guidance', teacher: 'R. Suresh', room: 'XI-A2', type: 'Mentorship' },
        ],
      },
      {
        day: 'Friday',
        periods: [
          { period: 'Period 1 (08:30 - 09:15)', subject: 'Mathematics', teacher: 'R. Suresh', room: 'XI-A2', type: 'Class' },
          { period: 'Period 2 (09:15 - 10:00)', subject: 'Physics Problem Solving', teacher: 'Karthik Raman', room: 'XI-A2', type: 'Class' },
          { period: 'Period 3 (10:15 - 11:00)', subject: 'Computer Science Project', teacher: 'Priya Krishnan', room: 'Comp Lab 2', type: 'Lab' },
          { period: 'Period 4 (11:00 - 11:45)', subject: 'School Assembly & House Activity', teacher: 'Principal', room: 'Auditorium', type: 'Assembly' },
          { period: 'Period 5 (12:30 - 13:15)', subject: 'Cultural & Club Activities', teacher: 'Staff', room: 'Amphitheatre', type: 'Activity' },
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

  static async getSchoolKPIs(): Promise<PrincipalKPIs> {
    await delay();
    return {
      total_students: 1248,
      total_faculty: 86,
      active_classes: 24,
      overall_attendance_rate: 94.2,
      overall_academic_percentage: 81.7,
      student_teacher_ratio: '15:1',
    };
  }

  static async getDepartmentalPerformance() {
    await delay();
    return [
      { department: 'Computer Science', passRate: 98.5, academicAverage: 88.2, facultyCount: 14, completionRate: 95 },
      { department: 'Mathematics', passRate: 94.2, academicAverage: 84.5, facultyCount: 18, completionRate: 92 },
      { department: 'Physics & Sciences', passRate: 92.0, academicAverage: 82.8, facultyCount: 20, completionRate: 90 },
      { department: 'English & Languages', passRate: 96.8, academicAverage: 86.4, facultyCount: 16, completionRate: 96 },
      { department: 'Commerce & Economics', passRate: 91.5, academicAverage: 81.2, facultyCount: 12, completionRate: 91 },
    ];
  }
}
