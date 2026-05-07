import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  LayoutDashboard,
  GraduationCap
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { Student, SectionDoc, ApiResponse } from '../../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWeekend, isPast, isToday } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'none';

export const SectionDashboardPage: React.FC = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  
  const [section, setSection] = useState<SectionDoc | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'students' | 'academic'>('attendance');

  useEffect(() => {
    fetchSectionData();
  }, [sectionId]);

  useEffect(() => {
    if (sectionId && activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [sectionId, currentMonth, activeTab]);

  const fetchSectionData = async () => {
    try {
      const secRes = await axiosInstance.get<ApiResponse<SectionDoc>>(`/sections/${sectionId}`);
      setSection(secRes.data.data);
      
      const stuRes = await axiosInstance.get<ApiResponse<Student[]>>(`/students?sectionId=${sectionId}&limit=100`);
      setStudents(stuRes.data.data);
    } catch (err) {
      toast.error('Failed to load section data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    
    try {
      const res = await axiosInstance.get(`/attendance?sectionId=${sectionId}&startDate=${startDate}&endDate=${endDate}`);
      const rawRecords = res.data.data;
      
      const mapped: Record<string, Record<string, AttendanceStatus>> = {};
      rawRecords.forEach((rec: any) => {
        // Robust UTC normalization
        const dateStr = rec.date.includes('T') ? rec.date.split('T')[0] : rec.date;
        if (!mapped[rec.studentId]) mapped[rec.studentId] = {};
        mapped[rec.studentId][dateStr] = rec.status;
      });
      setAttendanceRecords(mapped);
    } catch (err) {
      toast.error('Failed to load attendance records');
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const toggleAttendance = (studentId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (!isPast(date) && !isToday(date)) return; // Allow marking for past or today only

    setAttendanceRecords(prev => {
      const studentRecs = prev[studentId] || {};
      const current = studentRecs[dateStr] || 'none';
      
      let next: AttendanceStatus = 'present';
      if (current === 'present') next = 'absent';
      else if (current === 'absent') next = 'late';
      else if (current === 'late') next = 'none';
      
      return {
        ...prev,
        [studentId]: { ...studentRecs, [dateStr]: next }
      };
    });
  };

  const saveBatchAttendance = async () => {
    setIsSaving(true);
    try {
      const recordsToSave: any[] = [];
      Object.entries(attendanceRecords).forEach(([studentId, dates]) => {
        Object.entries(dates).forEach(([date, status]) => {
          if (status !== 'none') {
            recordsToSave.push({
              studentId,
              date,
              status,
              sectionId: section?.id,
              classId: section?.class
            });
          }
        });
      });

      if (recordsToSave.length === 0) {
        toast('No changes to save');
        return;
      }

      await axiosInstance.post('/attendance/bulk', { records: recordsToSave });
      toast.success('Register updated successfully');
    } catch (err) {
      toast.error('Failed to save register');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Initializing Section Hub...</div>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Academics' }, 
        { label: `Section ${section?.name}` }
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Section Hub: {section?.name}</h1>
             <p className="text-slate-500 text-sm font-medium">Class: {(section?.class as any)?.name || section?.class || 'N/A'} · {students.length} Enrolled Students</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {activeTab === 'attendance' && (
            <Button icon={<Save className="w-4 h-4" />} onClick={saveBatchAttendance} isLoading={isSaving}>Save Grid</Button>
          )}
          <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'attendance', label: 'Monthly Register', icon: Calendar },
          { id: 'students', label: 'Student Roster', icon: Users },
          { id: 'academic', label: 'Academic Links', icon: GraduationCap },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
              activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'attendance' && (
        <Card className="p-0 overflow-hidden border-slate-200 shadow-xl">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-sm font-black text-slate-700 uppercase tracking-widest px-2 min-w-[140px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
             </div>
             <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> P</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-red-500" /> A</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-amber-500" /> L</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-300" /> None</div>
             </div>
          </div>

          <div className="overflow-x-auto relative scrollbar-thin scrollbar-thumb-blue-100 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 bg-slate-50 sticky left-0 z-30 border-r border-slate-200 min-w-[200px] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Student Name
                  </th>
                  {daysInMonth.map(day => (
                    <th key={day.toString()} className={clsx(
                      "px-2 py-3 text-center min-w-[40px] border-r border-slate-100 last:border-0",
                      isWeekend(day) ? "bg-slate-100/50" : "bg-slate-50"
                    )}>
                      <div className="text-[10px] font-black text-slate-400 uppercase">{format(day, 'EEE')}</div>
                      <div className={clsx(
                        "text-sm font-bold",
                        isToday(day) ? "text-blue-600" : "text-slate-600"
                      )}>{format(day, 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-4 py-3 bg-white sticky left-0 z-10 border-r border-slate-100 group-hover:bg-blue-50/5 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs uppercase">
                          {student.fullName.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-slate-700 truncate">{student.fullName}</p>
                          <p className="text-[9px] text-slate-400 font-mono italic">#{student.rollNumber || '---'}</p>
                        </div>
                      </div>
                    </td>
                    {daysInMonth.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const status = attendanceRecords[student.id]?.[dateStr] || 'none';
                      const isLock = !isPast(day) && !isToday(day);
                      return (
                        <td 
                          key={dateStr}
                          onClick={() => !isLock && toggleAttendance(student.id, day)}
                          className={clsx(
                            "p-1 border-r border-slate-50 text-center transition-all cursor-pointer",
                            isWeekend(day) && "bg-slate-50/30",
                            isLock && "opacity-20 cursor-not-allowed"
                          )}
                        >
                          <div className={clsx(
                            "w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-[10px] font-black transition-all transform active:scale-90",
                            status === 'present' && "bg-emerald-500 text-white shadow-lg shadow-emerald-100",
                            status === 'absent' && "bg-red-500 text-white shadow-lg shadow-red-100",
                            status === 'late' && "bg-amber-500 text-white shadow-lg shadow-amber-100",
                            status === 'none' && "border-2 border-dashed border-slate-200 text-slate-200"
                          )}>
                             {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-blue-50/30 border-t border-slate-100 flex items-center gap-3">
             <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
             <p className="text-[11px] text-blue-700 font-bold italic">
               Tip: Click any cell to toggle: Present (P) → Absent (A) → Late (L) → Clear. Use horizontal scroll to see all dates.
             </p>
          </div>
        </Card>
      )}

      {activeTab === 'students' && (
        <Card className="p-0 overflow-hidden border-slate-200">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Enrolled Students ({students.length})</h3>
            <Button variant="secondary" size="sm" icon={<Users className="w-4 h-4" />} onClick={() => navigate('/students/new')}>Add Student</Button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Admission #</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{student.admissionNumber}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{student.fullName}</div>
                    <div className="text-[10px] text-slate-400">{student.parent?.email || 'No email provided'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => navigate(`/students/${student.id}/edit`)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                      <LayoutDashboard className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'academic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <Card className="p-6 border-slate-200 hover:border-blue-300 transition-all group cursor-pointer" onClick={() => navigate('/timetable')}>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                 <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1 text-lg">Class Timetable</h3>
              <p className="text-sm text-slate-500 leading-relaxed">View or update the weekly schedule for {section?.name}.</p>
           </Card>
           <Card className="p-6 border-slate-200 hover:border-emerald-300 transition-all group cursor-pointer" onClick={() => navigate('/subjects')}>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                 <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1 text-lg">Mapped Subjects</h3>
              <p className="text-sm text-slate-500 leading-relaxed">See all subjects and assigned teachers for this grade level.</p>
           </Card>
           <Card className="p-6 border-slate-200 hover:border-orange-300 transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                 <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1 text-lg">Performance Index</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Aggregated academic and behavioral analytics for the section.</p>
           </Card>
        </div>
      )}
    </div>
  );
};
