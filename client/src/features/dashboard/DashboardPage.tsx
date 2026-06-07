import React, { useEffect, useState } from 'react';
import {
  GraduationCap, Users, UserCheck, UserCog, ClipboardList,
  Bell, TrendingUp, Calendar, DollarSign, ChevronRight,
  Clock, BookOpen, CreditCard, Award, HelpCircle, Activity,
  FileText, Bus, Settings, ArrowRight, ShieldCheck, Heart, School, Wallet,
  Megaphone, CheckCircle, AlertTriangle, UserPlus, Layers, Compass, Building2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { StatCard } from '../../components/common/Card';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setActiveStudent } from '../../features/auth/authSlice';
import { clsx } from 'clsx';
import { ApiResponse } from '../../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
    <div className="flex justify-between">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-slate-100 rounded" />
        <div className="h-7 w-16 bg-slate-100 rounded" />
      </div>
      <div className="w-12 h-12 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { school } = useSelector((state: RootState) => state.settings);
  const { scopedSchoolId, scopedSchoolName, activeStudentId, activeStudentName } = useSelector((state: RootState) => state.auth);
  const enabledModules = (school?.enabledModules as string[]) || [];

  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportData, setSupportData] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [studentStats, setStudentStats] = useState<any>(null);
  const [studentAttendance, setStudentAttendance] = useState<any>(null);
  const [timetableToday, setTimetableToday] = useState<any[]>([]);
  const [homeworkPending, setHomeworkPending] = useState<any[]>([]);
  const [examsUpcoming, setExamsUpcoming] = useState<any[]>([]);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [isStudentDataLoading, setIsStudentDataLoading] = useState(false);

  const fetchStudentData = async (stuId: string) => {
    setIsStudentDataLoading(true);
    try {
      const [ledgerRes, attendanceRes, studentRes] = await Promise.all([
        axiosInstance.get<ApiResponse<any>>(`/fees/status/${stuId}`),
        axiosInstance.get<ApiResponse<any>>(`/attendance/report/${stuId}`),
        axiosInstance.get<ApiResponse<any>>(`/students/${stuId}`)
      ]);
      setStudentStats(ledgerRes.data.data);
      setStudentAttendance(attendanceRes.data.data);
      setStudentDetails(studentRes.data.data);

      const sectionId = studentRes.data.data?.section?.id;
      const classId = studentRes.data.data?.class?.id;
      if (sectionId) {
        const [ttRes, hwRes, examsRes] = await Promise.all([
          axiosInstance.get<ApiResponse<any[]>>(`/timetables?sectionId=${sectionId}`),
          axiosInstance.get<ApiResponse<any[]>>(`/homework`),
          axiosInstance.get<ApiResponse<any[]>>(`/exams?classId=${classId}`)
        ]);
        
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = daysOfWeek[new Date().getDay()];
        const entries = ttRes.data.data?.[0]?.entries || [];
        const todayEntries = entries.filter((e: any) => e.day === todayName)
          .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
        setTimetableToday(todayEntries);

        const activeHw = hwRes.data.data || [];
        setHomeworkPending(activeHw.filter((h: any) => new Date(h.dueDate) >= new Date()).slice(0, 3));

        const activeExams = examsRes.data.data || [];
        setExamsUpcoming(activeExams.filter((e: any) => new Date(e.startDate) >= new Date()).slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setIsStudentDataLoading(false);
    }
  };

  useEffect(() => {
    if (activeStudentId && (user?.role === 'parent' || user?.role === 'student')) {
      fetchStudentData(activeStudentId);
    }
  }, [activeStudentId, user?.role]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const handleSupportRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/support/tickets', supportData);
      toast.success('Support ticket created! Our team will contact you within 4 hours.');
      setIsSupportModalOpen(false);
      setSupportData({ subject: '', message: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <School className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Unable to load dashboard</h2>
        <p className="text-sm mt-2">There was a problem connecting to the server. Please try refreshing.</p>
        <Button onClick={() => window.location.reload()} className="mt-6">Refresh Page</Button>
      </div>
    );
  }

  const getRoleHeading = () => {
    switch (user?.role) {
      case 'super_admin':
        return 'Global Platform Governance Terminal';
      case 'admin':
        return 'Institutional Administration Terminal';
      case 'principal':
        return 'Principal Executive Console';
      case 'clerk':
        return 'Administrative Clerical Workdesk';
      case 'teacher':
        return 'Educator Workspace & Classroom Portal';
      case 'student':
        return 'Student Academic Portal';
      case 'parent':
        return 'Guardian Family Access Hub';
      default:
        return 'Vantage ERP School Console';
    }
  };

  const isSchoolStaff = ['super_admin', 'admin', 'principal', 'clerk'].includes(user?.role || '');
  const isTeacherRole = user?.role === 'teacher';
  const isStudentParent = ['student', 'parent'].includes(user?.role || '');

  const quickActions = (() => {
    if (isSchoolStaff) {
      return [
        { label: 'Add Student', icon: UserPlus, href: '/students/new', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700' },
        { label: 'Collect Fee', icon: DollarSign, href: '/fees/collect', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700' },
        { label: 'Add Enquiry', icon: HelpCircle, href: '/enquiries', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 hover:text-purple-700' },
        { label: 'Mark Attendance', icon: UserCheck, href: '/attendance/students', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700' },
        { label: 'Create Notice', icon: Megaphone, href: '/notices', color: 'text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700' },
        { label: 'View Reports', icon: FileText, href: '/reports', color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700' },
      ];
    }
    if (isTeacherRole) {
      return [
        { label: 'Mark Attendance', icon: UserCheck, href: '/attendance/students', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700' },
        { label: 'Add Homework', icon: BookOpen, href: '/homework', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700' },
        { label: 'View Timetable', icon: Clock, href: '/timetable', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 hover:text-purple-700' },
        { label: 'Enter Marks', icon: Award, href: '/exams/marks', color: 'text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700' },
      ];
    }
    if (isStudentParent) {
      return [
        { label: 'My Attendance', icon: UserCheck, href: '/student/attendance', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700' },
        { label: 'My Fees', icon: Wallet, href: '/student/fees', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700' },
        { label: 'Homework', icon: BookOpen, href: '/homework', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700' },
        { label: 'Exams', icon: Award, href: '/exams', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 hover:text-purple-700' },
        { label: 'Notices', icon: Megaphone, href: '/notices', color: 'text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700' },
      ];
    }
    return [];
  })();

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-12">
      {/* ── PREMIUM HEADER ────────────────────────────────────────── */}
      <div className="relative group rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-indigo-500/20">
         <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <School className="w-64 h-64" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-blue-300">
                  <ShieldCheck className="w-3.5 h-3.5" /> {scopedSchoolId ? `Session Context: ${scopedSchoolName}` : 'Secure Institution Terminal'}
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-4">
                  Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">{user?.name?.split(' ')[0]}</span> 👋
               </h1>
               <p className="text-blue-200 font-bold text-sm md:text-base tracking-wide uppercase mt-1">
                 {getRoleHeading()}
               </p>
                {scopedSchoolId && school ? (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-blue-100/80">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                      <School className="w-4 h-4 text-blue-400" /> {school.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                      <Compass className="w-4 h-4 text-blue-400" /> {school.address}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-blue-400" /> {todayStr}
                    </div>
                  </div>
                ) : (
                  <p className="text-blue-100/60 font-medium text-lg flex items-center gap-2 mt-2">
                    <Layers className="w-5 h-5 opacity-60" /> Platform Governance Console <span className="opacity-40">|</span> {todayStr}
                  </p>
                )}
            </div>
             <div className="flex items-center gap-4">
                {user?.role === 'super_admin' && !scopedSchoolId ? (
                  <Link to="/super-admin/schools" className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 active:scale-95">
                     <Building2 className="w-5 h-5" /> All Schools
                  </Link>
                ) : isAdmin && (
                  <Link to="/admissions/new" className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 active:scale-95">
                     <UserPlus className="w-5 h-5" /> Enlist Student
                  </Link>
                )}
               <button className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/20 transition-all text-white relative flex items-center justify-center">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-indigo-950 animate-pulse"></span>
               </button>
            </div>
         </div>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────── */}
      {quickActions.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-4">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">
               Quick Actions
             </h2>
             <div className="h-px bg-slate-100 flex-1" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {quickActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={idx}
                  to={action.href}
                  className="p-6 rounded-[2rem] bg-white border border-slate-200 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all text-left flex flex-col items-center justify-center text-center group active:scale-95 shadow-sm"
                >
                  <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-md", action.color)}>
                    <ActionIcon className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-800 leading-tight">{action.label}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADMIN INTELLIGENCE ────────────────────────────────────── */}
      {isAdmin && stats?.stats && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">
               {user?.role === 'super_admin' && !scopedSchoolId ? 'Platform Governance Metrics' : 'Institutional Metrics'}
             </h2>
             <div className="h-px bg-slate-100 flex-1" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {user?.role === 'super_admin' && !scopedSchoolId && (
              <StatCard 
                title="Active Schools" value={stats.stats.totalSchools || 0} 
                icon={<Building2 className="w-6 h-6 text-indigo-600" />} iconBg="bg-indigo-50" 
                onClick={() => navigate('/super-admin/schools')}
                className="rounded-[2rem] border-slate-100 hover:border-indigo-200 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5 group"
              />
            )}
            <StatCard 
              title="Global Enrollment" value={stats.stats.totalStudents} 
              icon={<GraduationCap className="w-6 h-6 text-blue-600" />} iconBg="bg-blue-50" 
              onClick={() => navigate('/students')}
              className="rounded-[2rem] border-slate-100 hover:border-blue-200 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 group"
            />
            <StatCard 
              title="Active Educators" value={stats.stats.totalTeachers} 
              icon={<UserCheck className="w-6 h-6 text-emerald-600" />} iconBg="bg-emerald-50" 
              onClick={() => navigate('/teachers')}
              className="rounded-[2rem] border-slate-100 hover:border-emerald-200 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5"
            />
            <StatCard 
              title="Operations Staff" value={stats.stats.totalStaff} 
              icon={<UserCog className="w-6 h-6 text-violet-600" />} iconBg="bg-violet-50" 
              onClick={() => navigate('/staff')}
              className="rounded-[2rem] border-slate-100 hover:border-violet-200 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/5"
            />
            {enabledModules.includes('admissions') && (
              <StatCard 
                title="Admission Pipeline" value={stats.stats.pendingAdmissions} 
                icon={<ClipboardList className="w-6 h-6 text-amber-600" />} iconBg="bg-amber-50" 
                onClick={() => navigate('/admissions')}
                className="rounded-[2rem] border-slate-100 hover:border-amber-200 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/5"
              />
            )}
            {enabledModules.includes('admissions') && (
              <StatCard 
                title="Inquiry Volume" value={stats.stats.totalEnquiries} 
                icon={<Activity className="w-6 h-6 text-rose-600" />} iconBg="bg-rose-50" 
                onClick={() => navigate('/enquiries')}
                className="rounded-[2rem] border-slate-100 hover:border-rose-200 transition-all duration-500 hover:shadow-2xl hover:shadow-rose-500/5"
              />
            )}
            {enabledModules.includes('fees') && (
              <StatCard 
                title="Revenue Stream" value={`₹${(stats.stats.totalRevenue / 1000).toFixed(1)}k`} 
                icon={<DollarSign className="w-6 h-6 text-teal-600" />} iconBg="bg-teal-50" 
                onClick={() => navigate('/fees/payments')}
                className="rounded-[2rem] border-slate-100 hover:border-teal-200 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/5"
              />
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {enabledModules.includes('attendance') && (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><UserCheck className="w-5 h-5" /></div>
                      Attendance Audit
                   </h3>
                   <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">LIVE</span>
                </div>
                <div className="space-y-6">
                  {stats.todayAttendance && [
                    { label: 'Present', value: stats.todayAttendance.present, color: 'bg-emerald-500', glow: 'shadow-emerald-500/40' },
                    { label: 'Absent', value: stats.todayAttendance.absent, color: 'bg-rose-500', glow: 'shadow-rose-500/40' },
                    { label: 'On Leave', value: stats.todayAttendance.leave, color: 'bg-amber-500', glow: 'shadow-amber-500/40' },
                  ].map((item) => {
                    const pct = Math.round((item.value / (stats.todayAttendance.total || 1)) * 100);
                    return (
                      <div key={item.label} className="space-y-2">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                          <span className="flex items-center gap-1.5"><div className={clsx("w-1.5 h-1.5 rounded-full", item.color)} /> {item.label}</span>
                          <span className="text-slate-900">{item.value} <span className="text-slate-300 font-medium ml-1">({pct}%)</span></span>
                        </div>
                        <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                          <div className={clsx("h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]", item.color, item.glow)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden relative">
              <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                 <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><TrendingUp className="w-5 h-5" /></div>
                 Enrollment Mix
              </h3>
              <div className="h-[220px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.studentsByClass?.slice(0, 5) || []} dataKey="count" nameKey="class" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} stroke="none">
                      {stats.studentsByClass?.slice(0, 5).map((_: any, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer outline-none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-3xl font-black text-slate-900">{stats.stats.totalStudents}</span>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Souls</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
              <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                 <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><Award className="w-5 h-5" /></div>
                 Exam Cycle
              </h3>
              <div className="space-y-4">
                {stats.upcomingExams?.length > 0 ? stats.upcomingExams.slice(0, 3).map((exam: any) => (
                  <div 
                    key={exam.id} 
                    onClick={() => navigate('/exams')}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-200 hover:bg-white hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex flex-col items-center justify-center font-black text-xs shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform">
                      <span className="leading-none">{format(new Date(exam.startDate), 'dd')}</span>
                      <span className="text-[8px] uppercase opacity-80">{format(new Date(exam.startDate), 'MMM')}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{exam.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] text-slate-400 font-bold uppercase">{exam.class?.name}</span>
                         <div className="w-1 h-1 bg-slate-200 rounded-full" />
                         <span className="text-[10px] text-rose-500 font-black uppercase">Phase 1</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                )) : (
                  <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[2rem]">
                     <Award className="w-10 h-10 mx-auto mb-3 opacity-20" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No Active Exam Phases</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TEACHER HUB ────────────────────────────────────────────── */}
      {isTeacher && stats?.teacherStats && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center gap-4">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">Classroom Management</h2>
             <div className="h-px bg-slate-100 flex-1" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Direct Students" value={stats.teacherStats.totalActiveStudents} 
              icon={<Users className="w-6 h-6 text-blue-600" />} iconBg="bg-blue-50" 
              onClick={() => navigate('/students')}
              className="rounded-[2rem] border-slate-100 hover:border-blue-200 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 group"
            />
            <StatCard 
              title="Class Load" value={stats.teacherStats.totalClasses} 
              icon={<Layers className="w-6 h-6 text-violet-600" />} iconBg="bg-violet-50" 
              onClick={() => navigate('/classes')}
              className="rounded-[2rem] border-slate-100 hover:border-violet-200 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/5"
            />
            <StatCard 
              title="Subject Domain" value={stats.teacherStats.totalSubjects} 
              icon={<BookOpen className="w-6 h-6 text-emerald-600" />} iconBg="bg-emerald-50" 
              onClick={() => navigate('/subjects')}
              className="rounded-[2rem] border-slate-100 hover:border-emerald-200 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5"
            />
            {enabledModules.includes('homework') && (
              <StatCard 
                title="Homework Queue" value={stats.teacherStats.pendingHomework} 
                icon={<ClipboardList className="w-6 h-6 text-amber-600" />} iconBg="bg-amber-50" 
                onClick={() => navigate('/homework')}
                className="rounded-[2rem] border-slate-100 hover:border-amber-200 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/5"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               { label: 'Register Presence', icon: UserCheck, color: 'bg-emerald-50 text-emerald-600', href: '/attendance/students', desc: 'Daily Student Logging' },
               { label: 'Curate Homework', icon: BookOpen, color: 'bg-amber-50 text-amber-600', href: '/homework', desc: 'Assignments & Tasks' },
               { label: 'View Schedule', icon: Clock, color: 'bg-violet-50 text-violet-600', href: '/timetable', desc: 'Class Time-slotting' },
             ].map(item => (
                <button 
                  key={item.label} onClick={() => navigate(item.href)}
                  className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all text-left flex items-center justify-between group"
                >
                   <div className="flex items-center gap-6">
                      <div className={clsx("w-16 h-16 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg", item.color)}>
                         <item.icon className="w-8 h-8" />
                      </div>
                      <div>
                         <p className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none">{item.label}</p>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-2 opacity-80">{item.desc}</p>
                      </div>
                   </div>
                   <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-500">
                      <ChevronRight className="w-5 h-5" />
                   </div>
                </button>
             ))}
          </div>
        </div>
      )}

      {/* ── STUDENT/PARENT TERMINAL ─────────────────────────────────── */}
      {isStudentParent && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          {/* Active context indicator */}
          {user?.role === 'parent' && activeStudentName && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Active Child Profile</p>
                <h3 className="text-xl font-black text-indigo-900 mt-1 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                  {activeStudentName}
                </h3>
                {studentDetails && (
                  <p className="text-xs text-indigo-700 font-bold uppercase mt-1">
                    Class: {studentDetails.class?.name} &bull; Section: {studentDetails.section?.name} &bull; Adm No: {studentDetails.admissionNumber}
                  </p>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-widest rounded-full">
                Multi-Child view enabled
              </div>
            </div>
          )}

          {isStudentDataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <>
              {/* Dashboard stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Attendance Summary */}
                <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all duration-500">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Attendance</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">
                      {studentAttendance?.stats?.percentage ?? 0}%
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {studentAttendance?.stats?.present ?? 0} Present / {studentAttendance?.stats?.absent ?? 0} Absent
                    </p>
                  </div>
                  <div className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all group-hover:scale-110",
                    (studentAttendance?.stats?.percentage ?? 0) >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    <UserCheck className="w-7 h-7" />
                  </div>
                </div>

                {/* Financial Ledger Status */}
                <div 
                  onClick={() => navigate('/student/fees')}
                  className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex items-center justify-between group hover:border-blue-200 hover:shadow-md cursor-pointer transition-all duration-500"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Ledger</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">
                      ₹{studentStats?.balanceDue ?? 0}
                    </p>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      {studentStats?.balanceDue > 0 ? (
                        <span className="text-rose-500 font-bold uppercase tracking-wider text-[9px] bg-rose-50 px-1.5 py-0.5 rounded">Outstanding Dues</span>
                      ) : (
                        <span className="text-emerald-500 font-bold uppercase tracking-wider text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded">All Cleared</span>
                      )}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-md transition-all group-hover:scale-110">
                    <Wallet className="w-7 h-7" />
                  </div>
                </div>

                {/* Homework Queue Card */}
                <div 
                  onClick={() => navigate('/homework')}
                  className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex items-center justify-between group hover:border-amber-200 hover:shadow-md cursor-pointer transition-all duration-500"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Assignments</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">
                      {homeworkPending.length}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Active deliverables in progress
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-md transition-all group-hover:scale-110">
                    <BookOpen className="w-7 h-7" />
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Timetable Widget */}
                <div className="lg:col-span-6 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight text-lg">
                    <div className="p-2 bg-violet-50 rounded-xl text-violet-600"><Clock className="w-5 h-5" /></div>
                    Today's Academic Schedule
                  </h3>
                  {timetableToday.length > 0 ? (
                    <div className="space-y-4">
                      {timetableToday.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300">
                          <div className="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-black rounded-lg">
                            {entry.startTime} - {entry.endTime}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{entry.subject?.name}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{entry.subject?.teacher?.name || 'Assigned Instructor'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[2rem]">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No Class Periods Scheduled</p>
                      <p className="text-xs font-medium text-slate-400 mt-1">Enjoy your free time today!</p>
                    </div>
                  )}
                </div>

                {/* Homework List Widget */}
                <div className="lg:col-span-6 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight text-lg">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><ClipboardList className="w-5 h-5" /></div>
                    Homework deliverables
                  </h3>
                  {homeworkPending.length > 0 ? (
                    <div className="space-y-4">
                      {homeworkPending.map((hw: any) => (
                        <div 
                          key={hw.id} 
                          onClick={() => navigate('/homework')}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer group flex items-start gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">{hw.subject?.name}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due: {format(new Date(hw.dueDate), 'dd MMM')}</span>
                            </div>
                            <p className="text-sm font-black text-slate-800 mt-2 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{hw.title}</p>
                            <p className="text-xs text-slate-400 line-clamp-1 font-medium mt-1">{hw.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 self-center group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[2rem]">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No Pending Homework</p>
                      <p className="text-xs font-medium text-slate-400 mt-1">Outstanding assignments are up to date!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Exams (Only for student/parent view) */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight text-lg">
                  <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><Award className="w-5 h-5" /></div>
                  Upcoming Exams & Assessments
                </h3>
                {examsUpcoming.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {examsUpcoming.map((exam: any) => (
                      <div 
                        key={exam.id} 
                        onClick={() => navigate('/exams')}
                        className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer group flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex flex-col items-center justify-center font-black text-xs shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform">
                          <span className="leading-none">{format(new Date(exam.startDate), 'dd')}</span>
                          <span className="text-[8px] uppercase opacity-80">{format(new Date(exam.startDate), 'MMM')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tight group-hover:text-blue-600 transition-colors">{exam.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{exam.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[2rem]">
                    <Award className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Upcoming Assessments</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">No exam schedules have been announced yet.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SHARED TERMINAL: Notices & Ecosystem ───────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {enabledModules.includes('notices') && (
          <div className={clsx("bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500", isAdmin ? "xl:col-span-8" : "xl:col-span-12")}>
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><Megaphone className="w-5 h-5" /></div>
                    <h3 className="font-black text-slate-900 text-2xl uppercase tracking-tight">Institutional Bulletins</h3>
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-11">Real-time announcements from the administration</p>
              </div>
              <Button variant="secondary" className="rounded-xl px-6 h-11 text-[10px] font-black uppercase tracking-widest border-slate-200" onClick={() => navigate('/notices')}>Archive</Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {stats?.recentNotices?.length > 0 ? (
                stats.recentNotices.slice(0, 4).map((notice: any) => (
                  <div 
                    key={notice.id} 
                    onClick={() => navigate('/notices')}
                    className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 cursor-pointer group"
                  >
                    <div className="flex items-center gap-6 flex-1">
                       <div className={clsx(
                         "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-500",
                         notice.priority === 'high' ? 'bg-rose-500 text-white' : 'bg-white text-slate-400'
                       )}>
                          <AlertTriangle className="w-6 h-6" />
                       </div>
                       <div className="overflow-hidden">
                          <div className="flex items-center gap-3 mb-1">
                             <p className="text-base font-black text-slate-800 leading-snug group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">{notice.title}</p>
                             {notice.priority === 'high' && <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black uppercase tracking-[0.1em] rounded-full">Urgent</span>}
                          </div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-tight opacity-70 line-clamp-1">{notice.content || 'Expand to view the full announcement details.'}</p>
                       </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(notice.publishDate), 'dd MMM')}</span>
                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight mt-1">{format(new Date(notice.publishDate), 'yyyy')}</span>
                    </div>
                  </div>
                ))
              ) : (
                  <div className="py-20 text-center text-slate-400 border-4 border-dashed border-slate-50 rounded-[2.5rem]">
                      <Megaphone className="w-16 h-16 mx-auto mb-6 opacity-10" />
                      <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Frequency is silent</p>
                      <p className="text-[10px] font-bold text-slate-300 mt-2">No active broadcasts currently detected</p>
                  </div>
              )}
            </div>
          </div>
        )}
        
        {isAdmin && (
          <div className="xl:col-span-4 bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-t border-white/5 group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Compass className="w-48 h-48" /></div>
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 mb-10 flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" /> Utility Terminal
            </h3>
            <div className="space-y-4 relative z-10">
              {[
                 { label: 'Ecosystem Logs', icon: Activity, href: '/reports', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                 { label: 'Internal Support', icon: HelpCircle, onClick: () => setIsSupportModalOpen(true), color: 'text-amber-400', bg: 'bg-amber-500/10' },
                 { label: 'Global Config', icon: Settings, href: '/settings', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              ].map((item, i) => (
                <button 
                  key={i} 
                  onClick={item.onClick || (() => navigate(item.href!))}
                  className="w-full flex items-center gap-6 p-6 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group/btn"
                >
                  <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center group-hover/btn:scale-110 transition-transform duration-500", item.bg, item.color)}>
                     <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/btn:text-white transition-colors">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-14 pt-8 border-t border-white/5 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Engine</p>
                  <p className="text-xs font-black text-blue-400 uppercase tracking-tight mt-1">Vantage ERP <span className="text-slate-700">v2.0.4</span></p>
               </div>
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-slate-600" />
               </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} title="Vantage ERP Support Portal">
         <div className="space-y-6 p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 space-y-2">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Priority Hotline</p>
                  <p className="text-xl font-black text-blue-900">+91 98765 43210</p>
                  <p className="text-xs text-blue-600 font-bold">24/7 Enterprise Support</p>
               </div>
               <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 space-y-2">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Direct Email</p>
                  <p className="text-xl font-black text-amber-900">care@vantage.erp</p>
                  <p className="text-xs text-amber-600 font-bold">Guaranteed 4h Response</p>
               </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            <form onSubmit={handleSupportRequest} className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Support Ticket</h4>
               <Input 
                 label="Subject" 
                 placeholder="e.g., Database synchronization issue" 
                 required 
                 value={supportData.subject}
                 onChange={(e) => setSupportData({ ...supportData, subject: e.target.value })}
               />
               <Input 
                 label="Describe your issue" 
                 multiline 
                 placeholder="Provide as much detail as possible..." 
                 required 
                 value={supportData.message}
                 onChange={(e) => setSupportData({ ...supportData, message: e.target.value })}
               />
               <Button 
                 type="submit" 
                 className="w-full h-14 rounded-xl font-black uppercase tracking-widest text-xs"
                 isLoading={isSubmitting}
               >
                 Submit Technical Ticket
               </Button>
            </form>
         </div>
      </Modal>
    </div>
  );
};

