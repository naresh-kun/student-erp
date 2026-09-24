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
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

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
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-800 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Central Administrative Console • Session 2025-2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Institutional Operations Center</h1>
          <p className="text-amber-100 text-xs md:text-sm">
            School-wide registrar control, resource allocation, and academic governance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="bg-white text-amber-900 hover:bg-amber-50 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Student Admission
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Enrollment</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">{kpis.total_students}</span>
          <span className="text-[11px] text-emerald-600 font-medium">99.4% Capacity Reached</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Teaching Faculty</span>
          <span className="text-2xl font-black text-amber-600 block mt-1">{kpis.total_faculty}</span>
          <span className="text-[11px] text-slate-400">Ratio: {kpis.student_teacher_ratio}</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Active Classrooms</span>
          <span className="text-2xl font-black text-blue-600 block mt-1">{kpis.active_classes}</span>
          <span className="text-[11px] text-slate-400">Grades 9 through 12</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Institution Attendance</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">{kpis.overall_attendance_rate}%</span>
          <span className="text-[11px] text-emerald-600 font-medium">Above 90% Target</span>
        </Card>
      </div>

      {/* Trends & Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Institutional Attendance Trend</CardTitle>
            <CardDescription>Aggregate student presence across all grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[75, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="attendance" name="School Attendance %" stroke="#d97706" strokeWidth={2.5} fill="#fde68a" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Health Card */}
        <Card className="lg:col-span-1 p-5 space-y-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> Operational Health
          </CardTitle>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> System State
              </span>
              <strong className="font-semibold">Healthy</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
              <span>Section Allocation</span>
              <strong>Simulated Ready</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span>Next Examination Period</span>
              <strong className="text-slate-700 dark:text-slate-300">March 15, 2026</strong>
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" className="w-full text-xs">
              <FileText className="w-3.5 h-3.5 mr-1" /> View Audit Telemetry
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
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer>
      <SectionHeader 
        title="Student Master Directory" 
        description="Search, inspect, and manage student enrollments across all academic grades"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1" /> Export Registry
            </Button>
            <Button variant="default" size="sm" className="text-xs bg-amber-600 hover:bg-amber-700">
              <Plus className="w-3.5 h-3.5 mr-1" /> Enroll Student
            </Button>
          </div>
        }
      />

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <Search className="w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name, roll number, or admission ID..."
          className="w-full bg-transparent text-xs outline-none text-slate-800 dark:text-slate-200" 
        />
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Admission ID</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Class & Section</th>
                  <th className="py-2.5 px-3">Attendance %</th>
                  <th className="py-2.5 px-3">Cumulative GPA</th>
                  <th className="py-2.5 px-3">Guardian Name</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{s.admission_number}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{s.roll_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.class_name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{s.attendance_rate}%</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{s.gpa}</td>
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
        description="Family contact directory with linked student mappings and communications history"
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
                  <th className="py-2.5 px-3">Linked Children</th>
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
                        <Badge key={c.id} variant="outline" className="text-[10px] mr-1">{c.name} ({c.class_name})</Badge>
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
        title="Faculty & Staff Master Register" 
        description="Academic personnel directory, department heads, and teaching workloads"
        actions={
          <Button variant="default" size="sm" className="text-xs bg-amber-600 hover:bg-amber-700">
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
                  <th className="py-2.5 px-3">Assigned Classes</th>
                  <th className="py-2.5 px-3">Weekly Hours</th>
                  <th className="py-2.5 px-3">Evaluation Rating</th>
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
                    <td className="py-2.5 px-3 font-mono">{f.workload_hours} hrs/wk</td>
                    <td className="py-2.5 px-3 font-bold text-amber-600">{f.rating} / 5.0</td>
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
        title="Classrooms & Academic Sections" 
        description="Section assignments, capacity limits, and assigned class coordinators"
        actions={
          <Button variant="default" size="sm" className="text-xs bg-amber-600 hover:bg-amber-700">
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
                  <p className="text-xs text-slate-500">{cls.stream}</p>
                </div>
                <Badge variant={utilPct >= 95 ? 'warning' : 'outline'} className="text-[10px]">
                  {utilPct}% Full
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <p>Class Teacher: <strong className="text-slate-800 dark:text-slate-200">{cls.teacher}</strong></p>
                <p>Location: <strong className="text-slate-800 dark:text-slate-200">{cls.room}</strong></p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Enrolled: {cls.enrolled}</span>
                  <span>Max: {cls.capacity}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${utilPct}%` }} />
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
        title="Curriculum & Course Catalog" 
        description="Departmental course offerings, credit frameworks, and syllabus management"
      />

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Credit Hours</th>
                  <th className="py-2.5 px-3">Faculty Assigned</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjects.map((sub) => (
                  <tr key={sub.code} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">{sub.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{sub.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{sub.department}</td>
                    <td className="py-2.5 px-3 font-mono">{sub.credits} Credits</td>
                    <td className="py-2.5 px-3">{sub.facultyCount} Instructors</td>
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
        description="School-wide presence telemetry, absenteeism reports, and Master Plan Amendment 2 status reconciliation"
      />

      {/* Institutional KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-500 font-medium">Total Present</span>
          <span className="text-xl font-black text-emerald-600 block mt-0.5">{totalPresent}</span>
          <span className="text-[10px] text-slate-400">Regular lecture presence</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-500">
          <span className="text-xs text-slate-500 font-medium">On Duty</span>
          <span className="text-xl font-black text-blue-600 block mt-0.5">{totalOnDuty}</span>
          <span className="text-[10px] text-slate-400">Institutional duty (Present)</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-purple-500">
          <span className="text-xs text-slate-500 font-medium">Approved Leave</span>
          <span className="text-xl font-black text-purple-600 block mt-0.5">{totalLeave}</span>
          <span className="text-[10px] text-slate-400">Faculty approved (Absence)</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-rose-500">
          <span className="text-xs text-slate-500 font-medium">Unapproved Absent</span>
          <span className="text-xl font-black text-rose-600 block mt-0.5">{totalAbsent}</span>
          <span className="text-[10px] text-slate-400">Unjustified absence</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-indigo-500 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 font-medium">Effective Presence %</span>
          <span className="text-xl font-black text-indigo-600 block mt-0.5">{aggregateRate}%</span>
          <span className="text-[10px] text-slate-400">([P + OD] / Total)</span>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Section Attendance Audit Ledger</CardTitle>
          <CardDescription className="text-xs">
            Calculated per Master Plan Amendment 2 formula: <code>Attendance % = (Present + On Duty) / (Present + Absent + On Duty + Leave) × 100</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Audit Date</th>
                  <th className="py-2.5 px-3">Class Section</th>
                  <th className="py-2.5 px-3">Enrolled</th>
                  <th className="py-2.5 px-3">Present</th>
                  <th className="py-2.5 px-3">On Duty</th>
                  <th className="py-2.5 px-3">Leave</th>
                  <th className="py-2.5 px-3">Absent</th>
                  <th className="py-2.5 px-3">Attendance %</th>
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
                    <td className="py-2.5 px-3 text-purple-600 font-bold">{log.leave}</td>
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
        title="Examination & Grade Audit Registry" 
        description="Term examination benchmarks, grade moderation, and institutional pass rates"
      />

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Class Section</th>
                  <th className="py-2.5 px-3">Examination Series</th>
                  <th className="py-2.5 px-3">Evaluated Students</th>
                  <th className="py-2.5 px-3">Section Average</th>
                  <th className="py-2.5 px-3">Top Score</th>
                  <th className="py-2.5 px-3">Pass Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {examSummaries.map((ex, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold">{ex.class}</td>
                    <td className="py-2.5 px-3 text-slate-500">{ex.exam}</td>
                    <td className="py-2.5 px-3 font-mono">{ex.students}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-amber-600">{ex.avg}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">{ex.highest}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-600">{ex.passRate}</td>
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
        title="Master Institutional Timetable" 
        description="Facility allocation, scheduling matrix, and instructor collision detection"
        actions={
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Export Master PDF
          </Button>
        }
      />

      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Collision Detection Active: <strong>Zero scheduling conflicts</strong> identified across 24 classrooms and 78 instructors.</span>
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
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Period 1 (08:30)</th>
                  <th className="py-2.5 px-3">Period 2 (09:30)</th>
                  <th className="py-2.5 px-3">Period 3 (10:40)</th>
                  <th className="py-2.5 px-3">Period 4 (11:40)</th>
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
        title="Academic Calendar Publisher" 
        description="Publish institutional events, exam periods, campus holidays, and notice bulletins"
        actions={
          <Button variant="default" size="sm" className="text-xs bg-amber-600 hover:bg-amber-700">
            <Plus className="w-3.5 h-3.5 mr-1" /> Publish New Notice
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices.map((n, i) => (
          <Card key={i} className="p-5 space-y-2">
            <div className="flex justify-between items-center">
              <Badge variant={n.category === 'Examination' ? 'destructive' : 'warning'} className="text-[10px]">{n.category}</Badge>
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
        title="Automated Section Allocation Engine" 
        description="Merit-based and quota-balanced student section distribution preview"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setRanSimulation(true)}
              className="text-xs"
            >
              <Play className="w-3.5 h-3.5 mr-1" /> Re-run Algorithm
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setPublished(true)}
              className="text-xs bg-amber-600 hover:bg-amber-700"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Commit & Publish Allocation
            </Button>
          </div>
        }
      />

      {ranSimulation && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
          <span>Allocation algorithm re-calculated across 32 candidates using merit score ranking.</span>
          <Button variant="ghost" size="sm" onClick={() => setRanSimulation(false)} className="text-xs h-7">Dismiss</Button>
        </div>
      )}

      {published && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>Allocations committed. Student portal rosters and timetable assignments updated.</span>
          <Button variant="ghost" size="sm" onClick={() => setPublished(false)} className="text-xs h-7">Dismiss</Button>
        </div>
      )}

      {/* Allocation Parameters Card */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-slate-500 font-medium">Target Stream</span>
          <strong className="block text-slate-800 dark:text-slate-200 font-bold mt-0.5">Grade 11 Admissions</strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Allocation Rule</span>
          <strong className="block text-slate-800 dark:text-slate-200 font-bold mt-0.5">Merit Rank + Balance</strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Section Capacity</span>
          <strong className="block text-slate-800 dark:text-slate-200 font-bold mt-0.5">35 Max / Section</strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Engine Status</span>
          <strong className="block text-emerald-600 font-bold mt-0.5">Preview Verified</strong>
        </div>
      </Card>

      {/* Allocation Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proposed Section Distribution Register</CardTitle>
          <CardDescription>Generated based on entrance test scores and gender quota balancing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Merit Rank</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Proposed Section Allocation</th>
                  <th className="py-2.5 px-3">Allocation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allocations.map((a) => (
                  <tr key={a.student_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold">#{a.merit_rank}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{a.student_name}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-amber-600">{a.score}%</td>
                    <td className="py-2.5 px-3 text-slate-500">{a.gender}</td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">{a.allocated_section}</td>
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
