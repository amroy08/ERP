import React, { useState } from 'react';
import { Shield, Check, X, Search, Filter } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ROLES, ROLE_PERMISSIONS } from '../../utils/constants';

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  principal: 'Principal',
  teacher: 'Teacher',
  clerk: 'Clerk',
  parent: 'Parent',
  student: 'Student',
};

// Group permissions by module for better organization
const permissionGroups = [
  { module: 'Dashboard', permissions: ['dashboard:view'] },
  { module: 'Students', permissions: ['student:view', 'student:create', 'student:update', 'student:delete'] },
  { module: 'Teachers', permissions: ['teacher:view', 'teacher:create', 'teacher:update', 'teacher:delete'] },
  { module: 'Staff', permissions: ['staff:view', 'staff:create', 'staff:update', 'staff:delete'] },
  { module: 'Admissions', permissions: ['admission:view', 'admission:create', 'admission:update', 'admission:delete', 'enquiry:view', 'enquiry:create', 'enquiry:update'] },
  { module: 'Finance', permissions: ['fee:view', 'fee:create', 'fee:update', 'fee:delete', 'fee:collect'] },
  { module: 'Academic', permissions: ['class:view', 'class:create', 'class:update', 'class:delete', 'exam:view', 'exam:create', 'exam:update', 'exam:delete', 'homework:view', 'homework:create', 'timetable:view'] },
  { module: 'Attendance', permissions: ['attendance:view', 'attendance:mark'] },
  { module: 'Operations', permissions: ['notice:view', 'notice:create', 'notice:update', 'notice:delete', 'transport:view', 'library:view', 'inventory:view', 'report:view'] },
  { module: 'Settings', permissions: ['settings:view', 'settings:update'] },
];

export const RolesPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>(ROLES.ADMIN);
  const [activePermissions, setActivePermissions] = useState<string[]>(ROLE_PERMISSIONS[ROLES.ADMIN] || []);

  const handleTogglePermission = (permission: string) => {
    setActivePermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission) 
        : [...prev, permission]
    );
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setActivePermissions(ROLE_PERMISSIONS[role] || []);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'System Configuration' }, { label: 'Roles & Permissions' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Roles & Permissions</h1>
          <p className="text-slate-500 text-sm">Define what each user role can access and perform in the system.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>Audit Log</Button>
          <Button icon={<Check className="w-4 h-4" />}>Save Changes</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role Selection Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">User Roles</h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {Object.values(ROLES).map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className={`w-full text-left px-4 py-3.5 text-sm font-medium transition-all border-l-4 ${
                  selectedRole === role
                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className={`w-4 h-4 ${selectedRole === role ? 'text-blue-600' : 'text-slate-400'}`} />
                  {roleLabels[role]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Management Area */}
        <div className="lg:col-span-9 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{roleLabels[selectedRole]} Permissions</h3>
                  <p className="text-xs text-slate-500">{activePermissions.length} actions enabled</p>
                </div>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Find permission..." 
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none w-48 md:w-64"
                />
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {permissionGroups.map((group) => (
                  <div key={group.module} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        {group.module}
                      </h4>
                      <button className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700 tracking-wider">Select All</button>
                    </div>
                    <div className="space-y-2.5">
                      {group.permissions.map((permission) => {
                        const isActive = activePermissions.includes(permission);
                        return (
                          <div 
                            key={permission}
                            onClick={() => handleTogglePermission(permission)}
                            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all group ${
                              isActive 
                                ? 'bg-blue-50/50 border-blue-100' 
                                : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <span className={`text-[13px] ${isActive ? 'text-blue-900 font-medium' : 'text-slate-600'}`}>
                              {permission.split(':').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                              isActive 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-100 text-transparent group-hover:bg-slate-200'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-start">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-amber-900">Security Note</h5>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Changes to permissions take effect immediately for all users with this role. Users may need to refresh their session or re-login to see all changes applied. Be cautious when removing view permissions as it may break some dashboard widgets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
