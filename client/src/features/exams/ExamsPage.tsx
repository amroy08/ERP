import React, { useState, useEffect } from 'react';
import { 
  Award, Search, Plus, Filter, 
  Calendar, BookOpen, GraduationCap, 
  ClipboardCheck, TrendingUp, ChevronRight,
  UserCheck, History, AlertCircle, Save,
  ArrowLeft, CheckCircle2, XCircle, Info
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

export const ExamsPage: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student' || user?.role === 'parent';
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation State
  const [view, setView] = useState<'list' | 'recording' | 'results'>('list');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  
  // Marks Entry state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examSubjects, setExamSubjects] = useState<SubjectDoc[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [marksData, setMarksData] = useState<Record<string, { marks: string, remark: string }>>({});
  const [maxMarks, setMaxMarks] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Schedule Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    name: '', type: 'internal', classId: '', startDate: '', endDate: '',
    mode: 'text' as 'text' | 'pdf',
    description: '', fileUrl: ''
  });
  const [classes, setClasses] = useState<ClassDoc[]>([]);

  useEffect(() => {
    if (!isStudent) {
      axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes')
        .then(res => setClasses(res.data.data))
        .catch(() => console.error('Failed to load classes'));
    }
    fetchExams();
  }, [isStudent]);

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<Exam[]>>('/exams');
      setExams(res.data.data);
    } catch {
      toast.error('Failed to load examinations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterRecording = async (exam: Exam) => {
    setSelectedExam(exam);
    setIsLoading(true);
    try {
      const subRes = await axiosInstance.get<ApiResponse<SubjectDoc[]>>(`/exams/subjects/${exam.id}`);
      setExamSubjects(subRes.data.data);
      setView('recording');
    } catch {
      toast.error('Failed to load subjects for this exam');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResults = async (exam: Exam) => {
    const studentId = (user as any)?.student?.id || (user as any)?.parent?.children?.[0]?.id;
    if (!studentId) return toast.error('Student profile not found');
    
    setSelectedExam(exam);
    setIsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<any[]>>(`/exams/report-card/${studentId}`);
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
      // 1. Fetch Students
      const stuRes = await axiosInstance.get<ApiResponse<Student[]>>(`/students?classId=${selectedExam.classId}&limit=100`);
      const studentList = stuRes.data.data;
      setStudents(studentList);

      // 2. Fetch Existing Marks
      const marksRes = await axiosInstance.get<ApiResponse<any[]>>(`/exams/marks/${selectedExam.id}/${selectedSubjectId}`);
      const existingMarks = marksRes.data.data;

      // 3. Map to state
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

  const handleScheduleExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/exams', {
        ...examForm,
        academicYearId: 'current' 
      });
      toast.success('Exam scheduled successfully');
      setIsScheduleModalOpen(false);
      fetchExams();
    } catch {
      toast.error('Failed to schedule exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitMarks = async () => {
    if (!selectedSubjectId) return toast.error('Please select a subject');
    
    setIsSubmitting(true);
    try {
      const payload = {
        examId: selectedExam?.id,
        subjectId: selectedSubjectId, // Added to payload as backend expects it
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
              <button 
                onClick={() => setView('list')}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedExam?.name}</h1>
                <p className="text-slate-500 text-sm font-medium">Class {selectedExam?.class?.name} · Recording Mode</p>
              </div>
           </div>
           <div className="flex gap-2 w-full md:w-auto">
              <Button 
                variant="primary" 
                icon={<Save className="w-4 h-4" />} 
                onClick={handleSubmitMarks}
                isLoading={isSubmitting}
                disabled={!selectedSubjectId || students.length === 0}
              >
                Save All Marks
              </Button>
              <Button variant="secondary" onClick={() => setView('list')}>Cancel</Button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <Card className="md:col-span-1 p-5 space-y-6 border-slate-200 shadow-xl shadow-slate-100/50">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">1. Select Subject</label>
                <div className="space-y-2">
                   {examSubjects.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubjectId(sub.id)}
                        className={clsx(
                          "w-full px-4 py-3 rounded-xl text-sm font-bold text-left transition-all border flex items-center justify-between group",
                          selectedSubjectId === sub.id 
                            ? "bg-blue-600 text-white border-transparent shadow-lg shadow-blue-200" 
                            : "bg-white text-slate-600 border-slate-100 hover:border-blue-200 hover:bg-blue-50/30"
                        )}
                      >
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
                        <Input 
                          type="number" 
                          value={maxMarks} 
                          onChange={e => setMaxMarks(parseInt(e.target.value) || 0)}
                          className="bg-white border-slate-200"
                        />
                        <p className="text-[9px] text-slate-400 italic">This will be applied to all students.</p>
                     </div>
                  </div>
                </div>
              )}
           </Card>

           <Card className="md:col-span-3 p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-100/50">
              {!selectedSubjectId ? (
                <div className="p-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-black text-slate-800">Ready to Record Marks</h3>
                   <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">Please select a subject from the left panel to load the student register.</p>
                </div>
              ) : isLoading ? (
                <div className="p-20 text-center animate-pulse space-y-4">
                   <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto" />
                   <div className="h-4 bg-slate-100 rounded w-48 mx-auto" />
                   <div className="h-3 bg-slate-100 rounded w-64 mx-auto opacity-50" />
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
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm transition-transform group-hover:scale-110">
                                    {student.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-700">{student.fullName}</p>
                                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase italic">#{student.rollNumber || '---'}</p>
                                  </div>
                               </div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="relative group/input">
                                  <Input 
                                    type="number"
                                    max={maxMarks}
                                    placeholder="0"
                                    value={marksData[student.id]?.marks || ''}
                                    onChange={e => setMarksData(prev => ({
                                      ...prev,
                                      [student.id]: { ...prev[student.id], marks: e.target.value }
                                    }))}
                                    className={clsx(
                                      "font-black text-center text-lg h-12 rounded-xl transition-all",
                                      isPass ? "border-emerald-100 focus:ring-emerald-500 text-emerald-600" : "border-red-100 focus:ring-red-500 text-red-600"
                                    )}
                                  />
                                  <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-focus-within/input:opacity-100 transition-opacity">/ {maxMarks}</div>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <Input 
                                  placeholder="Well performed, needs focus on algebra..."
                                  value={marksData[student.id]?.remark || ''}
                                  onChange={e => setMarksData(prev => ({
                                    ...prev,
                                    [student.id]: { ...prev[student.id], remark: e.target.value }
                                  }))}
                                  className="border-slate-100 focus:border-blue-300 text-sm italic h-12"
                                />
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex justify-center">
                                   {marksData[student.id]?.marks ? (
                                     isPass ? (
                                       <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-100">
                                          <CheckCircle2 className="w-5 h-5" />
                                       </div>
                                     ) : (
                                       <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-sm shadow-red-100">
                                          <XCircle className="w-5 h-5" />
                                       </div>
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

  if (view === 'results') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Breadcrumb items={[
          { label: 'My Academics' }, 
          { label: 'Examinations', onClick: () => setView('list') },
          { label: 'Exam Results' }
        ]} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('list')}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedExam?.name} Results</h1>
                <p className="text-slate-500 text-sm font-medium">Your performance in this examination</p>
              </div>
           </div>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-100/50">
          {studentResults.length === 0 ? (
            <div className="p-20 text-center space-y-4">
               <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8" />
               </div>
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
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {studentResults.map((result, idx) => {
                     const marks = result.marksObtained;
                     const max = result.maxMarks || 100;
                     const isPass = marks >= (max * 0.33);
                     return (
                       <tr key={idx} className="hover:bg-blue-50/5 transition-colors">
                         <td className="px-6 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                                {result.subject?.name?.substring(0, 2).toUpperCase() || 'SU'}
                              </div>
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
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <p className="text-sm italic text-slate-600">{result.remark || '--'}</p>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex justify-center">
                               {isPass ? (
                                 <Badge variant="success" size="sm" className="font-bold">PASS</Badge>
                               ) : (
                                 <Badge variant="error" size="sm" className="font-bold">FAIL</Badge>
                               )}
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
                        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
                        if (percentage >= 90) return 'A+';
                        if (percentage >= 80) return 'A';
                        if (percentage >= 70) return 'B';
                        if (percentage >= 60) return 'C';
                        if (percentage >= 50) return 'D';
                        return 'F';
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={isStudent ? [{ label: 'My Academics' }, { label: 'Examinations' }] : [{ label: 'Academics' }, { label: 'Examinations' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{isStudent ? 'My Examinations' : 'Academic Assessments'}</h1>
          <p className="text-slate-500 text-sm font-medium">{isStudent ? 'View your upcoming and past examination schedule.' : 'Schedule exams, record marks, and generate student report cards.'}</p>
        </div>
        {!isStudent && (
        <div className="flex gap-2">
          <Button variant="secondary" icon={<History className="w-4 h-4" />}>Previous Results</Button>
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
            const isScheduled = exam.status === 'scheduled' || exam.status === 'completed';
            return (
            <Card 
              key={exam.id} 
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
                      <Button 
                         variant="primary" 
                         size="sm" 
                         className="flex-1 text-[10px] font-black uppercase tracking-wide h-10 shadow-lg shadow-blue-100"
                         onClick={() => handleEnterRecording(exam)}
                         icon={<ClipboardCheck className="w-3.5 h-3.5" />}
                      >
                         Record Marks
                      </Button>
                      <Button variant="secondary" size="sm" className="px-3 h-10 border-slate-200">
                         <Info className="w-4 h-4" />
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
         <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-600" />
         </div>
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
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule New Examination"
        size="lg"
      >
         <form onSubmit={handleScheduleExam} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-5">
               <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Exam Title</label>
                  <Input 
                    value={examForm.name} 
                    onChange={e => setExamForm({...examForm, name: e.target.value})}
                    placeholder="e.g. Unit Test 1 - April" 
                    className="font-bold text-lg h-12 border-slate-200 focus:ring-blue-600 rounded-xl"
                    required 
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Type</label>
                  <select 
                    value={examForm.type} 
                    onChange={e => setExamForm({...examForm, type: e.target.value})}
                    className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  >
                     <option value="internal">Internal Assessment (Weekly/Quiz)</option>
                     <option value="mid_term">Mid Term Examination</option>
                     <option value="final_exam">Final Examination</option>
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Target Class</label>
                  <select 
                    value={examForm.classId} 
                    onChange={e => setExamForm({...examForm, classId: e.target.value})}
                    className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    required
                  >
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
                     <button 
                       type="button"
                       onClick={() => setExamForm({...examForm, mode: 'text'})}
                       className={clsx("flex-1 p-4 rounded-2xl border text-xs font-black uppercase tracking-wide transition-all", examForm.mode === 'text' ? "bg-slate-800 text-white border-transparent shadow-xl shadow-slate-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-800")}
                     >
                       Syllabus (Typed)
                     </button>
                     <button 
                       type="button"
                       onClick={() => setExamForm({...examForm, mode: 'pdf'})}
                       className={clsx("flex-1 p-4 rounded-2xl border text-xs font-black uppercase tracking-wide transition-all", examForm.mode === 'pdf' ? "bg-slate-800 text-white border-transparent shadow-xl shadow-slate-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-800")}
                     >
                       Paper (PDF/Media)
                     </button>
                  </div>
               </div>

               {examForm.mode === 'text' ? (
                  <textarea 
                    rows={4}
                    placeholder="Describe syllabus, duration, and specific instructions for teachers and students..."
                    className="w-full p-5 text-sm font-medium bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-300"
                    value={examForm.description}
                    onChange={e => setExamForm({...examForm, description: e.target.value})}
                  />
               ) : (
                  <div className="space-y-3">
                     <Input 
                        placeholder="Paste PDF Link or Paper URL (e.g. Google Drive/Storage)" 
                        value={examForm.fileUrl} 
                        onChange={e => setExamForm({...examForm, fileUrl: e.target.value})} 
                        className="h-12 border-slate-200 font-bold rounded-xl"
                     />
                     <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 font-bold italic">
                        <Info className="w-3.5 h-3.5" />
                        <span>Support for direct file uploads is managed by your storage configuration.</span>
                     </div>
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
