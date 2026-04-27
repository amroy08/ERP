import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Phone, ShieldCheck, Mail, Calendar, 
  User as UserIcon, Briefcase, Clock, History, Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { Tabs } from '../../components/common/Tabs';
import axiosInstance from '../../api/axiosInstance';
import { format } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';

export const StaffProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isRole } = usePermissions();
  const [staff, setStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axiosInstance.get(`/staff/${id}`);
        setStaff(res.data.data);
      } catch { 
        navigate('/staff'); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchStaff();
  }, [id, navigate]);

  const handleResetPassword = async () => {
    if (!window.confirm('Reset staff password to default (Staff@123)?')) return;
    try {
      await axiosInstance.post(`/staff/${id}/reset-password`);
      toast.success('Password reset to Staff@123');
    } catch {
      toast.error('Failed to reset password');
    }
  };

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

  if (!staff) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
  ];

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
  const name = staff.user?.name || staff.fullName || 'Unknown';
  const email = staff.user?.email || staff.email;
  const phone = staff.user?.phone || staff.phone;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <Breadcrumb items={[{ label: 'Staff', href: '/staff' }, { label: name }]} />
        <div className="flex gap-2">
           {canManage && (
             <Button variant="secondary" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => navigate(`/staff/${id}/edit`)}>Edit Profile</Button>
           )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 relative">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        <div className="px-8 pb-8 flex flex-col md:flex-row gap-6">
           <div className="relative -mt-12 shrink-0">
             <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-white overflow-hidden flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                  {name.charAt(0)}
                </div>
             </div>
           </div>
           
           <div className="flex-1 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                 <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{name}</h1>
                 <StatusBadge status={staff.status} />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-slate-500 font-medium">
                 <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest text-slate-400">
                    <Briefcase className="w-4 h-4" />
                    <span>{staff.department} · {staff.designation || 'Staff'}</span>
                 </div>
                 <div className="flex items-center gap-1.5 border-l border-slate-200 pl-6 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Joined: {staff.joiningDate ? format(new Date(staff.joiningDate), 'MMMM yyyy') : '—'}</span>
                 </div>
              </div>
           </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
             <Card className="p-0 overflow-hidden border-slate-200 shadow-sm min-h-[400px]">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="bg-slate-50 px-6 pt-2" />
                
                <div className="p-8">
                   {activeTab === 'overview' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                           <div className="space-y-4">
                              <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2">
                                 <Briefcase className="w-4 h-4" /> Employment Details
                              </h3>
                              <div className="space-y-1">
                                 <InfoRow label="Employee ID" value={staff.employeeId} />
                                 <InfoRow label="Department" value={staff.department} />
                                 <InfoRow label="Designation" value={staff.designation || '—'} />
                                 <InfoRow label="Joining Date" value={staff.joiningDate ? format(new Date(staff.joiningDate), 'dd MMM yyyy') : '—'} />
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                 <Phone className="w-4 h-4" /> Contact Information
                              </h3>
                              <div className="space-y-1">
                                 <InfoRow label="Phone" value={phone || '—'} icon={<Phone className="w-3.5 h-3.5" />} />
                                 <InfoRow label="Email" value={email || '—'} icon={<Mail className="w-3.5 h-3.5" />} />
                              </div>
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

          <div className="lg:col-span-4 space-y-6">
             <Card className="p-6 border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Status</h3>
                   <Badge variant={staff.user?.isActive ? 'green' : 'red'}>{staff.user?.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Portal Login</p>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <p className="text-xs font-bold text-slate-700 truncate">{email}</p>
                      </div>
                   </div>
                   {canManage && (
                     <Button 
                       variant="secondary" 
                       size="sm" 
                       className="w-full justify-start text-xs h-9 bg-slate-50 border-slate-200 hover:bg-slate-100"
                       icon={<Key className="w-3.5 h-3.5" />}
                       onClick={handleResetPassword}
                     >
                       Reset Password
                     </Button>
                   )}
                </div>
             </Card>
          </div>
      </div>
    </div>
  );
};

const Badge = ({ children, variant }: { children: React.ReactNode; variant: 'green' | 'red' }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
    variant === 'green' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
  }`}>
    {children}
  </span>
);
