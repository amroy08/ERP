import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, User, CheckCircle2, ShieldCheck, 
  Mail, Key, GraduationCap, LayoutGrid, Check, Users, Loader2
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import axiosInstance from '../../api/axiosInstance';
import { ApiResponse, Teacher, ClassDoc, SectionDoc } from '../../types';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200";

const Label: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">
    {text}{required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

export const TeacherFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [allClasses, setAllClasses] = useState<ClassDoc[]>([]);
  const [allSections, setAllSections] = useState<SectionDoc[]>([]);

  const [form, setForm] = useState({
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '',
    employeeId: '', 
    qualification: '',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active',
    canViewAllStudents: false,
    assignedClassIds: [] as string[],
    sectionsAsClassTeacher: [] as string[]
  });

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const toggleArray = (field: 'assignedClassIds' | 'sectionsAsClassTeacher', id: string) => {
    const current = [...form[field]];
    const index = current.indexOf(id);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    set(field, current);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, sectionRes] = await Promise.all([
          axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes'),
          axiosInstance.get<ApiResponse<SectionDoc[]>>('/sections')
        ]);
        setAllClasses(classRes.data.data);
        setAllSections(sectionRes.data.data);

        if (isEdit && id) {
          setIsLoading(true);
          const res = await axiosInstance.get<ApiResponse<any>>(`/teachers/${id}`);
          const t = res.data.data;
          
          // Split full name into first and last
          const names = (t.user?.name || '').split(' ');
          const fName = names[0] || '';
          const lName = names.slice(1).join(' ') || '';

          setForm({
            firstName: fName,
            lastName: lName,
            email: t.user?.email || '',
            phone: t.user?.phone || '',
            employeeId: t.employeeId || '',
            qualification: t.qualification || '',
            designation: t.designation || '',
            joiningDate: t.joiningDate ? String(t.joiningDate).split('T')[0] : '',
            status: t.status || 'active',
            canViewAllStudents: !!t.canViewAllStudents,
            assignedClassIds: t.assignedClasses?.map((c: any) => c.id) || [],
            sectionsAsClassTeacher: t.classTeacherOf?.map((s: any) => s.id) || []
          });
        }
      } catch (err) {
        toast.error('Failed to initialize teacher form');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEdit) {
        await axiosInstance.put(`/teachers/${id}`, form);
        toast.success('Teacher updated successfully');
        navigate('/teachers');
      } else {
        const res = await axiosInstance.post('/teachers', form);
        toast.success('Teacher account created successfully');
        setSuccessData(res.data.credentials);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isEdit ? 'Update failed' : 'Creation failed'));
    } finally { setIsSaving(false); }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-100 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Teacher Record...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Breadcrumb items={[{ label: 'Teachers', href: '/teachers' }, { label: isEdit ? 'Edit Teacher' : 'Add Teacher' }]} />
        <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/teachers')}>Back</Button>
      </div>

      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
          <div className="relative">
             <User className="w-7 h-7" />
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{isEdit ? 'Edit Teacher Profile' : 'New Teacher Account'}</h1>
          <p className="text-slate-500 text-sm font-medium">Configure profile, access permissions, and roles.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Info */}
          <div className="xl:col-span-12">
            <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-blue-500" />
                 Personal & Workplace Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label text="First Name" required />
                  <input className={inputCls} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Rajesh" required />
                </div>
                <div>
                  <Label text="Last Name" required />
                  <input className={inputCls} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Sharma" required />
                </div>
                <div>
                  <Label text="Employee ID" required />
                  <input className={inputCls} value={form.employeeId} onChange={e => set('employeeId', e.target.value)} placeholder="e.g. TEA-123" required />
                </div>
                <div>
                  <Label text="Qualification" required />
                  <input className={inputCls} value={form.qualification} onChange={e => set('qualification', e.target.value)} placeholder="e.g. M.Sc B.Ed" required />
                </div>
                <div>
                  <Label text="Joining Date" required />
                  <input type="date" className={inputCls} value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} required />
                </div>
                <div>
                  <Label text="Status" />
                  <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="resigned">Resigned</option>
                  </select>
                </div>
                <div>
                  <Label text="Work Email" required />
                  <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="rajesh@school.edu" required />
                </div>
                <div>
                  <Label text="Phone Number" required />
                  <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" required />
                </div>
              </div>
            </Card>
          </div>

          {/* Role & Assignments */}
          <div className="xl:col-span-7 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Portals & Student Visibility
                  </h3>
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                     <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Access</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase italic">{form.canViewAllStudents ? 'Full Visibility' : 'Restricted'}</span>
                     </div>
                     <button
                        type="button"
                        onClick={() => set('canViewAllStudents', !form.canViewAllStudents)}
                        className={clsx(
                           "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                           form.canViewAllStudents ? "bg-emerald-500" : "bg-slate-200"
                        )}
                     >
                        <span className={clsx(
                           "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                           form.canViewAllStudents ? "translate-x-6" : "translate-x-1"
                        )} />
                     </button>
                  </div>
               </div>
              
              <div className="space-y-8">
                 {form.canViewAllStudents && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-4 animate-in zoom-in-95 duration-300">
                       <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-emerald-900 leading-tight">Full Visibility Active</p>
                          <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">This teacher has been granted access to view and manage marks for **all students** in the school, bypassing class assignments.</p>
                       </div>
                    </div>
                 )}

                 <div>
                    <Label text="Classes Taught (Assigned Classes)" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-4">Select classes to grant this teacher visibility over students.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                       {allClasses.map(c => {
                         const isSelected = form.assignedClassIds.includes(c.id);
                         return (
                           <button
                             key={c.id} type="button"
                             onClick={() => toggleArray('assignedClassIds', c.id)}
                             className={clsx(
                               "flex items-center justify-between p-3 rounded-xl border text-left transition-all group",
                               isSelected 
                                 ? "bg-blue-50 border-blue-200 ring-1 ring-blue-500/10" 
                                 : "bg-white border-slate-100 hover:border-slate-300"
                             )}
                           >
                              <div className="flex items-center gap-2.5">
                                 <div className={clsx("p-1.5 rounded-lg", isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200")}>
                                    <GraduationCap className="w-3.5 h-3.5" />
                                 </div>
                                 <span className={clsx("text-xs font-bold", isSelected ? "text-blue-900" : "text-slate-600")}>{c.name}</span>
                              </div>
                              {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                           </button>
                         );
                       })}
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100">
                    <Label text="Class Teacher Role" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-4">Designate this teacher as the 'Class Teacher' for specific sections.</p>
                    <div className="grid grid-cols-1 gap-4">
                       {allClasses.map(c => (
                         <div key={c.id} className="space-y-2">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">{c.name} Sections</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                               {allSections.filter(s => s.class === c.id || (s.class as any) === c.id).map(s => {
                                 const isSelected = form.sectionsAsClassTeacher.includes(s.id);
                                 return (
                                   <button
                                     key={s.id} type="button"
                                     onClick={() => toggleArray('sectionsAsClassTeacher', s.id)}
                                     className={clsx(
                                       "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-bold",
                                       isSelected 
                                         ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm" 
                                         : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                     )}
                                   >
                                      <div className={clsx("w-5 h-5 rounded-md flex items-center justify-center", isSelected ? "bg-emerald-600 text-white" : "bg-slate-50")}>
                                         {isSelected ? <Check className="w-3 h-3" /> : <LayoutGrid className="w-3 h-3" />}
                                      </div>
                                      Section {s.name}
                                   </button>
                                 );
                               })}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </Card>
          </div>

          <div className="xl:col-span-5">
             <Card className="p-8 bg-slate-900 text-white h-full relative overflow-hidden border-none shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck className="w-32 h-32" /></div>
                <div className="relative z-10">
                   <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-8">Role Logic Guidance</h3>
                   <div className="space-y-6">
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-emerald-400" /></div>
                         <div>
                            <p className="text-sm font-bold">Automatic Visibility</p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed italic">Assigned classes allow teachers to see student lists, mark attendance, and assign homework for those grades.</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5 text-blue-400" /></div>
                         <div>
                            <p className="text-sm font-bold">Class Teacher Privileges</p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed italic">Designated Class Teachers receive administrative oversight for their section, including progress reports and behavioral tracking.</p>
                         </div>
                      </div>
                   </div>
                   
                   <div className="mt-20 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Note on Security</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed italic">Changes to assignments take effect immediately. Ensure correct portal permissions are mapped in the Role Management system.</p>
                   </div>
                </div>
             </Card>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 pt-4">
          <Button variant="secondary" type="button" onClick={() => navigate('/teachers')} className="h-12 px-8 rounded-xl font-bold">Discard Changes</Button>
          <Button type="submit" isLoading={isSaving} size="lg" className="px-12 h-12 shadow-xl shadow-blue-500/20 active:scale-95 transition-all rounded-xl font-black uppercase tracking-widest" icon={!isSaving && <Save className="w-4 h-4" />}>
            {isEdit ? 'Save Profile' : 'Confirm & Create Account'}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal 
        isOpen={!!successData} 
        onClose={() => navigate('/teachers')}
        title="Account Provisioned"
        size="md"
      >
        <div className="space-y-6 py-2">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Access Granted!</h3>
              <p className="text-sm text-slate-500 font-medium">The teacher account has been formally established.</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4 shadow-inner">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <Mail className="w-3 h-3" /> Login Identifier
              </label>
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <code className="text-sm font-black text-slate-700">{successData?.email}</code>
                <button type="button" className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors" onClick={() => copyToClipboard(successData?.email, 'Email')}>Copy</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <ShieldCheck className="w-3 h-3" /> Security Token (Password)
              </label>
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <code className="text-sm font-black text-emerald-700">{successData?.password}</code>
                <button type="button" className="text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors" onClick={() => copyToClipboard(successData?.password, 'Password')}>Copy</button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 flex gap-4">
             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20"><Key className="w-5 h-5" /></div>
             <div>
                <p className="text-xs font-bold text-blue-900 leading-tight">Credential Sharing Policy</p>
                <p className="text-[10px] text-blue-700 mt-1 leading-relaxed font-medium">The teacher must reset this temporary password upon their first successful login. Do not store in plain text.</p>
             </div>
          </div>

          <Button className="w-full h-14 text-sm font-black tracking-widest uppercase shadow-xl shadow-blue-500/10 rounded-xl" onClick={() => navigate('/teachers')}>Close & Back to Directory</Button>
        </div>
      </Modal>
    </div>
  );
};
