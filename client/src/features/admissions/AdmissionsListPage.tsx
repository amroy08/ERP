import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download, Filter, Eye, Users } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { AdmissionDetailsModal } from './AdmissionDetailsModal';
import axiosInstance from '../../api/axiosInstance';
import { usePermissions } from '../../hooks/usePermissions';
import { Admission, TableColumn, ApiResponse } from '../../types';
import { format } from 'date-fns';

// Helper: safely extract any nested field
const get = (row: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce((obj: any, key) => obj?.[key], row);
};

export const AdmissionsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRole } = usePermissions();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal state
  const [selectedAdmission, setSelectedAdmission] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAdmissions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await axiosInstance.get<ApiResponse<any[]>>(`/admissions?${params}`);
      setAdmissions(res.data.data || []);
    } catch (err) {
      setAdmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [search, statusFilter]);

  const handleRowClick = async (rawRow: Record<string, unknown>) => {
    // Fetch the full admission with relations for the modal
    try {
      const res = await axiosInstance.get<ApiResponse<any>>(`/admissions/${rawRow.id}`);
      setSelectedAdmission(res.data.data);
    } catch {
      setSelectedAdmission(rawRow); // Fallback to row data
    }
    setIsModalOpen(true);
  };

  const columns: TableColumn<Record<string, unknown>>[] = [
    { 
      key: 'firstName', 
      label: 'Student Name', 
      sortable: true, 
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{String(row.firstName || '')} {String(row.lastName || '')}</span>
          <span className="text-[10px] text-slate-400 font-mono italic">
            {String(row.applicationNo || `APP-${String(row.id).slice(-6).toUpperCase()}`)}
          </span>
        </div>
      ) 
    },
    { 
      key: 'class', 
      label: 'Class Applied', 
      render: (val) => {
        const cls = val as any;
        return <Badge variant="blue">{cls?.name || '—'}</Badge>;
      }
    },
    { 
      key: 'parentName', 
      label: "Guardian Name", 
      render: (val) => <span className="text-sm text-slate-600 font-medium">{String(val || '—')}</span> 
    },
    { 
      key: 'parentPhone', 
      label: 'Contact', 
      render: (val) => <span className="text-sm text-slate-600">{String(val || '—')}</span> 
    },
    {
      key: 'createdAt',
      label: 'Date Applied',
      render: (val) => {
        try {
          return val ? format(new Date(String(val)), 'dd MMM yyyy') : '—';
        } catch {
          return '—';
        }
      }
    },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={String(val || 'new')} /> },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <Button 
          variant="secondary" 
          size="sm" 
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => { e.stopPropagation(); handleRowClick(row); }}
        >
          Details
        </Button>
      ),
    },
  ];

  const totalCount = admissions.length;
  const newCount = admissions.filter(a => a.status === 'new').length;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admissions & CRM' }, { label: 'Applications' }]} />
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admission Applications</h1>
          <p className="text-slate-500 text-sm">Review, manage, and enroll new students into the system.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>Export List</Button>
          {isRole(['super_admin', 'admin', 'clerk']) && (
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/admissions/new')}>New Application</Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: totalCount, color: 'bg-slate-100 text-slate-700' },
          { label: 'New', value: newCount, color: 'bg-blue-50 text-blue-700' },
          { label: 'Under Review', value: admissions.filter(a => a.status === 'under_review').length, color: 'bg-amber-50 text-amber-700' },
          { label: 'Enrolled', value: admissions.filter(a => a.status === 'enrolled').length, color: 'bg-emerald-50 text-emerald-700' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-4 border border-black/5`}>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[300px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search by student or guardian name, phone..." 
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" 
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="new">🆕 New</option>
            <option value="under_review">⏳ Under Review</option>
            <option value="accepted">✅ Accepted</option>
            <option value="rejected">❌ Rejected</option>
            <option value="enrolled">🎓 Enrolled</option>
          </select>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={admissions} 
        isLoading={isLoading} 
        emptyMessage="No admission applications found." 
        keyExtractor={(row) => String(row.id)} 
      />

      <AdmissionDetailsModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedAdmission(null); }}
        admission={selectedAdmission}
        onUpdate={fetchAdmissions}
      />
    </div>
  );
};
