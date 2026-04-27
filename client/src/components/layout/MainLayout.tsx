import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Outlet } from 'react-router-dom';
import { PageTransition } from '../common/PageTransition';
import { useDispatch, useSelector } from 'react-redux';
import { setSchoolSettings, setSettingsLoading } from '../../store/settingsSlice';
import axiosInstance from '../../api/axiosInstance';
import { RootState } from '../../store/store';
import { setSchoolScope } from '../../features/auth/authSlice';
import { ShieldAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MainLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { scopedSchoolName, scopedSchoolId } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchSettings = async () => {
      dispatch(setSettingsLoading(true));
      try {
        const res = await axiosInstance.get('/school');
        dispatch(setSchoolSettings(res.data.data));
      } catch (error) {
        console.error('Failed to fetch school settings:', error);
      } finally {
        dispatch(setSettingsLoading(false));
      }
    };
    fetchSettings();
  }, [dispatch, scopedSchoolId]);

  const handleClearScope = () => {
    dispatch(setSchoolScope(null));
    navigate('/super-admin/schools');
  };

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden py-4 pr-4">
        <div className="flex flex-col flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden relative">
          <TopBar
            onToggleSidebar={() => setIsCollapsed((c) => !c)}
            isCollapsed={isCollapsed}
          />

          {scopedSchoolId && (
            <div className="bg-amber-50 border-y border-amber-100 px-8 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                  Viewing context for: <span className="text-amber-900 font-black">{scopedSchoolName}</span>
                </span>
              </div>
              <button 
                onClick={handleClearScope}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-200/50 hover:bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-colors"
              >
                Switch Back to Global View
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-8">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
