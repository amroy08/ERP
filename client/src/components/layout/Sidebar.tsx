import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, GraduationCap, UserCog, UserCheck,
  BookOpen, CalendarDays, ClipboardList, DollarSign, FileText,
  Clock, Megaphone, Phone, Bus, Library, Package, BarChart3,
  Settings, ShieldCheck, ChevronDown, ChevronRight, School,
  BookMarked, Award, UserPlus, Layers, Compass, Wallet, LogOut, Building2
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: Array<{ label: string; href: string; moduleId?: string; roles?: string[] }>;
  permission?: string;
  roles?: string[];
  moduleId?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  {
    label: 'Admissions & CRM', icon: Compass,
    children: [
      { label: 'Applications', href: '/admissions' },
      { label: 'Enquiries', href: '/enquiries' },
    ],
    permission: 'admission:view',
    moduleId: 'admissions',
  },
  {
    label: 'People', icon: Users,
    children: [
      { label: 'Students', href: '/students' },
      { label: 'Parents', href: '/parents' },
      { label: 'Teachers', href: '/teachers', roles: ['super_admin', 'admin', 'clerk', 'principal'] },
      { label: 'Staff Directory', href: '/staff', roles: ['super_admin', 'admin', 'clerk'] },
    ],
    permission: 'student:view',
    roles: ['super_admin', 'admin', 'teacher', 'clerk'],
  },
  {
    label: 'Academics', icon: BookOpen,
    children: [
      { label: 'Classes & Sections', href: '/classes' },
      { label: 'Attendance', href: '/attendance/students', moduleId: 'attendance' },
      { label: 'Examinations', href: '/exams', moduleId: 'exams' },
      { label: 'Time Table', href: '/timetable', moduleId: 'timetable' },
      { label: 'Homework', href: '/homework', moduleId: 'homework' },
      { label: 'Subjects', href: '/subjects' },
    ],
    roles: ['super_admin', 'admin', 'teacher', 'clerk'],
  },
  {
    label: 'My Academics', icon: GraduationCap,
    children: [
      { label: 'My Attendance', href: '/student/attendance', moduleId: 'attendance' },
      { label: 'Timetable', href: '/timetable', moduleId: 'timetable' },
      { label: 'Homework', href: '/homework', moduleId: 'homework' },
      { label: 'Examinations', href: '/exams', moduleId: 'exams' },
    ],
    roles: ['student', 'parent'],
  },
  {
    label: 'Financials', icon: DollarSign,
    children: [
      { label: 'Fee Collection', href: '/fees/collect' },
      { label: 'Fee Structures', href: '/fees/structures', roles: ['super_admin', 'admin'] },
      { label: 'Payment Reports', href: '/fees/payments' },
    ],
    permission: 'fee:view',
    roles: ['super_admin', 'admin', 'clerk', 'principal'],
    moduleId: 'fees',
  },
  {
    label: 'My Financials', icon: Wallet,
    children: [
      { label: 'My Fees', href: '/student/fees' },
    ],
    roles: ['student', 'parent'],
    moduleId: 'fees',
  },
  { label: 'Notice Board', icon: Megaphone, href: '/notices', moduleId: 'notices' },
  {
    label: 'Settings', icon: Settings,
    children: [
      { label: 'School Setup', href: '/settings' },
      { label: 'Module Licensing', href: '/settings/modules', roles: ['super_admin'] },
      { label: 'Permissions', href: '/roles' },
    ],
    permission: 'settings:view',
  },
  {
    label: 'Platform Admin', icon: Building2,
    children: [
      { label: 'Schools & Institutes', href: '/super-admin/schools' },
      { label: 'Module Licensing', href: '/settings/modules' },
      { label: 'System Archive', href: '/settings/archive' },
    ],
    roles: ['super_admin'],
  },
];

interface SidebarLinkProps {
  item: NavItem;
  isCollapsed: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ item, isCollapsed }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => {
    return item.children?.some((c) => location.pathname.startsWith(c.href)) ?? false;
  });

  const Icon = item.icon;
  const isActive = item.href
    ? location.pathname === item.href
    : item.children?.some((c) => location.pathname === c.href || location.pathname.startsWith(c.href + '/'));

  if (item.children) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            'sidebar-link w-full group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm',
            isActive ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80'
          )}
          title={isCollapsed ? item.label : undefined}
        >
          <Icon className={clsx("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600 transition-colors")} />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left tracking-tight">{item.label}</span>
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 opacity-40 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
              )}
            </>
          )}
        </button>
        {isOpen && !isCollapsed && (
          <div className="ml-4 pl-4 border-l border-slate-100 mt-1 space-y-1 mb-2">
            {item.children.map((child) => (
              <NavLink
                key={child.href}
                to={child.href}
                end
                className={({ isActive }) =>
                  clsx('block px-4 py-2 text-[12px] font-bold rounded-xl transition-all duration-200', {
                    'bg-blue-600 text-white shadow-lg shadow-blue-200': isActive,
                    'text-slate-400 hover:text-slate-800 hover:translate-x-1': !isActive,
                  })
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.href!}
      className={({ isActive }) =>
        clsx(
          'sidebar-link group mb-1 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm',
          isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80'
        )
      }
      title={isCollapsed ? item.label : undefined}
    >
      <Icon className={clsx("w-5 h-5 transition-colors", 
        location.pathname === item.href ? "text-white" : "text-slate-400 group-hover:text-blue-600"
      )} />
      {!isCollapsed && <span className="tracking-tight">{item.label}</span>}
    </NavLink>
  );
};

interface SidebarProps {
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { scopedSchoolId } = useSelector((state: RootState) => state.auth);
  const { school } = useSelector((state: RootState) => state.settings);
  const enabledModules = (school?.enabledModules as string[]) || [];
  const licensedRoles = (school?.licensedRoles as string[]) || [];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Map sidebar child labels to the license role they require
  const childLicenseMap: Record<string, string> = {
    'Teachers': 'teacher',
    'Staff Directory': 'staff',
  };

  const filteredItems = navItems
    .map(item => {
      if (item.children) {
        const filteredChildren = item.children.filter(child => {
          if (child.moduleId && !enabledModules.includes(child.moduleId)) return false;
          // @ts-ignore
          if (child.roles && !child.roles.includes(user?.role || '')) return false;
          // License gate: hide children that require an unlicensed role
          const requiredLicense = childLicenseMap[child.label];
          if (requiredLicense && licensedRoles.length > 0 && !licensedRoles.includes(requiredLicense)) return false;
          return true;
        });
        
        if (filteredChildren.length === 0 && item.children.length > 0) return null;
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter((item): item is NavItem => {
      if (!item) return false;

      // Super Admin Global View Restriction
      if (user?.role === 'super_admin' && !scopedSchoolId) {
        return ['Dashboard', 'Platform Admin'].includes(item.label);
      }

      if (item.moduleId && !enabledModules.includes(item.moduleId)) return false;
      if (item.roles && !item.roles.includes(user?.role || '')) return false;
      if (!item.permission) return true;
      return permissions.includes(item.permission);
    });

  return (
    <aside
      className={clsx(
        'flex flex-col h-[calc(100vh-2rem)] transition-all duration-500 ease-in-out m-4 rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative z-20 overflow-hidden',
        isCollapsed ? 'w-20' : 'w-[280px]'
      )}
    >
      {/* Premium Logo Section */}
      <div className={clsx(
        'flex items-center gap-4 px-6 py-10 flex-shrink-0'
      )}>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-xl shadow-blue-200 relative group overflow-hidden">
           <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
           <School className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <div className="text-slate-900 font-extrabold text-[15px] uppercase tracking-wider leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {user?.role === 'super_admin' && !scopedSchoolId ? 'Vantage ERP' : (school?.name || 'School ERP')}
            </div>
            <div className="text-blue-600/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">
              {user?.role === 'super_admin' && !scopedSchoolId ? 'Global Platform' : 'Academic Core'}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Feed */}
      <nav className="flex-1 overflow-y-auto pt-2 pb-6 px-4 custom-scrollbar space-y-1">
        {filteredItems.map((item) => (
          <SidebarLink key={item.label} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* User Quick Profile */}
      {!isCollapsed && user && (
        <div className="flex-shrink-0 p-6 border-t border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-3 px-1 py-1 transition-colors group">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black text-sm flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-slate-900 text-[13px] font-black tracking-tight truncate group-hover:text-blue-600 transition-colors uppercase">{user?.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                 <div className="text-slate-400 text-[9px] font-black uppercase tracking-[0.1em] truncate">
                   {user?.role?.replace('_', ' ')}
                 </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
