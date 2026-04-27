import toast from "react-hot-toast";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, GraduationCap, MoreVertical, Edit2, Trash2, ChevronRight, BookOpen, Calendar } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import axiosInstance from '../../api/axiosInstance';
import { ClassDoc, SectionDoc, ApiResponse } from '../../types';

export const ClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassDoc | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [numericValue, setNumericValue] = useState<number>(1);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes');
      setClasses(res.data.data);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingClass && selectedClass) {
        await axiosInstance.put(`/classes/${selectedClass.id}`, { name: newClassName, numericValue });
        toast.success('Class updated');
      } else {
        await axiosInstance.post('/classes', { name: newClassName, numericValue });
        toast.success('Class created successfully');
      }
      setIsModalOpen(false);
      setNewClassName('');
      setIsEditingClass(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (err) {
      toast.error('Failed to save class');
    }
  };

  const handleEditClass = (cls: ClassDoc) => {
    setSelectedClass(cls);
    setNewClassName(cls.name);
    setNumericValue(cls.numericValue);
    setIsEditingClass(true);
    setIsModalOpen(true);
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Are you sure? This will remove all associated sections.')) return;
    try {
      await axiosInstance.delete(`/classes/${id}`);
      toast.success('Class deleted');
      fetchClasses();
    } catch {
      toast.error('Failed to delete class');
    }
  };

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionDoc | null>(null);
  const [targetClassId, setTargetClassId] = useState('');
  const [sectionForm, setSectionForm] = useState({ name: '', maxStrength: 40 });

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingSection && selectedSection) {
        await axiosInstance.put(`/sections/${selectedSection.id}`, sectionForm);
        toast.success('Section updated');
      } else {
        await axiosInstance.post('/sections', { ...sectionForm, classId: targetClassId });
        toast.success('Section added');
      }
      setIsSectionModalOpen(false);
      setSectionForm({ name: '', maxStrength: 40 });
      setIsEditingSection(false);
      setSelectedSection(null);
      fetchClasses();
    } catch {
      toast.error('Failed to save section');
    }
  };

  const handleEditSection = (section: SectionDoc) => {
    setSelectedSection(section);
    setSectionForm({ name: section.name, maxStrength: section.maxStrength });
    setIsEditingSection(true);
    setIsSectionModalOpen(true);
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await axiosInstance.delete(`/sections/${id}`);
      toast.success('Section removed');
      fetchClasses();
    } catch {
      toast.error('Failed to remove section');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-100 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-slate-50 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const closeClassModal = () => {
    setIsModalOpen(false);
    setIsEditingClass(false);
    setSelectedClass(null);
    setNewClassName('');
    setNumericValue(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Breadcrumb items={[{ label: 'Academics' }, { label: 'Classes & Sections' }]} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                <GraduationCap className="w-7 h-7" />
             </div>
             Classes & Divisions
          </h1>
          <p className="text-slate-500 text-sm font-medium">Define your institution's academic structure and grade levels.</p>
        </div>
        <Button 
          onClick={() => { setIsEditingClass(false); setIsModalOpen(true); }}
          icon={<Plus className="w-5 h-5" />}
          className="shadow-xl shadow-blue-500/20 h-12 rounded-xl"
        >
          Add New Class
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group border-b-4 border-b-blue-600">
            <div className="p-6 bg-slate-50/50 flex justify-between items-start border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                   {cls.numericValue > 0 ? cls.numericValue : cls.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">{cls.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade Level</span>
                     <div className="w-1 h-1 bg-slate-300 rounded-full" />
                     <span className="text-[10px] font-bold text-blue-600">{cls.numericValue}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                 <button 
                   onClick={() => handleEditClass(cls)}
                   className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-transparent hover:border-slate-100"
                 >
                   <Edit2 className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => handleDeleteClass(cls.id)}
                   className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm border border-transparent hover:border-slate-100"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Users className="w-4 h-4 text-slate-400" />
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Sections</span>
                  </div>
                  <button 
                    onClick={() => { setTargetClassId(cls.id); setIsSectionModalOpen(true); }}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all group/add"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  {cls.sections?.map((section) => (
                    <div 
                      key={section.id}
                      onClick={() => navigate(`/academics/sections/${section.id}`)}
                      className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1 hover:border-blue-300 hover:bg-white hover:shadow-md transition-all cursor-pointer group/sec relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                         <span className="text-base font-black text-slate-800">{section.name}</span>
                         <div className="flex gap-1 opacity-0 group-hover/sec:opacity-100 transition-all">
                            <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }} />
                         </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Users className="w-3 h-3 text-slate-400" />
                         <span className="text-[10px] font-bold text-slate-500">{section.maxStrength} Max</span>
                      </div>
                      <div className="absolute top-0 right-0 p-1 opacity-5">
                         <div className="text-xs font-black rotate-12">SEC</div>
                      </div>
                    </div>
                  ))}
                  {(!cls.sections || cls.sections.length === 0) && (
                    <div className="col-span-2 py-4 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                       No Sections Assigned
                    </div>
                  )}
               </div>

               <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight leading-none">Curriculum</p>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{cls.subjects?.length || 0} Subjects</p>
                     </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
          </div>
        ))}

        {classes.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-6 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
               <GraduationCap className="w-12 h-12 text-slate-200" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Empty Academy</h3>
              <p className="text-slate-500 max-w-sm mx-auto font-medium">Your institution's academic structure begins here. Create your first class to get started.</p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)} 
              icon={<Plus className="w-5 h-5" />}
              className="h-14 px-8 rounded-2xl shadow-2xl"
            >
               Build Academic Structure
            </Button>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeClassModal} 
        title={isEditingClass ? "Modify Class Record" : "Register New Grade Level"}
        size="md"
      >
        <form onSubmit={handleCreateClass} className="space-y-6 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input 
              label="Visual Name" 
              placeholder="e.g. Class 10" 
              value={newClassName} 
              onChange={e => setNewClassName(e.target.value)}
              required 
            />
            <Input 
              label="Sort Rank (Numeric)" 
              type="number" 
              placeholder="10" 
              value={numericValue} 
              onChange={e => setNumericValue(parseInt(e.target.value))}
              required 
            />
          </div>
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-[1.5rem] flex gap-4">
            <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
               <span className="font-black uppercase tracking-widest block mb-1">Architecture Tip</span>
               Consistent naming (e.g., "Class X") helps with reporting. The sort rank determines how classes appear in dropdowns across the system.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="secondary" className="px-8 h-12 rounded-xl" onClick={closeClassModal}>Dismiss</Button>
            <Button type="submit" className="px-10 h-12 rounded-xl shadow-lg shadow-blue-500/20">
               {isEditingClass ? "Update Record" : "Establish Class"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
         isOpen={isSectionModalOpen}
         onClose={() => { setIsSectionModalOpen(false); setIsEditingSection(false); setSelectedSection(null); setSectionForm({ name: '', maxStrength: 40 }); }}
         title={isEditingSection ? "Modify Division" : "Assign New Section"}
         size="sm"
      >
         <form onSubmit={handleAddSection} className="space-y-5 py-2">
            <Input 
              label="Division Identifier" 
              placeholder="e.g. Section A"
              value={sectionForm.name}
              onChange={e => setSectionForm({...sectionForm, name: e.target.value})}
              required
            />
            <Input 
              label="Max Enrollment Limit" 
              type="number"
              value={sectionForm.maxStrength}
              onChange={e => setSectionForm({...sectionForm, maxStrength: parseInt(e.target.value)})}
              required
            />
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
               <Button variant="secondary" className="px-6 h-11 rounded-xl" onClick={() => { setIsSectionModalOpen(false); setIsEditingSection(false); setSelectedSection(null); setSectionForm({ name: '', maxStrength: 40 }); }}>Cancel</Button>
               <Button type="submit" className="px-8 h-11 rounded-xl shadow-lg shadow-blue-500/10">
                  {isEditingSection ? "Update Division" : "Confirm Assignment"}
               </Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default ClassesPage;
