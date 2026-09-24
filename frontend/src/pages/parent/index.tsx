import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { 
  MockDataService,
  type ParentChildCardItem,
  type StudentAbsenceAdvisoryRecord,
  type SubjectEvaluationRecord,
  type CalendarEventItem
} from '@/services/mockService';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Download, 
  MessageSquare, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Send, 
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { getGradeBadgeClass } from '@/utils/grading';

// ==========================================
// 1. PARENT DASHBOARD
// ==========================================
export const ParentDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState('STU202600001');
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);

  useEffect(() => {
    MockDataService.getMonthlyAttendanceTrend().then((res) => {
      setAttendanceTrend(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading parent portal..." />
      </PageContainer>
    );
  }

  const isArun = selectedChild === 'STU202600001';

  return (
    <PageContainer>
      {/* Child Switcher & Institution Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-blue-900 text-white shadow-sm border border-blue-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">Parent / Guardian Portal</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-800 text-blue-100 font-mono">Academic Year 2026–27</span>
          </div>
          <h1 className="text-xl font-bold">Child Academic & Attendance Summary</h1>
          <p className="text-xs text-blue-200">Logged in as S. Ramanathan • Parent of {isArun ? 'Arun Kumar (STU202600001)' : 'Keerthana M (STU202600004)'}</p>
        </div>

        {/* Child Selector Switcher */}
        <div className="flex items-center gap-2 bg-blue-950/60 p-1.5 rounded-lg border border-blue-700/50 self-start sm:self-center">
          <button
            onClick={() => setSelectedChild('STU202600001')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              isArun ? 'bg-white text-blue-950 shadow-sm' : 'text-blue-200 hover:text-white'
            }`}
          >
            Arun Kumar • XI-A2
          </button>
          <button
            onClick={() => setSelectedChild('STU202600004')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              !isArun ? 'bg-white text-blue-950 shadow-sm' : 'text-blue-200 hover:text-white'
            }`}
          >
            Keerthana M • X-A
          </button>
        </div>
      </div>

      {/* Selected Child Academic Overview Banner */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {isArun ? 'Arun Kumar' : 'Keerthana M'}
            </span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Student ID</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {isArun ? 'STU202600001' : 'STU202600004'}
            </span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Class & Section</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {isArun ? 'Grade 11 - Section A2' : 'Grade 10 - Section A'}
            </span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-700 pl-4 hidden md:block">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Stream</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {isArun ? 'Computer Science A' : 'General Secondary'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Admission: {isArun ? 'ADM20240091' : 'ADM20240094'}
          </Badge>
          <Badge variant="success" className="text-xs">
            Enrolled Active
          </Badge>
        </div>
      </div>

      {/* KPI Cards for Selected Child */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Attendance</span>
          <span className="text-2xl font-black text-blue-700 dark:text-blue-400 block mt-1">
            {isArun ? '94.30%' : '96.00%'}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">82 of 87 Sessions (P + OD)</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Cumulative Marks</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">
            {isArun ? '435 / 500' : '456 / 500'}
          </span>
          <span className="text-[11px] text-slate-500">Half-Yearly Examination</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Percentage</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">
            {isArun ? '87.00%' : '91.20%'}
          </span>
          <span className="text-[11px] text-slate-400">Class Average: 79.40%</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-teal-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Grade</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-teal-700 dark:text-teal-400">
              {isArun ? 'A2' : 'A1'}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getGradeBadgeClass(isArun ? 'A2' : 'A1')}`}>
              {isArun ? 'Very Good (81–90%)' : 'Outstanding (91–100%)'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">8-Tier School Grading Scale</span>
        </Card>
      </div>

      {/* Main Grid: Attendance Trend & Class Teacher Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">
                {isArun ? 'Arun Kumar' : 'Keerthana M'} — Verified Attendance Pattern
              </CardTitle>
              <CardDescription>Monthly verified classroom presence against school requirement (75% Minimum)</CardDescription>
            </div>
            <Badge variant="success" className="text-xs">Consistent Standing</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[75, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                  <Tooltip formatter={(val) => [`${val}%`, 'Attendance Rate']} />
                  <Area type="monotone" dataKey="attendance" name="Attendance %" stroke="#1d4ed8" strokeWidth={2.5} fill="#bfdbfe" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Class Teacher & PTM Advisory */}
        <Card className="lg:col-span-1 space-y-4 p-5">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-700" /> Assigned Class Teacher
          </CardTitle>
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2 text-xs">
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {isArun ? 'R. Suresh' : 'Meena Devi'}
            </p>
            <p className="text-slate-500">
              {isArun ? 'Senior PGT Mathematics • Class Teacher XI-A2' : 'PGT English • Class Teacher X-A'}
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {isArun ? '+91 94441 23456' : '+91 94441 78901'}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {isArun ? 'r.suresh@schoolerp.edu.in' : 'meena.devi@schoolerp.edu.in'}
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full text-xs">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Contact Class Teacher
          </Button>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Parent-Teacher Meeting (PTM) scheduled for 10/10/2026. Academic review for Half-Yearly Examinations.</span>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

// ==========================================
// 2. PARENT CHILDREN DIRECTORY
// ==========================================
export const ParentChildrenPage: React.FC = () => {
  const [children, setChildren] = useState<ParentChildCardItem[]>([]);

  useEffect(() => {
    MockDataService.getParentChildrenCards().then(setChildren);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Enrolled Wards / Children" 
        description="Comprehensive academic profiles and school administrative records for enrolled students"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.map((c, i) => (
          <Card key={i} className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <img src={c.avatar} alt={c.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-sm" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.name}</h3>
                <p className="text-xs font-mono text-slate-500 font-semibold">
                  Student ID: {c.student_id} • Adm No: {c.admNo}
                </p>
                <div className="flex gap-2 mt-1.5">
                  <Badge variant="default" className="text-[10px]">{c.grade}</Badge>
                  <Badge variant="outline" className="text-[10px]">{c.stream}</Badge>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                    Roll: {c.rollNo}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Attendance</span>
                <span className="text-base font-black text-blue-700 dark:text-blue-400 block mt-0.5">{c.attendance}%</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Cumulative Marks</span>
                <span className="text-base font-black text-slate-900 dark:text-slate-100 block mt-0.5">
                  {c.marksObtained} / {c.totalMarks}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Percentage / Grade</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="text-base font-black text-emerald-600">{c.percentage}%</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${getGradeBadgeClass(c.gradeValue)}`}>
                    {c.gradeValue}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p>Class Teacher: <strong className="text-slate-800 dark:text-slate-200">{c.teacher}</strong></p>
              <p>School Status: <strong className="text-emerald-600">Regular Enrolled Student • Board Candidate</strong></p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button variant="default" size="sm" className="text-xs flex-1">
                View Full School Record
              </Button>
              <Button variant="outline" size="sm" className="text-xs" title="Download Report Card">
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};

// ==========================================
// 3. PARENT ATTENDANCE PAGE
// ==========================================
export const ParentAttendancePage: React.FC = () => {
  const [submittedExcuse, setSubmittedExcuse] = useState(false);
  const [absenceLogs, setAbsenceLogs] = useState<StudentAbsenceAdvisoryRecord[]>([]);

  useEffect(() => {
    MockDataService.getStudentAbsenceLogs().then(setAbsenceLogs);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Student Attendance & Absence Advisory" 
        description="Verify classroom presence, monitor leave records, and submit absence notifications to the school"
        actions={
          <Badge variant="outline" className="text-xs font-mono">
            Student: Arun Kumar (STU202600001 • Grade 11-A2)
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-600">
              <span className="text-xs text-slate-500 font-semibold uppercase">Overall Attendance</span>
              <span className="text-2xl font-black text-blue-700 dark:text-blue-400 block mt-1">94.30%</span>
              <span className="text-[11px] text-slate-400">82 of 87 Sessions (P + OD)</span>
            </Card>
            <Card className="p-4 bg-white dark:bg-slate-900 text-center border-l-4 border-l-amber-500">
              <span className="text-xs text-slate-500 font-semibold uppercase">Approved Leave</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">3</span>
              <span className="text-[11px] text-slate-400">Faculty-approved leave</span>
            </Card>
            <Card className="p-4 bg-white dark:bg-slate-900 text-center border-l-4 border-l-rose-500">
              <span className="text-xs text-slate-500 font-semibold uppercase">Unapproved Absent</span>
              <span className="text-2xl font-black text-rose-600 block mt-1">2</span>
              <span className="text-[11px] text-slate-400">Excuse submission needed</span>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Absence & Leave Advisory Log</CardTitle>
              <CardDescription>Official entries recorded by class faculty across Approved Leave and Unapproved Absence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Marked / Approved By</th>
                      <th className="py-2.5 px-3">Notes & Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {absenceLogs.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono">{l.date}</td>
                        <td className="py-2.5 px-3">{l.period}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            l.status === 'LEAVE'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}>
                            {l.status === 'LEAVE' ? 'Approved Leave' : 'Unapproved Absent'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium">{l.faculty}</td>
                        <td className="py-2.5 px-3 text-slate-500">{l.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Absence Justification to School */}
        <Card className="p-5 space-y-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-700" /> Submit Absence Notice
          </CardTitle>
          <CardDescription>
            Notify class teacher R. Suresh regarding an upcoming absence or medical leave. Once verified by faculty, it will be marked as Approved Leave.
          </CardDescription>

          {submittedExcuse ? (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs space-y-1 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="font-bold">Leave Request Submitted</p>
              <p>Your communication has been dispatched to Class Teacher R. Suresh. Upon verification, the absence will reflect as Approved Leave.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmittedExcuse(true); }} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Date of Absence</label>
                <input type="date" defaultValue="2026-09-25" className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Reason Category</label>
                <select className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                  <option>Medical / Illness</option>
                  <option>Family Event / Function</option>
                  <option>Religious Observance</option>
                  <option>Educational Competition / Exam</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Explanation / Note to Faculty</label>
                <textarea rows={3} placeholder="Please explain the circumstances..." className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs" defaultValue="Arun had a fever and was advised rest by physician." />
              </div>
              <Button type="submit" variant="default" className="w-full text-xs">
                Submit Leave Notice
              </Button>
            </form>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};

// ==========================================
// 4. PARENT MARKS & REPORT CARDS
// ==========================================
export const ParentMarksPage: React.FC = () => {
  const [marksData, setMarksData] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<SubjectEvaluationRecord[]>([]);

  useEffect(() => {
    MockDataService.getSubjectMarksComparison().then(setMarksData);
    MockDataService.getParentStudentEvaluations().then(setEvaluations);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Academic Marks & Progress Report" 
        description="Official school examination performance, marks out of 100, and teacher remarks for Arun Kumar"
        actions={
          <Button variant="default" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download Half-Yearly Report Card (PDF)
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Cumulative Marks</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">435 / 500</span>
          <span className="text-[11px] text-slate-500">Half-Yearly Examination</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Percentage</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">87.00%</span>
          <span className="text-[11px] text-slate-400">Class Average: 79.40%</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Letter Grade</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">A2</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getGradeBadgeClass('A2')}`}>
              Very Good
            </span>
          </div>
          <span className="text-[11px] text-slate-400">8-Tier Scale (81–90%)</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-teal-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Section Rank</span>
          <span className="text-2xl font-black text-teal-700 dark:text-teal-400 block mt-1">4th</span>
          <span className="text-[11px] text-slate-400">Section XI-A2 (32 Students)</span>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subject Performance vs Section Benchmark (Marks / 100)</CardTitle>
          <CardDescription>Comparison of marks obtained across subjects against the Grade 11-A2 average</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(val) => [`${val} / 100`, 'Marks']} />
                <Bar dataKey="studentScore" name="Child's Marks" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="classAverage" name="Class Average" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base">Official Half-Yearly Subject Marks & Teacher Remarks</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Subject Teacher</th>
                  <th className="py-2.5 px-3">Marks Obtained</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {evaluations.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold">{ev.subject}</td>
                    <td className="py-2.5 px-3">{ev.faculty}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-800 dark:text-slate-200">{ev.score}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeBadgeClass(ev.grade)}`}>
                        {ev.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{ev.remarks}</td>
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
// 5. PARENT TIMETABLE PAGE
// ==========================================
export const ParentTimetablePage: React.FC = () => {
  const [weeklyGrid, setWeeklyGrid] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState('Monday');

  useEffect(() => {
    MockDataService.getWeeklyTimetableGrid().then(setWeeklyGrid);
  }, []);

  const activeDaySchedule = weeklyGrid.find((d) => d.day === selectedDay)?.periods || [];

  return (
    <PageContainer>
      <SectionHeader 
        title="Student Timetable & Daily Periods" 
        description="Weekly classroom routine and daily dismissal schedule for Arun Kumar (Grade 11 - Section A2)"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">School Hours: 08:30 AM - 02:45 PM</Badge>
          </div>
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
        {activeDaySchedule.map((slot: any, idx: number) => (
          <Card key={idx} className="p-4 hover:border-blue-300 dark:hover:border-blue-900 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{slot.subject}</h3>
                  <p className="text-xs text-slate-500">Teacher: {slot.teacher} • Classroom: <strong className="text-slate-700 dark:text-slate-300">{slot.room}</strong></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={slot.type === 'Lab' ? 'info' : 'outline'} className="text-xs">{slot.type}</Badge>
                <span className="font-mono text-xs text-slate-600 font-semibold">{slot.period}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};

// ==========================================
// 6. PARENT CALENDAR PAGE
// ==========================================
export const ParentCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);

  useEffect(() => {
    MockDataService.getParentCalendarEvents().then(setEvents);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="School Academic Calendar" 
        description="Key school dates, parent-teacher meetings, holidays, and examination periods"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((e, idx) => (
          <Card key={idx} className="p-5 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={e.category === 'PTM' ? 'default' : e.category === 'Holiday' ? 'warning' : 'info'} className="text-[10px]">
                  {e.category}
                </Badge>
                <span className="text-xs font-mono font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" /> {e.date}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{e.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">{e.desc}</p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex justify-between">
              <span>Time: {e.time}</span>
              <span>{e.location}</span>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};
