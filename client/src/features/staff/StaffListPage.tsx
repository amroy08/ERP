import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SchoolFilter } from '../../components/common/SchoolFilter';
import axiosInstance from '../../api/axiosInstance';
import { usePermissions } from '../../hooks/usePermissions';
import { Staff, TableColumn } from '../../types';
import toast from 'react-hot-toast';

export const StaffListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRole, hasPermission } = usePermissions();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/staff?limit=50${schoolFilter ? `&schoolId=${schoolFilter}` : ''}`);
      setStaff(res.data.data || []);
    } catch {
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [schoolFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete staff account for ${name}?`)) return;
    try {
      await axiosInstance.delete(`/staff/${id}`);
      toast.success('Staff member removed');
      fetchStaff();
    } catch {
      toast.error('Failed to remove staff');
    }
  };

  const filtered = staff.filter((s) =>
    (s.user?.name || s.fullName)?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase()) ||
    s.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: TableColumn<Record<string, unknown>>[] = [
    { key: 'employeeId', label: 'Employee ID', render: (val) => <span className="font-mono text-xs font-medium text-purple-600">{String(val)}</span> },
    { 
      label: 'Name', 
      sortable: true,
      render: (_, row: any) => row.user?.name || row.fullName || '—'
    },
    ...(isRole(['super_admin']) ? [{
      key: 'school',
      label: 'School',
      render: (_: any, row: any) => (
        <Badge variant="blue" className="bg-blue-50 text-blue-600 border-blue-100">
          {row.school?.name || 'N/A'}
        </Badge>
      )
    }] : []),
    { key: 'department', label: 'Department', sortable: true },
    { key: 'role', label: 'Role', render: (_, row: any) => row.designation || row.role || '—' },
    { 
      key: 'phone', 
      label: 'Phone',
      render: (_, row: any) => row.user?.phone || row.phone || '—'
    },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={String(val)} /> },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row: any) => (
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" className="h-8 px-2" onClick={() => navigate(`/staff/${row.id}`)}>
            <Eye className="w-4 h-4" />
          </Button>
          {hasPermission('staff:update') && (
            <Button variant="secondary" size="sm" className="h-8 px-2" onClick={() => navigate(`/staff/${row.id}/edit`)}>
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {hasPermission('staff:delete') && (
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
      <Breadcrumb items={[{ label: 'Staff' }]} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Non-Teaching Staff</h1>
          <p className="text-slate-500 text-sm">{filtered.length} staff members</p>
        </div>
        {hasPermission('staff:create') && (
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/staff/new')}>Add Staff</Button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        {isRole(['super_admin']) && (
          <SchoolFilter value={schoolFilter} onChange={setSchoolFilter} />
        )}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} isLoading={isLoading} emptyMessage="No staff found" keyExtractor={(row) => (row as unknown as Staff).id} />
    </div>
  );
};
