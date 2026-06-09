import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Calendar, Users, DollarSign, GraduationCap, 
  ArrowRight, FileText, PieChart as LucidePieChart, Filter, 
  RefreshCw, TrendingUp, Clock, Building2, Activity,
  ChevronRight, ArrowUpRight, ArrowDownRight, Loader2,
  BarChart3, Target, Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import axiosInstance from '../../api/axiosInstance';
import { SchoolFilter } from '../../components/common/SchoolFilter';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

// Chart colors
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

const attendanceTrendData = [
  { month: 'Jan', rate: 92.4 },
  { month: 'Feb', rate: 93.8 },
  { month: 'Mar', rate: 94.6 },
  { month: 'Apr', rate: 94.1 },
  { month: 'May', rate: 95.2 },
  { month: 'Jun', rate: 94.8 }
];

const feeOverviewData = [
  { name: 'Q1', paid: 45000, pending: 15000 },
  { name: 'Q2', paid: 62000, pending: 8000 },
  { name: 'Q3', paid: 78000, pending: 12000 },
  { name: 'Q4', paid: 84200, pending: 12800 }
];

const academicPerformanceData = [
  { name: 'Distinction', value: 35 },
  { name: 'First Class', value: 45 },
  { name: 'Second Class', value: 12 },
  { name: 'Needs Improvement', value: 8 }
];

const reportTypes = [
  { id: 'attendance', name: 'Attendance Summary', icon: Users, color: 'blue', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', borderHover: 'hover:border-blue-200', shadowHover: 'hover:shadow-blue-500/5', accentBar: 'bg-blue-500', desc: 'Class-wise and section-wise attendance performance, absentee trends, and monthly summaries.' },
  { id: 'fees', name: 'Financial Ledger', icon: DollarSign, color: 'emerald', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', borderHover: 'hover:border-emerald-200', shadowHover: 'hover:shadow-emerald-500/5', accentBar: 'bg-emerald-500', desc: 'Fee collection, pending dues, revenue efficiency, and payment distribution reports.' },
  { id: 'academic', name: 'Academic Results', icon: GraduationCap, color: 'indigo', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', borderHover: 'hover:border-indigo-200', shadowHover: 'hover:shadow-indigo-500/5', accentBar: 'bg-indigo-500', desc: 'Exam performance, pass percentage, subject-wise marks, and grading distribution.' },
  { id: 'students', name: 'Student Overview', icon: FileText, color: 'violet', iconBg: 'bg-violet-50', iconColor: 'text-violet-600', borderHover: 'hover:border-violet-200', shadowHover: 'hover:shadow-violet-500/5', accentBar: 'bg-violet-500', desc: 'Student intake, admission pipeline, class distribution, and enrollment growth.' },
];

const kpiConfig = [
  { title: 'Total Students', key: 'students', icon: GraduationCap, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', borderHover: 'hover:border-blue-200', trendLabel: 'from last month', trend: '+4.2%', trendUp: true, barColor: 'bg-blue-500', pct: 90 },
  { title: 'Attendance Rate', key: 'attendance', icon: Users, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', borderHover: 'hover:border-emerald-200', trendLabel: 'from last week', trend: '+0.4%', trendUp: true, barColor: 'bg-emerald-500', pct: 94 },
  { title: 'Fee Collection', key: 'fees', icon: DollarSign, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', borderHover: 'hover:border-indigo-200', trendLabel: 'from last month', trend: '+12.3%', trendUp: true, barColor: 'bg-indigo-500', pct: 85 },
  { title: 'Pending Dues', key: 'pending', icon: Activity, iconBg: 'bg-rose-50', iconColor: 'text-rose-600', borderHover: 'hover:border-rose-200', trendLabel: 'from last month', trend: '-8.2%', trendUp: true, barColor: 'bg-rose-500', pct: 15 },
  { title: 'Academic Pass Rate', key: 'pass', icon: Target, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', borderHover: 'hover:border-amber-200', trendLabel: 'from last semester', trend: '+2.1%', trendUp: true, barColor: 'bg-amber-500', pct: 88 },
  { title: 'Active Staff', key: 'staff', icon: Building2, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', borderHover: 'hover:border-violet-200', trendLabel: 'total educators', trend: 'Stable', trendUp: true, barColor: 'bg-violet-500', pct: 100 },
];

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRole } = usePermissions();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [isTargetToggle, setIsTargetToggle] = useState(false);

  // Filter toolbar state
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [className, setClassName] = useState('all');
  const [section, setSection] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterReportType, setFilterReportType] = useState('all');

  // Operational stats state
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const handleDownloadReport = async (type: string, format: 'pdf' | 'csv') => {
    const loadingKey = `${type}-${format}`;
    setIsGenerating(loadingKey);
    try {
      const token = localStorage.getItem('erp_access_token');
      const downloadUrl = `${axiosInstance.defaults.baseURL}/reports/export?type=${type}&format=${format}&token=${token}${schoolFilter ? `&schoolId=${schoolFilter}` : ''}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${type}_report.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ${format.toUpperCase()} export started!`);
    } catch {
      toast.error('Report generation failed');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleExcelExport = (type: string) => {
    // Safely route to CSV handler as backend does not support real .xlsx files yet
    handleDownloadReport(type, 'csv');
    toast.success('Excel export is not available yet. CSV file downloaded instead.', {
      duration: 5000,
      icon: 'ℹ️'
    });
  };

  // KPI calculations
  const totalStudents = stats?.stats?.totalStudents || 1240;
  const attendanceRate = stats?.todayAttendance 
    ? ((stats.todayAttendance.present / (stats.todayAttendance.total || 1)) * 100).toFixed(1) + '%' 
    : '94.6%';
  const feeCollection = stats?.stats?.totalRevenue 
    ? '₹' + (stats.stats.totalRevenue / 1000).toFixed(1) + 'k' 
    : '₹84.2k';
  const pendingDues = '₹12.8k';
  const academicPassRate = '88.4%';
  const activeStaff = stats?.stats 
    ? ((stats.stats.totalTeachers || 0) + (stats.stats.totalStaff || 0)) || 74
    : 74;

  const kpiValues: Record<string, string | number> = {
    students: totalStudents,
    attendance: attendanceRate,
    fees: feeCollection,
    pending: pendingDues,
    pass: academicPassRate,
    staff: activeStaff,
  };

  const classStrengthData = stats?.studentsByClass?.map((c: any) => ({
    name: c.class,
    students: c.count
  })) || [
    { name: 'Class 1', students: 120 },
    { name: 'Class 2', students: 115 },
    { name: 'Class 3', students: 130 },
    { name: 'Class 4', students: 110 },
    { name: 'Class 5', students: 95 }
  ];

  const chartTooltipStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* ── HEADER ── */}
      <div className="relative group rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-8 md:p-10 text-white shadow-2xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
          <BarChart3 className="w-56 h-56" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-blue-300">
              <Zap className="w-3.5 h-3.5" /> Analytics Intelligence Center
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3">
              Reports & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">Analytics</span>
            </h1>
            <p className="text-blue-200/80 font-medium text-sm">
              Real-time academic, attendance, fee, and institutional performance insights.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {isRole(['super_admin']) && (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-1.5">
                <SchoolFilter value={schoolFilter} onChange={setSchoolFilter} />
              </div>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-xl border border-white/10 text-white hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <Card className="!rounded-[2rem] !p-4 !border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Filter className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Filters</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={academicYear} 
              onChange={e => setAcademicYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:outline-none cursor-pointer font-medium transition-all"
            >
              <option value="2026-27">AY 2026-27</option>
              <option value="2025-26">AY 2025-26</option>
            </select>
            
            <select 
              value={className} 
              onChange={e => setClassName(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:outline-none cursor-pointer font-medium transition-all"
            >
              <option value="all">All Classes</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
            </select>
            
            <select 
              value={section} 
              onChange={e => setSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:outline-none cursor-pointer font-medium transition-all"
            >
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>

            <input 
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-slate-50 border border-slate-200 text-slate-500 text-xs px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:outline-none font-medium transition-all"
              placeholder="Start Date"
            />

            <select 
              value={filterReportType} 
              onChange={e => setFilterReportType(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:outline-none cursor-pointer font-medium transition-all"
            >
              <option value="all">All Types</option>
              <option value="academic">Academic</option>
              <option value="attendance">Attendance</option>
              <option value="financial">Financial</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── TOP KPI ROW ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">
            Key Performance Indicators
          </h2>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {kpiConfig.map((kpi, idx) => {
            const Icon = kpi.icon;
            const value = kpiValues[kpi.key];
            return (
              <div
                key={idx}
                className={clsx(
                  'bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm transition-all duration-500 hover:shadow-2xl flex flex-col justify-between h-44 relative overflow-hidden group',
                  kpi.borderHover
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{kpi.title}</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight mt-3">{value}</p>
                  </div>
                  <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm', kpi.iconBg)}>
                    <Icon className={clsx('w-6 h-6', kpi.iconColor)} />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full transition-all duration-1000', kpi.barColor)} style={{ width: `${kpi.pct}%` }} />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    {kpi.trend === 'Stable' ? (
                      <span className="text-slate-400">Stable</span>
                    ) : kpi.trendUp ? (
                      <span className="text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" />{kpi.trend}</span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-0.5"><ArrowDownRight className="w-3.5 h-3.5" />{kpi.trend}</span>
                    )}
                    <span className="text-slate-400 font-medium">{kpi.trendLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ANALYTICS VISUALIZATIONS ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">
            Performance Analytics
          </h2>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Attendance Trend */}
          <Card className="!rounded-[2rem] !border-slate-100 hover:!shadow-2xl hover:!shadow-blue-500/5 hover:!border-blue-200 transition-all duration-500">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Attendance Trend</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase pl-10">Monthly average %</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[85, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#1e293b', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} fill="url(#attendanceGrad)" dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Fee Collection Overview */}
          <Card className="!rounded-[2rem] !border-slate-100 hover:!shadow-2xl hover:!shadow-indigo-500/5 hover:!border-indigo-200 transition-all duration-500">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Fee Collection Mix</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase pl-10">Paid vs Pending</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeOverviewData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#1e293b', fontWeight: 'bold' }} />
                  <Bar dataKey="paid" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Paid" />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Academic Performance */}
          <Card className="!rounded-[2rem] !border-slate-100 hover:!shadow-2xl hover:!shadow-emerald-500/5 hover:!border-emerald-200 transition-all duration-500">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Grade Distribution</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase pl-10">Passing student splits</p>
            </div>
            <div className="h-56 flex flex-col justify-between">
              <div className="h-36 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={academicPerformanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={58} paddingAngle={4} stroke="none">
                      {academicPerformanceData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-slate-800">88.4%</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">Pass Rate</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9px] text-slate-500 font-bold uppercase">
                {academicPerformanceData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Class-wise Student Strength */}
          <Card className="!rounded-[2rem] !border-slate-100 hover:!shadow-2xl hover:!shadow-violet-500/5 hover:!border-violet-200 transition-all duration-500">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Enrollment Distribution</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase pl-10">Active strength by class</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classStrengthData} layout="vertical" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#1e293b', fontWeight: 'bold' }} />
                  <Bar dataKey="students" fill="#10b981" radius={[0, 4, 4, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      </div>

      {/* ── REPORT EXPORT CARDS ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">
            Report Export Console
          </h2>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className={clsx(
                  'bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-2xl group flex',
                  report.borderHover, report.shadowHover
                )}
              >
                <div className={clsx('w-1.5 group-hover:w-2.5 transition-all duration-300 shrink-0', report.accentBar)} />
                <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm', report.iconBg)}>
                      <Icon className={clsx('w-7 h-7', report.iconColor)} />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">{report.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{report.desc}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <Button 
                      variant="primary"
                      size="xs"
                      className="!rounded-xl !text-[10px] !font-black !uppercase !tracking-wider !py-2.5"
                      disabled={isGenerating === `${report.id}-pdf`}
                      onClick={() => handleDownloadReport(report.id, 'pdf')}
                      isLoading={isGenerating === `${report.id}-pdf`}
                    >
                      Export PDF
                    </Button>
                    <Button 
                      variant="secondary"
                      size="xs"
                      className="!rounded-xl !text-[10px] !font-black !uppercase !tracking-wider !py-2.5"
                      disabled={isGenerating === `${report.id}-csv`}
                      onClick={() => handleDownloadReport(report.id, 'csv')}
                      isLoading={isGenerating === `${report.id}-csv`}
                    >
                      CSV Data
                    </Button>
                    <Button 
                      variant="success"
                      size="xs"
                      className="!rounded-xl !text-[10px] !font-black !uppercase !tracking-wider !py-2.5"
                      onClick={() => handleExcelExport(report.id)}
                    >
                      Excel
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STATS COMPARISON & SCHEDULED BULLETINS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Statistical Comparison block */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
                <LucidePieChart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base tracking-tight uppercase">Statistical Comparison</h3>
                <p className="text-xs text-slate-400 font-medium">Institutional progress vs target metrics</p>
              </div>
            </div>
            <div className="bg-slate-50 p-1 border border-slate-200 rounded-xl inline-flex gap-1">
              <button 
                onClick={() => setIsTargetToggle(false)}
                className={clsx(
                  'px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer',
                  !isTargetToggle ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
                )}
              >
                Current Quarter
              </button>
              <button 
                onClick={() => setIsTargetToggle(true)}
                className={clsx(
                  'px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer',
                  isTargetToggle ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
                )}
              >
                Target Goals
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            {[
              { label: 'Total Student Intake', value: isTargetToggle ? 95 : 85, barColor: 'bg-blue-500', textColor: 'text-blue-600' },
              { label: 'Revenue Collection Efficiency', value: isTargetToggle ? 98 : 92, barColor: 'bg-emerald-500', textColor: 'text-emerald-600' },
              { label: 'Academic Pass Percentage', value: isTargetToggle ? 90 : 78, barColor: 'bg-indigo-500', textColor: 'text-indigo-600' },
              { label: 'Attendance Health', value: isTargetToggle ? 97 : 94.6, barColor: 'bg-amber-500', textColor: 'text-amber-600' },
              { label: 'Library Circulation Rate', value: isTargetToggle ? 60 : 45, barColor: 'bg-rose-500', textColor: 'text-rose-600' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="uppercase tracking-wider text-[10px] font-black text-slate-500">{stat.label}</span>
                  <span className={clsx('font-black', stat.textColor)}>{stat.value}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
                  <div 
                    className={clsx('h-full rounded-full transition-all duration-1000', stat.barColor)} 
                    style={{ width: `${stat.value}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Reports block */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all duration-500 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base tracking-tight uppercase">Scheduled Reports</h3>
                <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">Automation Engine Active</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { name: 'Weekly Attendance', next: 'Every Friday, 4PM', badgeColor: 'green' },
                { name: 'Monthly Financials', next: '1st of every Month', badgeColor: 'green' },
                { name: 'Annual Audit', next: '31st March 2027', badgeColor: 'blue' },
                { name: 'Exam Performance Summary', next: 'After Exam Cycle', badgeColor: 'amber' },
                { name: 'Fee Defaulter Report', next: 'Weekly on Mondays', badgeColor: 'green' }
              ].map((job) => (
                <div key={job.name} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-300 cursor-pointer group flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-700 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{job.name}</span>
                    <p className="text-[10px] text-slate-400 font-medium">{job.next}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.badgeColor === 'green' ? (
                      <Badge variant="green" className="text-[9px] px-2 py-0.5 font-black uppercase">Active</Badge>
                    ) : job.badgeColor === 'blue' ? (
                      <Badge variant="blue" className="text-[9px] px-2 py-0.5 font-black uppercase">Pending</Badge>
                    ) : (
                      <Badge variant="yellow" className="text-[9px] px-2 py-0.5 font-black uppercase">Paused</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="primary"
              className="w-full !rounded-2xl !py-3 !text-[11px] !font-black !uppercase !tracking-wider !shadow-lg !shadow-blue-600/10"
              onClick={() => navigate('/settings')}
            >
              Configure Automation
            </Button>
          </div>
          
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 bg-indigo-100/30 rounded-full blur-3xl" />
        </div>

      </div>

    </div>
  );
};
