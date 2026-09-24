import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { 
  MockDataService, 
  FacultyDirectoryItem,
  type PrincipalClassAcademicItem,
  type PrincipalGradeAttendanceTrend,
  type PrincipalAttendanceDistributionItem,
  type PrincipalReportItem
} from '@/services/mockService';
import { 
  Award, 
  FileText, 
  Download, 
  ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

// ==========================================
// 1. PRINCIPAL DASHBOARD
// ==========================================
export const PrincipalDashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [deptData, setDeptData] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      MockDataService.getSchoolKPIs(),
      MockDataService.getDepartmentalPerformance(),
    ]).then(([kpiRes, depts]) => {
      setKpis(kpiRes);
      setDeptData(depts);
    });
  }, []);

  if (!kpis) {
    return (
      <PageContainer>
        <LoadingState message="Loading institutional oversight console..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Principal Executive Header */}
      <div className="p-6 md:p-7 rounded-xl bg-blue-900 text-white shadow-sm border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-blue-800 text-blue-100 text-xs font-medium">
            <Award className="w-3.5 h-3.5" />
            <span>Office of the Principal • Academic Year 2026–27</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Vidya Mandir Institutional Oversight</h1>
          <p className="text-blue-200 text-xs md:text-sm">
            Institutional governance, CBSE/ICSE curriculum compliance, and school performance oversight
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="bg-white text-blue-950 hover:bg-blue-50 text-xs font-semibold shadow-sm">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Annual School Dossier
          </Button>
        </div>
      </div>

      {/* High-Level Institutional KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Students</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">
            {kpis.total_students}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Grades 9 through 12</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Academic Average</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">
            {kpis.overall_academic_percentage || '81.7%'}
          </span>
          <span className="text-[11px] text-slate-400">Institutional Examination Average</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-teal-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">School Attendance Rate</span>
          <span className="text-2xl font-black text-teal-700 dark:text-teal-400 block mt-1">
            {kpis.overall_attendance_rate}%
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Above 90% School Benchmark</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-indigo-600">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Faculty</span>
          <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400 block mt-1">
            {kpis.total_faculty}
          </span>
          <span className="text-[11px] text-slate-400">Student-Teacher Ratio: {kpis.student_teacher_ratio}</span>
        </Card>
      </div>

      {/* Main Grid: Departmental Performance & Strategic Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Departmental Examination Pass Rate Benchmark</CardTitle>
            <CardDescription>Half-Yearly Examination pass percentages across academic departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                  <Tooltip formatter={(val) => [`${val}%`, 'Pass Rate']} />
                  <Bar dataKey="passRate" name="Pass Rate %" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Executive Decisions & Strategic Updates */}
        <Card className="lg:col-span-1 p-5 space-y-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700" /> School Governance & Notices
          </CardTitle>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">Board Affiliation Review</span>
              <p className="text-slate-500">Scheduled for 28/10/2026. Institutional compliance documentation submitted.</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">Senior Secondary Science Lab</span>
              <p className="text-slate-500">Upgraded equipment and safety audits certified for Physics and Chemistry practicals.</p>
            </div>
          </div>
          <Button variant="outline" className="w-full text-xs">
            <FileText className="w-3.5 h-3.5 mr-1" /> View Governance Resolutions
          </Button>
        </Card>
      </div>
    </PageContainer>
  );
};

// ==========================================
// 2. PRINCIPAL ACADEMICS
// ==========================================
export const PrincipalAcademicsPage: React.FC = () => {
  const [deptData, setDeptData] = useState<any[]>([]);
  const [classAcademics, setClassAcademics] = useState<PrincipalClassAcademicItem[]>([]);

  useEffect(() => {
    MockDataService.getDepartmentalPerformance().then(setDeptData);
    MockDataService.getClassAcademicComparisons().then(setClassAcademics);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="School-Wide Academic Oversight" 
        description="Class performance benchmarks, academic percentages, and syllabus delivery progress"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grade-by-Grade Academic Average (%)</CardTitle>
            <CardDescription>Academic Year 2026–27 Half-Yearly Examination Results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classAcademics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="grade" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[70, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                  <Tooltip formatter={(val) => [`${val}%`, 'Score']} />
                  <Legend />
                  <Bar dataKey="academicAverage" name="Academic Average %" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="passRate" name="Pass Rate %" fill="#059669" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Departmental Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Syllabus Completion & Curriculum Delivery</CardTitle>
            <CardDescription>Term curriculum milestones verified by Academic Coordinator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deptData.map((d, i) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{d.department}</span>
                  <span className="text-blue-700 dark:text-blue-400 font-bold">{d.completionRate}% Delivered</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${d.completionRate}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

// ==========================================
// 3. PRINCIPAL ATTENDANCE
// ==========================================
export const PrincipalAttendancePage: React.FC = () => {
  const [gradeAttendance, setGradeAttendance] = useState<PrincipalGradeAttendanceTrend[]>([]);
  const [distribution, setDistribution] = useState<PrincipalAttendanceDistributionItem[]>([]);

  useEffect(() => {
    MockDataService.getGradeAttendanceTrends().then(setGradeAttendance);
    MockDataService.getPrincipalAttendanceDistribution().then(setDistribution);
  }, []);

  const totalSessions = distribution.reduce((sum, d) => sum + d.count, 0);
  const presentItem = distribution.find((d) => d.status === 'PRESENT');
  const onDutyItem = distribution.find((d) => d.status === 'ON_DUTY');
  const leaveItem = distribution.find((d) => d.status === 'LEAVE');
  const absentItem = distribution.find((d) => d.status === 'ABSENT');

  const presentCount = presentItem ? presentItem.count : 0;
  const onDutyCount = onDutyItem ? onDutyItem.count : 0;
  const leaveCount = leaveItem ? leaveItem.count : 0;
  const absentCount = absentItem ? absentItem.count : 0;

  // Attendance % = (PRESENT + ON_DUTY) / (PRESENT + ABSENT + ON_DUTY + LEAVE) * 100
  const overallPresenceRate = totalSessions > 0
    ? Number((((presentCount + onDutyCount) / totalSessions) * 100).toFixed(1))
    : 0;

  return (
    <PageContainer>
      <SectionHeader 
        title="Institutional Attendance Intelligence" 
        description="School-wide presence telemetry, longitudinal trends, and canonical 4-status reconciliation"
      />

      {/* Executive Attendance KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-indigo-600 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 font-medium">Overall Rate</span>
          <span className="text-xl font-black text-indigo-600 block mt-0.5">{overallPresenceRate}%</span>
          <span className="text-[10px] text-slate-400">([P + OD] / Total)</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-500 font-medium">Present</span>
          <span className="text-xl font-black text-emerald-600 block mt-0.5">{presentCount.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400">Classroom presence</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-500">
          <span className="text-xs text-slate-500 font-medium">On Duty</span>
          <span className="text-xl font-black text-blue-600 block mt-0.5">{onDutyCount}</span>
          <span className="text-[10px] text-slate-400">Counts as Present</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-amber-500">
          <span className="text-xs text-slate-500 font-medium">Approved Leave</span>
          <span className="text-xl font-black text-amber-600 block mt-0.5">{leaveCount}</span>
          <span className="text-[10px] text-slate-400">Faculty approved (Absence)</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-rose-500">
          <span className="text-xs text-slate-500 font-medium">Unapproved Absent</span>
          <span className="text-xl font-black text-rose-600 block mt-0.5">{absentCount}</span>
          <span className="text-[10px] text-slate-400">Direct absence</span>
        </Card>
      </div>

      {/* Four-Status Distribution & Rule Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Institutional Status Composition</CardTitle>
            <CardDescription>Visual comparison across the four canonical attendance states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    formatter={(val: any, _name: any, item: any) => [
                      `${val} sessions (${item.payload.percentage}%)`,
                      `${item.payload.label} [${item.payload.countsAs}]`
                    ]}
                  />
                  <Bar dataKey="count" name="Sessions" radius={[3, 3, 0, 0]}>
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Classification & Business Rules</CardTitle>
            <CardDescription>Master Plan Amendment 2 Calculation Policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {distribution.map((item) => (
              <div 
                key={item.status} 
                className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block">{item.description}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={item.countsAs === 'Presence' ? 'success' : item.status === 'LEAVE' ? 'warning' : 'outline'}
                    className="text-[10px]"
                  >
                    {item.countsAs}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{item.count} sessions ({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cohort Longitudinal Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cohort Attendance Progression (Grades 9 – 12)</CardTitle>
          <CardDescription>Monthly presence telemetry by academic cohort (Calculated as [Present + On Duty] / Total)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[88, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip formatter={(val) => [`${val}%`, 'Attendance Rate']} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="gr12" name="Grade 12" stroke="#1d4ed8" strokeWidth={2} />
                <Line type="monotone" dataKey="gr11" name="Grade 11" stroke="#4f46e5" strokeWidth={2} />
                <Line type="monotone" dataKey="gr10" name="Grade 10" stroke="#059669" strokeWidth={2} />
                <Line type="monotone" dataKey="gr9" name="Grade 9" stroke="#d97706" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

// ==========================================
// 4. PRINCIPAL FACULTY
// ==========================================
export const PrincipalFacultyPage: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyDirectoryItem[]>([]);

  useEffect(() => {
    MockDataService.getFacultyDirectory().then(setFaculty);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Faculty Workload & Departmental Directory" 
        description="Departmental teaching assignments, weekly instructional workloads, and assigned classes"
      />

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Faculty Member</th>
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
// 5. PRINCIPAL REPORTS & ACCREDITATION
// ==========================================
export const PrincipalReportsPage: React.FC = () => {
  const [reports, setReports] = useState<PrincipalReportItem[]>([]);

  useEffect(() => {
    MockDataService.getReportMetadata().then(setReports);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Executive Reports & Accreditation Archive" 
        description="Official school dossiers, board examination filings, and institutional performance records"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep, idx) => (
          <Card key={idx} className="p-5 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-[10px] font-mono">{rep.format} • {rep.size}</Badge>
                <span className="text-xs text-slate-400 font-mono">{rep.date}</span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{rep.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rep.desc}</p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="default" size="sm" className="w-full text-xs bg-blue-900 hover:bg-blue-800">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download Official Dossier ({rep.format})
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};
