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
  type FacultyTodayLectureItem,
  type FacultyAssignedClassSummary,
  type FacultyGradeDistributionItem,
  type FacultyStudentGradeItem,
  type FacultyTimetableSlotItem
} from '@/services/mockService';
import { 
  BookOpen, 
  CalendarCheck, 
  CheckCircle2, 
  Download, 
  Save, 
  FileCheck2,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { calculateGrade, getGradeBadgeClass } from '@/utils/grading';

// ==========================================
// 1. FACULTY DASHBOARD
// ==========================================
export const FacultyDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState<FacultyTodayLectureItem[]>([]);
  const [assignedSummary, setAssignedSummary] = useState<FacultyAssignedClassSummary[]>([]);

  useEffect(() => {
    Promise.all([
      MockDataService.getFacultyTodayLectures(),
      MockDataService.getFacultyAssignedClassesSummary(),
    ]).then(([classes, summary]) => {
      setTodayClasses(classes);
      setAssignedSummary(summary);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading faculty portal..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Faculty Profile Banner */}
      <div className="p-6 md:p-7 rounded-xl bg-blue-900 text-white shadow-sm border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-blue-800 text-blue-100 text-xs font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Senior Secondary Faculty • Mathematics Department</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">R. Suresh</h1>
          <p className="text-blue-200 text-xs md:text-sm">
            Senior PGT Mathematics & Department Head • Class Teacher XI-A2 • Employee ID: <code className="font-mono text-white font-semibold">FAC20240012</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="bg-white text-blue-950 hover:bg-blue-50 text-xs font-semibold">
            <CalendarCheck className="w-3.5 h-3.5 mr-1.5" /> Mark Today's Attendance
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Assigned Classes</span>
          <span className="text-2xl font-black text-blue-700 dark:text-blue-400 block mt-1">3 Classes</span>
          <span className="text-[11px] text-slate-500">91 Enrolled Students</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Today's Periods</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">3 Periods</span>
          <span className="text-[11px] text-emerald-600 font-medium">Period 1 Logged • 2 Pending</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-amber-500">
          <span className="text-xs text-slate-500 font-semibold uppercase">Attendance Registers</span>
          <span className="text-2xl font-black text-amber-600 block mt-1">1 Register</span>
          <span className="text-[11px] text-slate-400">Grade 12-A1 Period 3 Pending</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-teal-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Weekly Workload</span>
          <span className="text-2xl font-black text-teal-700 dark:text-teal-400 block mt-1">24 Periods</span>
          <span className="text-[11px] text-slate-400">Curriculum standard: 24/wk</span>
        </Card>
      </div>

      {/* Schedule & Class Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Today's Teaching Schedule & Classroom Routine</CardTitle>
            <CardDescription>Monday • Verified period assignments and register recording status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayClasses.map((c, i) => (
              <div key={i} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.class} — {c.subject}</span>
                    <Badge variant={c.attendanceDone ? 'success' : 'warning'} className="text-[10px]">
                      {c.attendanceDone ? 'Register Logged' : 'Pending Register'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{c.period} • Classroom: <strong className="text-slate-700 dark:text-slate-300">{c.room}</strong> • {c.students} Students</p>
                </div>
                <Button 
                  variant={c.attendanceDone ? 'outline' : 'default'} 
                  size="sm" 
                  className="text-xs self-end sm:self-center"
                >
                  {c.attendanceDone ? 'View Register' : 'Mark Attendance'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Assigned Classes Summary */}
        <Card className="lg:col-span-1 space-y-4 p-5">
          <CardTitle className="text-base">Assigned Sections & Workload</CardTitle>
          <div className="space-y-3 text-xs">
            {assignedSummary.map((s, i) => (
              <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>{s.name}</span>
                  <span className="text-blue-700 dark:text-blue-400">Avg: {s.avgScore}</span>
                </div>
                <p className="text-slate-500 mt-1">{s.studentCount} Students • {s.periodsPerWeek} Periods / Week</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

// ==========================================
// 2. FACULTY CLASSES ROSTER
// ==========================================
export const FacultyClassesPage: React.FC = () => {
  const [students, setStudents] = useState<StudentDirectoryItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('Grade 11 - Computer Science A (Sec A2)');

  useEffect(() => {
    MockDataService.getStudentDirectory().then(setStudents);
  }, []);

  const classStudents = students.filter(s => s.class_name.includes('Grade 11'));

  return (
    <PageContainer>
      <SectionHeader 
        title="Class Roster & Student Directory" 
        description="Assigned classes, enrolled student roll numbers, and academic performance overview"
        actions={
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Class Roster (CSV)
          </Button>
        }
      />

      {/* Class Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {[
          'Grade 11 - Computer Science A (Sec A2) (30 Students)',
          'Grade 12 - Computer Science A (Sec A1) (31 Students)',
          'Grade 10 - Section A (38 Students)'
        ].map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls.split(' (')[0])}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              selectedClass === cls.split(' (')[0]
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {cls}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">{selectedClass} — Student Enrolled Roster</CardTitle>
            <Badge variant="outline" className="text-xs">Subject: Mathematics (Code: MATH-041)</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Admission No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Attendance %</th>
                  <th className="py-2.5 px-3">Academic %</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Parent / Guardian Contact</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classStudents.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{s.roll_number}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-700 dark:text-blue-400 font-semibold">{s.student_id}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{s.admission_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.gender}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">{s.attendance_rate}%</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{s.percentage}%</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getGradeBadgeClass(s.grade)}`}>
                        {s.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{s.parent_name} ({s.parent_contact})</td>
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
// 3. FACULTY ATTENDANCE ENTRY SHEET
// ==========================================
export const FacultyAttendancePage: React.FC = () => {
  const [students, setStudents] = useState<StudentDirectoryItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'ON_DUTY' | 'LEAVE'>>({});

  useEffect(() => {
    MockDataService.getStudentDirectory().then((res) => {
      setStudents(res);
      const initial: Record<string, 'PRESENT' | 'ABSENT' | 'ON_DUTY' | 'LEAVE'> = {};
      res.forEach(s => { initial[s.id] = 'PRESENT'; });
      setAttendanceMap(initial);
    });
  }, []);

  const handleStatusChange = (id: string, status: 'PRESENT' | 'ABSENT' | 'ON_DUTY' | 'LEAVE') => {
    setAttendanceMap(prev => ({ ...prev, [id]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, 'PRESENT' | 'ABSENT' | 'ON_DUTY' | 'LEAVE'> = {};
    students.forEach(s => { updated[s.id] = 'PRESENT'; });
    setAttendanceMap(updated);
  };

  const presentCount = Object.values(attendanceMap).filter(v => v === 'PRESENT').length;
  const onDutyCount = Object.values(attendanceMap).filter(v => v === 'ON_DUTY').length;
  const leaveCount = Object.values(attendanceMap).filter(v => v === 'LEAVE').length;
  const absentCount = Object.values(attendanceMap).filter(v => v === 'ABSENT').length;
  const totalCount = Object.keys(attendanceMap).length;

  // Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
  const sessionAttendanceRate = totalCount > 0 
    ? Number((((presentCount + onDutyCount) / totalCount) * 100).toFixed(1))
    : 0;

  return (
    <PageContainer>
      <SectionHeader 
        title="Session Attendance Recording Sheet" 
        description="Mark and submit live session registers across the 4 canonical statuses: Present, On Duty, Leave, and Absent"
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Class: <strong>Grade 11 - Section A2</strong> • Period: <strong>Period 1 (Mathematics)</strong>
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllPresent}
              className="text-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Mark All Present
            </Button>
          </div>
        }
      />

      {submitted && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Attendance register for <strong>Grade 11-A2 (Mathematics)</strong> recorded and submitted to Academic Registry.</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSubmitted(false)} className="text-xs h-7">Edit Entry</Button>
        </div>
      )}

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-500 font-medium">Present</span>
          <span className="text-xl font-black text-emerald-600 block mt-0.5">{presentCount}</span>
          <span className="text-[10px] text-slate-400">In Classroom</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-500">
          <span className="text-xs text-slate-500 font-medium">On Duty</span>
          <span className="text-xl font-black text-blue-600 block mt-0.5">{onDutyCount}</span>
          <span className="text-[10px] text-slate-400">Counts as Present</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-amber-500">
          <span className="text-xs text-slate-500 font-medium">Approved Leave</span>
          <span className="text-xl font-black text-amber-600 block mt-0.5">{leaveCount}</span>
          <span className="text-[10px] text-slate-400">Faculty-approved leave</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-rose-500">
          <span className="text-xs text-slate-500 font-medium">Absent</span>
          <span className="text-xl font-black text-rose-600 block mt-0.5">{absentCount}</span>
          <span className="text-[10px] text-slate-400">Unapproved absence</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-indigo-500 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 font-medium">Attendance Rate</span>
          <span className="text-xl font-black text-indigo-600 block mt-0.5">{sessionAttendanceRate}%</span>
          <span className="text-[10px] text-slate-400">({presentCount + onDutyCount}/{totalCount})</span>
        </Card>
      </div>

      {/* Attendance Register Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Student Roll List (Grade 11 - Section A2)</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Faculty is authorized to approve student <strong>Leave</strong> and mark school-sanctioned <strong>On Duty</strong>. Both Leave and Absent count as absences in attendance percentage calculations.
            </CardDescription>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setSubmitted(true)}
            className="text-xs bg-blue-900 hover:bg-blue-800"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> Submit Attendance Register
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Historical Rate</th>
                  <th className="py-2.5 px-3 text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.slice(0, 6).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold">{s.roll_number}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-700 dark:text-blue-400 font-semibold">{s.student_id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.attendance_rate}% Overall</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {(
                          [
                            { id: 'PRESENT', label: 'Present', activeBg: 'bg-emerald-600 text-white' },
                            { id: 'ON_DUTY', label: 'On Duty', activeBg: 'bg-blue-600 text-white' },
                            { id: 'LEAVE', label: 'Approved Leave', activeBg: 'bg-amber-600 text-white' },
                            { id: 'ABSENT', label: 'Absent', activeBg: 'bg-rose-600 text-white' },
                          ] as const
                        ).map((statusItem) => (
                          <button
                            key={statusItem.id}
                            type="button"
                            onClick={() => handleStatusChange(s.id, statusItem.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                              attendanceMap[s.id] === statusItem.id
                                ? statusItem.activeBg
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {statusItem.label}
                          </button>
                        ))}
                      </div>
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
// 4. FACULTY MARKS ENTRY SHEET
// ==========================================
export const FacultyMarksPage: React.FC = () => {
  const [published, setPublished] = useState(false);
  const [gradeDistribution, setGradeDistribution] = useState<FacultyGradeDistributionItem[]>([]);
  const [studentGrades, setStudentGrades] = useState<FacultyStudentGradeItem[]>([]);

  useEffect(() => {
    Promise.all([
      MockDataService.getFacultyGradeDistribution(),
      MockDataService.getFacultyClassGrades(),
    ]).then(([dist, grades]) => {
      setGradeDistribution(dist);
      setStudentGrades(grades);
    });
  }, []);

  const handleScoreChange = (index: number, val: string) => {
    const updated = [...studentGrades];
    if (val.trim().toUpperCase() === 'AB') {
      updated[index].score = 'AB';
      updated[index].grade = 'AB';
    } else {
      const num = Number(val);
      const safeNum = isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
      updated[index].score = safeNum;
      updated[index].grade = calculateGrade(safeNum);
    }
    setStudentGrades(updated);
  };

  return (
    <PageContainer>
      <SectionHeader 
        title="Examination Marks Entry & Grade Book" 
        description="Enter marks out of 100 or 'AB' for absent, compute letter grades (A1 to E), and publish examination rosters"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">Save Draft</Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setPublished(true)}
              className="text-xs bg-blue-900 hover:bg-blue-800"
            >
              <FileCheck2 className="w-3.5 h-3.5 mr-1" /> Publish Examination Marks
            </Button>
          </div>
        }
      />

      {published && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Marks for <strong>Grade 11-A2 (Mathematics — Half-Yearly Examination)</strong> published to student and parent portals.</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPublished(false)} className="text-xs h-7">Dismiss</Button>
        </div>
      )}

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grade Distribution Snapshot (8-Tier School Grading Scale)</CardTitle>
          <CardDescription>Grade 11-A2 Mathematics • Half-Yearly Examination • Class Average: 87.00%</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="grade" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Student Count" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Marks Entry Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Half-Yearly Examination Score Sheet</CardTitle>
            <CardDescription className="text-xs">
              Marks are out of 100. Enter numeric mark (0–100) or 'AB' for absent students. Grade is computed automatically via school grading scale.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">Exam: Half-Yearly 2026–27</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Marks Obtained (/100)</th>
                  <th className="py-2.5 px-3">Derived Grade</th>
                  <th className="py-2.5 px-3">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentGrades.map((g, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold">{g.roll}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{g.name}</td>
                    <td className="py-2.5 px-3">
                      <input 
                        type="text" 
                        value={g.score} 
                        onChange={(e) => handleScoreChange(i, e.target.value)}
                        className="w-20 p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-center" 
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeBadgeClass(g.grade)}`}>
                        {g.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <input 
                        type="text" 
                        defaultValue={g.feedback} 
                        className="w-full max-w-sm p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300" 
                      />
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
// 5. FACULTY TIMETABLE PAGE
// ==========================================
export const FacultyTimetablePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [facultySlots, setFacultySlots] = useState<FacultyTimetableSlotItem[]>([]);

  useEffect(() => {
    MockDataService.getFacultyTimetableSlots().then(setFacultySlots);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Faculty Teaching Timetable" 
        description="Weekly instructional routine, planning periods, and room assignments for R. Suresh"
        actions={
          <Badge variant="outline" className="text-xs">Weekly Workload: 24 Teaching Periods</Badge>
        }
      />

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              selectedDay === day 
                ? 'bg-blue-900 text-white shadow-sm' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {facultySlots.map((slot, idx) => (
          <Card key={idx} className="p-4 hover:border-blue-300 dark:hover:border-blue-900 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{slot.subject}</h3>
                  <p className="text-xs text-slate-500">
                    Class: <strong className="text-slate-800 dark:text-slate-200">{slot.class}</strong> • Location: <strong className="text-slate-800 dark:text-slate-200">{slot.room}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={slot.type === 'Class Lecture' ? 'default' : 'outline'} className="text-xs">{slot.type}</Badge>
                <span className="font-mono text-xs text-slate-500 font-semibold">{slot.period}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};
