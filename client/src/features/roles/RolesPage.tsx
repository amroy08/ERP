import React, { useState, useMemo } from 'react';
import { Shield, Check, Search, Lock, Eye, EyeOff } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { ROLES, ROLE_PERMISSIONS } from '../../utils/constants';

const roleLabels: Record<string, { label: string; desc: string; color: string }> = {
  super_admin: { label: 'Super Admin', desc: 'Full platform access across all schools', color: 'bg-violet-600' },
  admin: { label: 'Admin', desc: 'Full school management access', color: 'bg-blue-600' },
  principal: { label: 'Principal', desc: 'School oversight and reporting', color: 'bg-indigo-600' },
  teacher: { label: 'Teacher', desc: 'Classroom and student management', color: 'bg-emerald-600' },
  clerk: { label: 'Clerk', desc: 'Administrative and data entry tasks', color: 'bg-amber-600' },
  parent: { label: 'Parent', desc: 'View-only access for wards', color: 'bg-teal-600' },
  student: { label: 'Student', desc: 'Personal academic dashboard', color: 'bg-cyan-600' },
};

const permissionGroups = [
  { module: 'Dashboard', icon: '📊', permissions: ['dashboard:view', 'dashboard:full'] },
  { module: 'Students', icon: '🎓', permissions: ['student:view', 'student:create', 'student:update', 'student:delete', 'student:export'] },
  { module: 'Parents', icon: '👨‍👩‍👧', permissions: ['parent:view', 'parent:create', 'parent:update', 'parent:delete'] },
  { module: 'Admissions', icon: '📋', permissions: ['admission:view', 'admission:create', 'admission:update', 'admission:delete', 'admission:approve'] },
  { module: 'Enquiries', icon: '❓', permissions: ['enquiry:view', 'enquiry:create', 'enquiry:update'] },
  { module: 'Teachers', icon: '👨‍🏫', permissions: ['teacher:view', 'teacher:create', 'teacher:update', 'teacher:delete'] },
  { module: 'Staff', icon: '👤', permissions: ['staff:view', 'staff:create', 'staff:update', 'staff:delete'] },
  { module: 'Attendance', icon: '✅', permissions: ['attendance:view', 'attendance:mark', 'attendance:export'] },
  { module: 'Finance', icon: '💰', permissions: ['fee:view', 'fee:create', 'fee:collect', 'fee:export', 'fee:report'] },
  { module: 'Exams', icon: '📝', permissions: ['exam:view', 'exam:create', 'exam:update', 'exam:marks_entry'] },
  { module: 'Classes', icon: '🏫', permissions: ['class:view', 'class:create', 'class:update', 'class:delete'] },
  { module: 'Subjects', icon: '📚', permissions: ['subject:view', 'subject:create', 'subject:update', 'subject:delete'] },
  { module: 'Notices', icon: '📢', permissions: ['notice:view', 'notice:create', 'notice:update', 'notice:delete'] },
  { module: 'Homework', icon: '📖', permissions: ['homework:view', 'homework:create', 'homework:update', 'homework:delete'] },
  { module: 'Timetable', icon: '🕐', permissions: ['timetable:view', 'timetable:manage'] },
  { module: 'Transport', icon: '🚌', permissions: ['transport:view', 'transport:manage'] },
  { module: 'Reports', icon: '📈', permissions: ['report:view', 'report:export'] },
  { module: 'Settings', icon: '⚙️', permissions: ['settings:view', 'settings:update'] },
  { module: 'Roles', icon: '🔐', permissions: ['role:view', 'role:manage'] },
];

const formatPermission = (p: string) => {
  const parts = p.split(':');
  const action = parts[1]?.replace(/_/g, ' ') || parts[0];
  return action.charAt(0).toUpperCase() + action.slice(1);
};

export const RolesPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>(ROLES.ADMIN);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGrantedOnly, setShowGrantedOnly] = useState(false);

  const activePermissions = ROLE_PERMISSIONS[selectedRole] || [];
  const roleMeta = roleLabels[selectedRole];

  const filteredGroups = useMemo(() => {
    return permissionGroups
      .map(group => {
        const filtered = group.permissions.filter(p => {
          const matchesSearch = !searchQuery || 
            p.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.module.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesFilter = !showGrantedOnly || activePermissions.includes(p);
          return matchesSearch && matchesFilter;
        });
        return { ...group, permissions: filtered };
      })
      .filter(g => g.permissions.length > 0);
  }, [searchQuery, showGrantedOnly, activePermissions]);

  const totalPermissions = permissionGroups.reduce((sum, g) => sum + g.permissions.length, 0);
  const grantedCount = activePermissions.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: 'System Configuration' }, { label: 'Roles & Permissions' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Roles & Permissions</h1>
          <p className="text-slate-500 text-sm font-medium">System-defined access control matrix. Permissions are enforced server-side.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <Lock className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-700">Read-Only — Roles are system-managed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role Selection Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">User Roles</h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {Object.values(ROLES).filter(r => r !== 'super_admin').map((role) => {
              const meta = roleLabels[role];
              const count = (ROLE_PERMISSIONS[role] || []).length;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-4 py-3.5 transition-all border-l-4 ${
                    selectedRole === role
                      ? 'bg-blue-50 border-blue-600'
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${meta.color} flex items-center justify-center`}>
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${selectedRole === role ? 'text-blue-700' : 'text-slate-700'}`}>
                          {meta.label}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">{count} permissions</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions Area */}
        <div className="lg:col-span-9 space-y-6">
          <Card className="p-0 overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${roleMeta.color} flex items-center justify-center shadow-lg`}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">{roleMeta.label}</h3>
                  <p className="text-xs text-slate-500 font-medium">{roleMeta.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-2 hidden md:block">
                  <p className="text-2xl font-black text-slate-800">{grantedCount}<span className="text-sm text-slate-400 font-bold">/{totalPermissions}</span></p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Granted</p>
                </div>
                <button 
                  onClick={() => setShowGrantedOnly(!showGrantedOnly)}
                  className={`p-2 rounded-lg border transition-all ${showGrantedOnly ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                  title={showGrantedOnly ? 'Show all' : 'Show granted only'}
                >
                  {showGrantedOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..." 
                    className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-none w-40 md:w-52 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Permission Groups */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredGroups.map((group) => {
                  const grantedInGroup = group.permissions.filter(p => activePermissions.includes(p)).length;
                  const totalInGroup = group.permissions.length;
                  const allGranted = grantedInGroup === totalInGroup;
                  
                  return (
                    <div key={group.module} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-base">{group.icon}</span>
                          {group.module}
                        </h4>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          allGranted 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : grantedInGroup > 0 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'bg-slate-100 text-slate-400'
                        }`}>
                          {grantedInGroup}/{totalInGroup}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {group.permissions.map((permission) => {
                          const isActive = activePermissions.includes(permission);
                          return (
                            <div 
                              key={permission}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                isActive 
                                  ? 'bg-blue-50/50 border-blue-100' 
                                  : 'bg-slate-50/50 border-slate-100'
                              }`}
                            >
                              <span className={`text-[13px] font-medium ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                                {formatPermission(permission)}
                              </span>
                              <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                isActive 
                                  ? 'bg-blue-600 text-white shadow-sm' 
                                  : 'bg-slate-200 text-transparent'
                              }`}>
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Info Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 items-start">
            <div className="p-2.5 bg-slate-200 rounded-xl text-slate-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-700">How Permissions Work</h5>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Permissions are enforced at the API level. Each role has a fixed set of actions defined in the system configuration. 
                When a user logs in, their role determines what API endpoints they can access and what UI elements are visible.
                Contact the Super Admin to request permission changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
