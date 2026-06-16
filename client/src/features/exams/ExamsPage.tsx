import React, { useState, useEffect, useCallback } from 'react';
import { 
  Award, Search, Plus, Filter, 
  Calendar, BookOpen, GraduationCap, 
  ClipboardCheck, TrendingUp, ChevronRight,
  UserCheck, History, AlertCircle, Save,
  ArrowLeft, CheckCircle2, XCircle, Info, Edit2, Trash2,
  BarChart2, ListChecks, RefreshCw, ChevronDown, X
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import axiosInstance from '../../api/axiosInstance';
import { ApiResponse, Teacher, Student, SubjectDoc, ClassDoc } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useAuth } from '../../hooks/useAuth';

interface Exam {
  id: string;
  name: string;
  type: string;
  class: { id: string; name: string };
  classId: string;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
}

interface GradebookSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  teacherName: string | null;
  totalStudents: number;
  marksEnteredCount: number;
  pendingMarksCount: number;
  maxMarks: number;
  averageMarks: number | null;
}

interface GradebookData {
  examId: string;
  examName: string;
  examType: string;
  classId: string;
  className: string;
  startDate: string;
  endDate: string;
  status: string;
  totalStudents: number;
  subjects: GradebookSubject[];
}

interface MarksRow {
  studentId: string;
  studentName: string;
  admissionNo: string | null;
  rollNumber: string | null;
  sectionName: string | null;
  resultId: string | null;
  marksObtained: number | null;
  maxMarks: number;
  percentage: number | null;
  grade: string | null;
  remark: string | null;
  updatedAt: string | null;
  status: 'entered' | 'pending';
}

export const ExamsPage: React.FC = () => {
  const { user, activeStudentId } = useAuth();
  const isStudent = user?.role === 'student' || user?.role === 'parent';
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation State: list | recording | results | gradebook | marks-view
  const [view, setView] = useState<'list' | 'recording' | 'results' | 'gradebook' | 'marks-view'>('list');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  
  // Marks Entry state (legacy recording mode)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examSubjects, setExamSubjects] = useState<SubjectDoc[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [marksData, setMarksData] = useState<Record<string, { marks: string, remark: string }>>({});
  const [maxMarks, setMaxMarks] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phase 3.2C: Gradebook state
  const [gradebookData, setGradebookData] = useState<GradebookData | null>(null);
  const [gradebookLoading, setGradebookLoading] = useState(false);

  // Phase 3.2C: Marks view state (enriched, inline edit)
  const [marksViewRows, setMarksViewRows] = useState<MarksRow[]>([]);
  const [marksViewLoading, setMarksViewLoading] = useState(false);
  const [marksViewSubject, setMarksViewSubject] = useState<GradebookSubject | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editMarks, setEditMarks] = useState('');
  const [editRemark, setEditRemark] = useState('');
  const [editMaxMarks, setEditMaxMarks] = useState(100);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [marksSearch, setMarksSearch] = useState('');
  const [marksFilter, setMarksFilter] = useState<'all' | 'entered' | 'pending'>('all');

  // Schedule Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examForm, setExamForm] = useState({
    name: '', type: 'internal', classId: '', startDate: '', endDate: '',
    mode: 'text' as 'text' | 'pdf',
    description: '', fileUrl: ''
  });
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    if (!isStudent) {
      axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes')
        .then(res => setClasses(res.data.data))
        .catch(() => console.error('Failed to load classes'));
    }
  }, [isStudent]);

  const fetchExams = async (classId?: string) => {
    setIsLoading(true);
    try {
      const url = classId ? `/exams?classId=${classId}` : '/exams';
      const res = await axiosInstance.get<ApiResponse<Exam[]>>(url);
      setExams(res.data.data);
    } catch {
      toast.error('Failed to load examinations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeStudentId && isStudent) {
      axiosInstance.get<ApiResponse<any>>(`/students/${activeStudentId}`).then(res => {
        setStudentInfo(res.data.data);
        fetchExams(res.data.data?.classId || res.data.data?.class?.id);
      }).catch(err => {
        console.error('Failed to load student details for exams:', err);
        fetchExams();
      });
    } else if (user?.role === 'student' && (user as any)?.student) {
      fetchExams((user as any).student.classId);
    } else {
      fetchExams();
    }
  }, [activeStudentId, isStudent, user]);

  // ── Legacy recording mode (bulk marks entry) ──────────────────────────────
  const handleEnterRecording = async (exam: Exam) => {
    setSelectedExam(exam);
    setIsLoading(true);
    try {
      const subRes = await axiosInstance.get<ApiResponse<SubjectDoc[]>>(`/exams/subjects/${exam.id}`);
      setExamSubjects(subRes.data.data);
      setSelectedSubjectId('');
      setView('recording');
    } catch {
      toast.error('Failed to load subjects for this exam');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResults = async (exam: Exam) => {
    const studentId = activeStudentId || (user as any)?.student?.id;
    if (!studentId) return toast.error('Student profile not found');
    
    setSelectedExam(exam);
    setIsLoading(true);
    try {
      // Phase 3.2C: Fixed URL — /exams/report/:studentId (was /exams/report-card/:studentId)
      const res = await axiosInstance.get<ApiResponse<any[]>>(`/exams/report/${studentId}`);
      const examResults = res.data.data.filter(r => r.examId === exam.id);
      setStudentResults(examResults);
      setView('results');
    } catch {
      toast.error('Failed to load exam results');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarksGrid = async () => {
    if (!selectedSubjectId || !selectedExam) return;
    setIsLoading(true);
    try {
      const stuRes = await axiosInstance.get<ApiResponse<Student[]>>(`/students?classId=${selectedExam.classId}&limit=100`);
      const studentList = stuRes.data.data;
      setStudents(studentList);

      const marksRes = await axiosInstance.get<ApiResponse<any[]>>(`/exams/marks/${selectedExam.id}/${selectedSubjectId}`);
      const existingMarks = marksRes.data.data;

      const initialMarks: Record<string, { marks: string, remark: string }> = {};
      studentList.forEach(s => {
        const existing = existingMarks.find(m => m.studentId === s.id);
        initialMarks[s.id] = {
          marks: existing ? existing.marksObtained.toString() : '',
          remark: existing ? existing.remark || '' : ''
        };
        if (existing && existing.maxMarks) setMaxMarks(existing.maxMarks);
      });
      setMarksData(initialMarks);
    } catch {
      toast.error('Failed to load student marks grid');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'recording' && selectedSubjectId) {
      fetchMarksGrid();
    }
  }, [selectedSubjectId]);

  // ── Phase 3.2C: Gradebook view ────────────────────────────────────────────
  const handleViewGradebook = async (exam: Exam) => {
    setSelectedExam(exam);
    setGradebookLoading(true);
    setView('gradebook');
    try {
      const res = await axiosInstance.get<ApiResponse<GradebookData>>(`/exams/${exam.id}/gradebook`);
      setGradebookData(res.data.data);
    } catch {
      toast.error('Failed to load gradebook');
    } finally {
      setGradebookLoading(false);
    }
  };

  // ── Phase 3.2C: Marks view (enriched, per subject) ───────────────────────
  const handleViewSubjectMarks = async (subject: GradebookSubject) => {
    if (!selectedExam) return;
    setMarksViewSubject(subject);
    setEditMaxMarks(subject.maxMarks || 100);
    setMarksViewLoading(true);
    setMarksSearch('');
    setMarksFilter('all');
    setView('marks-view');
    try {
      const res = await axiosInstance.get<ApiResponse<MarksRow[]>>(`/exams/${selectedExam.id}/subjects/${subject.subjectId}/marks`);
      setMarksViewRows(res.data.data);
    } catch {
      toast.error('Failed to load marks for this subject');
    } finally {
      setMarksViewLoading(false);
    }
  };

  const refreshMarksView = async () => {
    if (!selectedExam || !marksViewSubject) return;
    setMarksViewLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<MarksRow[]>>(`/exams/${selectedExam.id}/subjects/${marksViewSubject.subjectId}/marks`);
      setMarksViewRows(res.data.data);
    } catch {
      toast.error('Failed to refresh marks');
    } finally {
      setMarksViewLoading(false);
    }
  };

  const startEditRow = (row: MarksRow) => {
    setEditingRow(row.studentId);
    setEditMarks(row.marksObtained !== null ? row.marksObtained.toString() : '');
    setEditRemark(row.remark ?? '');
    setEditMaxMarks(row.maxMarks || 100);
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditMarks('');
    setEditRemark('');
  };

  const saveRowMark = async (row: MarksRow) => {
    if (!selectedExam || !marksViewSubject) return;
    setSavingRowId(row.studentId);
    try {
      await axiosInstance.post(`/exams/${selectedExam.id}/subjects/${marksViewSubject.subjectId}/marks/save`, {
        studentId: row.studentId,
        marksObtained: editMarks,
        maxMarks: editMaxMarks,
        remark: editRemark
      });
      toast.success(`Marks saved for ${row.studentName}`);
      setEditingRow(null);
      await refreshMarksView();
      // Also refresh gradebook counts
      const gbRes = await axiosInstance.get<ApiResponse<GradebookData>>(`/exams/${selectedExam.id}/gradebook`);
      setGradebookData(gbRes.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save marks');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleScheduleExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingExamId) {
        await axiosInstance.put(`/exams/${editingExamId}`, { ...examForm, academicYearId: 'current' });
        toast.success('Exam updated successfully');
      } else {
        await axiosInstance.post('/exams', { ...examForm, academicYearId: 'current' });
        toast.success('Exam scheduled successfully');
      }
      setIsScheduleModalOpen(false);
      setEditingExamId(null);
      setExamForm({ name: '', type: 'internal', classId: '', startDate: '', endDate: '', mode: 'text', description: '', fileUrl: '' });
      fetchExams();
    } catch {
      toast.error('Failed to save exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExamId(exam.id);
    setExamForm({
      name: exam.name,
      type: exam.type,
      classId: exam.classId,
      startDate: format(new Date(exam.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(exam.endDate), 'yyyy-MM-dd'),
      mode: 'text',
      description: exam.description || '',
      fileUrl: ''
    });
    setIsScheduleModalOpen(true);
  };

  const handleDeleteExam = async (exam: Exam) => {
    if (!window.confirm(`Are you sure you want to delete "${exam.name}"? All associated marks will also be deleted.`)) return;
    try {
      await axiosInstance.delete(`/exams/${exam.id}`);
      toast.success(`Exam "${exam.name}" deleted successfully`);
      fetchExams();
    } catch {
      toast.error('Failed to delete exam');
    }
  };

  const handleSubmitMarks = async () => {
    if (!selectedSubjectId) return toast.error('Please select a subject');
    setIsSubmitting(true);
    try {
      const payload = {
        examId: selectedExam?.id,
        subjectId: selectedSubjectId,
        maxMarks: maxMarks,
        results: Object.entries(marksData).map(([studentId, data]) => ({
          studentId,
          marksObtained: data.marks || '0',
          remark: data.remark
        }))
      };
      await axiosInstance.post('/exams/marks', payload);
      toast.success('Marks recorded successfully');
      setView('list');
    } catch {
      toast.error('Failed to submit results');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── GRADE BADGE HELPER ─────────────────────────────────────────────────────
  const gradeBadgeClass = (grade: string | null) => {
    if (!grade) return 'bg-slate-100 text-slate-400';
    if (grade === 'A+' || grade === 'A') return 'bg-emerald-100 text-emerald-700';
    if (grade === 'B') return 'bg-blue-100 text-blue-700';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-700';
    if (grade === 'D') return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  // ── FILTERED MARKS ROWS ───────────────────────────────────────────────────
  const filteredMarksRows = marksViewRows.filter(row => {
    const matchSearch = !marksSearch || row.studentName.toLowerCase().includes(marksSearch.toLowerCase()) || (row.admissionNo ?? '').toLowerCase().includes(marksSearch.toLowerCase());
    const matchFilter = marksFilter === 'all' || row.status === marksFilter;
    return matchSearch && matchFilter;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: RECORDING (bulk marks entry)
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'recording') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Breadcrumb items={[
          { label: 'Academics' }, 
          { label: 'Examinations', onClick: () => setView('list') },
          { label: 'Record Marks' }
        ]} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div className="flex items-center gap-4">
              <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedExam?.name}</h1>
                <p className="text-slate-500 text-sm font-medium">Class {selectedExam?.class?.name} · Recording Mode</p>
              </div>
           </div>
           <div className="flex gap-2 w-full md:w-auto">
              <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSubmitMarks} isLoading={isSubmitting} disabled={!selectedSubjectId || students.length === 0}>Save All Marks</Button>
              <Button variant="secondary" onClick={() => setView('list')}>Cancel</Button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <Card className="md:col-span-1 p-5 space-y-6 border-slate-200 shadow-xl shadow-slate-100/50">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">1. Select Subject</label>
                <div className="space-y-2">
                   {examSubjects.map(sub => (
                      <button key={sub.id} onClick={() => setSelectedSubjectId(sub.id)}
                        className={clsx("w-full px-4 py-3 rounded-xl text-sm font-bold text-left transition-all border flex items-center justify-between group",
                          selectedSubjectId === sub.id ? "bg-blue-600 text-white border-transparent shadow-lg shadow-blue-200" : "bg-white text-slate-600 border-slate-100 hover:border-blue-200 hover:bg-blue-50/30"
                        )}>
                         <span>{sub.name}</span>
                         <ChevronRight className={clsx("w-4 h-4 transition-transform", selectedSubjectId === sub.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100")} />
                      </button>
                   ))}
                </div>
              </div>

              {selectedSubjectId && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">2. Assessment Settings</label>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Maximum Marks</p>
                        <Input type="number" value={maxMarks} onChange={e => setMaxMarks(parseInt(e.target.value) || 0)} className="bg-white border-slate-200" />
                        <p className="text-[9px] text-slate-400 italic">This will be applied to all students.</p>
                     </div>
                  </div>
                </div>
              )}
           </Card>

           <Card className="md:col-span-3 p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-100/50">
              {!selectedSubjectId ? (
                <div className="p-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6"><BookOpen className="w-8 h-8" /></div>
                   <h3 className="text-xl font-black text-slate-800">Ready to Record Marks</h3>
                   <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">Please select a subject from the left panel to load the student register.</p>
                </div>
              ) : isLoading ? (
                <div className="p-20 text-center animate-pulse space-y-4">
                   <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto" />
                   <div className="h-4 bg-slate-100 rounded w-48 mx-auto" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Marks Obtd.</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks / Behavioral Notes</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {students.map(student => {
                         const marks = parseInt(marksData[student.id]?.marks || '0');
                         const isPass = marks >= (maxMarks * 0.33);
                         return (
                           <tr key={student.id} className="hover:bg-blue-50/5 transition-colors group">
                             <td className="px-6 py-5">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm transition-transform group-hover:scale-110">{student.fullName.charAt(0)}</div>
                                  <div>
                                    <p className="text-sm font-black text-slate-700">{student.fullName}</p>
                                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase italic">#{student.rollNumber || '---'}</p>
                                  </div>
                               </div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="relative group/input">
                                  <Input type="number" max={maxMarks} placeholder="0"
                                    value={marksData[student.id]?.marks || ''}
                                    onChange={e => setMarksData(prev => ({ ...prev, [student.id]: { ...prev[student.id], marks: e.target.value } }))}
                                    className={clsx("font-black text-center text-lg h-12 rounded-xl transition-all",
                                      isPass ? "border-emerald-100 focus:ring-emerald-500 text-emerald-600" : "border-red-100 focus:ring-red-500 text-red-600"
                                    )}
                                  />
                                  <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-focus-within/input:opacity-100 transition-opacity">/ {maxMarks}</div>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <Input placeholder="Well performed, needs focus on algebra..."
                                  value={marksData[student.id]?.remark || ''}
                                  onChange={e => setMarksData(prev => ({ ...prev, [student.id]: { ...prev[student.id], remark: e.target.value } }))}
                                  className="border-slate-100 focus:border-blue-300 text-sm italic h-12"
                                />
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex justify-center">
                                   {marksData[student.id]?.marks ? (
                                     isPass ? (
                                       <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-100"><CheckCircle2 className="w-5 h-5" /></div>
                                     ) : (
                                       <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-sm shadow-red-100"><XCircle className="w-5 h-5" /></div>
                                     )
                                   ) : (
                                     <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200" />
                                   )}
                                </div>
                             </td>
                           </tr>
                         );
                       })}
                    </tbody>
                  </table>
                  <div className="p-4 bg-blue-50/30 flex items-center gap-3">
                     <Info className="w-4 h-4 text-blue-500" />
                     <p className="text-[10px] text-blue-700 font-bold italic">Pass mark automatically calculated as 33% of max marks ({Math.ceil(maxMarks * 0.33)} marks).</p>
                  </div>
                </div>
              )}
           </Card>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: RESULTS (student/parent — own results)
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'results') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Breadcrumb items={[
          { label: 'My Academics' }, 
          { label: 'Examinations', onClick: () => setView('list') },
          { label: 'Exam Results' }
        ]} />

        <div className="flex items-center gap-4">
           <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"><ArrowLeft className="w-5 h-5" /></button>
           <div>
             <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedExam?.name} Results</h1>
             <p className="text-slate-500 text-sm font-medium">Your performance in this examination</p>
           </div>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-100/50">
          {studentResults.length === 0 ? (
            <div className="p-20 text-center space-y-4">
               <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6"><Award className="w-8 h-8" /></div>
               <h3 className="text-xl font-black text-slate-800">No Results Published Yet</h3>
               <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">Your marks for this exam have not been uploaded or published by the teachers yet. Please check back later.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks Obtained</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {studentResults.map((result, idx) => {
                     const marks = result.marksObtained;
                     const max = result.maxMarks || 100;
                     const pct = Math.round((marks / max) * 100);
                     const isPass = marks >= (max * 0.33);
                     let grade = result.grade || 'F';
                     return (
                       <tr key={idx} className="hover:bg-blue-50/5 transition-colors">
                         <td className="px-6 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">{result.subject?.name?.substring(0, 2).toUpperCase() || 'SU'}</div>
                              <div>
                                <p className="text-sm font-black text-slate-700">{result.subject?.name || 'Unknown'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{result.subject?.code || '---'}</p>
                              </div>
                           </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex items-baseline gap-1">
                               <span className={clsx("text-lg font-black", isPass ? "text-slate-800" : "text-red-600")}>{marks}</span>
                               <span className="text-xs font-bold text-slate-400">/ {max}</span>
                               <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <span className={clsx("px-2 py-1 rounded-lg text-xs font-black", gradeBadgeClass(grade))}>{grade}</span>
                         </td>
                         <td className="px-6 py-5">
                            <p className="text-sm italic text-slate-600">{result.remark || '--'}</p>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex justify-center">
                               {isPass ? <Badge variant="success" size="sm" className="font-bold">PASS</Badge> : <Badge variant="error" size="sm" className="font-bold">FAIL</Badge>}
                            </div>
                         </td>
                       </tr>
                     );
                   })}
                </tbody>
              </table>
              <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Score:</span>
                    <span className="text-lg font-black text-slate-800">
                      {studentResults.reduce((acc, curr) => acc + (curr.marksObtained || 0), 0)} / {studentResults.reduce((acc, curr) => acc + (curr.maxMarks || 100), 0)}
                    </span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall Grade:</span>
                    <span className="text-lg font-black text-blue-600">
                      {(() => {
                        const totalObtained = studentResults.reduce((acc, curr) => acc + (curr.marksObtained || 0), 0);
                        const totalMax = studentResults.reduce((acc, curr) => acc + (curr.maxMarks || 100), 0);
                        const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
                        if (pct >= 90) return 'A+'; if (pct >= 80) return 'A'; if (pct >= 70) return 'B'; if (pct >= 60) return 'C'; if (pct >= 50) return 'D'; return 'F';
                      })()}
                    </span>
                 </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: GRADEBOOK (Phase 3.2C — Admin/Teacher)
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'gradebook') {
    const totalEnteredAll = gradebookData?.subjects.reduce((acc, s) => acc + s.marksEnteredCount, 0) ?? 0;
    const totalPendingAll = gradebookData?.subjects.reduce((acc, s) => acc + s.pendingMarksCount, 0) ?? 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Breadcrumb items={[
          { label: 'Academics' },
          { label: 'Examinations', onClick: () => setView('list') },
          { label: 'Gradebook' }
        ]} />

        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{gradebookData?.examName ?? selectedExam?.name}</h1>
            <p className="text-slate-500 text-sm font-medium">
              Class {gradebookData?.className ?? selectedExam?.class?.name} · {gradebookData ? format(new Date(gradebookData.startDate), 'dd MMM') + ' – ' + format(new Date(gradebookData.endDate), 'dd MMM yyyy') : ''}
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={<ClipboardCheck className="w-4 h-4" />} onClick={() => handleEnterRecording(selectedExam!)}>Record Marks (Bulk)</Button>
        </div>

        {/* Summary stats */}
        {gradebookData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: gradebookData.totalStudents, color: 'bg-slate-800 text-white' },
              { label: 'Subjects', value: gradebookData.subjects.length, color: 'bg-blue-600 text-white' },
              { label: 'Marks Entered', value: totalEnteredAll, color: 'bg-emerald-500 text-white' },
              { label: 'Pending', value: totalPendingAll, color: 'bg-amber-500 text-white' },
            ].map(stat => (
              <div key={stat.label} className={clsx('rounded-2xl p-5 flex flex-col gap-1', stat.color)}>
                <span className="text-2xl font-black">{stat.value}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Subject cards */}
        <Card className="p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-100/50">
          {gradebookLoading ? (
            <div className="p-16 text-center space-y-3 animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-48 mx-auto" />
            </div>
          ) : !gradebookData || gradebookData.subjects.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-500 font-bold">No subjects found for this exam's class.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click a subject to view and edit student marks</p>
              </div>
              <div className="divide-y divide-slate-100">
                {gradebookData.subjects.map(subject => {
                  const pct = subject.totalStudents > 0 ? Math.round((subject.marksEnteredCount / subject.totalStudents) * 100) : 0;
                  return (
                    <div key={subject.subjectId}
                      className="px-6 py-5 hover:bg-blue-50/20 transition-colors group cursor-pointer flex items-center gap-4"
                      onClick={() => handleViewSubjectMarks(subject)}>
                      {/* Subject avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0">
                        {(subject.subjectCode || subject.subjectName).substring(0, 2).toUpperCase()}
                      </div>
                      {/* Subject info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-800 group-hover:text-blue-700 transition-colors">{subject.subjectName}</p>
                          {subject.subjectCode && <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">{subject.subjectCode}</span>}
                        </div>
                        {subject.teacherName && <p className="text-[10px] text-slate-400 font-medium mt-0.5">Teacher: {subject.teacherName}</p>}
                        {/* Progress bar */}
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">{subject.marksEnteredCount}/{subject.totalStudents} entered</span>
                        </div>
                      </div>
                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6 text-center shrink-0">
                        <div>
                          <p className="text-xs font-black text-emerald-600">{subject.marksEnteredCount}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Entered</p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-amber-500">{subject.pendingMarksCount}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Pending</p>
                        </div>
                        {subject.averageMarks !== null && (
                          <div>
                            <p className="text-xs font-black text-slate-700">{subject.averageMarks}/{subject.maxMarks}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Avg Marks</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-black text-slate-700">{subject.maxMarks}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Max Marks</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: MARKS-VIEW (Phase 3.2C — per subject, inline edit)
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'marks-view') {
    const enteredCount = marksViewRows.filter(r => r.status === 'entered').length;
    const pendingCount = marksViewRows.filter(r => r.status === 'pending').length;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Breadcrumb items={[
          { label: 'Academics' },
          { label: 'Examinations', onClick: () => setView('list') },
          { label: 'Gradebook', onClick: () => setView('gradebook') },
          { label: marksViewSubject?.subjectName ?? 'Marks' }
        ]} />

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setView('gradebook')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{marksViewSubject?.subjectName}</h1>
              <p className="text-slate-500 text-sm font-medium">{selectedExam?.name} · Class {selectedExam?.class?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshMarksView} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all" title="Refresh">
              <RefreshCw className={clsx("w-4 h-4", marksViewLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: marksViewRows.length, color: 'bg-slate-800 text-white', filter: 'all' as const },
            { label: 'Entered', value: enteredCount, color: 'bg-emerald-500 text-white', filter: 'entered' as const },
            { label: 'Pending', value: pendingCount, color: 'bg-amber-500 text-white', filter: 'pending' as const },
          ].map(stat => (
            <button key={stat.filter} onClick={() => setMarksFilter(stat.filter)}
              className={clsx('rounded-2xl p-4 flex flex-col gap-1 text-left transition-all', stat.color, marksFilter === stat.filter ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : 'opacity-80 hover:opacity-100')}>
              <span className="text-2xl font-black">{stat.value}</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{stat.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name or admission no..."
            value={marksSearch}
            onChange={e => setMarksSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Marks table */}
        <Card className="p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-100/50">
          {marksViewLoading ? (
            <div className="p-16 text-center animate-pulse space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-48 mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks Obtained</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Marks</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">%</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Updated</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMarksRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-16 text-center text-slate-400 font-medium">No students found.</td></tr>
                  ) : filteredMarksRows.map(row => {
                    const isEditing = editingRow === row.studentId;
                    const isSaving = savingRowId === row.studentId;
                    return (
                      <tr key={row.studentId} className={clsx("transition-colors", isEditing ? "bg-blue-50/40" : "hover:bg-slate-50/60 group")}>
                        {/* Student */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                              {row.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-700">{row.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{row.admissionNo || row.rollNumber || '—'}</p>
                            </div>
                          </div>
                        </td>
                        {/* Marks */}
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <Input type="number" value={editMarks} onChange={e => setEditMarks(e.target.value)}
                              max={editMaxMarks} min={0} placeholder="0"
                              className="w-24 h-10 font-black text-center text-base border-blue-300 focus:ring-blue-500" />
                          ) : (
                            <span className={clsx("text-base font-black", row.marksObtained !== null ? (row.percentage! >= 33 ? "text-slate-800" : "text-red-600") : "text-slate-300 italic text-sm")}>
                              {row.marksObtained !== null ? row.marksObtained : '—'}
                            </span>
                          )}
                        </td>
                        {/* Max Marks */}
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <Input type="number" value={editMaxMarks} onChange={e => setEditMaxMarks(parseInt(e.target.value) || 100)}
                              min={1} className="w-24 h-10 font-black text-center text-base border-blue-300 focus:ring-blue-500" />
                          ) : (
                            <span className="text-sm font-bold text-slate-500">{row.maxMarks}</span>
                          )}
                        </td>
                        {/* Percentage */}
                        <td className="px-6 py-4">
                          <span className={clsx("text-sm font-black", row.percentage !== null ? (row.percentage >= 33 ? "text-emerald-600" : "text-red-600") : "text-slate-300")}>
                            {row.percentage !== null ? `${row.percentage}%` : '—'}
                          </span>
                        </td>
                        {/* Grade */}
                        <td className="px-6 py-4">
                          <span className={clsx("px-2 py-1 rounded-lg text-xs font-black", gradeBadgeClass(row.grade))}>
                            {row.grade ?? '—'}
                          </span>
                        </td>
                        {/* Remarks */}
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <Input value={editRemark} onChange={e => setEditRemark(e.target.value)}
                              placeholder="Feedback / notes..." className="h-10 text-sm italic border-blue-300 focus:ring-blue-500 min-w-[200px]" />
                          ) : (
                            <span className="text-sm italic text-slate-500 max-w-[200px] truncate block">{row.remark || '—'}</span>
                          )}
                        </td>
                        {/* Last Updated */}
                        <td className="px-6 py-4">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {row.updatedAt ? format(new Date(row.updatedAt), 'dd MMM, HH:mm') : '—'}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {isEditing ? (
                              <>
                                <Button variant="primary" size="sm" isLoading={isSaving} onClick={() => saveRowMark(row)}
                                  icon={<Save className="w-3.5 h-3.5" />} className="h-8 px-3 text-xs font-black">
                                  Save
                                </Button>
                                <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all" title="Cancel">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => startEditRow(row)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100" title="Edit marks">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-4 bg-blue-50/30 flex items-center gap-3">
                <Info className="w-4 h-4 text-blue-500" />
                <p className="text-[10px] text-blue-700 font-bold italic">
                  Marks saved here sync immediately with mobile student/parent/teacher views. Refresh mobile app to see changes.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: LIST (default)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={isStudent ? [{ label: 'My Academics' }, { label: 'Examinations' }] : [{ label: 'Academics' }, { label: 'Examinations' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{isStudent ? 'My Examinations' : 'Academic Assessments'}</h1>
          <p className="text-slate-500 text-sm font-medium">{isStudent ? 'View your upcoming and past examination schedule.' : 'Schedule exams, record marks, and view gradebook.'}</p>
        </div>
        {!isStudent && (
        <div className="flex gap-2">
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsScheduleModalOpen(true)}>Schedule Exam</Button>
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)
         ) : exams.length === 0 ? (
            <div className="col-span-3 text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <p className="text-slate-500 font-bold mb-4">{isStudent ? 'No examinations scheduled for your class yet.' : 'No examinations scheduled yet.'}</p>
               {!isStudent && <Button size="sm" onClick={() => setIsScheduleModalOpen(true)}>Get Started</Button>}
            </div>
          ) : exams.map((exam) => {
            return (
            <Card key={exam.id}
              className={clsx(
                "p-0 overflow-hidden border-slate-200 hover:shadow-xl transition-all group border-l-4 border-l-blue-500 hover:-translate-y-1 duration-300",
                isStudent ? "cursor-pointer" : ""
              )}
              onClick={() => isStudent ? handleViewResults(exam) : undefined}
            >
               <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                     <Badge variant={exam.type === 'final_exam' ? 'error' : 'secondary'} size="sm" className="font-black uppercase tracking-widest text-[9px]">
                        {exam.type.replace('_', ' ')}
                     </Badge>
                     <StatusBadge status={exam.status} />
                  </div>

                  <div className="space-y-1">
                     <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{exam.name}</h3>
                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg w-fit">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-500" /> 
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Class {exam.class?.name || 'All'}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 py-3 border-y border-slate-50">
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Starts</p>
                        <p className="text-xs font-bold text-slate-700">{format(new Date(exam.startDate), 'dd MMM')}</p>
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ends</p>
                        <p className="text-xs font-bold text-slate-700">{format(new Date(exam.endDate), 'dd MMM yyyy')}</p>
                     </div>
                  </div>

                  {!isStudent && (
                   <div className="flex gap-2 pt-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                      {/* Phase 3.2C: Primary action → Gradebook */}
                      <Button 
                         variant="primary" 
                         size="sm" 
                         className="flex-1 text-[10px] font-black uppercase tracking-wide h-10 shadow-lg shadow-blue-100"
                         onClick={(e) => { e.stopPropagation(); handleViewGradebook(exam); }}
                         icon={<BarChart2 className="w-3.5 h-3.5" />}
                      >
                         Gradebook
                      </Button>
                      <Button 
                         variant="secondary" 
                         size="sm" 
                         className="text-[10px] font-black uppercase h-10"
                         onClick={(e) => { e.stopPropagation(); handleEnterRecording(exam); }}
                         icon={<ClipboardCheck className="w-3.5 h-3.5" />}
                      >
                         Record
                      </Button>
                       <Button variant="secondary" size="sm" className="px-3 h-10 border-slate-200" onClick={(e) => { e.stopPropagation(); handleEditExam(exam); }}>
                          <Edit2 className="w-4 h-4" />
                       </Button>
                       <Button variant="danger" size="sm" className="px-3 h-10" onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam); }}>
                          <Trash2 className="w-4 h-4" />
                       </Button>
                   </div>
                  )}
               </div>
            </Card>
            );
         })}
      </div>

      {!isStudent && (
      <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl flex gap-4 text-amber-900 shadow-sm">
         <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0"><AlertCircle className="w-6 h-6 text-amber-600" /></div>
         <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-tight">Grading Policy Reminder</p>
            <p className="text-xs leading-relaxed opacity-80 font-medium max-w-2xl">
               Ensure all internal assessment marks are finalized before submitting final exam results. 
               Once submitted, results are instantly visible on parent portals. Corrections require <strong>Super Admin</strong> approval.
            </p>
         </div>
      </div>
      )}

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Schedule New Examination" size="lg">
         <form onSubmit={handleScheduleExam} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-5">
               <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Exam Title</label>
                  <Input value={examForm.name} onChange={e => setExamForm({...examForm, name: e.target.value})} placeholder="e.g. Unit Test 1 - April" className="font-bold text-lg h-12 border-slate-200 focus:ring-blue-600 rounded-xl" required />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Type</label>
                  <select value={examForm.type} onChange={e => setExamForm({...examForm, type: e.target.value})} className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all">
                     <option value="internal">Internal Assessment (Weekly/Quiz)</option>
                     <option value="mid_term">Mid Term Examination</option>
                     <option value="final_exam">Final Examination</option>
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Target Class</label>
                  <select value={examForm.classId} onChange={e => setExamForm({...examForm, classId: e.target.value})} className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all" required>
                     <option value="">Select Target Class</option>
                     {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Start Date</label>
                  <Input type="date" value={examForm.startDate} onChange={e => setExamForm({...examForm, startDate: e.target.value})} className="h-12 border-slate-200 font-bold rounded-xl" required />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">End Date</label>
                  <Input type="date" value={examForm.endDate} onChange={e => setExamForm({...examForm, endDate: e.target.value})} className="h-12 border-slate-200 font-bold rounded-xl" required />
               </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Exam Paper / Instructions Mode</label>
                  <div className="flex gap-4">
                     <button type="button" onClick={() => setExamForm({...examForm, mode: 'text'})} className={clsx("flex-1 p-4 rounded-2xl border text-xs font-black uppercase tracking-wide transition-all", examForm.mode === 'text' ? "bg-slate-800 text-white border-transparent shadow-xl shadow-slate-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-800")}>Syllabus (Typed)</button>
                     <button type="button" onClick={() => setExamForm({...examForm, mode: 'pdf'})} className={clsx("flex-1 p-4 rounded-2xl border text-xs font-black uppercase tracking-wide transition-all", examForm.mode === 'pdf' ? "bg-slate-800 text-white border-transparent shadow-xl shadow-slate-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-800")}>Paper (PDF/Media)</button>
                  </div>
               </div>
               {examForm.mode === 'text' ? (
                  <textarea rows={4} placeholder="Describe syllabus, duration, and specific instructions..." className="w-full p-5 text-sm font-medium bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-300" value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} />
               ) : (
                  <div className="space-y-3">
                     <Input placeholder="Paste PDF Link or Paper URL" value={examForm.fileUrl} onChange={e => setExamForm({...examForm, fileUrl: e.target.value})} className="h-12 border-slate-200 font-bold rounded-xl" />
                     <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 font-bold italic"><Info className="w-3.5 h-3.5" /><span>Support for direct file uploads is managed by your storage configuration.</span></div>
                  </div>
               )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
               <Button variant="secondary" onClick={() => setIsScheduleModalOpen(false)} className="px-8 h-12 rounded-xl border-slate-200 font-black uppercase tracking-widest text-[10px]">Discard</Button>
               <Button type="submit" isLoading={isSubmitting} icon={<Award className="w-4 h-4" />} className="px-8 h-12 rounded-xl bg-blue-600 shadow-xl shadow-blue-200 font-black uppercase tracking-widest text-[10px]">Broadcast Exam</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};
