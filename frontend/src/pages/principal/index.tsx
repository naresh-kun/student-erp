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
  type PrincipalClassGpaItem,
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
        <LoadingState message="Loading executive intelligence dashboard..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Principal Executive Header */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-pink-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm border border-white/20">
            <Award className="w-3.5 h-3.5" />
            <span>Executive Leadership • Institutional Strategic Oversight</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Office of the Principal</h1>
          <p className="text-rose-100 text-xs md:text-sm">
            Institutional quality governance, academic performance indices, and strategic compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="bg-white text-rose-900 hover:bg-rose-50 text-xs shadow-sm">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Annual Executive Dossier
          </Button>
        </div>
      </div>

      {/* High-Level Institutional KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Student Body</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">{kpis.total_students}</span>
          <span className="text-[11px] text-emerald-600 font-medium">99.4% Enrollment Utilization</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Institutional GPA</span>
          <span className="text-2xl font-black text-rose-600 block mt-1">{kpis.school_gpa_average}</span>
          <span className="text-[11px] text-slate-400">Class Average / 4.0 Scale</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Aggregated Attendance</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">{kpis.overall_attendance_rate}%</span>
          <span className="text-[11px] text-emerald-600 font-medium">+1.4% vs Previous Term</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 font-semibold uppercase">Faculty Strength</span>
          <span className="text-2xl font-black text-purple-600 block mt-1">{kpis.total_faculty}</span>
          <span className="text-[11px] text-slate-400">Ratio: {kpis.student_teacher_ratio}</span>
        </Card>
      </div>

      {/* Main Grid: Departmental Performance & Strategic Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Departmental Academic Performance Index</CardTitle>
            <CardDescription>Term pass rate percentages across core academic faculties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="passRate" name="Pass Rate %" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Executive Decisions & Strategic Updates */}
        <Card className="lg:col-span-1 p-5 space-y-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600" /> Strategic Governance
          </CardTitle>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">Accreditation Board Review</span>
              <p className="text-slate-500">Scheduled for March 28, 2026. Institutional documentation dossier submitted.</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">STEM Innovation Lab Expansion</span>
              <p className="text-slate-500">Capital improvement grant approved for modern physics and robotics equipment.</p>
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
  const [classGpa, setClassGpa] = useState<PrincipalClassGpaItem[]>([]);

  useEffect(() => {
    MockDataService.getDepartmentalPerformance().then(setDeptData);
    MockDataService.getClassGpaComparisons().then(setClassGpa);
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="School-Wide Academic Oversight" 
        description="Curriculum delivery progress, grade distributions, and departmental performance audits"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grade-by-Grade Cumulative GPA</CardTitle>
            <CardDescription>Academic Year 2025-2026 Term 1 Results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classGpa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="grade" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 4.0]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="gpa" name="Average GPA" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Departmental Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Syllabus Completion & Workload Delivery</CardTitle>
            <CardDescription>Term curriculum milestones verified by Academic Board</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deptData.map((d, i) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{d.department}</span>
                  <span className="text-rose-600 font-bold">{d.completionRate}% Completed</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-rose-600 rounded-full" style={{ width: `${d.completionRate}%` }} />
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
        description="School-wide presence telemetry, longitudinal trends, and Master Plan Amendment 2 status reconciliation"
      />

      {/* Executive Attendance KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-indigo-500 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 font-medium">Presence Rate</span>
          <span className="text-xl font-black text-indigo-600 block mt-0.5">{overallPresenceRate}%</span>
          <span className="text-[10px] text-slate-400">([P + OD] / Total)</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-500 font-medium">Present</span>
          <span className="text-xl font-black text-emerald-600 block mt-0.5">{presentCount.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400">In lecture</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-blue-500">
          <span className="text-xs text-slate-500 font-medium">On Duty</span>
          <span className="text-xl font-black text-blue-600 block mt-0.5">{onDutyCount}</span>
          <span className="text-[10px] text-slate-400">Counts as Present</span>
        </Card>
        <Card className="p-3 bg-white dark:bg-slate-900 text-center border-l-4 border-l-purple-500">
          <span className="text-xs text-slate-500 font-medium">Approved Leave</span>
          <span className="text-xl font-black text-purple-600 block mt-0.5">{leaveCount}</span>
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
                  <Bar dataKey="count" name="Sessions" radius={[4, 4, 0, 0]}>
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
          <CardTitle className="text-base">Cohort Attendance Progression (Grades 9 - 12)</CardTitle>
          <CardDescription>Monthly presence telemetry by academic cohort (Calculated as [Present + On Duty] / Total)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[88, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="gr12" name="Grade 12" stroke="#e11d48" strokeWidth={2} />
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
        title="Faculty Workload & Academic Performance" 
        description="Departmental teaching distribution, student-faculty ratios, and professional appraisals"
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
                  <th className="py-2.5 px-3">Weekly Teaching Load</th>
                  <th className="py-2.5 px-3">Appraisal Rating</th>
                  <th className="py-2.5 px-3">Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{f.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{f.department}</td>
                    <td className="py-2.5 px-3 text-slate-500">{f.designation}</td>
                    <td className="py-2.5 px-3 font-mono">{f.workload_hours} hrs/wk</td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">{f.rating} / 5.0</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" className="text-[10px]">Exemplary</Badge>
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
        description="Formal institutional dossiers, regulatory compliance filings, and performance analytics"
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
              <Button variant="default" size="sm" className="w-full text-xs bg-rose-600 hover:bg-rose-700">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download Official Dossier ({rep.format})
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};
