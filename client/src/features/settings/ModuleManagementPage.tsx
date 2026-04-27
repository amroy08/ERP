import React, { useState, useEffect } from 'react';
import { 
  Settings, CheckCircle, XCircle, 
  Library, BookOpen, GraduationCap, 
  DollarSign, Package, Bus, Bell, 
  CalendarDays, Save, AlertTriangle, ShieldCheck, ChevronRight,
  Users, UserCog, School, Crown, Lock, Unlock, Layers
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { updateEnabledModules, setSchoolSettings } from '../../store/settingsSlice';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface ModuleDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'Academics' | 'Administration' | 'Financials' | 'Infrastructure';
}

const ALL_MODULES: ModuleDef[] = [
  { id: 'attendance', name: 'Attendance Management', description: 'Track daily student presence and generate reports.', icon: <CheckCircle className="w-5 h-5" />, category: 'Academics' },
  { id: 'homework', name: 'Homework & Assignments', description: 'Digital assignment submission and teacher feedback.', icon: <BookOpen className="w-5 h-5" />, category: 'Academics' },
  { id: 'exams', name: 'Examination & Grading', description: 'Schedule exams, enter marks, and generate report cards.', icon: <GraduationCap className="w-5 h-5" />, category: 'Academics' },
  { id: 'timetable', name: 'Class Timetable', description: 'Weekly schedule management for classes and teachers.', icon: <CalendarDays className="w-5 h-5" />, category: 'Academics' },
  { id: 'fees', name: 'Fee Management', description: 'Collect fees, track dues, and manage financial ledgers.', icon: <DollarSign className="w-5 h-5" />, category: 'Financials' },
  { id: 'notices', name: 'Notice Board', description: 'Broadcast announcements to students, parents, and staff.', icon: <Bell className="w-5 h-5" />, category: 'Administration' },
  { id: 'library', name: 'Library Management', description: 'Manage book inventory, issuing, and returns.', icon: <Library className="w-5 h-5" />, category: 'Infrastructure' },
  { id: 'inventory', name: 'Inventory & Assets', description: 'Track school supplies, assets, and transactions.', icon: <Package className="w-5 h-5" />, category: 'Infrastructure' },
  { id: 'transport', name: 'Transport System', description: 'Manage school buses, routes, and student tracking.', icon: <Bus className="w-5 h-5" />, category: 'Infrastructure' },
];

interface PortalDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  alwaysOn?: boolean;
}

const PORTALS: PortalDef[] = [
  { id: 'admin', name: 'Admin Portal', description: 'Full system administration, student records, and configuration.', icon: <Crown className="w-6 h-6" />, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', alwaysOn: true },
  { id: 'staff', name: 'Staff Portal', description: 'Clerk and operations staff can log in to manage records and fees.', icon: <UserCog className="w-6 h-6" />, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  { id: 'teacher', name: 'Teacher Portal', description: 'Teachers get their own dashboard for attendance, homework, and marks entry.', icon: <School className="w-6 h-6" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { id: 'student', name: 'Student Portal', description: 'Students can view timetable, attendance, results, and fees from their own login.', icon: <GraduationCap className="w-6 h-6" />, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'parent', name: 'Parent Portal', description: 'Parents track their child\'s academic progress, fees, and attendance.', icon: <Users className="w-6 h-6" />, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
];

const PLAN_TIERS = [
  { id: 'starter', name: 'Starter', roles: ['admin'], color: 'from-slate-600 to-slate-700' },
  { id: 'professional', name: 'Professional', roles: ['admin', 'staff'], color: 'from-blue-600 to-blue-700' },
  { id: 'business', name: 'Business', roles: ['admin', 'staff', 'teacher'], color: 'from-indigo-600 to-violet-700' },
  { id: 'enterprise', name: 'Enterprise', roles: ['admin', 'staff', 'teacher', 'student', 'parent'], color: 'from-amber-500 to-orange-600' },
];

const getPlanFromRoles = (roles: string[]): { id: string; name: string; color: string } => {
  // Find the highest tier that matches
  if (roles.includes('student') || roles.includes('parent')) return PLAN_TIERS[3];
  if (roles.includes('teacher')) return PLAN_TIERS[2];
  if (roles.includes('staff')) return PLAN_TIERS[1];
  return PLAN_TIERS[0];
};

export const ModuleManagementPage: React.FC = () => {
  const { school } = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();
  const [selectedModules, setSelectedModules] = useState<string[]>(school?.enabledModules as string[] || []);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(school?.licensedRoles as string[] || ['admin']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Fetch user counts per role
    const fetchCounts = async () => {
      try {
        const res = await axiosInstance.get('/dashboard/stats');
        const stats = res.data?.data?.stats;
        if (stats) {
          setRoleCounts({
            admin: 1,
            staff: stats.totalStaff || 0,
            teacher: stats.totalTeachers || 0,
            student: stats.totalStudents || 0,
            parent: 0,
          });
        }
      } catch { /* silent */ }
    };
    fetchCounts();
  }, []);

  const toggleModule = (id: string) => {
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleRole = (id: string) => {
    if (id === 'admin') return; // Admin always on
    setSelectedRoles(prev => {
      if (prev.includes(id)) {
        return prev.filter(r => r !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const currentPlan = getPlanFromRoles(selectedRoles);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.put('/school', {
        enabledModules: selectedModules,
        licensedRoles: selectedRoles,
        licensePlan: currentPlan.id,
      });
      dispatch(setSchoolSettings(res.data.data));
      toast.success('Licensing & module configuration saved successfully');
    } catch (error) {
      toast.error('Failed to update configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'Academics', icon: <BookOpen className="w-4 h-4" />, color: 'blue' },
    { id: 'Administration', icon: <Settings className="w-4 h-4" />, color: 'indigo' },
    { id: 'Financials', icon: <DollarSign className="w-4 h-4" />, color: 'emerald' },
    { id: 'Infrastructure', icon: <Bus className="w-4 h-4" />, color: 'violet' }
  ] as const;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-32">
      <Breadcrumb items={[{ label: 'System Settings' }, { label: 'Module Management' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                <ShieldCheck className="w-7 h-7" />
             </div>
             Enterprise Licensing
          </h1>
          <p className="text-slate-500 text-sm font-medium pl-14">Manage access portals and feature modules for your institution.</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Save className="w-5 h-5" />} 
          onClick={handleSave} 
          isLoading={isSubmitting}
          className="shadow-2xl shadow-blue-500/30 h-14 px-8 text-base rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 border-0"
        >
          Save Configuration
        </Button>
      </div>

      {/* ── SUBSCRIPTION PLAN BANNER ─────────────────────────── */}
      <div className={clsx(
        "relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl",
        `bg-gradient-to-br ${currentPlan.color}`
      )}>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Crown className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest">
              <Layers className="w-3.5 h-3.5" /> Current Plan
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">{currentPlan.name}</h2>
            <p className="text-white/60 font-medium text-sm">
              {selectedRoles.length} portal{selectedRoles.length !== 1 ? 's' : ''} active &bull; {selectedModules.length} modules enabled
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {PLAN_TIERS.map(tier => (
              <button
                key={tier.id}
                onClick={() => {
                  setSelectedRoles([...tier.roles]);
                }}
                className={clsx(
                  "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border",
                  currentPlan.id === tier.id
                    ? "bg-white text-slate-900 border-white shadow-xl"
                    : "bg-white/10 text-white/80 border-white/10 hover:bg-white/20"
                )}
              >
                {tier.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ACCESS PORTALS ────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
           <div className="p-2 rounded-lg bg-slate-900 text-white shadow-md">
              <Lock className="w-4 h-4" />
           </div>
           <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.25em]">Access Portals</h2>
           <div className="h-px bg-slate-100 flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {PORTALS.map(portal => {
            const isActive = selectedRoles.includes(portal.id);
            const count = roleCounts[portal.id] || 0;
            return (
              <div 
                key={portal.id}
                onClick={() => toggleRole(portal.id)}
                className={clsx(
                  "relative p-6 cursor-pointer transition-all duration-500 rounded-[2rem] border-2 flex flex-col group overflow-hidden",
                  portal.alwaysOn && "cursor-default",
                  isActive 
                    ? `${portal.borderColor} bg-white shadow-2xl shadow-slate-200/50 ring-4 ring-blue-500/5`
                    : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-xl"
                )}
              >
                {isActive && <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />}
                
                <div className="flex items-start justify-between relative z-10 mb-4">
                  <div className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg",
                    isActive ? `${portal.bgColor} ${portal.color}` : "bg-slate-100 text-slate-400"
                  )}>
                    {portal.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    {portal.alwaysOn && (
                      <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Always On</span>
                    )}
                    <div className={clsx(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500",
                      isActive ? "bg-emerald-500 text-white scale-110" : "bg-slate-200 text-white"
                    )}>
                      {isActive ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                <h3 className={clsx(
                  "text-base font-black tracking-tight transition-colors",
                  isActive ? "text-slate-900" : "text-slate-500"
                )}>{portal.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed flex-1">{portal.description}</p>

                <div className={clsx(
                  "mt-4 pt-3 border-t flex items-center justify-between",
                  isActive ? "border-slate-100" : "border-slate-100/50"
                )}>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {count} user{count !== 1 ? 's' : ''}
                  </span>
                  <span className={clsx(
                    "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                    isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                  )}>
                    {isActive ? 'Licensed' : 'Locked'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DEPLOYMENT NOTICE ─────────────────────────────────── */}
      <div className="relative group overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200/60 p-6 rounded-[2rem] flex flex-col md:flex-row gap-6 items-center shadow-sm">
         <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-md border border-amber-100 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
         </div>
         <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base font-black text-amber-900 uppercase tracking-tight">System Deployment Notice</h3>
            <p className="text-sm leading-relaxed text-amber-800 font-medium opacity-90 max-w-2xl">
               Disabling a portal will immediately prevent those users from logging in. Disabling a module hides related interfaces. Ensure your staff is notified before major changes.
            </p>
         </div>
         <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <AlertTriangle className="w-32 h-32 text-amber-500" />
         </div>
      </div>

      {/* ── FEATURE MODULES ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-12">
        {categories.map(cat => (
          <div key={cat.id} className="space-y-6">
            <div className="flex items-center gap-4">
               <div className={clsx("p-2 rounded-lg text-white shadow-md", {
                 'bg-blue-600': cat.color === 'blue',
                 'bg-indigo-600': cat.color === 'indigo',
                 'bg-emerald-600': cat.color === 'emerald',
                 'bg-violet-600': cat.color === 'violet',
               })}>
                  {cat.icon}
               </div>
               <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.25em]">{cat.id}</h2>
               <div className="h-px bg-slate-100 flex-1" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ALL_MODULES.filter(m => m.category === cat.id).map(module => {
                const isActive = selectedModules.includes(module.id);
                return (
                  <div 
                    key={module.id} 
                    onClick={() => toggleModule(module.id)}
                    className={clsx(
                      "p-6 cursor-pointer transition-all duration-500 rounded-[2rem] border-2 flex flex-col h-full group relative overflow-hidden",
                      isActive 
                        ? "border-blue-500/20 bg-white shadow-2xl shadow-blue-500/5 ring-4 ring-blue-500/5" 
                        : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50"
                    )}
                  >
                    {isActive && <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />}
                    
                    <div className="flex items-start justify-between relative z-10">
                      <div className={clsx(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg",
                        isActive ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/20" : "bg-white text-slate-400 border border-slate-100"
                      )}>
                        {module.icon}
                      </div>
                      <div className={clsx(
                        "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500",
                        isActive ? "bg-emerald-500 text-white scale-110" : "bg-slate-200 text-white"
                      )}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="mt-6 relative z-10 flex-1">
                      <h3 className={clsx(
                        "text-lg font-black tracking-tight transition-colors duration-300",
                        isActive ? "text-slate-900" : "text-slate-600"
                      )}>{module.name}</h3>
                      <p className="text-sm text-slate-400 mt-2 font-medium leading-relaxed">{module.description}</p>
                    </div>

                    <div className={clsx(
                      "mt-6 pt-4 border-t transition-all duration-500 flex items-center justify-between",
                      isActive ? "border-blue-50/50" : "border-slate-100 opacity-0 group-hover:opacity-100"
                    )}>
                       <span className={clsx(
                         "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                         isActive ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                       )}>
                          {isActive ? 'Enabled' : 'Disabled'}
                       </span>
                       <ChevronRight className={clsx(
                         "w-4 h-4 transition-transform duration-500 group-hover:translate-x-1",
                         isActive ? "text-blue-400" : "text-slate-300"
                       )} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── FLOATING STATUS BAR ───────────────────────────────── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none">
        <Card className="p-5 bg-slate-900/90 backdrop-blur-xl text-white border-0 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] flex items-center justify-between pointer-events-auto border-t border-white/10">
           <div className="flex items-center gap-6 pl-4">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 opacity-80">Subscription Plan</span>
                 <h2 className="text-xl font-black tracking-tight leading-none">
                    {currentPlan.name} <span className="text-slate-500 font-medium text-sm ml-1">&bull; {selectedRoles.length} Portals</span>
                 </h2>
              </div>
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div className="hidden md:flex flex-col">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedModules.length} Modules Active</span>
                   <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Licensed v2.1</span>
                   </div>
              </div>
           </div>
           <Button 
              variant="primary" 
              onClick={handleSave} 
              isLoading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0 px-10 h-14 rounded-[1.5rem] shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest text-xs"
           >
              Confirm Deployment
           </Button>
        </Card>
      </div>
    </div>
  );
};
