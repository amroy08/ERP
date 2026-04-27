import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, BookOpen, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

interface FeeComponent {
  category: string;
  name: string;
  amount: number;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'annually';
}

interface FeeStructure {
  id: string;
  name: string;
  class: { id: string; name: string };
  academicYear: { id: string; name: string };
  components: FeeComponent[];
  totalAmount: number;
  isActive: boolean;
}

const CATEGORIES = ['tuition', 'admission', 'exam', 'transport', 'hostel', 'library', 'sports', 'miscellaneous'];
const FREQUENCIES = ['one_time', 'monthly', 'quarterly', 'annually'];
const FREQ_LABELS: Record<string, string> = { one_time: 'One Time', monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually' };
const CAT_COLORS: Record<string, string> = {
  tuition: 'blue', admission: 'green', exam: 'orange', transport: 'purple',
  hostel: 'red', library: 'gray', sports: 'yellow', miscellaneous: 'gray'
};

const emptyComponent = (): FeeComponent => ({ category: 'tuition', name: '', amount: 0, frequency: 'annually' });

export const FeeStructurePage: React.FC = () => {
  const { isRole } = usePermissions();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    class: '',
    components: [emptyComponent()],
  });

  const canManage = isRole(['super_admin', 'admin', 'clerk']);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [structRes, classRes] = await Promise.all([
        axiosInstance.get('/fees/structures'),
        axiosInstance.get('/classes?limit=50'),
      ]);
      setStructures(structRes.data.data || []);
      setClasses(classRes.data.data || []);
    } catch (err) { 
      console.error('Fee load error:', err);
      toast.error('Failed to load fee data'); 
    }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', class: '', components: [emptyComponent()] });
    setIsModalOpen(true);
  };

  const openEdit = (s: FeeStructure) => {
    setEditingId(s.id);
    setFormData({ 
      name: s.name, 
      class: s.class?.id || 'all', 
      components: (s.components as any[]) || [emptyComponent()] 
    });
    setIsModalOpen(true);
  };

  const handleAddComponent = () => setFormData(f => ({ ...f, components: [...f.components, emptyComponent()] }));
  const handleRemoveComponent = (i: number) => setFormData(f => ({ ...f, components: f.components.filter((_, idx) => idx !== i) }));
  const updateComponent = (i: number, field: keyof FeeComponent, value: string | number) => {
    setFormData(f => {
      const components = [...f.components];
      components[i] = { ...components[i], [field]: value };
      return { ...f, components };
    });
  };

  const totalPreview = formData.components.reduce((s, c) => s + Number(c.amount || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class) { toast.error('Please select a class'); return; }
    if (formData.components.some(c => !c.name || c.amount < 0)) {
      toast.error('All fee components need a name and valid amount (>= 0)'); return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        await axiosInstance.put(`/fees/structures/${editingId}`, formData);
        toast.success('Fee structure updated');
      } else {
        await axiosInstance.post('/fees/structures', formData);
        toast.success('Fee structure created');
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate fee structure "${name}"?`)) return;
    try {
      await axiosInstance.delete(`/fees/structures/${id}`);
      toast.success('Fee structure deactivated');
      fetchAll();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Fee Management' }, { label: 'Fee Structures' }]} />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fee Structures</h1>
          <p className="text-slate-500 text-sm">Define annual fee components for each class.</p>
        </div>
        {canManage && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>New Fee Structure</Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : structures.length === 0 ? (
        <Card className="py-20 text-center">
          <div className="text-5xl mb-4">💰</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Fee Structures Yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create fee structures per class to enable fee collection.</p>
          {canManage && <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>Create First Structure</Button>}
        </Card>
      ) : (
        <div className="space-y-3">
          {structures.map(s => (
            <Card key={s.id} className="p-0 overflow-hidden border-slate-200 shadow-sm">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={s.class ? 'blue' : 'purple'}>{s.class?.name || 'All Classes'}</Badge>
                      <span className="text-xs text-slate-400">{s.academicYear?.name}</span>
                      <span className="text-xs text-slate-500 font-semibold">· {(s.components as any[])?.length || 0} components</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total Annual</p>
                    <p className="text-lg font-black text-slate-800">₹{(s.totalAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  {canManage && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="secondary" size="sm" className="h-8 px-2" onClick={() => openEdit(s)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="danger" size="sm" className="h-8 px-2" onClick={() => handleDelete(s.id, s.name)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  {expandedId === s.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </div>

              {expandedId === s.id && (
                <div className="border-t border-slate-100 p-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(s.components as any[] || []).map((c, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{c.category}</p>
                        <p className="text-sm font-bold text-slate-700">{c.name}</p>
                        <p className="text-base font-black text-blue-600 mt-1">₹{Number(c.amount || 0).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{FREQ_LABELS[c.frequency] || 'One Time'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Fee Structure' : 'Create Fee Structure'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Structure Name <span className="text-red-500">*</span></label>
              <input
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="e.g. Class 10 Annual Fee"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Class <span className="text-red-500">*</span></label>
              <select
                value={formData.class}
                onChange={e => setFormData(f => ({ ...f, class: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              >
                <option value="">Select Class</option>
                <option value="all">All Classes (Global)</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Fee Components</p>
              <Button type="button" variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddComponent}>Add Component</Button>
            </div>
            <div className="space-y-3">
              {formData.components.map((comp, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                    <select value={comp.category} onChange={e => updateComponent(i, 'category', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
                    <input value={comp.name} onChange={e => updateComponent(i, 'name', e.target.value)} placeholder="e.g. Tuition Fee" className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount (₹)</label>
                    <input type="number" value={comp.amount} onChange={e => updateComponent(i, 'amount', Number(e.target.value))} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" min="0" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Frequency</label>
                    <select value={comp.frequency} onChange={e => updateComponent(i, 'frequency', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                      {FREQUENCIES.map(f => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {formData.components.length > 1 && (
                      <button type="button" onClick={() => handleRemoveComponent(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">
              <p className="text-xs text-blue-600 font-semibold">Total Fee Amount</p>
              <p className="text-2xl font-black text-blue-700">₹{totalPreview.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>{editingId ? 'Update Structure' : 'Create Structure'}</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
