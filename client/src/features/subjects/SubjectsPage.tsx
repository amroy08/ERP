import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Search, Filter, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { SubjectDoc, ApiResponse, ClassDoc, Teacher } from '../../types';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectDoc | null>(null);
  const [newSubject, setNewSubject] = useState({ name: '', code: '', isOptional: false, classId: '', teacherId: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes').then(res => setClasses(res.data.data));
    axiosInstance.get<ApiResponse<Teacher[]>>('/teachers').then(res => setTeachers(res.data.data));
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axiosInstance.get<ApiResponse<SubjectDoc[]>>('/subjects');
      setSubjects(res.data.data);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedSubject) {
        await axiosInstance.put(`/subjects/${selectedSubject.id}`, newSubject);
        toast.success('Subject updated');
      } else {
        await axiosInstance.post('/subjects', newSubject);
        toast.success('Subject created successfully');
      }
      setIsModalOpen(false);
      setNewSubject({ name: '', code: '', isOptional: false, classId: '', teacherId: '' });
      setIsEditing(false);
      setSelectedSubject(null);
      fetchSubjects();
    } catch (err) {
      toast.error('Failed to save subject');
    }
  };

  const handleEditSubject = (subject: SubjectDoc) => {
    setSelectedSubject(subject);
    setNewSubject({ 
      name: subject.name, 
      code: subject.code, 
      isOptional: subject.isOptional,
      classId: subject.class?.id || '',
      teacherId: subject.teacher?.id || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await axiosInstance.delete(`/subjects/${id}`);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch {
      toast.error('Failed to delete subject');
    }
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-xl w-full" />
        <div className="h-64 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <Breadcrumb items={[{ label: 'Academics' }, { label: 'Subjects' }]} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                <BookOpen className="w-7 h-7" />
             </div>
             Curriculum Management
          </h1>
          <p className="text-slate-500 text-sm font-medium">Design and organize academic subjects for your institution.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-5 h-5" />}
          className="shadow-xl shadow-indigo-500/20 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
        >
          Add New Subject
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 group">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by subject name or unique code..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3.5 text-sm border border-slate-200 rounded-[1.25rem] bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none w-full font-medium shadow-sm"
            />
         </div>
         <div className="flex gap-2">
            <Button variant="secondary" className="h-[52px] rounded-[1.25rem] px-6" icon={<Filter className="w-4 h-4" />}>Advanced Filters</Button>
         </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Subject Identity</th>
                <th className="px-6 py-5">Code</th>
                <th className="px-6 py-5">Academic Level</th>
                <th className="px-6 py-5">Assigned Educator</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-8 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSubjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-slate-50/30 transition-all duration-300 group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-500/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        {subject.name.charAt(0)}
                      </div>
                      <div>
                         <span className="block font-black text-slate-800 tracking-tight">{subject.name}</span>
                         <span className={clsx(
                           "text-[9px] font-black uppercase tracking-widest",
                           subject.isActive ? "text-emerald-500" : "text-slate-400"
                         )}>
                            {subject.isActive ? 'Active Syllabus' : 'Draft Mode'}
                         </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono font-black text-slate-500 border border-slate-200/50 shadow-sm">{subject.code}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                       <span className="text-sm font-bold text-slate-700">{subject.class?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 border border-slate-200/50 overflow-hidden">
                          {subject.teacher?.user?.profilePhoto ? (
                            <img src={subject.teacher.user.profilePhoto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            subject.teacher?.user?.name?.charAt(0) || '?'
                          )}
                       </div>
                       <div>
                          <span className="block text-xs font-black text-slate-800">{subject.teacher?.user?.name || 'Not Staffed'}</span>
                          <span className="text-[10px] text-slate-400 font-bold">Primary Faculty</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {subject.isOptional ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Optional Elective</span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Core Curriculum</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        onClick={() => handleEditSubject(subject)}
                        className="p-2.5 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-transparent hover:border-blue-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="p-2.5 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm border border-transparent hover:border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSubjects.length === 0 && (
            <div className="py-24 text-center space-y-6">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                  <BookOpen className="w-10 h-10 text-slate-200" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                     {searchQuery ? "No Matches Found" : "Empty Curriculum"}
                  </h3>
                  <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm">
                     {searchQuery ? `We couldn't find any results for "${searchQuery}". Try a different term.` : "Start building your school's curriculum by adding subjects."}
                  </p>
               </div>
               {!searchQuery && (
                 <Button 
                   onClick={() => setIsModalOpen(true)}
                   className="h-12 px-8 rounded-xl shadow-lg"
                   icon={<Plus className="w-4 h-4" />}
                 >
                    Initialize Subject
                 </Button>
               )}
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setIsEditing(false); setSelectedSubject(null); setNewSubject({ name: '', code: '', isOptional: false, classId: '', teacherId: '' }); }} 
        title={isEditing ? "Modify Subject Definition" : "Register New Subject"}
        size="md"
      >
        <form onSubmit={handleCreateSubject} className="space-y-6 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input 
              label="Subject Title" 
              placeholder="e.g. Mathematics" 
              value={newSubject.name} 
              onChange={e => setNewSubject({...newSubject, name: e.target.value})}
              required 
            />
            <Input 
              label="Course Identifier (Code)" 
              placeholder="e.g. MATH-101" 
              value={newSubject.code} 
              onChange={e => setNewSubject({...newSubject, code: e.target.value})}
              required 
            />
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level Assignment</label>
               <select 
                 value={newSubject.classId}
                 onChange={e => setNewSubject({...newSubject, classId: e.target.value})}
                 className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold transition-all"
                 required
               >
                  <option value="">Select Class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Faculty</label>
               <select 
                 value={newSubject.teacherId}
                 onChange={e => setNewSubject({...newSubject, teacherId: e.target.value})}
                 className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold transition-all"
               >
                  <option value="">Select Teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
               </select>
            </div>
          </div>
          
          <div 
            className={clsx(
              "flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer group/opt",
              newSubject.isOptional ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
            )}
            onClick={() => setNewSubject({...newSubject, isOptional: !newSubject.isOptional})}
          >
             <div className={clsx(
               "w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner",
               newSubject.isOptional ? 'bg-indigo-600' : 'bg-slate-300'
             )}>
                <div className={clsx(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md",
                  newSubject.isOptional ? 'left-7' : 'left-1'
                )} />
             </div>
             <div>
                <p className={clsx(
                  "text-sm font-black transition-colors duration-300",
                  newSubject.isOptional ? 'text-indigo-900' : 'text-slate-700'
                )}>Elective Subject</p>
                <p className="text-xs text-slate-500 font-medium leading-none mt-1">Students can choose this as an additional course.</p>
             </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
            <Button variant="secondary" className="px-8 h-12 rounded-xl" onClick={() => { setIsModalOpen(false); setIsEditing(false); setSelectedSubject(null); setNewSubject({ name: '', code: '', isOptional: false, classId: '', teacherId: '' }); }}>Discard</Button>
            <Button type="submit" className="px-10 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
               {isEditing ? "Update Subject" : "Finalize Registration"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
