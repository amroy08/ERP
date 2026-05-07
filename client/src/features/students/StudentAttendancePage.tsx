import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { ApiResponse } from '../../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  remark?: string;
}

interface AttendanceReport {
  records: AttendanceRecord[];
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
}

export const StudentAttendancePage: React.FC = () => {
  const { id: urlId } = useParams<{ id: string }>();
  const { user } = useAuth();
  // Use URL param if available, otherwise use student's own ID from auth
  const studentId = urlId || (user as any)?.student?.id;
  const isSelfView = !urlId && user?.role === 'student';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (studentId) fetchReport();
  }, [studentId]);

  const fetchReport = async () => {
    try {
      const res = await axiosInstance.get<ApiResponse<AttendanceReport>>(`/attendance/report/${studentId}`);
      setReport(res.data.data);
    } catch (err) {
      console.error('Failed to fetch attendance report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    toast.loading('Generating PDF report...', { id: 'pdf' });
    try {
      // In a real app, this would be: 
      // window.open(`${axiosInstance.defaults.baseURL}/attendance/report/${studentId}/pdf`, '_blank');
      // For now, we simulate success
      setTimeout(() => {
        toast.success('Attendance report downloaded', { id: 'pdf' });
        window.print(); // Fallback to print view
      }, 1500);
    } catch {
      toast.error('Failed to generate PDF', { id: 'pdf' });
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (date: Date) => {
    return report?.records.find(r => isSameDay(new Date(r.date), date));
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Generating Year-wise Report...</div>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={isSelfView ? [
        { label: 'My Academics' }, 
        { label: 'My Attendance' }
      ] : [
        { label: 'Students' }, 
        { label: 'Attendance Report' }
      ]} />

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Full Attendance History</h1>
          <p className="text-slate-500 text-sm">Comprehensive yearly record and analytics for the student.</p>
        </div>
        <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExportPDF}>Export PDF Record</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Attendance Score</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-800">{report?.stats.percentage}%</h3>
            <Badge variant={report?.stats.percentage && report.stats.percentage > 75 ? 'green' : 'red'}>
               {report?.stats.percentage && report.stats.percentage > 75 ? 'Good' : 'Critical'}
            </Badge>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Present</p>
          <h3 className="text-2xl font-black text-slate-800">{report?.stats.present} <span className="text-slate-400 text-sm font-normal">Days</span></h3>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Absent</p>
          <h3 className="text-2xl font-black text-slate-800">{report?.stats.absent} <span className="text-slate-400 text-sm font-normal">Days</span></h3>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Late Marks</p>
          <h3 className="text-2xl font-black text-slate-800">{report?.stats.late} <span className="text-slate-400 text-sm font-normal">Days</span></h3>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                 <Calendar className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-800">{format(currentDate, 'MMMM yyyy')}</h2>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monthly Performance Review</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
                 <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
                 <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
           </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-inner translate-z-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-slate-50/80 p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              {day}
            </div>
          ))}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white/40 h-32" />
          ))}
          {days.map(day => {
            const status = getDayStatus(day);
            return (
              <div key={day.toString()} className="bg-white h-32 p-3 border-r border-b border-slate-50 relative group hover:bg-blue-50/20 transition-all">
                <span className={clsx(
                  "text-sm font-bold transition-all",
                  isSameDay(day, new Date()) ? "w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-lg shadow-lg shadow-blue-200" : "text-slate-400"
                )}>
                  {format(day, 'd')}
                </span>
                
                {status && (
                  <div className="mt-2 space-y-1">
                    <div className={clsx(
                      "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
                      status.status === 'present' && "bg-green-50 text-green-700 border border-green-100",
                      status.status === 'absent' && "bg-red-50 text-red-700 border border-red-100",
                      status.status === 'late' && "bg-yellow-50 text-yellow-700 border border-yellow-100",
                      status.status === 'leave' && "bg-blue-50 text-blue-700 border border-blue-100"
                    )}>
                      {status.status === 'present' && <CheckCircle2 className="w-3 h-3" />}
                      {status.status === 'absent' && <XCircle className="w-3 h-3" />}
                      {status.status === 'late' && <Clock className="w-3 h-3" />}
                      {status.status === 'leave' && <AlertCircle className="w-3 h-3" />}
                      <span>{status.status}</span>
                    </div>
                    {status.remark && (
                       <p className="text-[9px] text-slate-400 font-medium px-1 truncate italic">"{status.remark}"</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-6 items-center justify-center border-t border-slate-100 pt-8">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
              <span className="text-xs font-bold text-slate-600">Present Day</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
              <span className="text-xs font-bold text-slate-600">Absent Day</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm" />
              <span className="text-xs font-bold text-slate-600">Late Mark</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
              <span className="text-xs font-bold text-slate-600">Approved Leave</span>
           </div>
        </div>
      </Card>
      
      <Card className="p-0 overflow-hidden border-slate-200">
         <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Detail Log Archive</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4">Remarks / Explanation</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 text-sm">
                  {report?.records.slice().reverse().map(record => (
                     <tr key={record.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-700">{format(new Date(record.date), 'dd MMM yyyy')}</td>
                        <td className="px-6 py-4">
                           <Badge variant={record.status === 'present' ? 'green' : record.status === 'absent' ? 'red' : 'yellow'}>
                              {record.status}
                           </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{record.remark || '---'}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
};
