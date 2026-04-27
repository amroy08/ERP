import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, Database, History, UserCheck, AlertTriangle } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { ApiResponse } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ArchiveItem {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  data: any;
  deletedAt: string;
  deletedBy: string;
}

export const ArchivePage: React.FC = () => {
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchArchives = async () => {
    setIsLoading(true);
    try {
      const typeParam = filterType !== 'all' ? `?type=${filterType}` : '';
      const res = await axiosInstance.get<ApiResponse<ArchiveItem[]>>(`/archive${typeParam}`);
      setArchives(res.data.data);
    } catch {
      setArchives([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, [filterType]);

  const handleRestore = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to restore "${name}"? This will return the record to the active list.`)) return;
    
    try {
      await axiosInstance.post(`/archive/${id}/restore`);
      toast.success('Record restored successfully');
      fetchArchives();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to restore record');
    }
  };

  const handlePurge = async (id: string, name: string) => {
    if (!window.confirm(`PERMANENT DELETE: Are you absolutely sure you want to permanently delete "${name}"? This action cannot be undone and all history will be lost.`)) return;
    
    try {
      await axiosInstance.delete(`/archive/${id}`);
      toast.success('Record permanently purged');
      fetchArchives();
    } catch {
      toast.error('Failed to purge record');
    }
  };

  const filtered = archives.filter(item => 
    item.entityName?.toLowerCase().includes(search.toLowerCase()) ||
    item.entityType?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { 
      key: 'entityName', 
      label: 'Record Name',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{row.entityName || 'Unnamed Record'}</p>
            <p className="text-[10px] text-slate-500 font-mono">{row.entityId}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'entityType', 
      label: 'Type',
      render: (val: any) => (
        <Badge variant={val === 'student' ? 'info' : val === 'teacher' ? 'warning' : 'secondary'} className="capitalize">
          {String(val)}
        </Badge>
      )
    },
    { 
      key: 'deletedAt', 
      label: 'Archived On',
      render: (val: any) => (
        <span className="text-xs text-slate-500 font-medium">
          {format(new Date(val), 'MMM dd, yyyy HH:mm')}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 px-2 text-blue-600 hover:text-blue-700" 
            onClick={() => handleRestore(row.id, row.entityName)}
            title="Restore Record"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Restore
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50" 
            onClick={() => handlePurge(row.id, row.entityName)}
            title="Permanently Purge"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Settings' }, { label: 'System Archive' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-500" />
            System Archive
          </h1>
          <p className="text-slate-500 text-sm">Manage deleted records and restore backups from the vault.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-indigo-50 border-indigo-100">
           <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
              <Database className="w-6 h-6" />
           </div>
           <div>
              <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-wider">Total Backups</p>
              <h3 className="text-2xl font-black text-indigo-900">{archives.length}</h3>
           </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by record name or type..." 
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
            />
          </div>
          <div className="flex gap-2">
             {['all', 'student', 'teacher', 'staff', 'parent', 'notice'].map(type => (
               <button
                 key={type}
                 onClick={() => setFilterType(type)}
                 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                   filterType === type 
                     ? 'bg-slate-800 text-white shadow-md' 
                     : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                 }`}
               >
                 {type.charAt(0).toUpperCase() + type.slice(1)}
               </button>
             ))}
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={filtered as any} 
          isLoading={isLoading} 
          emptyMessage="The vault is empty. No deleted records found." 
          keyExtractor={(row) => (row as ArchiveItem).id}
        />
      </Card>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800">
         <AlertTriangle className="w-5 h-5 shrink-0" />
         <p className="text-xs leading-relaxed font-medium">
           Records in the archive are snapshots of data. Purging a record here will permanently remove it and all its associated history (fees, marks, etc.) from the server. Use with caution.
         </p>
      </div>
    </div>
  );
};
