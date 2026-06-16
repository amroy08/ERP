import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Plus, Calendar,
  FileText, Trash2, Save, AlertCircle,
  Users, ChevronRight, ArrowLeft, Eye,
  CheckCircle2, Clock, RotateCcw, XCircle,
  Download, MessageSquare, Star, Filter,
  TrendingUp, AlertTriangle, RefreshCw
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
import { clsx } from 'clsx';

// ── Types ──────────────────────────────────────────────────────────────────

interface SubmissionStudent {
  studentId: string;
  studentName: string;
  admissionNumber: string | null;
  rollNumber: string | null;
  submissionId: string | null;
  status: 'pending' | 'submitted' | 'late' | 'reviewed' | 'returned';
  submittedAt: string | null;
  hasFile: boolean;
  hasText: boolean;
  fileName: string | null;
  marks: number | null;
  teacherFeedback: string | null;
  reviewedAt: string | null;
}

interface SubmissionsData {
  homework: {
    homeworkId: string;
    title: string;
    description: string;
    className: string;
    sectionName: string | null;
    subjectName: string;
    dueDate: string;
    assignedBy: string | null;
  };
  stats: {
    total: number;
    submittedCount: number;
    pendingCount: number;
    reviewedCount: number;
    returnedCount: number;
    lateCount: number;
  };
  students: SubmissionStudent[];
}

interface SubmissionDetail {
  submissionId: string;
  homeworkId: string;
  homeworkTitle: string;
  className: string;
  sectionName: string | null;
  subjectName: string;
  dueDate: string;
  student: {
    studentId: string;
    studentName: string;
    admissionNumber: string | null;
    rollNumber: string | null;
  };
  submissionText: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: string;
  submittedAt: string;
  teacherFeedback: string | null;
  marks: number | null;
  reviewedAt: string | null;
  canReview: boolean;
  canReturn: boolean;
  canDownload: boolean;
}

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',  color: 'bg-slate-100 text-slate-600 border-slate-200',      icon: <Clock className="w-3 h-3" /> },
  submitted: { label: 'Submitted',color: 'bg-blue-50 text-blue-700 border-blue-200',           icon: <CheckCircle2 className="w-3 h-3" /> },
  late:      { label: 'Late',     color: 'bg-amber-50 text-amber-700 border-amber-200',         icon: <AlertTriangle className="w-3 h-3" /> },
  reviewed:  { label: 'Reviewed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200',   icon: <Star className="w-3 h-3" /> },
  returned:  { label: 'Returned', color: 'bg-purple-50 text-purple-700 border-purple-200',      icon: <RotateCcw className="w-3 h-3" /> },
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border', cfg.color)}>
      {cfg.icon}{cfg.label}
    </span>
  );
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Main Component ─────────────────────────────────────────────────────────

export const HomeworkPage: React.FC = () => {
  const { user, activeStudentId } = useAuth();
  const isStudent = user?.role === 'student' || user?.role === 'parent';
  const canReviewSubmissions = !isStudent; // admin, super_admin, teacher, clerk, principal

  // ── View state ────────────────────────────────────────────────────────────
  const [view, setView] = useState<'list' | 'submissions'>('list');

  // ── List state ────────────────────────────────────────────────────────────
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [sections, setSections] = useState<SectionDoc[]>([]);
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', classId: '', sectionId: '', subjectId: '', dueDate: '', fileUrl: '' });

  // ── Submissions state ─────────────────────────────────────────────────────
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [submissionsData, setSubmissionsData] = useState<SubmissionsData | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [subFilter, setSubFilter] = useState<'all' | 'pending' | 'submitted' | 'late' | 'reviewed' | 'returned'>('all');

  // ── Review modal state ────────────────────────────────────────────────────
  const [reviewDetail, setReviewDetail] = useState<SubmissionDetail | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDetailLoading, setReviewDetailLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ feedback: '', marks: '' });
  const [isReviewing, setIsReviewing] = useState(false);

  // ── Load student info ─────────────────────────────────────────────────────
  useEffect(() => {
    if (activeStudentId && isStudent) {
      axiosInstance.get<ApiResponse<any>>(`/students/${activeStudentId}`)
        .then(res => setStudentInfo(res.data.data))
        .catch(err => console.error('Failed to load student details for homework:', err));
    }
  }, [activeStudentId, isStudent]);

  // ── Fetch homework list ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isStudent) {
        const targetStudentId = activeStudentId || (user as any)?.student?.id;
        if (targetStudentId) {
          let classId = studentInfo?.classId || studentInfo?.class?.id;
          let sectionId = studentInfo?.sectionId || studentInfo?.section?.id;
          if (!classId) {
            const studentRes = await axiosInstance.get<ApiResponse<any>>(`/students/${targetStudentId}`);
            classId = studentRes.data.data?.classId || studentRes.data.data?.class?.id;
            sectionId = studentRes.data.data?.sectionId || studentRes.data.data?.section?.id;
          }
          const hwRes = await axiosInstance.get<ApiResponse<Homework[]>>(`/homework?classId=${classId || ''}&sectionId=${sectionId || ''}`);
          setHomeworks(hwRes.data.data);
        } else {
          setHomeworks([]);
        }
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
    } catch {
      toast.error('Failed to load homework data');
    } finally {
      setIsLoading(false);
    }
  }, [isStudent, activeStudentId, studentInfo, user]);

  useEffect(() => { fetchData(); }, [activeStudentId, studentInfo]);

  useEffect(() => {
    if (form.classId) {
      axiosInstance.get<ApiResponse<SectionDoc[]>>(`/sections?classId=${form.classId}`)
        .then(res => setSections(res.data.data));
    } else {
      setSections([]);
    }
  }, [form.classId]);

  // ── Homework CRUD ─────────────────────────────────────────────────────────
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

  // ── Submissions view ──────────────────────────────────────────────────────
  const openSubmissions = async (hw: Homework) => {
    setSelectedHomework(hw);
    setView('submissions');
    setSubFilter('all');
    setSubmissionsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<SubmissionsData>>(`/homework/${hw.id}/submissions`);
      setSubmissionsData(res.data.data);
    } catch {
      toast.error('Failed to load submissions');
      setView('list');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const refreshSubmissions = async () => {
    if (!selectedHomework) return;
    setSubmissionsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<SubmissionsData>>(`/homework/${selectedHomework.id}/submissions`);
      setSubmissionsData(res.data.data);
    } catch {
      toast.error('Failed to refresh submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // ── Review modal ──────────────────────────────────────────────────────────
  const openReviewModal = async (submissionId: string) => {
    setReviewDetailLoading(true);
    setReviewModalOpen(true);
    try {
      const res = await axiosInstance.get<ApiResponse<SubmissionDetail>>(`/homework/submissions/${submissionId}`);
      setReviewDetail(res.data.data);
      setReviewForm({ feedback: res.data.data.teacherFeedback ?? '', marks: res.data.data.marks?.toString() ?? '' });
    } catch {
      toast.error('Failed to load submission detail');
      setReviewModalOpen(false);
    } finally {
      setReviewDetailLoading(false);
    }
  };

  const handleReview = async (status: 'reviewed' | 'returned') => {
    if (!reviewDetail) return;
    setIsReviewing(true);
    try {
      const marksVal = reviewForm.marks !== '' ? parseFloat(reviewForm.marks) : undefined;
      await axiosInstance.patch(`/homework/submissions/${reviewDetail.submissionId}/review`, {
        status,
        teacherFeedback: reviewForm.feedback || undefined,
        marks: marksVal
      });
      toast.success(status === 'reviewed' ? 'Marked as reviewed ✓' : 'Returned to student');
      setReviewModalOpen(false);
      setReviewDetail(null);
      await refreshSubmissions();
    } catch {
      toast.error('Failed to update submission');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDownload = (submissionId: string) => {
    const token = (axiosInstance.defaults.headers as any)?.Authorization
      ?? `Bearer ${(document.cookie.match(/accessToken=([^;]+)/) || [])[1] ?? ''}`;
    window.open(`/api/homework/submissions/${submissionId}/download`, '_blank');
  };

  // ── Filtered submissions ──────────────────────────────────────────────────
  const filteredStudents = submissionsData?.students.filter(s =>
    subFilter === 'all' ? true : s.status === subFilter
  ) ?? [];

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: SUBMISSIONS
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === 'submissions' && selectedHomework) {
    const stats = submissionsData?.stats;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Breadcrumb items={[
          { label: 'Academics' },
          { label: 'Homework', onClick: () => setView('list') },
          { label: 'Submissions' }
        ]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('list')}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedHomework.title}</h1>
              <p className="text-slate-500 text-sm font-medium">
                {(selectedHomework as any).subject?.name} · {(selectedHomework as any).class?.name}
                {(selectedHomework as any).section?.name && ` · Section ${(selectedHomework as any).section.name}`}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={refreshSubmissions}
            isLoading={submissionsLoading}
          >
            Refresh
          </Button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Total',     value: stats.total,          color: 'bg-slate-800 text-white' },
              { label: 'Submitted', value: stats.submittedCount, color: 'bg-blue-600 text-white' },
              { label: 'Pending',   value: stats.pendingCount,   color: 'bg-slate-100 text-slate-700' },
              { label: 'Reviewed',  value: stats.reviewedCount,  color: 'bg-emerald-500 text-white' },
              { label: 'Returned',  value: stats.returnedCount,  color: 'bg-purple-500 text-white' },
              { label: 'Late',      value: stats.lateCount,      color: 'bg-amber-500 text-white' },
            ].map(s => (
              <div key={s.label} className={clsx('rounded-2xl p-4 text-center', s.color)}>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'submitted', 'late', 'reviewed', 'returned'] as const).map(f => (
            <button
              key={f}
              onClick={() => setSubFilter(f)}
              className={clsx(
                'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all border',
                subFilter === f
                  ? 'bg-slate-800 text-white border-transparent shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              )}
            >
              {f === 'all' ? `All (${submissionsData?.students.length ?? 0})` : `${f} (${submissionsData?.students.filter(s => s.status === f).length ?? 0})`}
            </button>
          ))}
        </div>

        {/* Submissions table */}
        <Card className="p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-100/50">
          {submissionsLoading ? (
            <div className="p-20 text-center animate-pulse space-y-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-48 mx-auto" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-20 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-slate-500 font-bold">No submissions found for this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Content</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewed</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => (
                    <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                            {student.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-700">{student.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {student.rollNumber ? `#${student.rollNumber}` : student.admissionNumber ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={student.status} />
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 font-medium">
                        {student.submittedAt ? format(new Date(student.submittedAt), 'dd MMM, h:mm a') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {student.hasText && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase">
                              <FileText className="w-2.5 h-2.5" />Text
                            </span>
                          )}
                          {student.hasFile && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">
                              <Download className="w-2.5 h-2.5" />File
                            </span>
                          )}
                          {!student.hasText && !student.hasFile && (
                            <span className="text-slate-300 text-[10px] font-bold">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-slate-700">
                        {student.marks !== null ? student.marks : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 font-medium">
                        {student.reviewedAt ? format(new Date(student.reviewedAt), 'dd MMM') : '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {student.submissionId ? (
                          <Button
                            size="sm"
                            variant={student.status === 'pending' ? 'secondary' : 'primary'}
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => openReviewModal(student.submissionId!)}
                            className="text-[10px] font-black uppercase tracking-wide h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {['submitted', 'late'].includes(student.status) ? 'Review' : 'View'}
                          </Button>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold uppercase">Not submitted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Review Modal */}
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => { setReviewModalOpen(false); setReviewDetail(null); }}
          title="Submission Review"
          size="lg"
        >
          {reviewDetailLoading ? (
            <div className="p-12 text-center animate-pulse space-y-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-40 mx-auto" />
            </div>
          ) : reviewDetail ? (
            <div className="p-6 space-y-6">
              {/* Student + homework info header */}
              <div className="flex items-start justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                    {reviewDetail.student.studentName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{reviewDetail.student.studentName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {reviewDetail.student.rollNumber ? `#${reviewDetail.student.rollNumber}` : reviewDetail.student.admissionNumber ?? '—'}
                    </p>
                  </div>
                </div>
                <StatusPill status={reviewDetail.status} />
              </div>

              {/* Homework info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Homework</p>
                  <p className="font-bold text-blue-800">{reviewDetail.homeworkTitle}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject</p>
                  <p className="font-bold text-slate-700">{reviewDetail.subjectName}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
                  <p className="font-bold text-slate-700">{format(new Date(reviewDetail.submittedAt), 'dd MMM yyyy, h:mm a')}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                  <p className="font-bold text-slate-700">{format(new Date(reviewDetail.dueDate), 'dd MMM yyyy')}</p>
                </div>
              </div>

              {/* Submission content */}
              {reviewDetail.submissionText && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Submission Text</p>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto font-medium">
                    {reviewDetail.submissionText}
                  </div>
                </div>
              )}

              {/* File */}
              {reviewDetail.canDownload && reviewDetail.fileName && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-emerald-800 truncate">{reviewDetail.fileName}</p>
                    {reviewDetail.fileSize && (
                      <p className="text-[10px] text-emerald-600 font-bold">{formatFileSize(reviewDetail.fileSize)}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleDownload(reviewDetail.submissionId)}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  >
                    Download
                  </Button>
                </div>
              )}

              {/* Review form */}
              {(reviewDetail.canReview || reviewDetail.canReturn) && (
                <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Teacher Feedback</p>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Feedback / Comments</label>
                    <textarea
                      rows={3}
                      className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-300"
                      placeholder="Great work! Improve on..."
                      value={reviewForm.feedback}
                      onChange={e => setReviewForm(prev => ({ ...prev, feedback: e.target.value }))}
                    />
                  </div>
                  <div className="w-40">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Marks (Optional)</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 8"
                      value={reviewForm.marks}
                      onChange={e => setReviewForm(prev => ({ ...prev, marks: e.target.value }))}
                      className="h-10 font-bold text-center"
                    />
                  </div>
                </div>
              )}

              {/* Existing feedback (read-only if already reviewed) */}
              {!reviewDetail.canReview && !reviewDetail.canReturn && reviewDetail.teacherFeedback && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Teacher Feedback</p>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-800 font-medium">
                    {reviewDetail.teacherFeedback}
                  </div>
                  {reviewDetail.marks !== null && (
                    <p className="text-xs font-black text-slate-500 mt-2 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      Marks awarded: <span className="text-slate-800">{reviewDetail.marks}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setReviewModalOpen(false)}>Close</Button>
                {reviewDetail.canReview && (
                  <>
                    <Button
                      variant="secondary"
                      icon={<RotateCcw className="w-4 h-4" />}
                      onClick={() => handleReview('returned')}
                      isLoading={isReviewing}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      Return
                    </Button>
                    <Button
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => handleReview('reviewed')}
                      isLoading={isReviewing}
                    >
                      Mark Reviewed
                    </Button>
                  </>
                )}
                {reviewDetail.canReturn && (
                  <Button
                    variant="secondary"
                    icon={<RotateCcw className="w-4 h-4" />}
                    onClick={() => handleReview('returned')}
                    isLoading={isReviewing}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    Return for Resubmission
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: LIST
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Academics' }, { label: 'Homework' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Homework Assignments</h1>
          <p className="text-slate-500 text-sm">
            {isStudent
              ? 'Assignments from your class teacher will appear here.'
              : 'Create and manage daily student tasks. Click a card to view submissions.'}
          </p>
        </div>
        {!isStudent && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>Assign Homework</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
          ))
        ) : homeworks.length > 0 ? (
          homeworks.map((hw) => {
            const isOverdue = new Date(hw.dueDate) < new Date();
            return (
              <Card
                key={hw.id}
                className={clsx(
                  'p-0 overflow-hidden border-slate-200 hover:shadow-xl transition-all flex flex-col group min-h-[280px]',
                  canReviewSubmissions && 'cursor-pointer hover:-translate-y-1 duration-300'
                )}
                onClick={canReviewSubmissions ? () => openSubmissions(hw) : undefined}
              >
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <Badge variant="blue" className="w-fit text-[10px] font-black uppercase tracking-widest">{hw.subject?.name}</Badge>
                      <p className="text-xs font-bold text-slate-400">Section {hw.section?.name ?? '—'}</p>
                    </div>
                    {!isStudent && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(hw.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
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
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                      {hw.assignedBy?.user?.name?.charAt(0) ?? '?'}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">By {hw.assignedBy?.user?.name ?? 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isOverdue ? 'red' : 'emerald'} className="text-[9px]">
                      {isOverdue ? 'EXPIRED' : 'ACTIVE'}
                    </Badge>
                    {canReviewSubmissions && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Users className="w-3 h-3" />Submissions
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full">
            <EmptyState
              title="No Homework Found"
              description={isStudent ? 'Homework assigned by your class teacher will appear here.' : 'Assignments created by Class Teachers will appear here.'}
              icon={<BookOpen className="w-12 h-12" />}
              action={!isStudent ? { label: 'Create First Task', onClick: () => setIsModalOpen(true), icon: <Plus className="w-4 h-4" /> } : undefined}
            />
          </div>
        )}
      </div>

      {/* Assign Homework Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign New Homework" size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Task Title</label>
              <Input
                placeholder="e.g. Chapter 4 Exercise Solutions"
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Class</label>
              <select
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                required
                value={form.classId}
                onChange={e => setForm({ ...form, classId: e.target.value, sectionId: '' })}
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
                onChange={e => setForm({ ...form, sectionId: e.target.value })}
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
                onChange={e => setForm({ ...form, subjectId: e.target.value })}
              >
                <option value="">Select Subject...</option>
                {subjects.filter(s => !form.classId || s.class?.id === form.classId)
                  .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Due Date</label>
              <Input
                type="date"
                required
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Instructions / Details</label>
            <textarea
              rows={4}
              className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              placeholder="Provide detailed instructions..."
              required
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Resource URL (Optional PDF/Link)</label>
            <Input
              placeholder="https://storage.link/assignment.pdf"
              value={form.fileUrl}
              onChange={e => setForm({ ...form, fileUrl: e.target.value })}
            />
            <p className="text-[10px] text-slate-400 mt-2 px-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Only the assigned Class Teacher for the selected section can assign homework.
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
