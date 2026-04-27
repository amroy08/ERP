import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, GraduationCap, Phone, 
  ShieldCheck, Mail, Calendar, 
  User as UserIcon, CheckCircle2,
  Clock, BookOpen, Briefcase, Award, TrendingUp, History, Trash2
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Tabs } from '../../components/common/Tabs';
import axiosInstance from '../../api/axiosInstance';
import { Teacher, ApiResponse } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';

export const TeacherProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isRole, hasPermission } = usePermissions();
  const [teacher, setTeacher] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await axiosInstance.get<ApiResponse<any>>(`/teachers/${id}`);
        setTeacher(res.data.data);
      } catch { 
        navigate('/teachers'); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchTeacher();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-100 rounded" />
        <div className="h-48 bg-slate-50 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="h-96 bg-slate-50 rounded-2xl md:col-span-2" />
           <div className="h-96 bg-slate-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!teacher) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'subjects', label: 'Subjects & Classes', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
  ];

  const handleResetPassword = async () => {
    if (!window.confirm('Are you sure you want to reset this teacher\'s password to "Teacher@123"?')) return;
    try {
      await axiosInstance.post(`/teachers/${id}/reset-password`);
      toast.success('Password reset to: Teacher@123');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string | React.ReactNode; icon?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-1 rounded-lg">
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="text-sm text-slate-500 font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-700">{value}</span>
    </div>
  );

  const canManage = isRole(['super_admin', 'admin']);
  const name = teacher.user?.name || teacher.fullName || 'Unknown';
  const email = teacher.user?.email || teacher.email;
  const phone = teacher.user?.phone || teacher.phone;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <Breadcrumb items={isRole(['teacher']) ? [{ label: 'My Profile' }, { label: name }] : [{ label: 'Teachers', href: '/teachers' }, { label: name }]} />
        <div className="flex gap-2">
           {canManage && (
             <Button variant="secondary" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => navigate(`/teachers/${id}/edit`)}>Edit Profile</Button>
           )}
           {hasPermission('teacher:delete') && (
             <Button 
               variant="danger" 
               size="sm" 
               icon={<Trash2 className="w-4 h-4" />} 
               onClick={() => {
                 if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
                   axiosInstance.delete(`/teachers/${id}`).then(() => {
                     toast.success('Teacher deleted');
                     navigate('/teachers');
                   }).catch(() => toast.error('Failed to delete teacher'));
                 }
               }}
             >
               Delete Teacher
             </Button>
           )}
        </div>
      </div>

      {/* Hero Profile Section */}
      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 relative">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        <div className="px-8 pb-8 flex flex-col md:flex-row gap-6">
           <div className="relative -mt-12 shrink-0">
             <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-white overflow-hidden flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-4xl font-bold">
                  {name.charAt(0)}
                </div>
             </div>
             <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-4 h-4" />
             </div>
           </div>
           
           <div className="flex-1 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                 <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{name}</h1>
                 <StatusBadge status={teacher.status} />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-slate-500 font-medium">
                 <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest text-slate-400">
                    <Briefcase className="w-4 h-4" />
                    <span>{teacher.designation} · {teacher.employeeId}</span>
                 </div>
                 <div className="flex items-center gap-1.5 border-l border-slate-200 pl-6 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Joined: {format(new Date(teacher.joiningDate), 'MMMM yyyy')}</span>
                 </div>
              </div>
           </div>

           <div className="md:pt-6 pt-2 flex md:flex-col gap-4">
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</span>
                 <span className="text-xl font-black text-emerald-600">{teacher.experience || 0} Years</span>
              </div>
           </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
             <Card className="p-0 overflow-hidden border-slate-200 shadow-sm min-h-[500px]">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="bg-slate-50 px-6 pt-2" />
                
                <div className="p-8">
                   {activeTab === 'overview' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                           <div className="space-y-4">
                              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                 <Briefcase className="w-4 h-4" /> Work Profile
                              </h3>
                              <div className="space-y-1">
                                 <InfoRow label="Designation" value={teacher.designation} />
                                 <InfoRow label="Employee ID" value={teacher.employeeId} />
                                 <InfoRow label="Qualification" value={teacher.qualification} />
                                 <InfoRow label="Joining Date" value={format(new Date(teacher.joiningDate), 'dd MMM yyyy')} />
                                 <InfoRow label="Specialization" value={teacher.specialization || 'General'} />
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                 <Phone className="w-4 h-4" /> Contact Information
                              </h3>
                              <div className="space-y-1">
                                 <InfoRow label="Phone" value={phone || '—'} icon={<Phone className="w-3.5 h-3.5" />} />
                                 <InfoRow label="Official Email" value={email || '—'} icon={<Mail className="w-3.5 h-3.5" />} />
                                 {teacher.canViewAllStudents && (
                                   <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                                      <div>
                                         <p className="text-[10px] font-black text-emerald-900 uppercase">Global Access Active</p>
                                         <p className="text-[11px] text-emerald-700 leading-tight">This teacher can see all students across the school.</p>
                                      </div>
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>

                        {teacher.experience > 0 && (
                          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex gap-4 items-start">
                             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <TrendingUp className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-blue-900 uppercase tracking-wide">Professional Background</p>
                                <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                                   This educator brings {teacher.experience} years of expertise to our institution, specializing in {teacher.specialization || 'their core domain'}.
                                </p>
                             </div>
                          </div>
                        )}
                     </div>
                   )}

                   {activeTab === 'subjects' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Subjects</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <BookOpen className="w-5 h-5 text-indigo-500" />
                                 <span className="text-2xl font-black text-slate-800">{teacher.subjects?.length || 0} Subjects</span>
                              </div>
                           </div>
                           <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classes Taught</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <GraduationCap className="w-5 h-5 text-blue-500" />
                                 <span className="text-2xl font-black text-slate-800">{teacher.assignedClasses?.length || 0} Classes</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                             <BookOpen className="w-4 h-4 text-emerald-600" /> Subject Assignments
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {teacher.subjects?.length > 0 ? teacher.subjects.map((sub: any) => (
                                <div key={sub.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:ring-2 hover:ring-emerald-500/10 transition-all">
                                   <p className="font-bold text-slate-800 text-sm">{sub.name}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{sub.code}</p>
                                </div>
                              )) : (
                                <div className="col-span-2 py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                   <p className="text-sm text-slate-400 font-medium">No direct subjects assigned yet.</p>
                                </div>
                              )}
                           </div>
                        </div>
                     </div>
                   )}
                   
                   {activeTab === 'attendance' && (
                     <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                           <History className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                           <h3 className="font-bold text-slate-700 capitalize">Attendance History</h3>
                           <p className="text-sm text-slate-500 max-w-sm">No recent records available for attendance. Staff logs will appear here during active sessions.</p>
                        </div>
                     </div>
                   )}
                </div>
             </Card>
          </div>

          {/* Sidebar / Stats Area */}
          <div className="lg:col-span-4 space-y-6">
             <Card className="p-6 border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Portal Credentials</h3>
                   <Badge variant="green">Active</Badge>
                </div>
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Login ID (Email)</p>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <span className="text-xs font-bold text-slate-700 truncate">{email}</span>
                         <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => {
                            navigator.clipboard.writeText(email);
                            toast.success('Email copied');
                         }}>Copy</Button>
                      </div>
                   </div>
                   {canManage && (
                     <div className="flex flex-col gap-2">
                        <Button variant="secondary" className="w-full h-11 text-xs" icon={<ShieldCheck className="w-4 h-4" />} onClick={handleResetPassword}>Reset Password</Button>
                        <p className="text-[10px] text-slate-400 text-center italic font-medium leading-relaxed">
                          Resets account to: **Teacher@123**<br />
                          Required for teachers who lose access.
                        </p>
                     </div>
                   )}
                </div>
             </Card>

             <Card className="p-6 border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">Class Teacher Of</h3>
                <div className="space-y-3">
                   {teacher.classTeacherOf?.length > 0 ? teacher.classTeacherOf.map((sec: any) => (
                     <div key={sec.id} className="flex items-center gap-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black text-xs">
                           {(sec.class?.name || 'C').charAt(0)}
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-800">Section {sec.name}</p>
                           <p className="text-[10px] text-blue-600 font-bold uppercase underline">Go to Class Portal</p>
                        </div>
                     </div>
                   )) : (
                     <p className="text-[10px] text-slate-400 italic">Not assigned as a Class Teacher.</p>
                   )}
                </div>
             </Card>
          </div>
      </div>
    </div>
  );
};
