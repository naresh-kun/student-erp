import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { 
  MockDataService, 
  StudentDirectoryItem, 
  FacultyDirectoryItem, 
  ParentDirectoryItem,
  AllocationPreviewItem,
  type AdminClassSectionItem,
  type AdminSubjectCatalogItem,
  type AdminAttendanceAuditRecord,
  type AdminExamSummaryRecord,
  type AdminMasterTimetableEntry,
  type AdminCalendarNoticeItem
} from '@/services/mockService';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Download, 
  CheckCircle2, 
  Play, 
  Check, 
  FileText
} from 'lucide-react';
import { SCHOOL_CONFIG } from '@/config/schoolConfig';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { getGradeBadgeClass } from '@/utils/grading';

// ==========================================
// 1. ADMIN DASHBOARD
// ==========================================
export const AdminDashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      MockDataService.getSchoolKPIs(),
      MockDataService.getMonthlyAttendanceTrend(),
    ]).then(([kpiData, trend]) => {
      setKpis(kpiData);
      setAttendanceTrend(trend);
    });
  }, []);

  if (!kpis) {
    return (
      <PageContainer>
        <LoadingState message="Loading administrative oversight console..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Admin Executive Header */}
      <div className="p-6 md:p-7 rounded-xl bg-blue-900 text-white shadow-sm border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-blue-800 text-blue-100 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>School Administration Office • Academic Year {SCHOOL_CONFIG.academicYear}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{SCHOOL_CONFIG.name} Administration</h1>
          <p className="text-blue-200 text-xs md:text-sm">
            Institutional admissions, faculty records, student allocation, and academic governance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="bg-white text-blue-950 hover:bg-blue-50 text-xs font-semibold">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Student Admission
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Enrollment</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">
            {kpis.total_students}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Grades 9 through 12</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Teaching Faculty</span>
          <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400 block mt-1">
            {kpis.total_faculty}
          </span>
          <span className="text-[11px] text-slate-500">Student-Teacher: {kpis.student_teacher_ratio}</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-teal-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Active Classes & Sections</span>
          <span className="text-2xl font-black text-teal-700 dark:text-teal-400 block mt-1">
            {kpis.active_classes}
          </span>
          <span className="text-[11px] text-slate-400">4 Approved Senior Streams</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">School Attendance Today</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">
            {kpis.overall_attendance_rate}%
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Above 90% School Target</span>
        </Card>
      </div>

      {/* Trends & Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Institutional Attendance Pattern</CardTitle>
            <CardDescription>Aggregate student presence across all grades (P + OD verified)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[75, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                  <Tooltip formatter={(val) => [`${val}%`, 'School Attendance']} />
                  <Area type="monotone" dataKey="attendance" name="School Attendance %" stroke="#1d4ed8" strokeWidth={2.5} fill="#bfdbfe" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Health Card */}
        <Card className="lg:col-span-1 p-5 space-y-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700" /> Operational Overview
          </CardTitle>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Academic Term State
              </span>
              <strong className="font-semibold">Term 1 Active</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
              <span>Grade 11 Stream Allocation</span>
              <strong>Committed (4 Streams)</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span>Next Examination Period</span>
              <strong className="text-slate-700 dark:text-slate-300">Quarterly (15/10/2026)</strong>
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" className="w-full text-xs">
              <FileText className="w-3.5 h-3.5 mr-1" /> View Institutional Audit Log
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

// ==========================================
// 2. ADMIN STUDENTS DIRECTORY
// ==========================================
export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentDirectoryItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    MockDataService.getStudentDirectory().then(setStudents);
  }, []);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.admission_number.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer>
      <SectionHeader 
        title="Student Master Directory" 
        description="Search, inspect, and manage student enrollments, Student IDs, and academic records"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1" /> Export Registry (CSV)
            </Button>
            <Button variant="default" size="sm" className="text-xs bg-blue-900 hover:bg-blue-800">
              <Plus className="w-3.5 h-3.5 mr-1" /> Enroll New Student
            </Button>
          </div>
        }
      />

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <Search className="w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name, Student ID (e.g. STU202600001), roll number, or admission ID..."
          className="w-full bg-transparent text-xs outline-none text-slate-800 dark:text-slate-200" 
        />
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Admission No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Class & Section</th>
                  <th className="py-2.5 px-3">Stream</th>
                  <th className="py-2.5 px-3">Attendance %</th>
                  <th className="py-2.5 px-3">Academic %</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Parent / Guardian</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">{s.student_id}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{s.roll_number}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{s.admission_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{s.class_name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.stream || '—'}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">{s.attendance_rate}%</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{s.percentage}%</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getGradeBadgeClass(s.grade)}`}>
                        {s.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{s.parent_name}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" className="text-[10px]">{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

// ==========================================
// 3. ADMIN PARENTS DIRECTORY
// ==========================================
export const AdminParentsPage: React.FC = () => {
  const [parents, setParents] = useState<ParentDirectoryItem[]>([]);

  useEffect(() => {
    MockDataService.getParentDirectory().then(setParents);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Parent & Guardian Directory" 
        description="Parent contact directory with linked student IDs and school communication records"
      />

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Guardian Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Phone Number</th>
                  <th className="py-2.5 px-3">Linked Wards / Students</th>
                  <th className="py-2.5 px-3">Residential Address</th>
                  <th className="py-2.5 px-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parents.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{p.email}</td>
                    <td className="py-2.5 px-3 font-mono">{p.phone}</td>
                    <td className="py-2.5 px-3">
                      {p.children.map((c) => (
                        <Badge key={c.id} variant="outline" className="text-[10px] mr-1">
                          {c.name} ({c.class_name})
                        </Badge>
                      ))}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{p.address}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" className="text-[10px]">{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

// ==========================================
// 4. ADMIN FACULTY DIRECTORY
// ==========================================
export const AdminFacultyPage: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyDirectoryItem[]>([]);

  useEffect(() => {
    MockDataService.getFacultyDirectory().then(setFaculty);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Faculty & Teaching Staff Register" 
        description="Academic personnel directory, department designations, and instructional period workloads"
        actions={
          <Button variant="default" size="sm" className="text-xs bg-blue-900 hover:bg-blue-800">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Faculty Member
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Faculty Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Assigned Classes & Sections</th>
                  <th className="py-2.5 px-3">Weekly Workload</th>
                  <th className="py-2.5 px-3">Official Email</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{f.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{f.department}</td>
                    <td className="py-2.5 px-3 text-slate-500">{f.designation}</td>
                    <td className="py-2.5 px-3">
                      {f.assigned_classes.map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px] mr-1">{c}</Badge>
                      ))}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium">{f.workload_hours} Periods / wk</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{f.email}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" className="text-[10px]">{f.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

// ==========================================
// 5. ADMIN CLASSES & SECTIONS
// ==========================================
export const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<AdminClassSectionItem[]>([]);

  useEffect(() => {
    MockDataService.getClassSections().then(setClasses);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Classrooms, Streams & Academic Sections" 
        description="Class section management, stream allocations (Grades 11–12), and assigned class teachers"
        actions={
          <Button variant="default" size="sm" className="text-xs bg-blue-900 hover:bg-blue-800">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add New Section
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls, i) => {
          const utilPct = Math.round((cls.enrolled / cls.capacity) * 100);
          return (
            <Card key={i} className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{cls.name}</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">{cls.stream}</p>
                </div>
                <Badge variant={utilPct >= 95 ? 'warning' : 'outline'} className="text-[10px]">
                  {utilPct}% Enrolled
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <p>Class Teacher: <strong className="text-slate-800 dark:text-slate-200">{cls.teacher}</strong></p>
                <p>Room: <strong className="text-slate-800 dark:text-slate-200">{cls.room}</strong></p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Enrolled: {cls.enrolled}</span>
                  <span>Max: {cls.capacity}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${utilPct}%` }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
};

// ==========================================
// 6. ADMIN SUBJECTS CATALOG
// ==========================================
export const AdminSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<AdminSubjectCatalogItem[]>([]);

  useEffect(() => {
    MockDataService.getSubjectsCatalog().then(setSubjects);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Academic Subjects & Curriculum Register" 
        description="Departmental subject offerings, weekly period framework, and syllabus management"
      />

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Subject Code</th>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Weekly Periods</th>
                  <th className="py-2.5 px-3">Faculty Assigned</th>
                  <th className="py-2.5 px-3">Curriculum Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjects.map((sub) => (
                  <tr key={sub.code} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">{sub.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{sub.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{sub.department}</td>
                    <td className="py-2.5 px-3 font-mono font-medium">{sub.weekly_periods} Periods / wk</td>
                    <td className="py-2.5 px-3">{sub.facultyCount} Teachers</td>
                    <td className="py-2.5 px-3"><Badge variant="success" className="text-[10px]">{sub.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

// ==========================================
// 7. ADMIN ATTENDANCE AUDIT
// ==========================================
export const AdminAttendancePage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AdminAttendanceAuditRecord[]>([]);

  useEffect(() => {
    MockDataService.getAttendanceAuditLogs().then(setAuditLogs);
  }, []);

  const totalEnrolled = auditLogs.reduce((acc, log) => acc + log.total, 0);
  const totalPresent = auditLogs.reduce((acc, log) => acc + log.present, 0);
  const totalOnDuty = auditLogs.reduce((acc, log) => acc + log.onDuty, 0);
  const totalAbsent = auditLogs.reduce((acc, log) => acc + log.absent, 0);
  const totalLeave = auditLogs.reduce((acc, log) => acc + log.leave, 0);

  const aggregateRate = totalEnrolled > 0
    ? Number((((totalPresent + totalOnDuty) / totalEnrolled) * 100).toFixed(1))
    : 0;

  return (
    <PageContainer>
      <SectionHeader 
        title="Institutional Attendance Audit" 
        description="School-wide presence audit, absenteeism records, and canonical 4-status reconciliation"
      />

      {/* Institutional KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-500 font-medium">Total Present</span>
          <span className="text-xl font-black text-emerald-600 block mt-0.5">{totalPresent}</span>
          <span className="text-[10px] text-slate-400">Classroom presence</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-500">
          <span className="text-xs text-slate-500 font-medium">On Duty</span>
          <span className="text-xl font-black text-blue-600 block mt-0.5">{totalOnDuty}</span>
          <span className="text-[10px] text-slate-400">School activity (Present)</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-amber-500">
          <span className="text-xs text-slate-500 font-medium">Approved Leave</span>
          <span className="text-xl font-black text-amber-600 block mt-0.5">{totalLeave}</span>
          <span className="text-[10px] text-slate-400">Faculty-approved (Absence)</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-rose-500">
          <span className="text-xs text-slate-500 font-medium">Unapproved Absent</span>
          <span className="text-xl font-black text-rose-600 block mt-0.5">{totalAbsent}</span>
          <span className="text-[10px] text-slate-400">Unjustified absence</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-indigo-500 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 font-medium">Attendance Rate</span>
          <span className="text-xl font-black text-indigo-600 block mt-0.5">{aggregateRate}%</span>
          <span className="text-[10px] text-slate-400">([P + OD] / Total)</span>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Section Attendance Audit Ledger</CardTitle>
          <CardDescription className="text-xs">
            Calculated per approved school formula: <code>Attendance % = (Present + On Duty) / (Present + Absent + On Duty + Leave) × 100</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Audit Date</th>
                  <th className="py-2.5 px-3">Class & Section</th>
                  <th className="py-2.5 px-3">Enrolled</th>
                  <th className="py-2.5 px-3">Present</th>
                  <th className="py-2.5 px-3">On Duty</th>
                  <th className="py-2.5 px-3">Approved Leave</th>
                  <th className="py-2.5 px-3">Absent</th>
                  <th className="py-2.5 px-3">Attendance Rate</th>
                  <th className="py-2.5 px-3">Verified Faculty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono">{log.date}</td>
                    <td className="py-2.5 px-3 font-semibold">{log.class}</td>
                    <td className="py-2.5 px-3 font-medium">{log.total}</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">{log.present}</td>
                    <td className="py-2.5 px-3 text-blue-600 font-bold">{log.onDuty}</td>
                    <td className="py-2.5 px-3 text-amber-600 font-bold">{log.leave}</td>
                    <td className="py-2.5 px-3 text-rose-600 font-bold">{log.absent}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-indigo-600">{log.rate}</td>
                    <td className="py-2.5 px-3 text-slate-500">{log.verifiedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

// ==========================================
// 8. ADMIN MARKS & EXAMS REGISTRY
// ==========================================
export const AdminMarksPage: React.FC = () => {
  const [examSummaries, setExamSummaries] = useState<AdminExamSummaryRecord[]>([]);

  useEffect(() => {
    MockDataService.getExamSummaries().then(setExamSummaries);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Examination & Marks Audit Registry" 
        description="School examination series benchmarks, section average marks, and pass percentages"
      />

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Class & Section</th>
                  <th className="py-2.5 px-3">Examination Series</th>
                  <th className="py-2.5 px-3">Evaluated Students</th>
                  <th className="py-2.5 px-3">Section Average %</th>
                  <th className="py-2.5 px-3">Highest Score</th>
                  <th className="py-2.5 px-3">Pass Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {examSummaries.map((ex, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold">{ex.class}</td>
                    <td className="py-2.5 px-3 text-slate-500">{ex.exam}</td>
                    <td className="py-2.5 px-3 font-mono">{ex.students}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-blue-700 dark:text-blue-400">{ex.avg}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">{ex.highest}</td>
                    <td className="py-2.5 px-3 font-bold text-indigo-600">{ex.passRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

// ==========================================
// 9. ADMIN MASTER TIMETABLE
// ==========================================
export const AdminTimetablePage: React.FC = () => {
  const [timetableEntries, setTimetableEntries] = useState<AdminMasterTimetableEntry[]>([]);

  useEffect(() => {
    MockDataService.getMasterTimetableEntries().then(setTimetableEntries);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Master School Timetable" 
        description="Facility allocation, period scheduling matrix, and instructor collision detection"
        actions={
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Export Master PDF
          </Button>
        }
      />

      <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Collision Detection Active: <strong>Zero scheduling conflicts</strong> identified across 48 classrooms and 86 faculty members.</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monday Master Grid Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Class & Section</th>
                  <th className="py-2.5 px-3">Period 1 (08:30)</th>
                  <th className="py-2.5 px-3">Period 2 (09:15)</th>
                  <th className="py-2.5 px-3">Period 3 (10:15)</th>
                  <th className="py-2.5 px-3">Period 4 (11:00)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {timetableEntries.map((entry, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold">{entry.class}</td>
                    <td className="py-2.5 px-3">{entry.period1}</td>
                    <td className="py-2.5 px-3">{entry.period2}</td>
                    <td className="py-2.5 px-3">{entry.period3}</td>
                    <td className="py-2.5 px-3">{entry.period4}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

// ==========================================
// 10. ADMIN CALENDAR MANAGEMENT
// ==========================================
export const AdminCalendarPage: React.FC = () => {
  const [notices, setNotices] = useState<AdminCalendarNoticeItem[]>([]);

  useEffect(() => {
    MockDataService.getCalendarNotices().then(setNotices);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Academic Calendar & Event Notices" 
        description="Publish institutional events, examinations, parent-teacher meetings, and school holidays"
        actions={
          <Button variant="default" size="sm" className="text-xs bg-blue-900 hover:bg-blue-800">
            <Plus className="w-3.5 h-3.5 mr-1" /> Publish New Notice
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices.map((n, i) => (
          <Card key={i} className="p-5 space-y-2">
            <div className="flex justify-between items-center">
              <Badge variant={n.category === 'Examination' ? 'destructive' : n.category === 'PTM' ? 'default' : 'warning'} className="text-[10px]">
                {n.category}
              </Badge>
              <span className="text-xs font-mono text-slate-500">{n.date}</span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{n.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">{n.target}</p>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};

// ==========================================
// 11. ADMIN ALLOCATION ENGINE
// ==========================================
export const AdminAllocationPage: React.FC = () => {
  const [allocations, setAllocations] = useState<AllocationPreviewItem[]>([]);
  const [ranSimulation, setRanSimulation] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    MockDataService.getAllocationPreview().then(setAllocations);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Senior Secondary Stream & Section Allocation" 
        description="Merit-based Grade 11 stream allocation across Computer Science A, Bio-Maths B, Commerce C, and Pure Science D"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setRanSimulation(true)}
              className="text-xs"
            >
              <Play className="w-3.5 h-3.5 mr-1" /> Re-run Stream Allocation
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setPublished(true)}
              className="text-xs bg-blue-900 hover:bg-blue-800"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Commit & Publish Allocations
            </Button>
          </div>
        }
      />

      {ranSimulation && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
          <span>Allocation algorithm re-calculated across Grade 11 applicants using board exam merit marks.</span>
          <Button variant="ghost" size="sm" onClick={() => setRanSimulation(false)} className="text-xs h-7">Dismiss</Button>
        </div>
      )}

      {published && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>Allocations committed. Student portal rosters, stream assignments, and timetables updated.</span>
          <Button variant="ghost" size="sm" onClick={() => setPublished(false)} className="text-xs h-7">Dismiss</Button>
        </div>
      )}

      {/* Allocation Parameters Card */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-slate-500 font-medium">Target Academic Level</span>
          <strong className="block text-slate-800 dark:text-slate-200 font-bold mt-0.5">Grade 11 Admissions</strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Allocation Criteria</span>
          <strong className="block text-slate-800 dark:text-slate-200 font-bold mt-0.5">Merit Marks + Stream Pref</strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Section Capacity</span>
          <strong className="block text-slate-800 dark:text-slate-200 font-bold mt-0.5">35 Students / Section</strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Stream Structure</span>
          <strong className="block text-blue-700 dark:text-blue-400 font-bold mt-0.5">4 Approved Streams</strong>
        </div>
      </Card>

      {/* Allocation Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proposed Stream & Section Allocation Register</CardTitle>
          <CardDescription>
            Grades 11–12 support exactly one stream and one section within that stream (e.g. Computer Science A, Bio-Maths B, Commerce C, Pure Science D)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Merit Rank</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Marks Obtained (%)</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Allocated Stream & Section</th>
                  <th className="py-2.5 px-3">Allocation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allocations.map((a) => (
                  <tr key={a.student_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold">#{a.merit_rank}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">{a.student_id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{a.student_name}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-emerald-600">{a.score}%</td>
                    <td className="py-2.5 px-3 text-slate-500">{a.gender}</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-900 dark:text-blue-300">{a.allocated_section}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={a.status === 'Allocated' ? 'success' : 'warning'} className="text-[10px]">
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};
