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
  FileCheck2
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
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-800 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm border border-white/20">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Faculty Academic Workspace • Mathematics Department</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Dr. Anita Desai</h1>
          <p className="text-purple-100 text-xs md:text-sm">
            Senior Faculty & Curriculum Lead • Employee ID: <code className="font-mono text-white font-semibold">FAC-2019-012</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="bg-white text-purple-900 hover:bg-purple-50 text-xs">
            <CalendarCheck className="w-3.5 h-3.5 mr-1.5" /> Record Today's Attendance
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Assigned Classes</span>
          <span className="text-2xl font-black text-purple-600 block mt-1">3 Classes</span>
          <span className="text-[11px] text-slate-400">88 Total Enrolled Students</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Today's Lectures</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">3 Sessions</span>
          <span className="text-[11px] text-emerald-600 font-medium">1 Completed, 2 Pending</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Attendance Pending</span>
          <span className="text-2xl font-black text-amber-600 block mt-1">1 Register</span>
          <span className="text-[11px] text-slate-400">Grade 12-A Period 2</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Grading Queue</span>
          <span className="text-2xl font-black text-blue-600 block mt-1">14 Submissions</span>
          <span className="text-[11px] text-slate-400">Midterm Quiz Papers</span>
        </Card>
      </div>

      {/* Schedule & Class Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Today's Teaching Schedule</CardTitle>
            <CardDescription>Monday • Verified room assignments and attendance status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayClasses.map((c, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.class} — {c.subject}</span>
                    <Badge variant={c.attendanceDone ? 'success' : 'warning'} className="text-[10px]">
                      {c.attendanceDone ? 'Attendance Logged' : 'Pending Register'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{c.period} • Room: <strong className="text-slate-700 dark:text-slate-300">{c.room}</strong> • {c.students} Students</p>
                </div>
                <Button 
                  variant={c.attendanceDone ? 'outline' : 'default'} 
                  size="sm" 
                  className="text-xs self-end sm:self-center"
                >
                  {c.attendanceDone ? 'View Roster' : 'Take Attendance'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Assigned Classes Summary */}
        <Card className="lg:col-span-1 space-y-4 p-5">
          <CardTitle className="text-base">Assigned Sections</CardTitle>
          <div className="space-y-3 text-xs">
            {assignedSummary.map((s, i) => (
              <div key={i} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>{s.name}</span>
                  <span className="text-purple-600">Avg: {s.avgScore}</span>
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
  const [selectedClass, setSelectedClass] = useState('Grade 11 - Section A');

  useEffect(() => {
    MockDataService.getStudentDirectory().then(setStudents);
  }, []);

  const classStudents = students.filter(s => s.class_name.includes('Grade 11'));

  return (
    <PageContainer>
      <SectionHeader 
        title="Class Roster & Student Directory" 
        description="Assigned classes, enrolled student records, and performance overview"
        actions={
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Class Roster (CSV)
          </Button>
        }
      />

      {/* Class Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {['Grade 11 - Section A (32 Students)', 'Grade 12 - Section A (28 Students)', 'Grade 10 - Section B (28 Students)'].map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls.split(' (')[0])}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedClass === cls.split(' (')[0]
                ? 'bg-purple-600 text-white shadow-sm'
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
            <Badge variant="outline" className="text-xs">Subject: Mathematics</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Admission ID</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Attendance %</th>
                  <th className="py-2.5 px-3">Term GPA</th>
                  <th className="py-2.5 px-3">Primary Guardian</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classStudents.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{s.roll_number}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{s.admission_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.gender}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{s.attendance_rate}%</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{s.gpa}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.parent_name} ({s.parent_contact})</td>
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Class: <strong>Grade 11-A</strong> • Period: <strong>Period 1 (Mathematics)</strong></span>
          </div>
        }
      />

      {submitted && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Attendance register for <strong>Grade 11-A (Mathematics)</strong> recorded and submitted to Academic Registry.</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSubmitted(false)} className="text-xs h-7">Edit Entry</Button>
        </div>
      )}

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-500 font-medium">Present</span>
          <span className="text-xl font-black text-emerald-600 block mt-0.5">{presentCount}</span>
          <span className="text-[10px] text-slate-400">In lecture</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-500">
          <span className="text-xs text-slate-500 font-medium">On Duty</span>
          <span className="text-xl font-black text-blue-600 block mt-0.5">{onDutyCount}</span>
          <span className="text-[10px] text-slate-400">Counts as Present</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-purple-500">
          <span className="text-xs text-slate-500 font-medium">Leave</span>
          <span className="text-xl font-black text-purple-600 block mt-0.5">{leaveCount}</span>
          <span className="text-[10px] text-slate-400">Approved by Faculty</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-rose-500">
          <span className="text-xs text-slate-500 font-medium">Absent</span>
          <span className="text-xl font-black text-rose-600 block mt-0.5">{absentCount}</span>
          <span className="text-[10px] text-slate-400">Unapproved</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-indigo-500 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 font-medium">Effective Presence</span>
          <span className="text-xl font-black text-indigo-600 block mt-0.5">{sessionAttendanceRate}%</span>
          <span className="text-[10px] text-slate-400">({presentCount + onDutyCount}/{totalCount})</span>
        </Card>
      </div>

      {/* Attendance Register Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Student Roll Call (Grade 11-A)</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Faculty is authorized to approve student <strong>Leave</strong> and mark institutional <strong>On Duty</strong>. Both Leave and Absent count as absences in attendance percentage calculations.
            </CardDescription>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setSubmitted(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700"
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
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Historical Rate</th>
                  <th className="py-2.5 px-3 text-right">Session Status Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold">{s.roll_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.attendance_rate}% Overall</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {(
                          [
                            { id: 'PRESENT', label: 'Present', activeBg: 'bg-emerald-600 text-white' },
                            { id: 'ON_DUTY', label: 'On Duty', activeBg: 'bg-blue-600 text-white' },
                            { id: 'LEAVE', label: 'Leave', activeBg: 'bg-purple-600 text-white' },
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

  return (
    <PageContainer>
      <SectionHeader 
        title="Grade Book & Evaluation Entry" 
        description="Record midterm scores, compute letter grades, and publish evaluation rosters"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">Save Draft</Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setPublished(true)}
              className="text-xs bg-purple-600 hover:bg-purple-700"
            >
              <FileCheck2 className="w-3.5 h-3.5 mr-1" /> Publish Grades
            </Button>
          </div>
        }
      />

      {published && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Grades for <strong>Grade 11-A (Midterm Examination)</strong> published to student and parent portals.</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPublished(false)} className="text-xs h-7">Dismiss</Button>
        </div>
      )}

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grade Distribution Snapshot</CardTitle>
          <CardDescription>Grade 11-A Midterm Evaluation • Average: 88.5%</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="grade" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Student Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grade Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Examination Score Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Midterm Score (/100)</th>
                  <th className="py-2.5 px-3">Calculated Grade</th>
                  <th className="py-2.5 px-3">Instructor Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentGrades.map((g, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold">{g.roll}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{g.name}</td>
                    <td className="py-2.5 px-3">
                      <input 
                        type="number" 
                        defaultValue={g.score} 
                        className="w-16 p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold" 
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" className="text-[10px]">{g.grade}</Badge>
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
        description="Weekly instruction schedule, office hours, and room assignments for Dr. Anita Desai"
        actions={
          <Badge variant="outline" className="text-xs">Weekly Workload: 18 Teaching Hours</Badge>
        }
      />

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedDay === day 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {facultySlots.map((slot, idx) => (
          <Card key={idx} className="p-4 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{slot.subject}</h3>
                  <p className="text-xs text-slate-500">Target: <strong className="text-slate-800 dark:text-slate-200">{slot.class}</strong> • Location: <strong className="text-slate-800 dark:text-slate-200">{slot.room}</strong></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={slot.type === 'Lecture' ? 'default' : 'outline'} className="text-xs">{slot.type}</Badge>
                <span className="font-mono text-xs text-slate-500 font-semibold">{slot.period}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};
