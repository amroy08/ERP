import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, BookOpen, 
  MapPin, Settings, Download, MoreVertical, 
  ChevronLeft, ChevronRight, Plus, Filter,
  FileText, LayoutGrid, Save, AlertCircle,
  Clock3, GraduationCap, ArrowLeft, Trash2,
  Info
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import axiosInstance from '../../api/axiosInstance';
import { ApiResponse, ClassDoc, SectionDoc, SubjectDoc, Teacher } from '../../types';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useAuth } from '../../hooks/useAuth';

interface TimetableEntry {
  id?: string;
  day: string;
  subjectId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  room?: string;
  subject?: { name: string };
  teacher?: { user: { name: string, fullName: string } };
}

interface Timetable {
  id: string;
  classId: string;
  sectionId: string;
  fileUrl?: string;
  notes?: string;
  entries: (TimetableEntry & { subject: { name: string }, teacher: { user: { name: string } } })[];
}

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = ['admin', 'super_admin', 'principal'].includes(user?.role || '');
  const isStudent = user?.role === 'student' || user?.role === 'parent';
  
  // For students, auto-set class/section from their profile
  const studentClassId = (user as any)?.student?.classId || '';
  const studentSectionId = (user as any)?.student?.sectionId || '';
  
  // Navigation State
  const [selectedClassId, setSelectedClassId] = useState(isStudent ? studentClassId : '');
  const [selectedSectionId, setSelectedSectionId] = useState(isStudent ? studentSectionId : '');
  const [mode, setMode] = useState<'view' | 'manage'>('view');
  const [manageMode, setManageMode] = useState<'grid' | 'pdf'>('grid');

  // Data State
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [sections, setSections] = useState<SectionDoc[]>([]);
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  
  // Grid Builder State
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [gridEntries, setGridEntries] = useState<TimetableEntry[]>([]);
  const [pdfForm, setPdfForm] = useState({ fileUrl: '', notes: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (!isStudent) {
      axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes').then(res => setClasses(res.data.data));
    }
    if (isAdmin) {
      axiosInstance.get<ApiResponse<Teacher[]>>('/teachers').then(res => setTeachers(res.data.data));
    }
  }, [isAdmin, isStudent]);

  useEffect(() => {
    if (selectedClassId) {
      axiosInstance.get<ApiResponse<SectionDoc[]>>(`/sections?classId=${selectedClassId}`).then(res => setSections(res.data.data));
      axiosInstance.get<ApiResponse<SubjectDoc[]>>(`/subjects?classId=${selectedClassId}`).then(res => setSubjects(res.data.data));
    }
  }, [selectedClassId]);

  const fetchTimetable = async () => {
    if (!selectedSectionId && !isAdmin && !isStudent) return;
    setIsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<Timetable[]>>(`/timetables?sectionId=${selectedSectionId}`);
      if (res.data.data.length > 0) {
        const tt = res.data.data[0];
        setTimetable(tt);
        setGridEntries(tt.entries || []);
        setPdfForm({ fileUrl: tt.fileUrl || '', notes: tt.notes || '' });
        if (tt.fileUrl) setManageMode('pdf');
        else setManageMode('grid');
      } else {
        setTimetable(null);
        setGridEntries([]);
        setPdfForm({ fileUrl: '', notes: '' });
      }
    } catch {
      toast.error('Failed to load timetable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSectionId) fetchTimetable();
  }, [selectedSectionId]);

  const handleAddEntry = () => {
    setGridEntries([...gridEntries, {
      day: selectedDay,
      subjectId: '',
      teacherId: '',
      startTime: '08:00',
      endTime: '09:00',
      room: ''
    }]);
  };

  const handleRemoveEntry = (index: number) => {
    const list = [...gridEntries];
    list.splice(index, 1);
    setGridEntries(list);
  };

  const updateEntry = (index: number, field: keyof TimetableEntry, value: string) => {
    const list = [...gridEntries];
    list[index] = { ...list[index], [field]: value };
    
    // Auto-teacher lookup if subjectId changes
    if (field === 'subjectId') {
      const subject = subjects.find(s => s.id === value);
      if (subject?.teacher?.id) {
        list[index].teacherId = subject.teacher?.id;
      }
    }
    
    setGridEntries(list);
  };

  const handleSave = async () => {
    if (!selectedSectionId) return toast.error('Please select a section');
    setIsSubmitting(true);
    try {
      const payload = {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        fileUrl: manageMode === 'pdf' ? pdfForm.fileUrl : null,
        notes: pdfForm.notes,
        entries: manageMode === 'grid' ? gridEntries : []
      };
      await axiosInstance.post('/timetables', payload);
      toast.success('Timetable saved successfully');
      setMode('view');
      fetchTimetable();
    } catch {
      toast.error('Failed to save timetable');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter entries for current day when viewing
  const currentDayEntries = gridEntries
    .filter(e => e.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Breadcrumb items={isStudent ? [{ label: 'My Academics' }, { label: 'Timetable' }] : [{ label: 'Academics' }, { label: 'Timetable' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{isStudent ? 'My Class Schedule' : 'Academic Schedule'}</h1>
          <p className="text-slate-500 text-sm font-medium italic">{isStudent ? 'Your weekly lesson schedule based on your class and section.' : 'Design and broadcast weekly lessons for students and faculty.'}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {mode === 'view' ? (
              <Button icon={<Settings className="w-4 h-4" />} onClick={() => setMode('manage')}>Manage Records</Button>
            ) : (
              <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setMode('view')}>Back to View</Button>
            )}
          </div>
        )}
      </div>

      {!isStudent && (
      <Card className="p-4 border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex flex-wrap gap-4 items-end">
           <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classroom</label>
              <select 
                value={selectedClassId} 
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-100 rounded-xl bg-slate-50 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
              >
                 <option value="">Select Level</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
           <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
              <select 
                value={selectedSectionId} 
                onChange={e => setSelectedSectionId(e.target.value)}
                disabled={!selectedClassId}
                className="w-full px-4 py-3 text-sm border border-slate-100 rounded-xl bg-slate-50 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700 disabled:opacity-50"
              >
                 <option value="">Select Wing</option>
                 {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
           </div>
           <div className="flex gap-2">
            <Button variant="primary" icon={<Filter className="w-4 h-4" />} onClick={fetchTimetable} disabled={!selectedSectionId} isLoading={isLoading}>Load Schedule</Button>
           </div>
        </div>
      </Card>
      )}

      {selectedSectionId ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Sidebar - Days & Mode */}
           <div className="lg:col-span-3 space-y-6">
              <div className="p-1 bg-slate-100 rounded-2xl flex gap-1">
                 <button 
                   onClick={() => setSelectedDay('Monday')}
                   className={clsx("flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", mode === 'view' ? "bg-white shadow-sm text-slate-800" : "text-slate-400")}
                 >Daily Grid</button>
                 {isAdmin && mode === 'manage' && (
                   <div className="flex-1 flex gap-1">
                      <button 
                        onClick={() => setManageMode('grid')}
                        className={clsx("flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all", manageMode === 'grid' ? "bg-white shadow-sm text-blue-600" : "text-slate-400")}
                      ><LayoutGrid className="w-3.5 h-3.5 mx-auto" /></button>
                      <button 
                        onClick={() => setManageMode('pdf')}
                        className={clsx("flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all", manageMode === 'pdf' ? "bg-white shadow-sm text-blue-600" : "text-slate-400")}
                      ><FileText className="w-3.5 h-3.5 mx-auto" /></button>
                   </div>
                 )}
              </div>

              <div className="space-y-2">
                 {days.map(day => (
                   <button
                     key={day}
                     onClick={() => setSelectedDay(day)}
                     className={clsx(
                       "w-full p-4 rounded-2xl text-left transition-all flex justify-between items-center border",
                       selectedDay === day 
                         ? 'bg-blue-600 border-transparent text-white shadow-xl shadow-blue-500/20' 
                         : 'bg-white border-slate-50 text-slate-600 hover:border-blue-200'
                     )}
                   >
                     <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedDay === day ? 'text-blue-200' : 'text-slate-400'}`}>Session Day</span>
                        <span className="text-sm font-black">{day}</span>
                     </div>
                     <ChevronRight className={clsx("w-4 h-4", selectedDay === day ? "opacity-100" : "opacity-30")} />
                   </button>
                 ))}
              </div>

              {isAdmin && mode === 'manage' && (
                <Card className="p-5 bg-blue-600 text-white border-none shadow-xl shadow-blue-200">
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Status</p>
                        <p className="text-sm font-bold">Unsaved Changes</p>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full bg-white text-blue-600 h-10 font-black uppercase tracking-widest text-[10px]"
                        onClick={handleSave}
                        isLoading={isSubmitting}
                        icon={<Save className="w-4 h-4" />}
                      >
                        Publish All
                      </Button>
                   </div>
                </Card>
              )}
           </div>

           {/* Content Area */}
           <div className="lg:col-span-9">
              {mode === 'view' ? (
                 <div className="space-y-6">
                    {timetable?.fileUrl ? (
                       <Card className="p-0 overflow-hidden border-slate-100 shadow-2xl shadow-slate-100/50 aspect-[3/4] md:aspect-video relative group">
                          <iframe src={timetable.fileUrl} className="w-full h-full border-0" />
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button size="sm" variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => window.open(timetable.fileUrl, '_blank')}>Export PDF</Button>
                          </div>
                       </Card>
                    ) : (
                       <div className="space-y-4">
                          <div className="flex items-center justify-between px-3">
                             <div className="flex items-center gap-2">
                                <Clock3 className="w-5 h-5 text-blue-500" />
                                <h3 className="font-black text-slate-800 uppercase tracking-tight">{selectedDay} Period Schedule</h3>
                             </div>
                             <Badge variant="blue" className="font-black uppercase tracking-widest text-[9px]">Class {sections.find(s=>s.id === selectedSectionId)?.name}</Badge>
                          </div>

                          <div className="grid gap-3">
                             {currentDayEntries.length === 0 ? (
                                <div className="p-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                                   <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                   <p className="text-slate-400 font-bold">No academic sessions scheduled for {selectedDay}.</p>
                                </div>
                             ) : currentDayEntries.map((entry, idx) => (
                                <div key={idx} className="group relative flex items-stretch gap-4 p-5 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                                   <div className="flex flex-col justify-center items-center w-24 border-r border-slate-50 px-2 shrink-0">
                                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Period {idx + 1}</p>
                                      <p className="text-sm font-black text-slate-700">{entry.startTime}</p>
                                      <p className="text-[10px] font-bold text-slate-400">{entry.endTime}</p>
                                   </div>
                                   <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                         <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] uppercase">{entry.subject?.name || subjects.find(s=>s.id === entry.subjectId)?.name}</Badge>
                                         {entry.room && <Badge className="bg-slate-50 text-slate-500 border-none font-bold text-[9px] uppercase"><MapPin className="w-2.5 h-2.5 mr-1" /> {entry.room}</Badge>}
                                      </div>
                                      <h4 className="text-lg font-black text-slate-800 leading-tight">{entry.subject?.name || subjects.find(s=>s.id === entry.subjectId)?.name}</h4>
                                      <div className="flex items-center gap-1.5 pt-1">
                                         <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 uppercase">
                                            {(entry.teacher as any)?.user?.name?.charAt(0) || teachers.find(t=>t.id === entry.teacherId)?.user?.fullName?.charAt(0)}
                                         </div>
                                         <p className="text-[10px] font-bold text-slate-500">{(entry.teacher as any)?.user?.name || teachers.find(t=>t.id === entry.teacherId)?.user?.fullName}</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                         <Info className="w-4 h-4" />
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              ) : (
                 <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    {manageMode === 'pdf' ? (
                       <Card className="p-8 border-slate-200 space-y-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <FileText className="w-6 h-6" />
                             </div>
                             <div>
                                <h3 className="text-xl font-black text-slate-800">PDF Schedule Upload</h3>
                                <p className="text-sm text-slate-500 font-medium">Link a pre-made schedule document for this section.</p>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Document URL (S3, Drive, or CDN)</label>
                                <Input 
                                  placeholder="https://cdn.school.com/schedules/1A.pdf" 
                                  value={pdfForm.fileUrl}
                                  onChange={e => setPdfForm({...pdfForm, fileUrl: e.target.value})}
                                  className="h-12 border-slate-100 font-bold rounded-xl"
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Implementation Notes</label>
                                <textarea 
                                  rows={4}
                                  placeholder="e.g. This schedule accounts for the new laboratory sessions..."
                                  value={pdfForm.notes}
                                  onChange={e => setPdfForm({...pdfForm, notes: e.target.value})}
                                  className="w-full p-4 text-sm font-medium bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                />
                             </div>
                          </div>
                       </Card>
                    ) : (
                       <div className="space-y-6">
                          <div className="flex items-center justify-between">
                             <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5 text-blue-500" /> Edit {selectedDay} Builder
                             </h3>
                             <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleAddEntry}>Add Period</Button>
                          </div>

                          <div className="grid gap-4">
                             {gridEntries.filter(e => e.day === selectedDay).map((entry, masterIdx) => {
                                // Find actual index in master list
                                const idx = gridEntries.indexOf(entry);
                                return (
                                  <Card key={masterIdx} className="p-5 border-slate-100 hover:border-blue-100 transition-all flex flex-wrap lg:flex-nowrap gap-4 items-end relative group">
                                     <div className="w-full lg:w-48 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Time Slot</label>
                                        <div className="flex items-center gap-2">
                                           <Input type="time" value={entry.startTime} onChange={e => updateEntry(idx, 'startTime', e.target.value)} className="h-10 border-slate-50 font-black text-xs p-1" />
                                           <span className="text-slate-300">-</span>
                                           <Input type="time" value={entry.endTime} onChange={e => updateEntry(idx, 'endTime', e.target.value)} className="h-10 border-slate-50 font-black text-xs p-1" />
                                        </div>
                                     </div>
                                     <div className="flex-1 min-w-[200px] space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Subject</label>
                                        <select 
                                          value={entry.subjectId} 
                                          onChange={e => updateEntry(idx, 'subjectId', e.target.value)}
                                          className="w-full h-10 px-3 py-1 text-xs font-black border border-slate-50 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        >
                                           <option value="">Select</option>
                                           {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                        </select>
                                     </div>
                                     <div className="flex-1 min-w-[200px] space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Faculty</label>
                                        <select 
                                          value={entry.teacherId} 
                                          onChange={e => updateEntry(idx, 'teacherId', e.target.value)}
                                          className="w-full h-10 px-3 py-1 text-xs font-black border border-slate-50 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        >
                                           <option value="">Select</option>
                                           {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.fullName}</option>)}
                                        </select>
                                     </div>
                                     <div className="w-24 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Room</label>
                                        <Input placeholder="e.g. 101" value={entry.room} onChange={e => updateEntry(idx, 'room', e.target.value)} className="h-10 border-slate-50 font-black text-xs" />
                                     </div>
                                     <button 
                                        onClick={() => handleRemoveEntry(idx)}
                                        className="mb-1 p-2.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                     >
                                        <Trash2 className="w-4 h-4" />
                                     </button>
                                  </Card>
                                );
                             })}

                             {gridEntries.filter(e => e.day === selectedDay).length === 0 && (
                                <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl opacity-50">
                                   <p className="text-sm font-bold text-slate-400">No sessions added yet for {selectedDay}.</p>
                                </div>
                             )}
                          </div>
                       </div>
                    )}
                 </div>
              )}
           </div>
        </div>
      ) : (
        <div className="py-20 text-center space-y-6">
           <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mx-auto text-blue-500 rotate-12">
              <Calendar className="w-12 h-12" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">Ready to Schedule?</h2>
              <p className="text-slate-500 max-w-sm mx-auto font-medium">Select a student wing and classroom level above to start management or viewing schedules.</p>
           </div>
        </div>
      )}
    </div>
  );
};
