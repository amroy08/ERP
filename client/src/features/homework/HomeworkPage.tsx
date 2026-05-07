import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Filter, Calendar, 
  FileText, CheckCircle2, Clock, MoreVertical,
  ExternalLink, Trash2, Edit, Save, AlertCircle
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import axiosInstance from '../../api/axiosInstance';
import { ApiResponse, ClassDoc, SectionDoc, SubjectDoc, Homework } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const HomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student' || user?.role === 'parent';
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [sections, setSections] = useState<SectionDoc[]>([]);
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    dueDate: '',
    fileUrl: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isStudent) {
        const hwRes = await axiosInstance.get<ApiResponse<Homework[]>>('/homework');
        setHomeworks(hwRes.data.data);
      } else {
        const [hwRes, classRes, subRes] = await Promise.all([
          axiosInstance.get<ApiResponse<Homework[]>>('/homework'),
          axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes'),
          axiosInstance.get<ApiResponse<SubjectDoc[]>>('/subjects')
        ]);
        setHomeworks(hwRes.data.data);
        setClasses(classRes.data.data);
        setSubjects(subRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to load homework data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (form.classId) {
      axiosInstance.get<ApiResponse<SectionDoc[]>>(`/sections?classId=${form.classId}`).then(res => setSections(res.data.data));
    } else {
      setSections([]);
    }
  }, [form.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/homework', form);
      toast.success('Homework assigned successfully');
      setIsModalOpen(false);
      setForm({ title: '', description: '', classId: '', sectionId: '', subjectId: '', dueDate: '', fileUrl: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign homework');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    try {
      await axiosInstance.delete(`/homework/${id}`);
      toast.success('Assignment deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete assignment');
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Academics' }, { label: 'Homework' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Homework Assignments</h1>
          <p className="text-slate-500 text-sm">Create and manage daily student tasks and lesson reinforcements.</p>
        </div>
        {!isStudent && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>Assign Homework</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)
        ) : homeworks.length > 0 ? (
          homeworks.map((hw) => (
            <Card key={hw.id} className="p-0 overflow-hidden border-slate-200 hover:shadow-xl transition-all flex flex-col group min-h-[280px]">
               <div className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="flex flex-col gap-1">
                        <Badge variant="blue" className="w-fit text-[10px] font-black uppercase tracking-widest">{hw.subject?.name}</Badge>
                        <p className="text-xs font-bold text-slate-400">Section {hw.section?.name}</p>
                     </div>
                     {!isStudent && (
                     <button onClick={() => handleDelete(hw.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                     </button>
                     )}
                  </div>

                  <div className="space-y-1">
                     <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{hw.title}</h3>
                     <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{hw.description}</p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 text-xs font-bold text-slate-500">
                     <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>Due: {format(new Date(hw.dueDate), 'dd MMM')}</span>
                     </div>
                     {hw.fileUrl && (
                        <a 
                          href={hw.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                           <FileText className="w-3.5 h-3.5" />
                           <span>View PDF</span>
                        </a>
                     )}
                  </div>
               </div>
               <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                        {hw.assignedBy?.user?.name.charAt(0)}
                     </div>
                     <p className="text-[10px] font-bold text-slate-400">By {hw.assignedBy?.user?.name}</p>
                  </div>
                  <Badge variant={new Date(hw.dueDate) < new Date() ? 'red' : 'emerald'} className="text-[9px]">
                     {new Date(hw.dueDate) < new Date() ? 'EXPIRED' : 'ACTIVE'}
                  </Badge>
               </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState 
              title={isStudent ? 'No Homework Found' : 'No Homework Found'}
              description={isStudent ? 'Homework assigned by your class teacher will appear here.' : 'Assignments created by Class Teachers will appear here. Admins can monitor all class progress.'}
              icon={<BookOpen className="w-12 h-12" />}
              action={!isStudent ? {
                label: "Create First Task",
                onClick: () => setIsModalOpen(true),
                icon: <Plus className="w-4 h-4" />
              } : undefined}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign New Homework"
        size="lg"
      >
         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Task Title</label>
                  <Input 
                    placeholder="e.g. Chapter 4 Exercise Solutions" 
                    required 
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                  />
               </div>
               
               <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Class</label>
                  <select 
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                    value={form.classId}
                    onChange={e => setForm({...form, classId: e.target.value, sectionId: ''})}
                  >
                     <option value="">Select Grade...</option>
                     {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>

               <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Section</label>
                  <select 
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold disabled:opacity-50"
                    required
                    disabled={!form.classId}
                    value={form.sectionId}
                    onChange={e => setForm({...form, sectionId: e.target.value})}
                  >
                     <option value="">Select Section...</option>
                     {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                  </select>
               </div>

               <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Subject</label>
                  <select 
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                    value={form.subjectId}
                    onChange={e => setForm({...form, subjectId: e.target.value})}
                  >
                     <option value="">Select Subject...</option>
                     {subjects
                       .filter(s => !form.classId || s.classId === form.classId)
                       .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>

               <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Due Date</label>
                  <Input 
                    type="date" 
                    required 
                    value={form.dueDate}
                    onChange={e => setForm({...form, dueDate: e.target.value})}
                  />
               </div>
            </div>

            <div>
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Instructions / Details</label>
               <textarea 
                  rows={4}
                  className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  placeholder="Provide detailed instructions for the assignment..."
                  required
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
               />
            </div>

            <div>
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Resource URL (Optional PDF/Link)</label>
               <Input 
                 placeholder="https://storage.link/assignment.pdf" 
                 value={form.fileUrl}
                 onChange={e => setForm({...form, fileUrl: e.target.value})}
               />
               <p className="text-[10px] text-slate-400 mt-2 px-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Note: Only the assigned Class Teacher for the selected section can assign homework.
               </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
               <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Discard</Button>
               <Button type="submit" isLoading={isSubmitting} icon={<Save className="w-4 h-4" />}>Assign to Section</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};
