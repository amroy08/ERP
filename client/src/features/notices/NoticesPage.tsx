import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Filter, Bell, Flag, User, Calendar as CalendarIcon, MoreVertical, Edit2, Trash2, Megaphone, FileText, Download, ExternalLink, X } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import { Notice, ApiResponse } from '../../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export const NoticesPage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isStudent = user?.role === 'student';
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    priority: 'medium',
    audience: 'all',
    type: 'text' as 'text' | 'file'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<Notice[]>>('/notices?limit=50');
      setNotices(res.data.data || []);
    } catch {
      setNotices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title) return toast.error('Please fill in a title');
    if (newNotice.type === 'text' && !newNotice.content) return toast.error('Please fill in content');
    if (newNotice.type === 'file' && !selectedFile && !editingNotice?.fileUrl) return toast.error('Please select a PDF file');

    const formData = new FormData();
    formData.append('title', newNotice.title);
    formData.append('content', newNotice.content);
    formData.append('priority', newNotice.priority);
    formData.append('audience', newNotice.audience);
    formData.append('type', newNotice.type);
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    
    setIsSubmitting(true);
    try {
      if (editingNotice) {
        await axiosInstance.put(`/notices/${editingNotice.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Notice updated successfully!');
      } else {
        await axiosInstance.post('/notices', formData, { 
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Notice published successfully!');
      }
      handleCloseModal();
      fetchNotices();
    } catch {
      toast.error(editingNotice ? 'Failed to update notice' : 'Failed to publish notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setNewNotice({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      audience: notice.audience[0] || 'all',
      type: notice.type || 'text'
    });
    setIsModalOpen(true);
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      await axiosInstance.delete(`/notices/${id}`);
      toast.success('Notice deleted');
      fetchNotices();
    } catch {
      toast.error('Failed to delete notice');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNotice(null);
    setNewNotice({ title: '', content: '', priority: 'medium', audience: 'all', type: 'text' });
    setSelectedFile(null);
  };

  const filteredNotices = notices.filter(n => 
    n.title?.toLowerCase().includes(search.toLowerCase()) || 
    n.content?.toLowerCase().includes(search.toLowerCase())
  );

  const priorityColors = {
    low: 'bg-slate-100 text-slate-600 border-slate-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-100',
    high: 'bg-orange-50 text-orange-700 border-orange-100',
    urgent: 'bg-red-50 text-red-700 border-red-100'
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Communications' }, { label: 'Notice Board' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notice Board</h1>
          <p className="text-slate-500 text-sm">Publish and manage official announcements for the school community.</p>
        </div>
        {!isStudent && (
          <Button 
            icon={<Plus className="w-4 h-4" />} 
            onClick={() => setIsModalOpen(true)}
          >
            Create Notice
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search announcements..." 
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:font-normal" 
          />
        </div>
        <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>Filter Feed</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-50 rounded-2xl" />)}
        </div>
      ) : filteredNotices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredNotices.map((notice) => (
            <Card key={notice.id} className="p-0 overflow-hidden border-slate-200 hover:shadow-lg transition-all group flex flex-col h-full">
              <div className="p-5 flex flex-col h-full space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap gap-2">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      priorityColors[notice.priority as keyof typeof priorityColors] || priorityColors.medium
                    )}>
                      {notice.priority}
                    </span>
                    {notice.audience?.map(aud => (
                      <span key={aud} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                        {aud}
                      </span>
                    ))}
                    {notice.type === 'file' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> PDF
                      </span>
                    )}
                  </div>
                  {!isStudent && (
                    <div className="flex items-center gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleEditNotice(notice)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteNotice(notice.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{notice.title}</h3>
                  {notice.type === 'file' ? (
                     <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-center my-2">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-red-500">
                           <FileText className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-700">Notice Attachment</p>
                           <p className="text-[10px] text-slate-400">PDF Document</p>
                        </div>
                        <a 
                          href={notice.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-all"
                        >
                           <ExternalLink className="w-3 h-3" /> Open Notice
                        </a>
                     </div>
                  ) : (
                    <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                      {notice.content}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                   <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                         <User className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{(notice.createdBy as any)?.name || 'Admin'}</span>
                   </div>
                   <div className="flex items-center gap-1.5 text-slate-400">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{format(new Date(notice.publishDate), 'dd MMM yyyy')}</span>
                   </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
           title="No Notices Found" 
           description="Official announcements and school updates will appear here once published."
           icon={<Megaphone className="w-10 h-10" />}
           action={!isStudent ? {
              label: "Publish First Notice",
              onClick: () => setIsModalOpen(true),
              icon: <Plus className="w-4 h-4" />
           } : undefined}
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingNotice ? "Edit Announcement" : "Publish New Announcement"}
        size="lg"
      >
        <form onSubmit={handleCreateNotice} className="space-y-6">
          <Input 
            label="Notice Title" 
            placeholder="e.g., Annual Sports Day 2024" 
            value={newNotice.title}
            onChange={e => setNewNotice({...newNotice, title: e.target.value})}
            required 
          />

          <div className="space-y-3">
             <label className="text-sm font-semibold text-slate-700">Notice Type</label>
             <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setNewNotice({...newNotice, type: 'text'})}
                  className={clsx(
                    "flex-1 p-4 rounded-xl border-2 transition-all text-sm font-bold flex flex-col items-center gap-2",
                    newNotice.type === 'text' ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                  )}
                >
                   <Edit2 className="w-5 h-5" />
                   Write Notice
                </button>
                <button 
                  type="button"
                  onClick={() => setNewNotice({...newNotice, type: 'file'})}
                  className={clsx(
                    "flex-1 p-4 rounded-xl border-2 transition-all text-sm font-bold flex flex-col items-center gap-2",
                    newNotice.type === 'file' ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                  )}
                >
                   <FileText className="w-5 h-5" />
                   Upload PDF
                </button>
             </div>
          </div>

          {newNotice.type === 'text' ? (
            <Input 
              label="Content" 
              multiline 
              placeholder="Write your announcement here..." 
              value={newNotice.content}
              onChange={e => setNewNotice({...newNotice, content: e.target.value})}
              required 
            />
          ) : (
            <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700">Attach PDF Document</label>
               <input 
                 type="file" 
                 ref={fileInputRef}
                 onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                 accept="application/pdf"
                 className="hidden" 
               />
               {selectedFile || (editingNotice?.fileUrl && newNotice.type === 'file') ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <div>
                           <p className="text-xs font-bold text-emerald-800">{selectedFile ? selectedFile.name : 'Existing Notice PDF'}</p>
                           <p className="text-[10px] text-emerald-600">Ready to upload</p>
                        </div>
                     </div>
                     <button 
                       type="button"
                       onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                       className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>
               ) : (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-3 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all bg-slate-50"
                  >
                     <Plus className="w-8 h-8" />
                     <span className="text-xs font-bold uppercase tracking-widest">Select PDF File</span>
                  </button>
               )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Priority Level" 
              type="select" 
              value={newNotice.priority}
              onChange={e => setNewNotice({...newNotice, priority: e.target.value as any})}
              options={[
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
                { label: 'Urgent', value: 'urgent' },
              ]}
            />
            <Input 
              label="Target Audience" 
              type="select" 
              value={newNotice.audience}
              onChange={e => setNewNotice({...newNotice, audience: e.target.value})}
              options={[
                { label: 'Everyone', value: 'all' },
                { label: 'Teachers Only', value: 'teachers' },
                { label: 'Parents Only', value: 'parents' },
                { label: 'Students Only', value: 'students' },
              ]}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800">
             <Flag className="w-5 h-5 shrink-0" />
             <p className="text-xs leading-relaxed">
               <strong>Publishing Policy:</strong> Notices are visible immediately to the selected audience upon clicking publish. High and Urgent priority notices may trigger mobile push notifications for users.
             </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={handleCloseModal}>Discard</Button>
            <Button type="submit" isLoading={isSubmitting}>{editingNotice ? 'Update Notice' : 'Publish Notice'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
