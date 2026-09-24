import {
  LayoutDashboard,
  UserCheck,
  CalendarCheck,
  Award,
  Clock,
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  Briefcase,
  Layers,
  BookMarked,
  CheckSquare,
  FileSpreadsheet,
  Sliders,
  BarChart3,
  LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
}

export const ROLE_NAVIGATION: Record<UserRole, NavItem[]> = {
  Student: [
    {
      title: 'Dashboard',
      href: '/student/dashboard',
      icon: LayoutDashboard,
      description: 'Academic overview & schedule alerts',
    },
    {
      title: 'My Profile',
      href: '/student/profile',
      icon: UserCheck,
      description: 'Personal, contact & enrollment info',
    },
    {
      title: 'Attendance',
      href: '/student/attendance',
      icon: CalendarCheck,
      description: 'Subject & term attendance records',
    },
    {
      title: 'Marks & Grades',
      href: '/student/marks',
      icon: Award,
      description: 'Exam marks, GPA & report cards',
    },
    {
      title: 'Timetable',
      href: '/student/timetable',
      icon: Clock,
      description: 'Weekly schedule & classroom locations',
    },
    {
      title: 'Academic Calendar',
      href: '/student/calendar',
      icon: Calendar,
      description: 'Events, exams & campus holidays',
    },
  ],

  Parent: [
    {
      title: 'Dashboard',
      href: '/parent/dashboard',
      icon: LayoutDashboard,
      description: 'Children progress overview',
    },
    {
      title: 'My Children',
      href: '/parent/children',
      icon: Users,
      description: 'Detailed profiles of linked children',
    },
    {
      title: 'Attendance',
      href: '/parent/attendance',
      icon: CalendarCheck,
      description: 'Daily and session attendance logs',
    },
    {
      title: 'Marks & Grades',
      href: '/parent/marks',
      icon: Award,
      description: 'Term report cards & academic evaluations',
    },
    {
      title: 'Timetable',
      href: '/parent/timetable',
      icon: Clock,
      description: 'Class schedule & room information',
    },
    {
      title: 'Calendar',
      href: '/parent/calendar',
      icon: Calendar,
      description: 'Conferences, holidays & school events',
    },
  ],

  Faculty: [
    {
      title: 'Dashboard',
      href: '/faculty/dashboard',
      icon: LayoutDashboard,
      description: 'Teaching duties & pending actions',
    },
    {
      title: 'Assigned Classes',
      href: '/faculty/classes',
      icon: GraduationCap,
      description: 'Student rosters & section details',
    },
    {
      title: 'Mark Attendance',
      href: '/faculty/attendance',
      icon: CheckSquare,
      description: 'Record daily and lecture attendance',
    },
    {
      title: 'Marks & Grading',
      href: '/faculty/marks',
      icon: Award,
      description: 'Evaluation entry & mark submissions',
    },
    {
      title: 'Teaching Timetable',
      href: '/faculty/timetable',
      icon: Clock,
      description: 'Weekly schedule & assigned classrooms',
    },
  ],

  Admin: [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      description: 'System health & administrative actions',
    },
    {
      title: 'Students Directory',
      href: '/admin/students',
      icon: GraduationCap,
      description: 'Student records & enrollment status',
    },
    {
      title: 'Parents Directory',
      href: '/admin/parents',
      icon: Users,
      description: 'Parent accounts & guardian links',
    },
    {
      title: 'Faculty Directory',
      href: '/admin/faculty',
      icon: Briefcase,
      description: 'Staff directory & departments',
    },
    {
      title: 'Classes & Sections',
      href: '/admin/classes',
      icon: Layers,
      description: 'Grades, sections & room capacities',
    },
    {
      title: 'Subjects & Curriculum',
      href: '/admin/subjects',
      icon: BookMarked,
      description: 'Course catalog & academic credits',
    },
    {
      title: 'Attendance Records',
      href: '/admin/attendance',
      icon: CalendarCheck,
      description: 'School-wide attendance audit & overrides',
    },
    {
      title: 'Examination Marks',
      href: '/admin/marks',
      icon: Award,
      description: 'Institutional score records & grade locks',
    },
    {
      title: 'Master Timetable',
      href: '/admin/timetable',
      icon: Clock,
      description: 'Scheduling grid & conflict detection',
    },
    {
      title: 'Institutional Calendar',
      href: '/admin/calendar',
      icon: Calendar,
      description: 'Institutional events & holidays',
    },
    {
      title: 'Section Allocation',
      href: '/admin/allocation',
      icon: Sliders,
      description: 'Automated student distribution engine',
    },
  ],

  Principal: [
    {
      title: 'Executive Dashboard',
      href: '/principal/dashboard',
      icon: LayoutDashboard,
      description: 'Institutional KPIs & summary analytics',
    },
    {
      title: 'Academic Oversight',
      href: '/principal/academics',
      icon: BookOpen,
      description: 'Curriculum delivery & grade distributions',
    },
    {
      title: 'Attendance Analytics',
      href: '/principal/attendance',
      icon: BarChart3,
      description: 'Campus-wide attendance patterns & trends',
    },
    {
      title: 'Faculty Oversight',
      href: '/principal/faculty',
      icon: Briefcase,
      description: 'Staff allocation & workload review',
    },
    {
      title: 'Reports & Transcripts',
      href: '/principal/reports',
      icon: FileSpreadsheet,
      description: 'Accreditation summaries & sign-offs',
    },
  ],
};

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  Student: '/student/dashboard',
  Parent: '/parent/dashboard',
  Faculty: '/faculty/dashboard',
  Admin: '/admin/dashboard',
  Principal: '/principal/dashboard',
};
