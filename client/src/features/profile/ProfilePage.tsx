import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { User as UserIcon } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { setCredentials } from '../auth/authSlice';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ShieldCheck, Mail, User, Lock, Key, Camera, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { accessToken, refreshToken } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncProfile = async () => {
      if (!user) return;
      
      // If we are a student/teacher but ID is missing in Redux (stale session)
      const needsStudentId = user.role === 'student' && !user.student?.id;
      const needsTeacherId = user.role === 'teacher' && !user.teacher?.id;

      if (needsStudentId || needsTeacherId) {
        setIsSyncing(true);
        try {
          const res = await axiosInstance.get('/auth/me');
          if (res.data.success && res.data.data?.user) {
            // Update Redux so subsequent visits are instant
            dispatch(setCredentials({
              user: res.data.data.user,
              accessToken: accessToken!,
              refreshToken: refreshToken!
            }));
            
            // Redirect immediately
            const updatedUser = res.data.data.user;
            if (updatedUser.role === 'student' && updatedUser.student?.id) {
              navigate(`/students/${updatedUser.student.id}`, { replace: true });
            } else if (updatedUser.role === 'teacher' && updatedUser.teacher?.id) {
              navigate(`/teachers/${updatedUser.teacher.id}`, { replace: true });
            }
          }
        } catch (error) {
          console.error('Profile sync failed:', error);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    syncProfile();
  }, [user, accessToken, refreshToken, dispatch, navigate]);

  if (!user) return <Navigate to="/login" replace />;

  // 1. Direct redirection if ID is in state
  if (user.role === 'student' && user.student?.id) {
    return <Navigate to={`/students/${user.student.id}`} replace />;
  }

  if (user.role === 'teacher' && user.teacher?.id) {
    return <Navigate to={`/teachers/${user.teacher.id}`} replace />;
  }

  // 2. Loading state during sync
  if (isSyncing || user.role === 'student' || user.role === 'teacher') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Synchronizing Profile</h2>
          <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-widest">Fetching your institutional identity...</p>
        </div>
      </div>
    );
  }

  // 3. Admin Profile View
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Breadcrumb items={[{ label: 'System' }, { label: 'My Profile' }]} />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Card */}
        <div className="w-full md:w-80 shrink-0 space-y-6">
          <Card className="p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50 rounded-[2rem]">
            <div className="h-24 bg-gradient-to-br from-blue-600 to-indigo-700" />
            <div className="px-6 pb-8 text-center -mt-12">
              <div className="relative inline-block group">
                <div className="w-24 h-24 rounded-[2rem] bg-white p-1 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                  <div className="w-full h-full rounded-[1.75rem] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 font-black text-3xl">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-xl shadow-lg border-2 border-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-black text-slate-900 tracking-tight">{user.name}</h2>
              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{user.role.replace('_', ' ')}</span>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-50 space-y-3 text-left">
                <div className="flex items-center gap-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-bold truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold">Account Verified</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Edit Section */}
        <div className="flex-1 space-y-6">
          <Card className="p-8 border-slate-200 rounded-[2.5rem] shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              Account Security & Password
            </h3>

            <form onSubmit={(e) => { e.preventDefault(); toast.success('Security settings updated (demo)'); }} className="space-y-6 max-w-xl">
              <div className="grid grid-cols-1 gap-6">
                 <Input 
                   label="Current Password" 
                   type="password" 
                   icon={<Lock className="w-4 h-4" />}
                   placeholder="••••••••" 
                 />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Input 
                     label="New Password" 
                     type="password" 
                     icon={<Key className="w-4 h-4" />}
                     placeholder="Minimum 8 characters" 
                   />
                   <Input 
                     label="Confirm New Password" 
                     type="password" 
                     icon={<Key className="w-4 h-4" />}
                     placeholder="Re-enter password" 
                   />
                 </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="primary" className="px-10 h-12 rounded-2xl bg-blue-600 shadow-xl shadow-blue-200">
                  Update Security Settings
                </Button>
                <Button variant="secondary" className="px-8 h-12 rounded-2xl">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>

          <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight">Security Audit</p>
                <p className="text-xs text-white/50 font-medium">Last login from Mumbai, India &bull; 2 hours ago</p>
              </div>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300">View Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
};
