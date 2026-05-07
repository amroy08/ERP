import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, User, Phone, Mail, Users, ExternalLink, Trash2 } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { Parent, ApiResponse } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const ParentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchParents = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<Parent[]>>(`/parents?search=${search}`);
      setParents(res.data.data);
    } catch {
      setParents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const token = localStorage.getItem('erp_access_token');
    const url = `${axiosInstance.defaults.baseURL}/reports/export?type=parents&format=csv&token=${token}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parents_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Parents export started!');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the record for ${name}? This action cannot be undone.`)) return;
    
    try {
      await axiosInstance.delete(`/parents/${id}`);
      setParents(prev => prev.filter(p => p.id !== id));
      toast.success('Guardian record removed');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete guardian');
    }
  };

  const columns = [
    { 
      key: 'fatherName', 
      label: 'Guardian Name', 
      render: (_: any, row: any) => {
        const p = row as Parent;
        return (
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold">
                {p.fatherName.charAt(0)}
             </div>
             <div>
                <p className="text-sm font-bold text-slate-800">{p.fatherName}</p>
                <p className="text-xs text-slate-500 font-medium">{p.fatherOccupation || 'Guardian'}</p>
             </div>
          </div>
        );
      }
    },
    { 
      key: 'contact', 
      label: 'Contact Information', 
      render: (_: any, row: any) => {
        const p = row as Parent;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-slate-600">
               <Phone className="w-3.5 h-3.5 text-slate-400" />
               <span className="font-semibold">{p.fatherPhone}</span>
            </div>
            {p.email && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                 <Mail className="w-3.5 h-3.5 text-slate-400" />
                 <span>{p.email}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'children',
      label: 'Linked Students',
      render: (_: any, row: any) => {
        const p = row as Parent;
        return (
          <div className="flex flex-wrap gap-2">
            {p.children?.map((child: any) => (
              <Link 
                key={child.id} 
                to={`/students/${child.id}`}
                className="group flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
              >
                {child.fullName || studentNameFallback(child)}
                <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        );
      }
    },
    {
      key: 'address',
      label: 'Location',
      render: (_: any, row: any) => {
        const p = row as Parent;
        return <span className="text-xs text-slate-500 font-medium">{p.address?.city || '—'}</span>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8"
            onClick={() => navigate(`/parents/${row.id}`)}
          >
            Details
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            className="h-8 px-2" 
            onClick={() => handleDelete(row.id, row.fatherName)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  // Helper for cases where populate might slightly differ
  const studentNameFallback = (child: any) => child.fullName || "View Profile";

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'People' }, { label: 'Guardians' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Guardian Directory</h1>
          <p className="text-slate-500 text-sm">View parents and primary guardians linked to student accounts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export</Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by parent name or email..." 
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
            />
          </div>
          {search && (
            <Button variant="secondary" onClick={() => setSearch('')}>Clear</Button>
          )}
        </div>

        <DataTable 
          columns={columns} 
          data={parents as any} 
          isLoading={isLoading} 
          emptyMessage="No guardian records found." 
          keyExtractor={(row) => (row as Parent).id}
        />
      </Card>

      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-indigo-800">
         <Users className="w-5 h-5 shrink-0" />
         <p className="text-xs leading-relaxed font-medium">
           Guardian records are automatically created during student enrollment. You can link multiple children to a single guardian by using the same contact number during form submission.
         </p>
      </div>
    </div>
  );
};
