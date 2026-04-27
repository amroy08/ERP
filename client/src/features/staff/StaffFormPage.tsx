import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import axiosInstance from '../../api/axiosInstance';
import { ApiResponse, Staff } from '../../types';
import toast from 'react-hot-toast';

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all";
const Label: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
  <label className="block text-sm font-medium text-slate-700 mb-1.5">
    {text}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

export const StaffFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    employeeId: '', department: '', role: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active',
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  useEffect(() => {
    if (isEdit && id) {
      setIsLoading(true);
      axiosInstance.get<ApiResponse<Staff>>(`/staff/${id}`)
        .then(res => {
          const s = res.data.data;
          setForm({
            firstName: s.firstName || '',
            lastName: s.lastName || '',
            email: s.email || '',
            phone: s.phone || '',
            employeeId: s.employeeId || '',
            department: s.department || '',
            role: s.role || '',
            joiningDate: s.joiningDate ? String(s.joiningDate).split('T')[0] : '',
            status: s.status || 'active',
          });
        })
        .catch(() => toast.error('Failed to load staff data'))
        .finally(() => setIsLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEdit) {
        await axiosInstance.put(`/staff/${id}`, form);
        toast.success('Staff record updated');
      } else {
        await axiosInstance.post('/staff', form);
        toast.success('Staff member registered');
      }
      navigate('/staff');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isEdit ? 'Update failed' : 'Registration failed'));
    } finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading staff record...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Breadcrumb items={[{ label: 'Staff Directory', href: '/staff' }, { label: isEdit ? 'Edit Staff' : 'Add Staff' }]} />
        <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/staff')}>Back</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Update Staff Member' : 'Register Non-Teaching Staff'}</h1>
          <p className="text-slate-500 text-sm">Manage administrative and support staff accounts.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label text="First Name" required />
              <input className={inputCls} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Mohan" required />
            </div>
            <div>
              <Label text="Last Name" required />
              <input className={inputCls} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Kumar" required />
            </div>
            <div>
              <Label text="Employee ID" required />
              <input className={inputCls} value={form.employeeId} onChange={e => set('employeeId', e.target.value)} placeholder="e.g. STF-001" required />
            </div>
            <div>
              <Label text="Department" required />
              <input className={inputCls} value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Administration" required />
            </div>
            <div>
              <Label text="Role / Designation" required />
              <input className={inputCls} value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Accountant" required />
            </div>
            <div>
              <Label text="Phone Number" required />
              <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" required />
            </div>
            <div>
              <Label text="Email Address" required />
              <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="mohan@school.edu" required />
            </div>
            <div>
              <Label text="Joining Date" required />
              <input type="date" className={inputCls} value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} required />
            </div>
            <div>
              <Label text="Status" />
              <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="resigned">Resigned</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate('/staff')}>Cancel</Button>
          <Button type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
            {isEdit ? 'Save Changes' : 'Register Member'}
          </Button>
        </div>
      </form>
    </div>
  );
};
