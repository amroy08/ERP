import React, { useState } from 'react';
import {
  Menu, Bell, Search, LogOut, User, ChevronDown, Settings
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { logout, setSchoolScope } from '../../features/auth/authSlice';
import axiosInstance from '../../api/axiosInstance';
import { clsx } from 'clsx';


interface TopBarProps {
  onToggleSidebar: () => void;
  isCollapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { scopedSchoolId, scopedSchoolName } = useSelector((state: RootState) => state.auth);



  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {
      // ignore
    }
    dispatch(logout());
    navigate('/login');
  };

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    principal: 'bg-teal-100 text-teal-700',
    teacher: 'bg-emerald-100 text-emerald-700',
    clerk: 'bg-orange-100 text-orange-700',
    parent: 'bg-indigo-100 text-indigo-700',
    student: 'bg-cyan-100 text-cyan-700',
  };

  const roleBadge = user ? roleColors[user.role] || 'bg-gray-100 text-gray-700' : '';

  return (
    <header className="h-16 bg-white flex items-center px-6 gap-6 flex-shrink-0 z-30">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        title="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, teachers, fees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Academic Year */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
          <span className="text-xs font-medium text-blue-600">
            AY: {new Date().getMonth() + 1 >= 4 
              ? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` 
              : `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Impersonation Mode Badge */}
        {user?.role === 'super_admin' && scopedSchoolId && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl animate-pulse">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">Impersonating</span>
              <span className="text-sm font-bold text-slate-800 leading-tight">{scopedSchoolName}</span>
            </div>
            <button 
              onClick={() => {
                dispatch(setSchoolScope(null));
                navigate('/dashboard');
              }}
              className="ml-2 p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
              title="Exit school context"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-slate-700 leading-tight">{user?.name}</div>
              <div className={clsx('text-xs px-1.5 rounded font-medium leading-tight capitalize', roleBadge)}>
                {user?.role?.replace('_', ' ') || ''}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    <User className="w-4 h-4" /> My Profile
                  </button>
                  {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <button
                      onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                  )}
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
