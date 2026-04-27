import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Phone, 
  MessageSquare, Calendar, User, 
  MoreVertical, CheckCircle, Clock,
  Edit2, Trash2
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import axiosInstance from '../../api/axiosInstance';
import { Enquiry, ApiResponse } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const EnquiriesPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    visitorName: '',
    phone: '',
    purpose: 'admission',
    classEnquiry: '',
    remarks: '',
  });

  const fetchEnquiries = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<Enquiry[]>>('/enquiries');
      setEnquiries(res.data.data);
    } catch {
      toast.error('Failed to load enquiries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/enquiries', formData);
      toast.success('Enquiry recorded successfully');
      setIsModalOpen(false);
      fetchEnquiries();
    } catch {
      toast.error('Failed to save enquiry');
    }
  };

  const columns = [
    {
      key: 'visitorName',
      label: 'Visitor',
      render: (_: any, row: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800">{row.visitorName}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{row.purpose}</span>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (val: any) => (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="w-3.5 h-3.5 text-slate-400" /> {String(val)}
        </div>
      )
    },
    {
      key: 'classEnquiry',
      label: 'Interest',
      render: (val: any) => <span className="text-sm font-medium">{val ? `Class ${val}` : 'General'}</span>
    },
    {
      key: 'enquiryDate',
      label: 'Date',
      render: (val: any) => <span className="text-sm text-slate-500">{format(new Date(String(val)), 'dd MMM yyyy')}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: any) => <StatusBadge status={String(val)} />
    },
    {
      key: 'id',
      label: '',
      render: () => (
        <button className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Front Office' }, { label: 'Enquiries' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Visitor Management</h1>
          <p className="text-slate-500 text-sm">Track admission enquiries and general visitor logs.</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('enquiry:create') && (
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>New Enquiry</Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by visitor name or contact..." 
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
          />
        </div>
        <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>Advanced Filter</Button>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200">
        <DataTable 
          columns={columns} 
          data={enquiries} 
          isLoading={isLoading} 
          emptyMessage="No enquiries found. Add your first visitor record!"
          keyExtractor={(row) => row.id}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Enquiry"
        size="md"
      >
        <form onSubmit={handleCreateEnquiry} className="space-y-4">
          <Input 
            label="Visitor Name" 
            placeholder="Enter full name"
            value={formData.visitorName}
            onChange={e => setFormData({...formData, visitorName: e.target.value})}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Phone Number" 
              placeholder="+91 00000 00000"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              required
            />
            <Input 
              label="Purpose" 
              type="select"
              options={[
                { label: 'Admission', value: 'admission' },
                { label: 'General', value: 'general' },
                { label: 'Complaint', value: 'complaint' },
              ]}
              value={formData.purpose}
              onChange={e => setFormData({...formData, purpose: e.target.value})}
            />
          </div>
          <Input 
            label="Class of Interest (Optional)" 
            placeholder="e.g. 10"
            value={formData.classEnquiry}
            onChange={e => setFormData({...formData, classEnquiry: e.target.value})}
          />
          <Input 
            label="Remarks" 
            multiline
            placeholder="Add context about the conversation..."
            value={formData.remarks}
            onChange={e => setFormData({...formData, remarks: e.target.value})}
          />
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
             <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button type="submit">Save Enquiry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
