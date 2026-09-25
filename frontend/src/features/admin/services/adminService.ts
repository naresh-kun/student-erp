/**
 * Student ERP — Admin Domain Service Layer
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 *
 * Implements service abstraction adapter for School Administration operations:
 * - Institutional KPIs & Dashboard overview
 * - Student Master Register (Permanent & immutable Student ID)
 * - Parent Directory with linked children
 * - Faculty Directory (Descriptive & Non-Evaluative; NO ratings/rankings)
 * - Classes & Sections Hierarchy (Grades 11–12 stream-aware; Grades below 11 no stream)
 * - Subject Catalog (No credits, no GPA weighting)
 * - Canonical 4-Status Attendance Oversight ([P + OD] / [P + A + OD + L] * 100)
 * - Examination Marks Oversight (/100, %, 8-tier CBSE letter grades)
 * - Master Timetable & Institutional Calendar
 * - Stream-Aware Class / Section Allocation Engine (Merit-based & Random)
 */

import { MockDataService } from '@/services/mockService';
import { calculateAttendancePercentage, calculateGrade } from '@/utils';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import type {
  AdminDashboardKPIs,
  AdminStudentItem,
  AdminParentItem,
  AdminFacultyItem,
  AdminClassHierarchyItem,
  AdminSubjectCatalogItem,
  AdminAttendanceOverviewItem,
  AdminMarksOverviewItem,
  AdminTimetableSlotItem,
  AdminCalendarEventItem,
  AllocationSourceStudent,
  AllocationTargetSection,
  AllocationPreviewRecord,
  AllocationHistoryRecord,
  AllocationMethod,
} from '../types';
import type { AdminEventInput } from '../schemas/eventSchema';

const STORAGE_CALENDAR_KEY = 'student_erp_admin_calendar_events';
const STORAGE_ALLOCATION_HISTORY_KEY = 'student_erp_allocation_history';
const STORAGE_ALLOCATED_STUDENTS_KEY = 'student_erp_allocated_students_state';

class MemoryStore {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const memoryStore = new MemoryStore();

function getStorage() {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return memoryStore;
}

const delay = (ms = 35) => new Promise((resolve) => setTimeout(resolve, ms));

export class AdminService {
  // ==========================================
  // 1. DASHBOARD & KPIS
  // ==========================================
  static async getDashboardSummary(): Promise<{
    kpis: AdminDashboardKPIs;
    attendanceTrend: { month: string; attendance: number }[];
  }> {
    await delay();
    const rawKpis = await MockDataService.getSchoolKPIs();
    const trend = await MockDataService.getMonthlyAttendanceTrend();
    const calendarEvents = await this.getCalendarEvents();

    const kpis: AdminDashboardKPIs = {
      total_students: rawKpis.total_students,
      total_parents: 850,
      total_faculty: rawKpis.total_faculty,
      total_classes: 6,
      total_sections: 17,
      academic_year: SCHOOL_CONFIG.academicYear,
      overall_attendance_rate: rawKpis.overall_attendance_rate,
      student_teacher_ratio: rawKpis.student_teacher_ratio,
      active_examinations: 1, // Half-Yearly
      upcoming_events_count: calendarEvents.length,
      pending_operational_actions: 3, // e.g. Stream allocation review, attendance audit
    };

    return { kpis, attendanceTrend: trend };
  }

  // ==========================================
  // 2. STUDENT MASTER DIRECTORY
  // ==========================================
  static async getStudents(filters?: {
    search?: string;
    gradeLevel?: number;
    stream?: string;
    section?: string;
    status?: string;
  }): Promise<AdminStudentItem[]> {
    await delay();
    const rawStudents = await MockDataService.getStudents();
    const classes = await MockDataService.getClasses();
    const parents = await MockDataService.getParents();
    const marks = await MockDataService.getMarks();
    const storage = getStorage();

    // Check if any student has an updated allocated section from localStorage
    const savedAllocationsRaw = storage.getItem(STORAGE_ALLOCATED_STUDENTS_KEY);
    const savedAllocations: Record<string, string> = savedAllocationsRaw
      ? JSON.parse(savedAllocationsRaw)
      : {};

    const enrichedList: AdminStudentItem[] = rawStudents.map((s, idx) => {
      const cls = classes.find((c) => c.id === s.class_id);
      const parent = parents.find((p) => p.id === s.parent_id);

      // Section lookup
      let sectionName = 'Section A2';
      if (cls && s.section_id) {
        const sec = cls.sections.find((sc) => sc.id === s.section_id);
        if (sec) sectionName = sec.name;
      }
      // Check if overridden by allocation
      if (savedAllocations[s.student_id]) {
        sectionName = savedAllocations[s.student_id];
      }

      // Calculate marks & grade from mock data or deterministic values
      const studentMarks = marks.filter((m) => m.student_id === s.student_id);
      let avgScore = 88.5;
      if (studentMarks.length > 0) {
        const total = studentMarks.reduce((sum: number, m) => sum + Number(m.marks_obtained), 0);
        avgScore = Number((total / studentMarks.length).toFixed(1));
      } else {
        avgScore = idx % 2 === 0 ? 92.4 : 85.0;
      }

      const letterGrade = calculateGrade(avgScore);
      const attendanceRate = idx % 2 === 0 ? 95.8 : 93.3;

      return {
        id: s.id,
        student_id: s.student_id,
        admission_number: s.admission_number,
        roll_number: s.roll_number,
        first_name: s.first_name,
        last_name: s.last_name,
        name: `${s.first_name} ${s.last_name}`.trim(),
        class_id: s.class_id,
        class_name: cls ? cls.name : 'Grade 11 — Computer Science A',
        grade_level: cls ? cls.grade_level : 11,
        stream: s.stream,
        section_id: s.section_id,
        section_name: sectionName,
        academic_year: s.academic_year,
        gender: s.gender,
        date_of_birth: s.date_of_birth,
        blood_group: s.blood_group,
        parent_id: s.parent_id || 'par_001',
        parent_name: parent ? `${parent.first_name} ${parent.last_name}` : 'S. Ramanathan',
        parent_phone: parent ? parent.phone : '+91-98400-11207',
        attendance_percentage: attendanceRate,
        academic_percentage: avgScore,
        letter_grade: letterGrade,
        status: (s.status as 'Active' | 'Inactive') || 'Active',
      };
    });

    // Provide synthetic additional cohort records to show full directory feel
    const mockExtended: AdminStudentItem[] = [
      {
        id: 'STU202600003',
        student_id: 'STU202600003',
        admission_number: 'ADM20240093',
        roll_number: '11-B1-06',
        first_name: 'Aditya',
        last_name: 'Sharma',
        name: 'Aditya Sharma',
        class_id: 'cls_002',
        class_name: 'Grade 11 — Bio-Maths B',
        grade_level: 11,
        stream: 'Bio-Maths B',
        section_id: 'sec_004',
        section_name: savedAllocations['STU202600003'] || 'Section B1',
        academic_year: '2026–27',
        gender: 'Male',
        date_of_birth: '2009-08-11',
        blood_group: 'A+',
        parent_id: 'par_003',
        parent_name: 'V. Sharma',
        parent_phone: '+91-98400-11209',
        attendance_percentage: 97.2,
        academic_percentage: 94.0,
        letter_grade: 'A1',
        status: 'Active',
      },
      {
        id: 'STU202600004',
        student_id: 'STU202600004',
        admission_number: 'ADM20240094',
        roll_number: '11-C1-14',
        first_name: 'Rahul',
        last_name: 'Raj',
        name: 'Rahul Raj',
        class_id: 'cls_003',
        class_name: 'Grade 11 — Commerce C',
        grade_level: 11,
        stream: 'Commerce C',
        section_id: 'sec_007',
        section_name: savedAllocations['STU202600004'] || 'Section C1',
        academic_year: '2026–27',
        gender: 'Male',
        date_of_birth: '2009-03-19',
        blood_group: 'O-',
        parent_id: 'par_004',
        parent_name: 'K. Rajan',
        parent_phone: '+91-98400-11210',
        attendance_percentage: 91.5,
        academic_percentage: 82.0,
        letter_grade: 'A2',
        status: 'Active',
      },
      {
        id: 'STU202600005',
        student_id: 'STU202600005',
        admission_number: 'ADM20240095',
        roll_number: '10-A-22',
        first_name: 'Keerthana',
        last_name: 'M',
        name: 'Keerthana M',
        class_id: 'cls_000',
        class_name: 'Grade 10',
        grade_level: 10,
        stream: undefined,
        section_id: 'sec_g10_a',
        section_name: savedAllocations['STU202600005'] || 'Section A',
        academic_year: '2026–27',
        gender: 'Female',
        date_of_birth: '2010-07-04',
        blood_group: 'AB+',
        parent_id: 'par_005',
        parent_name: 'M. Murugan',
        parent_phone: '+91-98400-11211',
        attendance_percentage: 96.0,
        academic_percentage: 91.5,
        letter_grade: 'A1',
        status: 'Active',
      },
      {
        id: 'STU202600006',
        student_id: 'STU202600006',
        admission_number: 'ADM20240096',
        roll_number: '11-D1-09',
        first_name: 'Ananya',
        last_name: 'R',
        name: 'Ananya R',
        class_id: 'cls_004',
        class_name: 'Grade 11 — Pure Science D',
        grade_level: 11,
        stream: 'Pure Science D',
        section_id: 'sec_010',
        section_name: savedAllocations['STU202600006'] || 'Section D1',
        academic_year: '2026–27',
        gender: 'Female',
        date_of_birth: '2009-11-30',
        blood_group: 'B-',
        parent_id: 'par_006',
        parent_name: 'R. Raghuram',
        parent_phone: '+91-98400-11212',
        attendance_percentage: 89.2,
        academic_percentage: 79.5,
        letter_grade: 'B1',
        status: 'Active',
      },
    ];

    let combined = [...enrichedList, ...mockExtended];

    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        combined = combined.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.student_id.toLowerCase().includes(q) ||
            s.admission_number.toLowerCase().includes(q) ||
            s.roll_number.toLowerCase().includes(q)
        );
      }
      if (filters.gradeLevel) {
        combined = combined.filter((s) => s.grade_level === filters.gradeLevel);
      }
      if (filters.stream && filters.stream !== 'ALL') {
        combined = combined.filter((s) => s.stream === filters.stream);
      }
      if (filters.section && filters.section !== 'ALL') {
        combined = combined.filter((s) => s.section_name.includes(filters.section!));
      }
      if (filters.status && filters.status !== 'ALL') {
        combined = combined.filter((s) => s.status === filters.status);
      }
    }

    return combined;
  }

  static async getStudentById(studentId: string): Promise<AdminStudentItem | undefined> {
    const list = await this.getStudents();
    return list.find((s) => s.student_id === studentId || s.id === studentId);
  }

  // ==========================================
  // 3. PARENT DIRECTORY
  // ==========================================
  static async getParents(search?: string): Promise<AdminParentItem[]> {
    await delay();
    const rawParents = await MockDataService.getParents();
    const students = await this.getStudents();

    const parentItems: AdminParentItem[] = rawParents.map((p) => {
      const linkedChildren = (p.children_student_ids || []).map((stuId) => {
        const student = students.find((s) => s.student_id === stuId);
        return {
          student_id: stuId,
          name: student ? student.name : 'Enrolled Student',
          class_name: student ? student.class_name : 'Class 11',
          roll_number: student ? student.roll_number : '—',
        };
      });

      return {
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        name: `${p.first_name} ${p.last_name}`.trim(),
        relation: p.relation,
        occupation: p.occupation,
        phone: p.phone,
        email: p.email,
        address: p.address,
        children: linkedChildren,
        status: 'Active',
      };
    });

    if (search) {
      const q = search.toLowerCase();
      return parentItems.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.children.some((c) => c.name.toLowerCase().includes(q) || c.student_id.toLowerCase().includes(q))
      );
    }

    return parentItems;
  }

  // ==========================================
  // 4. FACULTY DIRECTORY (Non-Evaluative)
  // ==========================================
  static async getFaculty(search?: string, department?: string): Promise<AdminFacultyItem[]> {
    await delay();
    const rawFaculty = await MockDataService.getFaculty();
    const subjects = await MockDataService.getSubjects();

    const facultyItems: AdminFacultyItem[] = rawFaculty.map((f) => {
      const assignedSubjectNames = (f.assigned_subject_ids || []).map((subId) => {
        const sub = subjects.find((s) => s.id === subId);
        return sub ? sub.name : subId;
      });

      const isMath = f.department.toLowerCase().includes('math');

      return {
        id: f.id,
        employee_code: f.employee_code,
        first_name: f.first_name,
        last_name: f.last_name,
        name: `${f.first_name} ${f.last_name}`.trim(),
        email: `${f.first_name.toLowerCase().replace('.', '')}.${f.last_name.toLowerCase()}@schoolerp.edu.in`.replace('..', '.'),
        phone: '+91-98400-11203',
        department: f.department,
        designation: f.designation,
        qualification: f.qualification,
        office_room: f.office_room,
        assigned_subjects: assignedSubjectNames,
        class_teacher_of: f.class_teacher_of ? 'Grade 11 — Computer Science A (Sec A2)' : null,
        assigned_classes: isMath
          ? ['Grade 11-A2 (Math)', 'Grade 12-A1 (Math)', 'Grade 10-A (Math)']
          : ['Grade 11-A2 (Comp Sci)', 'Grade 12-A1 (Comp Sci)'],
        weekly_periods: isMath ? 24 : 20,
        status: 'Active',
      };
    });

    let result = facultyItems;
    if (department && department !== 'ALL') {
      result = result.filter((f) => f.department === department);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.employee_code.toLowerCase().includes(q) ||
          f.department.toLowerCase().includes(q) ||
          f.designation.toLowerCase().includes(q)
      );
    }

    return result;
  }

  // ==========================================
  // 5. CLASSES & SECTIONS HIERARCHY
  // ==========================================
  static async getClassesAndSections(): Promise<AdminClassHierarchyItem[]> {
    await delay();
    const rawClasses = await MockDataService.getClasses();
    const faculty = await MockDataService.getFaculty();

    return rawClasses.map((cls) => {
      const teacher = faculty.find((f) => f.id === cls.class_teacher_id);
      const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unassigned';

      const totalEnrolled = cls.sections.reduce((sum, s) => sum + s.enrolled_count, 0);
      const totalCapacity = cls.sections.reduce((sum, s) => sum + s.capacity, 0);

      return {
        id: cls.id,
        name: cls.name,
        code: cls.code,
        grade_level: cls.grade_level,
        stream: cls.stream,
        academic_year: cls.academic_year,
        class_teacher_name: teacherName,
        sections: cls.sections,
        total_enrolled: totalEnrolled,
        total_capacity: totalCapacity,
      };
    });
  }

  // ==========================================
  // 6. SUBJECTS CATALOG (No Credits)
  // ==========================================
  static async getSubjectsCatalog(): Promise<AdminSubjectCatalogItem[]> {
    await delay();
    const rawSubjects = await MockDataService.getSubjects();
    const faculty = await MockDataService.getFaculty();

    return rawSubjects.map((sub) => {
      const facultyNames = (sub.faculty_ids || []).map((fid) => {
        const fac = faculty.find((f) => f.id === fid);
        return fac ? `${fac.first_name} ${fac.last_name}` : fid;
      });

      let applicableGrades = 'Grades 10, 11, 12';
      let applicableStreams = 'All Streams';

      if (sub.code === 'CS-083') {
        applicableGrades = 'Grades 11, 12';
        applicableStreams = 'Computer Science A';
      } else if (sub.code === 'MATH-041') {
        applicableGrades = 'Grades 10, 11, 12';
        applicableStreams = 'Computer Science A, Bio-Maths B, Commerce C';
      } else if (sub.code === 'PHY-042' || sub.code === 'CHEM-043') {
        applicableGrades = 'Grades 11, 12';
        applicableStreams = 'Computer Science A, Bio-Maths B, Pure Science D';
      }

      return {
        id: sub.id,
        code: sub.code,
        name: sub.name,
        department: sub.department,
        weekly_periods: sub.weekly_periods,
        applicable_grades: applicableGrades,
        applicable_streams: applicableStreams,
        assigned_faculty_names: facultyNames.length > 0 ? facultyNames : ['R. Suresh (Interim)'],
        status: 'Active',
        description: sub.description,
      };
    });
  }

  // ==========================================
  // 7. ATTENDANCE OVERSIGHT (Canonical 4-Status)
  // ==========================================
  static async getAttendanceOverview(_date?: string, _gradeLevel?: number): Promise<AdminAttendanceOverviewItem[]> {
    await delay();
    const auditLogs = await MockDataService.getAttendanceAuditLogs();

    return auditLogs.map((log) => {
      const total = log.total;
      const rate = calculateAttendancePercentage({
        present: log.present,
        absent: log.absent,
        onDuty: log.onDuty,
        leave: log.leave,
      });

      return {
        date: log.date,
        class_id: 'cls_001',
        class_name: log.class,
        stream: log.class.includes('Comp Sci') ? 'Computer Science A' : log.class.includes('Bio') ? 'Bio-Maths B' : undefined,
        section_name: log.class,
        total_students: total,
        present_count: log.present,
        on_duty_count: log.onDuty,
        leave_count: log.leave,
        absent_count: log.absent,
        attendance_percentage: rate,
        verified_by: log.verifiedBy,
        session_status: 'Completed',
      };
    });
  }

  // ==========================================
  // 8. MARKS OVERSIGHT (CBSE 8-Tier Grades)
  // ==========================================
  static async getMarksOverview(): Promise<AdminMarksOverviewItem[]> {
    await delay();
    return [
      {
        exam_type: 'Half-Yearly Examination',
        academic_year: '2026–27',
        class_name: 'Grade 11 — Computer Science A',
        stream: 'Computer Science A',
        section_name: 'Section A2',
        subject_name: 'Mathematics',
        total_students: 30,
        evaluated_count: 30,
        average_percentage: 87.0,
        highest_marks: 98.0,
        pass_percentage: 100.0,
        grade_distribution: {
          A1: 12,
          A2: 10,
          B1: 5,
          B2: 2,
          C1: 1,
          C2: 0,
          D: 0,
          E: 0,
        },
        status: 'Published',
      },
      {
        exam_type: 'Half-Yearly Examination',
        academic_year: '2026–27',
        class_name: 'Grade 11 — Computer Science A',
        stream: 'Computer Science A',
        section_name: 'Section A2',
        subject_name: 'Computer Science',
        total_students: 30,
        evaluated_count: 30,
        average_percentage: 91.2,
        highest_marks: 99.0,
        pass_percentage: 100.0,
        grade_distribution: {
          A1: 16,
          A2: 9,
          B1: 3,
          B2: 2,
          C1: 0,
          C2: 0,
          D: 0,
          E: 0,
        },
        status: 'Published',
      },
      {
        exam_type: 'Half-Yearly Examination',
        academic_year: '2026–27',
        class_name: 'Grade 11 — Bio-Maths B',
        stream: 'Bio-Maths B',
        section_name: 'Section B1',
        subject_name: 'Biology',
        total_students: 34,
        evaluated_count: 34,
        average_percentage: 84.2,
        highest_marks: 96.0,
        pass_percentage: 97.1,
        grade_distribution: {
          A1: 10,
          A2: 12,
          B1: 8,
          B2: 3,
          C1: 1,
          C2: 0,
          D: 0,
          E: 0,
        },
        status: 'Published',
      },
      {
        exam_type: 'Half-Yearly Examination',
        academic_year: '2026–27',
        class_name: 'Grade 10',
        stream: undefined,
        section_name: 'Section A',
        subject_name: 'Mathematics',
        total_students: 38,
        evaluated_count: 38,
        average_percentage: 83.4,
        highest_marks: 97.0,
        pass_percentage: 97.4,
        grade_distribution: {
          A1: 11,
          A2: 14,
          B1: 8,
          B2: 3,
          C1: 1,
          C2: 1,
          D: 0,
          E: 0,
        },
        status: 'Published',
      },
    ];
  }

  // ==========================================
  // 9. TIMETABLE
  // ==========================================
  static async getMasterTimetable(): Promise<AdminTimetableSlotItem[]> {
    await delay();
    return [
      { id: '1', class_name: 'Grade 11-A2', section_name: 'Section A2', day_of_week: 'Monday', period_number: 1, start_time: '08:30', end_time: '09:15', subject_name: 'Mathematics', faculty_name: 'R. Suresh', room_number: 'XI-A2' },
      { id: '2', class_name: 'Grade 11-A2', section_name: 'Section A2', day_of_week: 'Monday', period_number: 2, start_time: '09:15', end_time: '10:00', subject_name: 'Computer Science', faculty_name: 'Priya Krishnan', room_number: 'Comp Lab 2' },
      { id: '3', class_name: 'Grade 11-A2', section_name: 'Section A2', day_of_week: 'Monday', period_number: 3, start_time: '10:15', end_time: '11:00', subject_name: 'Physics', faculty_name: 'R. Suresh', room_number: 'Physics Lab' },
      { id: '4', class_name: 'Grade 11-A2', section_name: 'Section A2', day_of_week: 'Monday', period_number: 4, start_time: '11:00', end_time: '11:45', subject_name: 'English Core', faculty_name: 'Priya Krishnan', room_number: 'XI-A2' },
      { id: '5', class_name: 'Grade 11-A2', section_name: 'Section A2', day_of_week: 'Monday', period_number: 5, start_time: '12:30', end_time: '13:15', subject_name: 'Chemistry', faculty_name: 'R. Suresh', room_number: 'Chemistry Lab' },
      { id: '6', class_name: 'Grade 12-A1', section_name: 'Section A1', day_of_week: 'Monday', period_number: 1, start_time: '08:30', end_time: '09:15', subject_name: 'Physics', faculty_name: 'Dr. Raman', room_number: 'XII-A1' },
      { id: '7', class_name: 'Grade 12-A1', section_name: 'Section A1', day_of_week: 'Monday', period_number: 2, start_time: '09:15', end_time: '10:00', subject_name: 'Mathematics', faculty_name: 'R. Suresh', room_number: 'XII-A1' },
      { id: '8', class_name: 'Grade 10-A', section_name: 'Section A', day_of_week: 'Monday', period_number: 1, start_time: '08:30', end_time: '09:15', subject_name: 'Science', faculty_name: 'Meena Devi', room_number: 'Room 101' },
    ];
  }

  // ==========================================
  // 10. CALENDAR & EVENTS
  // ==========================================
  static async getCalendarEvents(): Promise<AdminCalendarEventItem[]> {
    await delay();
    const storage = getStorage();
    const saved = storage.getItem(STORAGE_CALENDAR_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to defaults
      }
    }

    const defaultEvents: AdminCalendarEventItem[] = [
      {
        id: 'evt_001',
        title: 'Half-Yearly Examination 2026',
        category: 'Examination',
        description: 'Comprehensive term examinations across all grades (Class 10, 11 & 12).',
        start_date: '2026-10-12',
        end_date: '2026-10-22',
        start_time: '08:30',
        end_time: '12:30',
        location: 'Main Examination Halls & Classrooms',
        target_audience: 'All Students & Faculty',
        academic_relevance: 'Term 1 Evaluative Component',
        od_eligible: false,
        is_holiday: false,
      },
      {
        id: 'evt_002',
        title: 'Annual Science & Technology Exhibition',
        category: 'Academic',
        description: 'Student science working models, coding projects, and mathematics olympiad showcase.',
        start_date: '2026-10-28',
        end_date: '2026-10-28',
        start_time: '09:00',
        end_time: '15:30',
        location: 'School Auditorium & Open Amphitheatre',
        target_audience: 'Students, Faculty, Parents, Principals',
        academic_relevance: 'Co-Curricular Exhibition (OD Applicable)',
        od_eligible: true,
        is_holiday: false,
      },
      {
        id: 'evt_003',
        title: 'Diwali & Autumn School Holidays',
        category: 'Holiday',
        description: 'School closed for festive break; administrative and academic sessions resume after holidays.',
        start_date: '2026-11-01',
        end_date: '2026-11-05',
        location: 'All Campus Blocks',
        target_audience: 'School-Wide',
        academic_relevance: 'Official Institutional Vacation',
        od_eligible: false,
        is_holiday: true,
      },
      {
        id: 'evt_004',
        title: 'Parent-Teacher Meeting (Term 1 Review)',
        category: 'PTM',
        description: 'Term 1 progress report card distribution and one-on-one discussion with class teachers.',
        start_date: '2026-11-14',
        end_date: '2026-11-14',
        start_time: '09:00',
        end_time: '14:00',
        location: 'Respective Assigned Classrooms',
        target_audience: 'Parents & Class Teachers',
        academic_relevance: 'Parent-School Collaborative Evaluation',
        od_eligible: false,
        is_holiday: false,
      },
    ];

    storage.setItem(STORAGE_CALENDAR_KEY, JSON.stringify(defaultEvents));
    return defaultEvents;
  }

  static async addCalendarEvent(input: AdminEventInput): Promise<AdminCalendarEventItem> {
    await delay();
    const current = await this.getCalendarEvents();
    const newEvent: AdminCalendarEventItem = {
      id: `evt_${Date.now()}`,
      title: input.title,
      category: input.category,
      description: input.description,
      start_date: input.start_date,
      end_date: input.end_date,
      start_time: input.start_time,
      end_time: input.end_time,
      location: input.location,
      target_audience: input.target_audience,
      academic_relevance: input.academic_relevance || 'General School Event',
      od_eligible: input.od_eligible,
      is_holiday: input.is_holiday,
    };

    const updated = [newEvent, ...current];
    getStorage().setItem(STORAGE_CALENDAR_KEY, JSON.stringify(updated));
    return newEvent;
  }

  // ==========================================
  // 11. CLASS / SECTION ALLOCATION WORKSPACE
  // ==========================================

  /**
   * Loads candidate students and target sections for an allocation batch.
   * CRITICAL STREAM-AWARE RULE:
   * For Grades 11–12, allocation is strictly scoped to the selected stream.
   * e.g., Grade 11 Computer Science A students are ONLY allocated to A1, A2, or A3.
   */
  static async getAllocationWorkspace(grade: string, stream?: string): Promise<{
    sourceStudents: AllocationSourceStudent[];
    targetSections: AllocationTargetSection[];
  }> {
    await delay();
    const classes = await this.getClassesAndSections();

    // 1. Identify target sections
    let targetSections: AllocationTargetSection[] = [];
    if (grade === 'Grade 10') {
      const g10 = classes.find((c) => c.grade_level === 10);
      if (g10) {
        targetSections = g10.sections.map((s) => ({
          section_id: s.id,
          section_name: `Grade 10 — ${s.name}`,
          room: s.room,
          capacity: s.capacity,
          current_enrolled: s.enrolled_count,
          target_intake: s.capacity - s.enrolled_count,
        }));
      }
    } else if (grade === 'Grade 11') {
      // Find class matching stream
      const matchedClass = classes.find(
        (c) => c.grade_level === 11 && (stream ? c.stream === stream : true)
      );
      if (matchedClass) {
        targetSections = matchedClass.sections.map((s) => ({
          section_id: s.id,
          section_name: `${matchedClass.stream ? matchedClass.stream : 'Senior'} (${s.name})`,
          room: s.room,
          capacity: s.capacity,
          current_enrolled: s.enrolled_count,
          target_intake: s.capacity - s.enrolled_count,
        }));
      }
    } else if (grade === 'Grade 12') {
      const g12 = classes.find((c) => c.grade_level === 12);
      if (g12) {
        targetSections = g12.sections.map((s) => ({
          section_id: s.id,
          section_name: `Grade 12 — ${s.name}`,
          room: s.room,
          capacity: s.capacity,
          current_enrolled: s.enrolled_count,
          target_intake: s.capacity - s.enrolled_count,
        }));
      }
    }

    // Default target sections if none matched
    if (targetSections.length === 0) {
      targetSections = [
        { section_id: 'sec_target_1', section_name: `${stream || grade} — Section 1`, room: 'Room 201', capacity: 35, current_enrolled: 25, target_intake: 10 },
        { section_id: 'sec_target_2', section_name: `${stream || grade} — Section 2`, room: 'Room 202', capacity: 35, current_enrolled: 24, target_intake: 11 },
        { section_id: 'sec_target_3', section_name: `${stream || grade} — Section 3`, room: 'Room 203', capacity: 35, current_enrolled: 22, target_intake: 13 },
      ];
    }

    // 2. Candidate Student Pool
    // For Grade 11 CS: Arun Kumar, Keerthana, Karthik, etc.
    const sourceStudents: AllocationSourceStudent[] = [
      { student_id: 'STU202600001', student_name: 'Arun Kumar', gender: 'Male', current_grade: grade, qualifying_marks: 96.5, merit_rank: 4, current_section: 'Section A2', status: 'Unassigned' },
      { student_id: 'STU202600002', student_name: 'Priya S', gender: 'Female', current_grade: grade, qualifying_marks: 98.2, merit_rank: 1, current_section: 'Section A2', status: 'Unassigned' },
      { student_id: 'STU202600003', student_name: 'Aditya Sharma', gender: 'Male', current_grade: grade, qualifying_marks: 97.8, merit_rank: 2, current_section: 'Section B1', status: 'Unassigned' },
      { student_id: 'STU202600004', student_name: 'Keerthana M', gender: 'Female', current_grade: grade, qualifying_marks: 94.0, merit_rank: 6, current_section: 'Section A', status: 'Unassigned' },
      { student_id: 'STU202600005', student_name: 'Rahul Raj', gender: 'Male', current_grade: grade, qualifying_marks: 88.0, merit_rank: 12, current_section: 'Section C1', status: 'Unassigned' },
      { student_id: 'STU202600006', student_name: 'Ananya R', gender: 'Female', current_grade: grade, qualifying_marks: 79.5, merit_rank: 29, current_section: 'Section D1', status: 'Unassigned' },
      { student_id: 'STU202600007', student_name: 'M. Vignesh', gender: 'Male', current_grade: grade, qualifying_marks: 92.4, merit_rank: 8, current_section: 'Unassigned', status: 'Unassigned' },
      { student_id: 'STU202600008', student_name: 'Deepika Sundaram', gender: 'Female', current_grade: grade, qualifying_marks: 95.0, merit_rank: 5, current_section: 'Unassigned', status: 'Unassigned' },
    ];

    return { sourceStudents, targetSections };
  }

  /**
   * Generates a preview of allocation before committing.
   * Supports:
   * 1. MERIT-BASED: Students sorted descending by qualifying marks and distributed round-robin.
   * 2. RANDOM: Seeded pseudo-random distribution across selected target sections.
   *
   * STREAM-AWARE GOVERNANCE:
   * Grades 11–12 must strictly assign students to sections of that selected stream only.
   */
  static generateAllocationPreview(params: {
    grade: string;
    stream?: string;
    method: AllocationMethod;
    targetSections: string[];
    students: AllocationSourceStudent[];
  }): AllocationPreviewRecord[] {
    const { method, targetSections, students } = params;
    if (targetSections.length === 0 || students.length === 0) return [];

    let orderedStudents = [...students];

    if (method === 'MERIT') {
      // Sort strictly by qualifying marks descending (Rank 1 to N)
      orderedStudents.sort((a, b) => b.qualifying_marks - a.qualifying_marks);
    } else {
      // Deterministic pseudo-random shuffle (seeded by student_id char codes)
      orderedStudents.sort((a, b) => {
        const hashA = a.student_id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
        const hashB = b.student_id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
        return (hashA * 13) % 17 - (hashB * 13) % 17;
      });
    }

    // Distribute round-robin among target sections
    return orderedStudents.map((s, index) => {
      const sectionIndex = index % targetSections.length;
      const proposedSection = targetSections[sectionIndex];

      return {
        student_id: s.student_id,
        student_name: s.student_name,
        gender: s.gender,
        current_section: s.current_section || 'Unassigned',
        proposed_section: proposedSection,
        basis: method === 'MERIT' ? 'Merit Score' : 'Random Seeded',
        score: s.qualifying_marks,
        merit_rank: s.merit_rank,
      };
    });
  }

  /**
   * Commits the allocation preview into mock storage.
   * Updates student allocations and writes to allocation history.
   */
  static async publishAllocation(params: {
    academicYear: string;
    grade: string;
    stream?: string;
    method: AllocationMethod;
    publishedBy: string;
    notes?: string;
    previewRecords: AllocationPreviewRecord[];
  }): Promise<AllocationHistoryRecord> {
    await delay();
    const storage = getStorage();

    // 1. Update students section state
    const savedAllocationsRaw = storage.getItem(STORAGE_ALLOCATED_STUDENTS_KEY);
    const savedAllocations: Record<string, string> = savedAllocationsRaw
      ? JSON.parse(savedAllocationsRaw)
      : {};

    params.previewRecords.forEach((rec) => {
      savedAllocations[rec.student_id] = rec.proposed_section;
    });
    storage.setItem(STORAGE_ALLOCATED_STUDENTS_KEY, JSON.stringify(savedAllocations));

    // 2. Append to allocation history
    const history = await this.getAllocationHistory();
    const newEntry: AllocationHistoryRecord = {
      id: `alloc_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      academic_year: params.academicYear,
      grade: params.grade,
      stream: params.stream,
      allocation_method: params.method,
      student_count: params.previewRecords.length,
      published_by: params.publishedBy || 'School Administrator',
      status: 'Committed',
      notes: params.notes || `Allocated ${params.previewRecords.length} students via ${params.method === 'MERIT' ? 'Merit-Based' : 'Random Seeded'} method.`,
    };

    const updatedHistory = [newEntry, ...history];
    storage.setItem(STORAGE_ALLOCATION_HISTORY_KEY, JSON.stringify(updatedHistory));

    return newEntry;
  }

  /**
   * Retrieves allocation history ledger.
   */
  static async getAllocationHistory(): Promise<AllocationHistoryRecord[]> {
    await delay();
    const storage = getStorage();
    const saved = storage.getItem(STORAGE_ALLOCATION_HISTORY_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }

    const defaultHistory: AllocationHistoryRecord[] = [
      {
        id: 'alloc_001',
        date: '2026-06-15',
        academic_year: '2026–27',
        grade: 'Grade 11',
        stream: 'Computer Science A',
        allocation_method: 'MERIT',
        student_count: 90,
        published_by: 'K. Narayanan (Admin)',
        status: 'Committed',
        notes: 'Initial senior secondary section distribution across A1, A2, A3 based on Board qualifying merit.',
      },
      {
        id: 'alloc_002',
        date: '2026-06-16',
        academic_year: '2026–27',
        grade: 'Grade 11',
        stream: 'Bio-Maths B',
        allocation_method: 'MERIT',
        student_count: 96,
        published_by: 'K. Narayanan (Admin)',
        status: 'Committed',
        notes: 'Merit-based sectioning for Bio-Maths B across Sections B1, B2, B3.',
      },
      {
        id: 'alloc_003',
        date: '2026-06-18',
        academic_year: '2026–27',
        grade: 'Grade 10',
        stream: undefined,
        allocation_method: 'RANDOM',
        student_count: 74,
        published_by: 'K. Narayanan (Admin)',
        status: 'Committed',
        notes: 'Heterogeneous balanced random distribution across Grade 10 Sections A & B.',
      },
    ];

    storage.setItem(STORAGE_ALLOCATION_HISTORY_KEY, JSON.stringify(defaultHistory));
    return defaultHistory;
  }
}
