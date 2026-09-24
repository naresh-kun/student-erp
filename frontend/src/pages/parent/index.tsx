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

// ==========================================
// 1. PARENT DASHBOARD
// ==========================================
export const ParentDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState('Alex Morgan');
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
        <LoadingState message="Loading guardian portal..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Child Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200">Guardian Portal</span>
          <h1 className="text-2xl font-black">Family Academic Overview</h1>
          <p className="text-xs text-emerald-100">Welcome, Robert Morgan • Monitoring 2 linked students</p>
        </div>

        {/* Child Selector Pills */}
        <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/20 self-start sm:self-center">
          {['Alex Morgan (Grade 11-A)', 'Leo Morgan (Grade 8-B)'].map((child) => (
            <button
              key={child}
              onClick={() => setSelectedChild(child.split(' ')[0] + ' ' + child.split(' ')[1])}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedChild.startsWith(child.split(' ')[0])
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              {child}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards for Selected Child */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Current Term GPA</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">3.85 / 4.0</span>
          <span className="text-[11px] text-slate-400">Class Standing: Top 10%</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Attendance Rate</span>
          <span className="text-2xl font-black text-blue-600 block mt-1">94.2%</span>
          <span className="text-[11px] text-emerald-600 font-medium">Clear of penalty</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Next Assessment</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">March 15</span>
          <span className="text-[11px] text-slate-400">Term 1 Finals</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Tuition & Fees</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">Paid in Full</span>
          <span className="text-[11px] text-slate-400">Term 1 Account Cleared</span>
        </Card>
      </div>

      {/* Main Grid: Today's Routine & Urgent Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">{selectedChild}'s Attendance Pattern</CardTitle>
              <CardDescription>Monthly verified classroom presence vs school requirement</CardDescription>
            </div>
            <Badge variant="success" className="text-xs">Consistent</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[75, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="attendance" name="Attendance %" stroke="#059669" strokeWidth={2.5} fill="#a7f3d0" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Teacher Contact & Conference */}
        <Card className="lg:col-span-1 space-y-4 p-5">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" /> Class Mentor Contact
          </CardTitle>
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs">
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Dr. Anita Desai</p>
            <p className="text-slate-500">Class Teacher • Grade 11-A</p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> +1-555-0102</p>
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> anita.desai@studenterp.edu</p>
            </div>
          </div>
          <Button variant="default" className="w-full text-xs">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Message Class Teacher
          </Button>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Parent-Teacher conference scheduled for April 10, 2026. RSVP open in portal.</span>
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
        title="Linked Children Profiles" 
        description="Comprehensive academic profiles and school administrative data for enrolled children"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.map((c, i) => (
          <Card key={i} className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <img src={c.avatar} alt={c.name} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.name}</h3>
                <p className="text-xs font-mono text-slate-500">{c.rollNo} • {c.admNo}</p>
                <div className="flex gap-2 mt-1.5">
                  <Badge variant="success" className="text-[10px]">{c.grade}</Badge>
                  <Badge variant="outline" className="text-[10px]">{c.stream}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Attendance</span>
                <span className="text-base font-black text-emerald-600 block mt-0.5">{c.attendance}%</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Term GPA</span>
                <span className="text-base font-black text-slate-900 dark:text-slate-100 block mt-0.5">{c.gpa}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Status</span>
                <span className="text-base font-black text-blue-600 block mt-0.5">Good</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p>Advisor / Class Teacher: <strong className="text-slate-800 dark:text-slate-200">{c.teacher}</strong></p>
              <p>Enrollment Status: <strong className="text-emerald-600">Active • Full-Time Scholar</strong></p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button variant="default" size="sm" className="text-xs flex-1">
                View Full Academic Record
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
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
        title="Child Attendance & Absence Advisory" 
        description="Verify presence, review absence notifications, and submit absence justifications"
        actions={
          <Badge variant="outline" className="text-xs">Selected: Alex Morgan (Grade 11-A)</Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500">
              <span className="text-xs text-slate-500 font-semibold uppercase">Overall Presence</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">94.3%</span>
              <span className="text-[11px] text-slate-400">82 of 87 Sessions (P + OD)</span>
            </Card>
            <Card className="p-4 bg-white dark:bg-slate-900 text-center border-l-4 border-l-purple-500">
              <span className="text-xs text-slate-500 font-semibold uppercase">Approved Leave</span>
              <span className="text-2xl font-black text-purple-600 block mt-1">3</span>
              <span className="text-[11px] text-slate-400">Faculty approved leave</span>
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
              <CardDescription>Records verified by class faculty across Approved Leave and Unapproved Absence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Reported By</th>
                      <th className="py-2.5 px-3">Reason / Justification</th>
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
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}>
                            {l.status === 'LEAVE' ? 'Approved Leave' : 'Unapproved Absent'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{l.faculty}</td>
                        <td className="py-2.5 px-3 text-slate-500">{l.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Absence Justification */}
        <Card className="p-5 space-y-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-600" /> Submit Absence Excuse
          </CardTitle>
          <CardDescription>
            Notify the class teacher regarding upcoming or past absences. Once reviewed, authorized absences are recorded as approved LEAVE.
          </CardDescription>

          {submittedExcuse ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <p className="font-bold">Excuse Note Submitted</p>
              <p>Your note has been dispatched to Dr. Anita Desai. Once verified, the absence will reflect as authorized LEAVE.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmittedExcuse(true); }} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Date of Absence</label>
                <input type="date" defaultValue="2026-02-20" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Reason Category</label>
                <select className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                  <option>Medical / Illness</option>
                  <option>Family Emergency</option>
                  <option>Religious Observance</option>
                  <option>Other Educational Travel</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Explanation / Note</label>
                <textarea rows={3} placeholder="Please explain the circumstances..." className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs" defaultValue="Alex had a routine medical appointment." />
              </div>
              <Button type="submit" variant="default" className="w-full text-xs">
                Submit Note to School
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
        title="Academic Progress & Examination Results" 
        description="Term assessments, subject grades, and formal teacher remarks for Alex Morgan"
        actions={
          <Button variant="default" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download Term 1 Report Card (PDF)
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Term 1 Percentage</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">91.0%</span>
          <span className="text-[11px] text-slate-400">Class Average: 81.2%</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Grade Point Average</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">3.85 / 4.0</span>
          <span className="text-[11px] text-emerald-600 font-medium">Honor Roll Standing</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Section Rank</span>
          <span className="text-2xl font-black text-indigo-600 block mt-1">4th</span>
          <span className="text-[11px] text-slate-400">Out of 32 Students</span>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subject Comparison Against Section Benchmark</CardTitle>
          <CardDescription>Performance comparison across all enrolled subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="studentScore" name="Child's Score" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="classAverage" name="Class Average" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base">Term 1 Official Subject Evaluations</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Faculty</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Instructor Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {evaluations.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold">{ev.subject}</td>
                    <td className="py-2.5 px-3">{ev.faculty}</td>
                    <td className="py-2.5 px-3 font-bold font-mono">{ev.score}</td>
                    <td className="py-2.5 px-3"><Badge variant="success" className="text-[10px]">{ev.grade}</Badge></td>
                    <td className="py-2.5 px-3 text-slate-600">{ev.remarks}</td>
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
        title="Child School Timetable & Routine" 
        description="Weekly schedule and daily school dismissal hours for Alex Morgan (Grade 11-A)"
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
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedDay === day 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {activeDaySchedule.map((slot: any, idx: number) => (
          <Card key={idx} className="p-4 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{slot.subject}</h3>
                  <p className="text-xs text-slate-500">Teacher: {slot.teacher} • Location: <strong className="text-slate-700 dark:text-slate-300">{slot.room}</strong></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={slot.type === 'Lab' ? 'info' : 'outline'} className="text-xs">{slot.type}</Badge>
                <span className="font-mono text-xs text-slate-500 font-semibold">{slot.period}</span>
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
        title="Family & School Calendar" 
        description="Key institutional dates, conferences, holidays, and student assessment periods"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((e, idx) => (
          <Card key={idx} className="p-5 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={e.category === 'Conference' ? 'default' : e.category === 'Holiday' ? 'warning' : 'info'} className="text-[10px]">
                  {e.category}
                </Badge>
                <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
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
