import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { User as UserIcon } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { setCredentials } from '../auth/authSlice';

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

  // 3. Fallback for admins
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
      <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 mb-2">
        <UserIcon className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Administrative Hub</h2>
      <p className="text-slate-500 text-sm max-w-md">
        System administrators and staff use the central management terminals. 
        You do not have a student/teacher directory profile.
      </p>
    </div>
  );
};
