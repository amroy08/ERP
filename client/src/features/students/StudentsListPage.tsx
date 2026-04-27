import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, User, Eye, Edit2, ShieldAlert, Trash2, Calendar, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, X, Info } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import { usePermissions } from '../../hooks/usePermissions';
import { Student, ClassDoc, SectionDoc, ApiResponse, PaginatedResponse } from '../../types';
import clsx from 'clsx';

export const StudentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRole, hasPermission } = usePermissions();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [sections, setSections] = useState<SectionDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Import Modal
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRole(['student'])) {
      navigate('/profile', { replace: true });
    } else {
      fetchInitialData();
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, classFilter, sectionFilter, statusFilter, pagination.page]);

  const fetchInitialData = async () => {
    try {
      const res = await axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes');
      setClasses(res.data.data);
    } catch (err) {
      console.error('Failed to fetch classes');
    }
  };

  useEffect(() => {
    if (classFilter) {
      axiosInstance.get<ApiResponse<SectionDoc[]>>(`/sections?classId=${classFilter}`).then(res => setSections(res.data.data));
    } else {
      setSections([]);
    }
    setSectionFilter('');
  }, [classFilter]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);
      if (sectionFilter) params.set('sectionId', sectionFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await axiosInstance.get<PaginatedResponse<Student>>(`/students?${params}`);
      setStudents(res.data.data || []);
      setPagination(prev => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (err) {
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/students/${id}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  // ── Import Handlers ─────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setImportFile(file);
      setImportResult(null);
    } else {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await axiosInstance.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(res.data.data);
      if (res.data.data.success > 0) {
        toast.success(`${res.data.data.success} students imported successfully!`);
        fetchStudents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
      setImportResult({ success: 0, failed: 0, errors: [err.response?.data?.message || 'Server error'] });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['First Name', 'Last Name', 'Class', 'Section', 'Gender', 'Date of Birth', 'Roll Number', 'Father Name', 'Father Phone', 'Mother Name', 'Mother Phone', 'Aadhaar', 'Religion', 'Category', 'Blood Group', 'Address'];
    const sampleRow = ['Rahul', 'Sharma', 'Class 1', 'A', 'Male', '2015-06-15', '1', 'Rajesh Sharma', '9876543210', 'Priya Sharma', '9876543211', '', 'Hindu', 'General', 'B+', '123 Main Street, Mumbai'];
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const closeImportModal = () => {
    setIsImportOpen(false);
    setImportFile(null);
    setImportResult(null);
    setIsDragging(false);
  };

  const columns = [
    { 
      key: 'fullName', 
      label: 'Student', 
      render: (_: any, row: any) => {
        const student = row as Student;
        return (
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
                {student.profilePhoto ? <img src={student.profilePhoto} alt="" /> : <User className="w-5 h-5" />}
             </div>
             <div>
                <p className="text-sm font-bold text-slate-800">{student.fullName}</p>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider">{student.admissionNumber}</p>
             </div>
          </div>
        );
      }
    },
    { 
      key: 'class', 
      label: 'Class & Section', 
      render: (_: any, row: any) => {
        const student = row as Student;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">{student.class?.name || '—'}</span>
            <span className="text-xs text-slate-400">Section {student.section?.name || '—'}</span>
          </div>
        );
      }
    },
    {
      key: 'parent',
      label: 'Guardian',
      render: (_: any, row: any) => {
        const student = row as Student;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">{student.parent?.fatherName || '—'}</span>
            <span className="text-xs text-slate-400">{student.parent?.fatherPhone || '—'}</span>
          </div>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val: any) => <StatusBadge status={String(val)} /> 
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 px-2"
            onClick={() => navigate(`/students/${row.id}`)}
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 px-2"
            onClick={() => navigate(`/students/${row.id}/attendance`)}
            title="Attendance Report"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
          </Button>
          {hasPermission('student:update') && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => navigate(`/students/${row.id}/edit`)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {hasPermission('student:delete') && (
            <Button 
              variant="danger" 
              size="sm" 
              className="h-8 px-2 ml-1"
              onClick={() => handleDeleteStudent(row.id, row.fullName)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const canAddStudent = hasPermission('student:create');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'People' }, { label: 'Students' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Directory</h1>
          <p className="text-slate-500 text-sm">Manage student records, academic history and personal profiles.</p>
        </div>
        <div className="flex gap-2">
          {canAddStudent && (
            <Button 
              variant="secondary" 
              icon={<Upload className="w-4 h-4" />} 
              onClick={() => setIsImportOpen(true)}
            >
              Import Excel
            </Button>
          )}
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>Export CSV</Button>
          {canAddStudent && (
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/admissions/new')}>Enroll Student</Button>
          )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[280px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID or phone..." 
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
            />
          </div>
          <div className="flex flex-wrap gap-3">
             <select 
               value={classFilter} 
               onChange={e => setClassFilter(e.target.value)}
               className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
             >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
             <select 
               value={sectionFilter} 
               onChange={e => setSectionFilter(e.target.value)}
               className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
               disabled={!classFilter}
             >
                <option value="">All Sections</option>
                {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
             </select>
             <select 
               value={statusFilter} 
               onChange={e => setStatusFilter(e.target.value)}
               className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
             >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
                <option value="alumni">Alumni</option>
             </select>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={students as any} 
          isLoading={isLoading} 
          emptyMessage="No students found matching your criteria." 
          keyExtractor={(row) => (row as Student).id}
        />
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center text-xs text-slate-500">
           <p>Showing {students.length} of {pagination.total} students</p>
           <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({...p, page: p.page - 1}))}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => setPagination(p => ({...p, page: p.page + 1}))}>Next</Button>
           </div>
        </div>
      </Card>
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800">
         <ShieldAlert className="w-5 h-5 shrink-0" />
         <p className="text-xs leading-relaxed">
           <strong>Data Privacy Note:</strong> Student records contain sensitive personal information. Access is logged and restricted based on your role's permissions. Exporting large datasets requires administrative audit approval.
         </p>
      </div>

      {/* ── Import Modal ────────────────────────────────────── */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeImportModal}>
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Import Students from Excel</h2>
                  <p className="text-xs text-slate-500 font-medium">Bulk add students from an Excel spreadsheet</p>
                </div>
              </div>
              <button onClick={closeImportModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-bold text-blue-800">Need a template?</p>
                    <p className="text-xs text-blue-600">Download a sample file with all required columns.</p>
                  </div>
                </div>
                <button 
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Download Template
                </button>
              </div>

              {/* Drop Zone */}
              {!importResult && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={clsx(
                    "relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300",
                    isDragging 
                      ? "border-emerald-400 bg-emerald-50 scale-[1.02]" 
                      : importFile
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {importFile ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{importFile.name}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {(importFile.size / 1024).toFixed(1)} KB · Ready to import
                        </p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                        className="text-xs text-red-500 font-bold hover:text-red-700 transition-colors"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          Drop your Excel file here or <span className="text-blue-600">browse</span>
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          Supports .xlsx, .xls, and .csv files (max 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Import Results */}
              {importResult && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-2xl font-black text-emerald-700">{importResult.success}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Imported</p>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
                      <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-2xl font-black text-red-600">{importResult.failed}</p>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Failed</p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 max-h-48 overflow-y-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Error Details</p>
                      </div>
                      <div className="space-y-1">
                        {importResult.errors.map((err, idx) => (
                          <p key={idx} className="text-xs text-amber-700 font-medium py-1 border-b border-amber-100 last:border-0">
                            {err}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Required Columns Info */}
              {!importResult && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Required Columns</p>
                  <div className="flex flex-wrap gap-2">
                    {['First Name', 'Class', 'Father Name', 'Father Phone'].map(col => (
                      <span key={col} className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100">
                        {col} *
                      </span>
                    ))}
                    {['Last Name', 'Section', 'Gender', 'DOB', 'Roll Number', 'Mother Name', 'Aadhaar', 'Address'].map(col => (
                      <span key={col} className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">
                        {col}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 italic font-medium">
                    Column names are flexible — "Father Name", "father_name", "FatherName" all work. Class can be "Class 1", "1", or "Class 1".
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-3xl">
              <Button variant="secondary" onClick={closeImportModal}>
                {importResult ? 'Close' : 'Cancel'}
              </Button>
              {!importResult && (
                <Button 
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  isLoading={isImporting}
                  icon={<Upload className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                >
                  {isImporting ? 'Importing...' : 'Start Import'}
                </Button>
              )}
              {importResult && importResult.success > 0 && (
                <Button 
                  onClick={() => { closeImportModal(); }}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
