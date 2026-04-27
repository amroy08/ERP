import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import axiosInstance from '../../api/axiosInstance';
import { usePermissions } from '../../hooks/usePermissions';
import { Teacher, TableColumn, ApiResponse } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const TeachersListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRole, hasPermission } = usePermissions();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/teachers?limit=50');
      setTeachers(res.data.data || []);
    } catch {
      setTeachers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isRole(['teacher'])) {
      navigate('/profile', { replace: true });
    } else {
      fetchTeachers();
    }
  }, []); // Run once on mount

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete teacher account for ${name}?`)) return;
    try {
      await axiosInstance.delete(`/teachers/${id}`);
      toast.success('Teacher deactivated');
      fetchTeachers();
    } catch {
      toast.error('Failed to deactivate teacher');
    }
  };

  const filtered = teachers.filter((t) =>
    (t.user?.name || t.fullName)?.toLowerCase().includes(search.toLowerCase()) ||
    (t.user?.email || t.email)?.toLowerCase().includes(search.toLowerCase()) ||
    t.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: TableColumn<Record<string, unknown>>[] = [
    {
      key: 'employeeId',
      label: 'Employee ID',
      render: (val) => <span className="font-mono text-xs font-medium text-blue-600">{String(val)}</span>,
    },
    {
      key: 'fullName',
      label: 'Teacher Name',
      render: (_, row) => {
        const t = row as unknown as Teacher;
        const name = t.user?.name || t.fullName || 'Unknown';
        const email = t.user?.email || t.email;
        const phone = t.user?.phone || t.phone;
        
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs">
              {name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-slate-800">{name}</div>
              <div className="text-[10px] text-slate-400 font-medium">{email}</div>
            </div>
          </div>
        );
      },
    },
    { 
      key: 'phone', 
      label: 'Phone', 
      render: (_, row) => {
        const t = row as unknown as Teacher;
        return <span className="text-sm text-slate-600">{t.user?.phone || t.phone || '—'}</span>;
      }
    },
    { key: 'qualification', label: 'Qualification', render: (val) => <span className="text-sm">{String(val)}</span> },
    {
      key: 'joiningDate',
      label: 'Joining Date',
      render: (val) => val ? format(new Date(String(val)), 'dd MMM yyyy') : '—',
    },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={String(val)} /> },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row: any) => (
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" className="h-8 px-2" onClick={() => navigate(`/teachers/${row.id}`)}>
            <Eye className="w-4 h-4" />
          </Button>
          {hasPermission('teacher:update') && (
            <Button variant="secondary" size="sm" className="h-8 px-2" onClick={() => navigate(`/teachers/${row.id}/edit`)}>
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {hasPermission('teacher:delete') && (
            <Button variant="danger" size="sm" className="h-8 px-2" onClick={() => handleDelete(row.id, row.fullName)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ];


  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Teachers' }]} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Teachers</h1>
          <p className="text-slate-500 text-sm">{filtered.length} teachers on record</p>
        </div>
        {hasPermission('teacher:create') && (
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/teachers/new')}>Add Teacher</Button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teachers..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filtered as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        emptyMessage="No teachers found"
        keyExtractor={(row) => (row as unknown as Teacher).id}
      />
    </div>
  );
};
