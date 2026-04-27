import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Plane, Save, Users, Calendar, Filter, Search } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import axiosInstance from '../../api/axiosInstance';
import { Student, ClassDoc, SectionDoc, ApiResponse } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave';

export const AttendancePage: React.FC = () => {
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [sections, setSections] = useState<SectionDoc[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Selection
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes').then(res => setClasses(res.data.data));
  }, []);

  useEffect(() => {
    if (selectedClass) {
      axiosInstance.get<ApiResponse<SectionDoc[]>>(`/sections?classId=${selectedClass}`).then(res => setSections(res.data.data));
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedClass]);

  const loadRegister = async () => {
    if (!selectedClass || !selectedSection || !selectedDate) return;
    setIsLoading(true);
    try {
      // 1. Fetch Students
      const studentRes = await axiosInstance.get(`/students?classId=${selectedClass}&sectionId=${selectedSection}&limit=100`);
      const studentList = studentRes.data.data;
      setStudents(studentList);

      // 2. Fetch Existing Attendance
      const attendanceRes = await axiosInstance.get(`/attendance?date=${selectedDate}&classId=${selectedClass}&sectionId=${selectedSection}`);
      const existingRecords = attendanceRes.data.data;
      
      const recordMap: Record<string, AttendanceStatus> = {};
      studentList.forEach((s: Student) => {
        const existing = existingRecords.find((r: any) => r.studentId === s.id);
        recordMap[s.id] = existing ? (existing.status as AttendanceStatus) : 'present';
      });
      setRecords(recordMap);
    } catch (err) {
      toast.error('Failed to load register');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newRecords: Record<string, AttendanceStatus> = {};
    students.forEach(s => newRecords[s.id] = status);
    setRecords(newRecords);
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    try {
      const attendanceData = students.map(s => ({
        studentId: s.id,
        status: records[s.id],
        date: selectedDate,
        classId: selectedClass,
        sectionId: selectedSection
      }));
      
      await axiosInstance.post('/attendance/bulk', { records: attendanceData });
      toast.success('Attendance marked successfully!');
    } catch (err) {
      toast.error('Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions: { id: AttendanceStatus, label: string, color: string }[] = [
    { id: 'present', label: 'P', color: 'bg-emerald-500 text-white' },
    { id: 'absent', label: 'A', color: 'bg-red-500 text-white' },
    { id: 'late', label: 'L', color: 'bg-amber-500 text-white' },
    { id: 'half_day', label: 'H', color: 'bg-orange-500 text-white' },
    { id: 'leave', label: 'LV', color: 'bg-indigo-500 text-white' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Academics' }, { label: 'Attendance' }]} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Register</h1>
          <p className="text-slate-500 text-sm">Mark daily attendance for students. Data reflects in parent portals instantly.</p>
        </div>
        <div className="flex gap-2">
           <Button icon={<Save className="w-4 h-4" />} isLoading={isSaving} onClick={saveAttendance} disabled={students.length === 0}>Save Register</Button>
        </div>
      </div>

      <Card className="p-4 border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
           <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Class</label>
              <select 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              >
                 <option value="">Select Class</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
           <div className="space-y-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Section</label>
              <select 
                value={selectedSection} 
                onChange={e => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
              >
                 <option value="">Select Section</option>
                 {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
              </select>
           </div>
           <div className="space-y-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
              <input 
                type="date" 
                value={selectedDate} 
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              />
           </div>
           <Button 
            className="h-[46px]" 
            icon={<Search className="w-4 h-4" />} 
            onClick={loadRegister}
            disabled={!selectedClass || !selectedSection}
           >
             Load Register
           </Button>
        </div>
      </Card>

      {isLoading ? (
        <Card className="py-20 flex items-center justify-center border-slate-200">
           <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-500">Preparing student register...</p>
           </div>
        </Card>
      ) : students.length > 0 ? (
        <div className="space-y-6">
           <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
                    {students.length}
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800">Section Register</h3>
                    <p className="text-xs text-slate-500">Marking for {format(new Date(selectedDate), 'dd MMM yyyy')}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                 <span className="text-xs font-bold text-slate-500 px-2">Mark All:</span>
                 <Button size="sm" variant="secondary" className="bg-white" onClick={() => handleMarkAll('present')}>Present</Button>
                 <Button size="sm" variant="secondary" className="bg-white" onClick={() => handleMarkAll('absent')}>Absent</Button>
              </div>
           </div>

           <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <tr>
                       <th className="px-6 py-4">Roll</th>
                       <th className="px-6 py-4">Student</th>
                       <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {students.map((student) => {
                       const currentStatus = records[student.id];
                       return (
                         <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                               <span className="text-sm font-bold text-slate-400 font-mono tracking-tighter">
                                  {student.rollNumber || '—'}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                                     {student.firstName.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-slate-700">{student.fullName}</p>
                                     <p className="text-[10px] text-slate-400">{student.admissionNumber}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center justify-center gap-2">
                                  {statusOptions.map((opt) => {
                                     const isActive = currentStatus === opt.id;
                                     return (
                                       <button
                                         key={opt.id}
                                         onClick={() => handleStatusChange(student.id, opt.id)}
                                         className={clsx(
                                           "w-9 h-9 rounded-xl flex items-center justify-center transition-all border-2 text-[10px] font-black",
                                           isActive 
                                             ? `${opt.color} border-transparent shadow-lg scale-110` 
                                             : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                                         )}
                                       >
                                          {opt.label}
                                       </button>
                                     );
                                  })}
                               </div>
                            </td>
                         </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <Card className="border-slate-200">
          <EmptyState 
            title="Register Ready" 
            description="Select a class and section to load the student list and start marking attendance."
            icon={<Filter className="w-10 h-10" />}
          />
        </Card>
      )}
    </div>
  );
};
