import React, { useEffect, useState } from 'react';
import { useParams as useReactParams, useNavigate as useReactNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, GraduationCap, Phone, MapPin, 
  AlertCircle, ShieldCheck, Mail, Calendar, 
  FileText, History, DollarSign, BookOpen, 
  User as UserIcon, Download, 
  TrendingUp, Award, Clock, CheckCircle2, XCircle,
  Trash2, Plus
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Tabs } from '../../components/common/Tabs';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import axiosInstance from '../../api/axiosInstance';
import { Student, ApiResponse, LeaveRequest, ActivityLog } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { Select } from '../../components/common/Select';

export const StudentProfilePage: React.FC = () => {
  const { id } = useReactParams();
  const navigate = useReactNavigate();
  const { isRole, hasPermission } = usePermissions();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [attendance, setAttendance] = useState<any[]>([]);
  const [fees, setFees] = useState<any>(null);
  const [academics, setAcademics] = useState<any>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  const [promotionData, setPromotionData] = useState({ newClassId: '', newSectionId: '' });
  const [leaveData, setLeaveData] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });

  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  // Fee management state
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [newFeeData, setNewFeeData] = useState({ feeStructureId: '', customAmount: '' });
  const [feeStructures, setFeeStructures] = useState<any[]>([]);

  useEffect(() => {
    fetchStudent();
    fetchClasses();
  }, [id]);

  useEffect(() => {
    if (promotionData.newClassId) {
      fetchSections(promotionData.newClassId);
    }
  }, [promotionData.newClassId]);

  useEffect(() => {
    if (!id) return;
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'fees') fetchFees();
    if (activeTab === 'academic') fetchAcademics();
    if (activeTab === 'leaves') fetchLeaves();
  }, [activeTab, id]);

  const fetchStudent = async () => {
    try {
      const res = await axiosInstance.get<ApiResponse<Student>>(`/students/${id}`);
      setStudent(res.data.data);
    } catch { 
      navigate('/students'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axiosInstance.get(`/attendance/report/${id}`);
      setAttendance(res.data.data?.records || []);
    } catch (err) { console.error(err); }
  };

  const fetchFees = async () => {
    try {
      const res = await axiosInstance.get(`/fees/status/${id}`);
      setFees(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchAcademics = async () => {
    try {
      const res = await axiosInstance.get(`/exams/report/${id}`);
      setAcademics(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchLeaves = async () => {
    try {
      const res = await axiosInstance.get(`/leaves/student/${id}`);
      setLeaves(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchLogs = async () => {
    try {
      const res = await axiosInstance.get(`/students/${id}/logs`);
      setLogs(res.data.data);
      setIsLogsModalOpen(true);
    } catch (err) { toast.error('Failed to fetch logs'); }
  };

  const fetchClasses = async () => {
    try {
      const res = await axiosInstance.get('/classes');
      setClasses(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await axiosInstance.get(`/sections?classId=${classId}`);
      setSections(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleEditPayment = async () => {
    if (!editingPayment) return;
    try {
      await axiosInstance.put(`/fees/payment/${editingPayment.id}`, editingPayment);
      toast.success('Payment updated');
      setIsEditPaymentModalOpen(false);
      fetchFees();
    } catch (err) { toast.error('Failed to update payment'); }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return;
    try {
      await axiosInstance.delete(`/fees/payment/${paymentId}`);
      toast.success('Payment deleted');
      fetchFees();
    } catch (err) { toast.error('Failed to delete payment'); }
  };

  const fetchFeeStructures = async () => {
    try {
      const res = await axiosInstance.get(`/fees/structures?classId=${student?.class?.id}`);
      setFeeStructures(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleAddFee = async () => {
    try {
      await axiosInstance.post('/fees/student-fees', {
        studentId: id,
        feeStructureId: newFeeData.feeStructureId,
        customAmount: newFeeData.customAmount || null
      });
      toast.success('Fee assigned to student');
      setIsAddFeeModalOpen(false);
      setNewFeeData({ feeStructureId: '', customAmount: '' });
      fetchFees();
    } catch (err) { toast.error('Failed to add fee'); }
  };

  const handleUpdateFee = async () => {
    if (!editingFee) return;
    try {
      await axiosInstance.put(`/fees/student-fees/${editingFee.id}`, {
        customAmount: editingFee.customAmount
      });
      toast.success('Fee updated');
      setIsEditFeeModalOpen(false);
      fetchFees();
    } catch (err) { toast.error('Failed to update fee'); }
  };

  const handleDeleteFee = async (feeId: string) => {
    if (!window.confirm('Are you sure you want to remove this fee assignment?')) return;
    try {
      await axiosInstance.delete(`/fees/student-fees/${feeId}`);
      toast.success('Fee removed');
      fetchFees();
    } catch (err) { toast.error('Failed to delete fee'); }
  };

  const handlePromote = async () => {
    try {
      await axiosInstance.post(`/students/${id}/promote`, promotionData);
      toast.success('Student promoted successfully');
      setIsPromoteModalOpen(false);
      fetchStudent();
    } catch (err) { toast.error('Promotion failed'); }
  };

  const handleLeaveSubmit = async () => {
    try {
      await axiosInstance.post(`/leaves`, { ...leaveData, studentId: id });
      toast.success('Leave application submitted');
      setIsLeaveModalOpen(false);
      fetchLeaves();
    } catch (err) { toast.error('Failed to submit leave'); }
  };

  const handleResetPassword = async () => {
    if (!window.confirm('Are you sure you want to reset this student\'s password to "Student@123"?')) return;
    try {
      await axiosInstance.post(`/students/${id}/reset-password`);
      toast.success('Password reset to: Student@123');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-8 w-64 bg-slate-100 rounded" />
        <div className="h-48 bg-slate-50 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="h-96 bg-slate-50 rounded-2xl md:col-span-2" />
           <div className="h-96 bg-slate-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'academic', label: 'Academic', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
    { id: 'fees', label: 'Fees & Finance', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'leaves', label: 'Leaves', icon: <FileText className="w-4 h-4" /> },
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

  const canManage = isRole(['super_admin', 'admin', 'clerk']);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <Breadcrumb items={isRole(['student']) ? [{ label: 'My Profile' }, { label: student.fullName }] : [{ label: 'Directory', href: '/students' }, { label: student.fullName }]} />
        <div className="flex gap-2">
           <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>ID Card</Button>
           {canManage && (
             <Button variant="secondary" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => navigate(`/students/${id}/edit`)}>Edit Profile</Button>
           )}
           {hasPermission('student:delete') && (
             <Button 
               variant="danger" 
               size="sm" 
               icon={<Trash2 className="w-4 h-4" />} 
               onClick={() => {
                 if (window.confirm(`Are you sure you want to delete ${student.fullName}? This action cannot be undone.`)) {
                   axiosInstance.delete(`/students/${id}`).then(() => {
                     toast.success('Student deleted');
                     navigate('/students');
                   }).catch(() => toast.error('Failed to delete student'));
                 }
               }}
             >
               Delete Student
             </Button>
           )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 relative">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        <div className="px-8 pb-8 flex flex-col md:flex-row gap-6">
           <div className="relative -mt-12 shrink-0">
             <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-white overflow-hidden flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                  {student.firstName.charAt(0)}
                </div>
             </div>
             <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-4 h-4" />
             </div>
           </div>
           
           <div className="flex-1 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                 <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{student.fullName}</h1>
                 <StatusBadge status={student.status} />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-slate-500 font-medium">
                 <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm font-bold">{student.class?.name} · Section {student.section?.name}</span>
                 </div>
                 <div className="flex items-center gap-1.5 border-l border-slate-200 pl-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adm ID:</span>
                    <span className="text-sm font-mono text-blue-600 font-bold">{student.admissionNumber}</span>
                 </div>
              </div>
           </div>

           <div className="md:pt-6 pt-2 flex md:flex-col gap-4">
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance</span>
                  <span className="text-xl font-black text-emerald-600">
                    {attendance.length > 0 ? ((attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100).toFixed(1) : '94.2'}%
                  </span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade Point</span>
                 <span className="text-xl font-black text-indigo-600">A+</span>
              </div>
           </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
             <Card className="p-0 overflow-hidden border-slate-200 shadow-sm min-h-[600px]">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="bg-slate-50 px-6 pt-2" />
                
                <div className="p-8">
                    {activeTab === 'overview' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                           <div className="space-y-4">
                              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                 <UserIcon className="w-4 h-4" /> Personal Profile
                              </h3>
                              <div className="space-y-1">
                                 <InfoRow label="First Name" value={student.firstName} />
                                 <InfoRow label="Last Name" value={student.lastName} />
                                 <InfoRow label="Date of Birth" value={student.dateOfBirth ? format(new Date(student.dateOfBirth), 'dd MMM yyyy') : '—'} />
                                 <InfoRow label="Gender" value={student.gender} />
                                 <InfoRow label="Blood Group" value={<Badge variant="red">{student.bloodGroup || '—'}</Badge>} />
                                 <InfoRow label="House / Team" value={student.house || '—'} />
                                 <InfoRow label="Aadhaar Number" value={(student as any).aadhaarNumber || '—'} icon={<ShieldCheck className="w-3.5 h-3.5" />} />
                                 <InfoRow label="Previous School" value={(student as any).previousSchool || '—'} icon={<GraduationCap className="w-3.5 h-3.5" />} />
                              </div>

                              <div className="pt-6 space-y-4">
                                <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Medical Information
                                </h3>
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                    <p className="text-xs text-rose-800 font-bold leading-relaxed">
                                        {student.medicalNote || 'No critical medical conditions or allergies reported in the student file.'}
                                    </p>
                                </div>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                 <MapPin className="w-4 h-4" /> Contact & Guardian Details
                              </h3>
                              <div className="space-y-1">
                                 <InfoRow label="Father's Name" value={student.parent?.fatherName || '—'} icon={<UserIcon className="w-3.5 h-3.5" />} />
                                 <InfoRow label="Father's Phone" value={student.parent?.fatherPhone || '—'} icon={<Phone className="w-3.5 h-3.5" />} />
                                 <InfoRow label="Mother's Name" value={student.parent?.motherName || '—'} icon={<UserIcon className="w-3.5 h-3.5" />} />
                                 <InfoRow label="Mother's Phone" value={student.parent?.motherPhone || '—'} icon={<Phone className="w-3.5 h-3.5" />} />
                                 <InfoRow label="Guardian Email" value={student.parent?.email || '—'} icon={<Mail className="w-3.5 h-3.5" />} />
                                 <div className="pt-3">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 leading-none">Home Address</p>
                                     <p className="text-xs text-slate-600 font-bold">
                                        {typeof student.parent?.address === 'string' 
                                           ? student.parent.address 
                                           : [student.address?.street, student.address?.city, student.address?.state].filter(Boolean).join(', ') || (student as any).addressStreet || '—'}
                                     </p>
                                 </div>
                              </div>

                              <div className="pt-6 space-y-4">
                                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Emergency Protocol
                                </h3>
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-black text-emerald-900 leading-none">{(student as any).emergencyName || 'Primary Guardian'}</p>
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">{(student as any).emergencyRel || 'Relationship'}</p>
                                    </div>
                                    <p className="text-sm font-black text-slate-800">{(student as any).emergencyPhone || student.parent?.fatherPhone}</p>
                                </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                   {activeTab === 'academic' && (() => {
                      const results = Array.isArray(academics) ? academics : [];
                      const totalMarks = results.reduce((s: number, r: any) => s + (r.marksObtained || 0), 0);
                      const totalMax = results.reduce((s: number, r: any) => s + (r.maxMarks || 0), 0);
                      const overallPct = totalMax > 0 ? Math.round((totalMarks / totalMax) * 100) : 0;
                      const uniqueExams = new Set(results.map((r: any) => r.examId)).size;

                      return (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Overall Score</p>
                              <p className="text-2xl font-black text-blue-700 mt-1">{results.length > 0 ? `${overallPct}%` : '—'}</p>
                           </div>
                           <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Exams Taken</p>
                              <p className="text-2xl font-black text-indigo-700 mt-1">{uniqueExams}</p>
                           </div>
                           <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">Subjects Graded</p>
                              <p className="text-2xl font-black text-emerald-700 mt-1">{results.length}</p>
                           </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                           <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-50">
                                 <tr>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Exam</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Subject</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Marks</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Max</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Grade</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {results.length > 0 ? results.map((r: any) => (
                                   <tr key={r.id} className="hover:bg-slate-50/50">
                                      <td className="px-4 py-3 text-xs font-bold text-slate-500">{r.exam?.name || '—'}</td>
                                      <td className="px-4 py-3 text-sm font-bold text-slate-700">{r.subject?.name || '—'}</td>
                                      <td className="px-4 py-3 text-sm font-black text-blue-600">{r.marksObtained}</td>
                                      <td className="px-4 py-3 text-sm text-slate-500">{r.maxMarks}</td>
                                      <td className="px-4 py-3"><Badge variant="blue">{r.grade || '—'}</Badge></td>
                                   </tr>
                                 )) : (
                                   <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm italic">No academic results found for current session.</td></tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                      </div>
                      );
                    })()}

                   {activeTab === 'attendance' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                           <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              <span className="text-lg font-black text-emerald-700 mt-1">{attendance.filter((a: any) => a.status === 'present').length}</span>
                              <span className="text-[10px] font-bold text-emerald-400 uppercase">Present</span>
                           </div>
                           <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col items-center">
                              <XCircle className="w-5 h-5 text-rose-500" />
                              <span className="text-lg font-black text-rose-700 mt-1">{attendance.filter((a: any) => a.status === 'absent').length}</span>
                              <span className="text-[10px] font-bold text-rose-400 uppercase">Absent</span>
                           </div>
                         </div>
                        <div className="grid grid-cols-7 gap-2">
                           {Array.from({ length: 28 }).map((_, i) => (
                             <div key={i} className={`h-8 rounded-lg ${i % 7 === 0 ? 'bg-rose-100' : 'bg-emerald-100'} border border-white opacity-50`}></div>
                           ))}
                        </div>
                     </div>
                   )}

                   {activeTab === 'fees' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <Card className="p-5 bg-indigo-50 border-indigo-100 flex justify-between items-center shadow-none">
                              <div>
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Total Fee</p>
                                 <p className="text-2xl font-black text-indigo-700 mt-1">₹{fees?.totalFee?.toLocaleString() || '0'}</p>
                              </div>
                              <DollarSign className="w-8 h-8 text-indigo-200" />
                           </Card>
                           <Card className="p-5 bg-emerald-50 border-emerald-100 flex justify-between items-center shadow-none">
                              <div>
                                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">Total Paid</p>
                                 <p className="text-2xl font-black text-emerald-700 mt-1">₹{fees?.paidAmount?.toLocaleString() || '0'}</p>
                              </div>
                              <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                           </Card>
                           <Card className={`p-5 ${(fees?.balanceDue || 0) > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'} flex justify-between items-center shadow-none`}>
                              <div>
                                 <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Balance Due</p>
                                 <p className={`text-2xl font-black mt-1 ${(fees?.balanceDue || 0) > 0 ? 'text-rose-700' : 'text-slate-400'}`}>₹{fees?.balanceDue?.toLocaleString() || '0'}</p>
                              </div>
                              <AlertCircle className={`w-8 h-8 ${(fees?.balanceDue || 0) > 0 ? 'text-rose-200' : 'text-slate-200'}`} />
                           </Card>
                        </div>

                        {/* Fee Breakdown Table */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Fee Breakdown</h4>
                               {canManage && (
                                 <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { fetchFeeStructures(); setIsAddFeeModalOpen(true); }}>Add Fee</Button>
                               )}
                            </div>
                            <div className="overflow-x-auto rounded-2xl border border-slate-100 overflow-hidden">
                               <table className="w-full text-left border-collapse">
                                  <thead className="bg-slate-50">
                                     <tr>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Fee Name</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Status</th>
                                        {canManage && <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Actions</th>}
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                     {fees?.structures?.length > 0 ? fees.structures.map((s: any, idx: number) => (
                                       <tr key={s.id || idx} className="hover:bg-slate-50/50">
                                          <td className="px-4 py-3 text-sm font-bold text-slate-700">{s.name}</td>
                                          <td className="px-4 py-3 text-sm font-black text-blue-600">₹{(s.effectiveAmount || s.totalAmount || 0).toLocaleString()}</td>
                                          <td className="px-4 py-3"><Badge variant="orange">Pending</Badge></td>
                                          {canManage && (
                                            <td className="px-4 py-3 text-right">
                                              <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => { setEditingFee({ id: s._studentFeeId || s.id, customAmount: s.effectiveAmount || s.totalAmount, name: s.name }); setIsEditFeeModalOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                                {s._studentFeeId && <button onClick={() => handleDeleteFee(s._studentFeeId)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
                                              </div>
                                            </td>
                                          )}
                                       </tr>
                                     )) : (
                                       <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400 text-sm italic">No fees assigned.</td></tr>
                                     )}
                                  </tbody>
                               </table>
                            </div>
                        </div>

                        {/* Transactions */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Payment History</h4>
                            {fees?.payments?.length > 0 ? fees.payments.map((p : any) => (
                               <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-slate-50 rounded-2xl group hover:border-blue-100 transition-all">
                                  <div className="flex items-center gap-3">
                                     <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors"><DollarSign className="w-4 h-4 text-emerald-500" /></div>
                                      <div>
                                         <p className="text-sm font-bold text-slate-700">{p.receiptNumber}</p>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{format(new Date(p.paymentDate), 'dd MMM yyyy')} • {p.paymentMode}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <p className="text-base font-black text-slate-800">₹{p.amountPaid.toLocaleString()}</p>
                                     {isRole(['admin', 'super_admin']) && (
                                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button onClick={() => { setEditingPayment(p); setIsEditPaymentModalOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                         <button onClick={() => handleDeletePayment(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                       </div>
                                     )}
                                  </div>
                               </div>
                            )) : (
                               <p className="text-sm text-slate-400 italic text-center py-10">No payments found.</p>
                            )}
                        </div>
                     </div>
                   )}

                   {activeTab === 'leaves' && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-sm font-bold text-slate-800">Leave History</h3>
                           <Button size="sm" onClick={() => setIsLeaveModalOpen(true)}>New Application</Button>
                        </div>
                        {leaves.length > 0 ? leaves.map(l => (
                          <div key={l.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between bg-white shadow-sm">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${l.status === 'approved' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                                   {l.type.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-800">{l.status === 'approved' ? 'Leave Approved' : 'Request Pending'}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(l.startDate), 'dd MMM')} - {format(new Date(l.endDate), 'dd MMM yyyy')}</p>
                                </div>
                             </div>
                             <Badge variant={l.status === 'approved' ? 'emerald' : 'orange'}>{l.status}</Badge>
                          </div>
                        )) : (
                          <div className="text-center py-20 opacity-50"><History className="mx-auto w-10 h-10 mb-2" /><p className="text-sm font-medium">No leave applications yet.</p></div>
                        )}
                     </div>
                   )}
                </div>
             </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <Card className="p-6 border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Portal Account</h3>
                   <Badge variant="blue">Active</Badge>
                </div>
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Login Email</p>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <span className="text-xs font-bold text-slate-700 truncate">stu.{student.admissionNumber.toLowerCase().replace(/-/g, '')}@school.local</span>
                         <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => toast.success('Email copied')}>Copy</Button>
                      </div>
                   </div>
                   {canManage && (
                     <div className="flex flex-col gap-2">
                        <Button variant="secondary" className="w-full h-11 text-xs" icon={<ShieldCheck className="w-4 h-4" />} onClick={handleResetPassword}>Reset Password</Button>
                     </div>
                   )}
                </div>
             </Card>

             {canManage && (
               <Card className="p-6 border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">Quick Actions</h3>
                  <div className="grid grid-cols-1 gap-3">
                     <Button variant="secondary" className="w-full justify-start text-slate-700 py-3" icon={<ArrowLeft className="w-4 h-4 rotate-180" />} onClick={() => setIsPromoteModalOpen(true)}>Promote Student</Button>
                     <Button variant="secondary" className="w-full justify-start text-slate-700 py-3" icon={<FileText className="w-4 h-4" />} onClick={() => setIsLeaveModalOpen(true)}>Leave Application</Button>
                     <Button variant="secondary" className="w-full justify-start text-slate-700 py-3" icon={<History className="w-4 h-4" />} onClick={fetchLogs}>History & Logs</Button>
                  </div>
               </Card>
             )}
          </div>
      </div>

      <Modal isOpen={isPromoteModalOpen} onClose={() => setIsPromoteModalOpen(false)} title="Promote Student">
         <div className="space-y-5 p-2">
            <p className="text-xs text-blue-600 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 font-bold leading-relaxed">
               You are promoting <b>{student.fullName}</b> to the next academic level. All current details will be moved, and any outstanding balance of <b>₹{fees?.balanceDue?.toLocaleString() || '0'}</b> will be carried forward as "Previous Dues".
            </p>
            
            <Select 
              label="Target Class" 
              options={classes.map(c => ({ value: c.id, label: c.name }))}
              value={promotionData.newClassId}
              onChange={(e) => setPromotionData({ ...promotionData, newClassId: e.target.value })}
            />

            <Select 
              label="Target Section" 
              options={sections.map(s => ({ value: s.id, label: s.name }))}
              value={promotionData.newSectionId}
              onChange={(e) => setPromotionData({ ...promotionData, newSectionId: e.target.value })}
              disabled={!promotionData.newClassId}
            />

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
               <Button variant="secondary" onClick={() => setIsPromoteModalOpen(false)} className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
               <Button onClick={handlePromote} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20" disabled={!promotionData.newClassId || !promotionData.newSectionId}>Confirm Promotion</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isEditPaymentModalOpen} onClose={() => setIsEditPaymentModalOpen(false)} title="Edit Payment Record">
         <div className="space-y-4 p-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Receipt: {editingPayment?.receiptNumber}</p>
            <Input 
              label="Amount Paid" 
              type="number"
              value={editingPayment?.amountPaid} 
              onChange={(e) => setEditingPayment({...editingPayment, amountPaid: parseFloat(e.target.value)})} 
            />
            <Input 
              label="Remarks" 
              value={editingPayment?.remarks} 
              onChange={(e) => setEditingPayment({...editingPayment, remarks: e.target.value})} 
            />
            <div className="flex justify-end gap-2 pt-4">
               <Button variant="secondary" onClick={() => setIsEditPaymentModalOpen(false)}>Cancel</Button>
               <Button onClick={handleEditPayment}>Save Changes</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="New Leave Application">
         <div className="space-y-4 p-2">
            <Input label="Leave Type (Sick, Casual, etc.)" value={leaveData.type} onChange={(e) => setLeaveData({...leaveData, type: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
               <Input label="Start Date" type="date" value={leaveData.startDate} onChange={(e) => setLeaveData({...leaveData, startDate: e.target.value})} />
               <Input label="End Date" type="date" value={leaveData.endDate} onChange={(e) => setLeaveData({...leaveData, endDate: e.target.value})} />
            </div>
            <Input label="Reason" value={leaveData.reason} onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})} multiline />
            <div className="flex justify-end gap-2 pt-4">
               <Button variant="secondary" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
               <Button onClick={handleLeaveSubmit}>Submit Request</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} title="Student Activity Logs">
         <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {logs.length > 0 ? logs.map(log => (
               <div key={log.id} className="p-4 border-l-4 border-blue-500 bg-blue-50/30 rounded-r-xl">
                  <div className="flex justify-between items-start">
                     <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{log.action}</p>
                     <p className="text-[10px] text-slate-400 font-bold">{format(new Date(log.createdAt), 'dd MMM, hh:mm a')}</p>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{log.description}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold italic">By: {log.performedBy || 'System'}</p>
               </div>
            )) : <p className="text-center py-20 text-slate-400 italic">No activity logs found.</p>}
         </div>
      </Modal>

      <Modal isOpen={isAddFeeModalOpen} onClose={() => setIsAddFeeModalOpen(false)} title="Add Fee Assignment">
         <div className="space-y-4 p-2">
            <p className="text-xs text-blue-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 font-bold">
               Assign a fee structure to <b>{student.fullName}</b>. You can optionally set a custom amount.
            </p>
            <Select 
              label="Fee Structure" 
              options={feeStructures.map((f: any) => ({ value: f.id, label: `${f.name} (₹${f.totalAmount?.toLocaleString()})` }))}
              value={newFeeData.feeStructureId}
              onChange={(e) => setNewFeeData({ ...newFeeData, feeStructureId: e.target.value })}
            />
            <Input 
              label="Custom Amount (optional — leave blank to use default)" 
              type="number"
              value={newFeeData.customAmount} 
              onChange={(e) => setNewFeeData({ ...newFeeData, customAmount: e.target.value })} 
              placeholder="e.g. 5000"
            />
            <div className="flex justify-end gap-2 pt-4">
               <Button variant="secondary" onClick={() => setIsAddFeeModalOpen(false)}>Cancel</Button>
               <Button onClick={handleAddFee} disabled={!newFeeData.feeStructureId}>Add Fee</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isEditFeeModalOpen} onClose={() => setIsEditFeeModalOpen(false)} title="Edit Fee Amount">
         <div className="space-y-4 p-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fee: {editingFee?.name}</p>
            <Input 
              label="Amount (₹)" 
              type="number"
              value={editingFee?.customAmount} 
              onChange={(e) => setEditingFee({...editingFee, customAmount: parseFloat(e.target.value)})} 
            />
            <div className="flex justify-end gap-2 pt-4">
               <Button variant="secondary" onClick={() => setIsEditFeeModalOpen(false)}>Cancel</Button>
               <Button onClick={handleUpdateFee}>Save Changes</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
