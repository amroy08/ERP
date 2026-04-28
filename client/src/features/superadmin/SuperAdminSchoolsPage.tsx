import React, { useState, useEffect } from 'react';
import { 
  Plus, School, Users, BookOpen, Crown, Lock, Unlock, 
  Settings, Trash2, Edit, Eye, CheckCircle, XCircle,
  Shield, Building2, ChevronRight, Search, Globe, Phone, Mail,
  UserPlus, Layers, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useDispatch } from 'react-redux';
import { setSchoolScope } from '../auth/authSlice';
import { useNavigate } from 'react-router-dom';

const PLAN_CONFIGS: Record<string, { color: string; bg: string; border: string; roles: string[] }> = {
  starter:      { color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200', roles: ['admin'] },
  professional: { color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',  roles: ['admin','staff'] },
  business:     { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200',roles: ['admin','staff','teacher'] },
  enterprise:   { color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200', roles: ['admin','staff','teacher','student','parent'] },
};

const PORTAL_COLORS: Record<string, string> = {
  admin: 'bg-blue-500', staff: 'bg-violet-500', teacher: 'bg-emerald-500',
  student: 'bg-amber-500', parent: 'bg-rose-500',
};

interface SchoolData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  slug?: string;
  licensePlan?: string;
  licensedRoles?: string[];
  enabledModules?: string[];
  totalUsers: number;
  totalClasses: number;
  roleCounts: Record<string, number>;
  createdAt: string;
  adminUser?: { id: string; name: string; email: string; lastLogin?: string } | null;
}

const DEFAULT_MODULES = ['attendance','homework','exams','timetable','fees','notices','transport','admissions'];

export const SuperAdminSchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAccessSchool = (id: string, name: string) => {
    dispatch(setSchoolScope({ id, name }));
    toast.success(`Accessing ${name} context`);
    navigate('/dashboard');
  };

  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', website: '',
    principal: '', licensePlan: 'starter', licensedRoles: ['admin'],
    adminName: '', adminEmail: '', adminPassword: 'Admin@123',
  });

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/schools');
      setSchools(res.data.data || []);
    } catch { toast.error('Failed to load schools'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSchools(); }, []);

  const handlePlanChange = (plan: string) => {
    setForm(f => ({ ...f, licensePlan: plan, licensedRoles: PLAN_CONFIGS[plan]?.roles || ['admin'] }));
  };

  const handleCreateSchool = async () => {
    if (!form.name || !form.address || !form.phone || !form.email) {
      toast.error('Name, address, phone and email are required'); return;
    }
    setSubmitting(true);
    try {
      const enabledModules = DEFAULT_MODULES;
      await axiosInstance.post('/admin/schools', { ...form, enabledModules });
      toast.success(`School "${form.name}" created!`);
      setShowCreateModal(false);
      setForm({ name: '', address: '', phone: '', email: '', website: '', principal: '',
        licensePlan: 'starter', licensedRoles: ['admin'], adminName: '', adminEmail: '', adminPassword: 'Admin@123' });
      fetchSchools();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create school');
    } finally { setSubmitting(false); }
  };

  const handleUpdateLicensing = async (schoolId: string, licensePlan: string, licensedRoles: string[]) => {
    try {
      await axiosInstance.put(`/admin/schools/${schoolId}`, { licensePlan, licensedRoles });
      toast.success('Licensing updated');
      fetchSchools();
      if (selectedSchool) setSelectedSchool(s => s ? { ...s, licensePlan, licensedRoles } : null);
    } catch { toast.error('Failed to update licensing'); }
  };

  const filtered = schools.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalStats = {
    schools: schools.length,
    users: schools.reduce((a, s) => a + s.totalUsers, 0),
    students: schools.reduce((a, s) => a + (s.roleCounts?.student || 0), 0),
    teachers: schools.reduce((a, s) => a + (s.roleCounts?.teacher || 0), 0),
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: 'Super Admin' }, { label: 'Schools & Institutes' }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-xl shadow-indigo-200">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Schools & Institutes</h1>
            <p className="text-slate-500 text-sm">Manage all client schools and their subscriptions</p>
          </div>
        </div>
        <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 border-0 shadow-xl shadow-indigo-200 rounded-2xl px-8 h-12">
          Add New School
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Schools', value: totalStats.schools, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Users', value: totalStats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Students', value: totalStats.students, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Teachers', value: totalStats.teachers, icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(stat => (
          <Card key={stat.label} className="p-5 flex items-center gap-4">
            <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center', stat.bg)}>
              <stat.icon className={clsx('w-6 h-6', stat.color)} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Input placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)}
        icon={<Search className="w-4 h-4" />} />

      {/* Schools List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center">
          <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="font-black text-slate-400">No schools found</h3>
          <p className="text-sm text-slate-400 mt-1">Add your first client school to get started</p>
          <Button variant="primary" className="mt-6 mx-auto" onClick={() => setShowCreateModal(true)}>
            Add First School
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map(school => {
            const plan = school.licensePlan || 'starter';
            const cfg = PLAN_CONFIGS[plan] || PLAN_CONFIGS.starter;
            const roles = (school.licensedRoles as string[]) || ['admin'];
            return (
              <Card key={school.id} className="p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 border-transparent hover:border-indigo-100"
                onClick={() => { setSelectedSchool(school); setShowDetailModal(true); }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                      {school.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-tight">{school.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{school.email}</p>
                    </div>
                  </div>
                  <span className={clsx('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border', cfg.color, cfg.bg, cfg.border)}>
                    {plan}
                  </span>
                </div>

                {/* Portal pills */}
                <div className="flex gap-2 flex-wrap mb-4">
                  {['admin','staff','teacher','student','parent'].map(role => {
                    const active = roles.includes(role);
                    return (
                      <span key={role} className={clsx(
                        'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                        active ? `${PORTAL_COLORS[role]} text-white` : 'bg-slate-100 text-slate-400'
                      )}>
                        {active ? <Unlock className="w-2.5 h-2.5 inline mr-1" /> : <Lock className="w-2.5 h-2.5 inline mr-1" />}
                        {role}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex gap-4 text-xs font-bold text-slate-400">
                    <span><Users className="w-3.5 h-3.5 inline mr-1" />{school.totalUsers} users</span>
                    <span><BookOpen className="w-3.5 h-3.5 inline mr-1" />{school.totalClasses} classes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); handleAccessSchool(school.id, school.name); }}>
                      Access School
                    </Button>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create School Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New School" size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="School Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Vidya Public School" />
            <Input label="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@school.com" />
            <Input label="Phone *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
            <Input label="Website" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://school.edu.in" />
          </div>
          <Input label="Address *" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main Street, City" />
          <Input label="Principal Name" value={form.principal} onChange={e => setForm(f => ({ ...f, principal: e.target.value }))} placeholder="Dr. Ramesh Sharma" />

          {/* Plan Selection */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Subscription Plan</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(PLAN_CONFIGS).map(([plan, cfg]) => (
                <button key={plan} onClick={() => handlePlanChange(plan)}
                  className={clsx('p-3 rounded-2xl border-2 text-center transition-all', 
                    form.licensePlan === plan ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-slate-100 hover:border-slate-200')}>
                  <Crown className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-black uppercase tracking-wide">{plan}</div>
                  <div className="text-[9px] text-slate-400 mt-1">{cfg.roles.length} portal{cfg.roles.length !== 1 ? 's' : ''}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Admin Account */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Admin Account (Optional)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Admin Name" value={form.adminName} onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} placeholder="School Admin" />
              <Input label="Admin Email" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} placeholder="admin@school.com" />
              <Input label="Password" value={form.adminPassword} onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} placeholder="Admin@123" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleCreateSchool} isLoading={submitting}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-700 border-0">
              Create School
            </Button>
          </div>
        </div>
      </Modal>

      {/* School Detail Modal */}
      {selectedSchool && (
        <SchoolDetailModal
          school={selectedSchool}
          isOpen={showDetailModal}
          onClose={() => { setShowDetailModal(false); setSelectedSchool(null); }}
          onUpdate={handleUpdateLicensing}
          onRefresh={fetchSchools}
        />
      )}
    </div>
  );
};

/* ── School Detail / Licensing Modal ── */
interface DetailModalProps {
  school: SchoolData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, plan: string, roles: string[]) => void;
  onRefresh: () => void;
}

const SchoolDetailModal: React.FC<DetailModalProps> = ({ school, isOpen, onClose, onUpdate, onRefresh }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAccess = () => {
    dispatch(setSchoolScope({ id: school.id, name: school.name }));
    toast.success(`Accessing ${school.name} context`);
    onClose();
    navigate('/dashboard');
  };
  const [roles, setRoles] = useState<string[]>((school.licensedRoles as string[]) || ['admin']);
  const [plan, setPlan] = useState(school.licensePlan || 'starter');
  const [saving, setSaving] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: 'Admin@123' });
  const [addingAdmin, setAddingAdmin] = useState(false);

  const toggleRole = (role: string) => {
    if (role === 'admin') return;
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(school.id, plan, roles);
    setSaving(false);
  };

  const handleAddAdmin = async () => {
    if (!adminForm.email) { toast.error('Email required'); return; }
    setAddingAdmin(true);
    try {
      const res = await axiosInstance.post(`/admin/schools/${school.id}/admin`, adminForm);
      toast.success(`Admin created: ${res.data.data.email} / ${res.data.data.defaultPassword}`);
      setShowAddAdmin(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create admin');
    } finally { setAddingAdmin(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={school.name} size="lg">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* School info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { icon: Mail, label: school.email },
            { icon: Phone, label: school.phone },
            { icon: Globe, label: school.address },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-slate-500">
              <Icon className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="truncate font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* User counts */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {['admin','staff','teacher','student','parent'].map(role => (
            <div key={role} className="bg-slate-50 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-slate-800">{school.roleCounts?.[role] || 0}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide mt-0.5">{role}s</div>
            </div>
          ))}
        </div>

        {/* Admin account */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-black text-blue-800 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Admin Account
            </h4>
            <Button variant="ghost" icon={<UserPlus className="w-4 h-4" />} onClick={() => setShowAddAdmin(!showAddAdmin)}
              className="text-xs h-8 text-blue-600 hover:bg-blue-100">
              {school.adminUser ? 'Add Another' : 'Create Admin'}
            </Button>
          </div>
          {school.adminUser ? (
            <div>
              <p className="font-bold text-blue-900">{school.adminUser.name}</p>
              <p className="text-xs text-blue-600">{school.adminUser.email}</p>
              {school.adminUser.lastLogin && (
                <p className="text-xs text-blue-400 mt-1">Last login: {new Date(school.adminUser.lastLogin).toLocaleDateString()}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-blue-600 font-medium">No admin assigned yet</p>
          )}
          {showAddAdmin && (
            <div className="mt-3 space-y-2 pt-3 border-t border-blue-100">
              <Input label="Name" value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} />
              <Input label="Email" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} />
              <Input label="Password" value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))} />
              <Button variant="primary" onClick={handleAddAdmin} isLoading={addingAdmin} className="w-full">
                Create Admin Account
              </Button>
            </div>
          )}
        </div>

        {/* Plan Selection */}
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Subscription Plan</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(PLAN_CONFIGS).map(([p, cfg]) => (
              <button key={p} onClick={() => { setPlan(p); setRoles(cfg.roles); }}
                className={clsx('p-3 rounded-2xl border-2 text-center transition-all',
                  plan === p ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-slate-100 hover:border-slate-200')}>
                <div className="text-xs font-black uppercase tracking-wide">{p}</div>
                <div className="text-[9px] text-slate-400">{cfg.roles.join(', ')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Portal Toggles */}
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Access Portals</label>
          <div className="flex gap-3 flex-wrap">
            {['admin','staff','teacher','student','parent'].map(role => {
              const active = roles.includes(role);
              return (
                <button key={role} onClick={() => toggleRole(role)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-sm font-black transition-all',
                    role === 'admin' ? 'border-blue-200 bg-blue-50 text-blue-600 cursor-default' :
                    active ? `${PORTAL_COLORS[role]} border-transparent text-white` : 'border-slate-100 text-slate-400'
                  )}>
                  {active ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Manage Licensing Prompt */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Layers className="w-5 h-5 text-indigo-500" />
             <div className="text-left">
                <h4 className="text-[10px] font-black text-slate-900 uppercase">Advanced Modules</h4>
                <p className="text-[9px] text-slate-500 font-medium">Fine-tune individual feature modules</p>
             </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleAccess} className="text-[10px] font-black uppercase text-indigo-600 hover:bg-white h-8">
            Open Dashboard
          </Button>
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} className="w-20">Close</Button>
          <Button variant="secondary" onClick={handleAccess} className="flex-1 bg-slate-100 border-slate-200 text-slate-700">Access School</Button>
          <Button variant="primary" onClick={handleSave} isLoading={saving}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-700 border-0">
            Save Licensing
          </Button>
        </div>
      </div>
    </Modal>
  );
};
