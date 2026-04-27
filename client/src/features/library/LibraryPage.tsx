import { clsx } from "clsx";
import React, { useState, useEffect } from 'react';
import { 
  Book as BookIcon, Search, Plus, Filter, 
  BookOpen, Hash, MapPin, Users, History,
  ArrowRight, CheckCircle, AlertCircle
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import axiosInstance from '../../api/axiosInstance';
import { ApiResponse } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  availableCopies: number;
  totalCopies: number;
  status: string;
  shelfLocation?: string;
}

export const LibraryPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Issue Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueData, setIssueData] = useState({
    userId: '',
    userType: 'Student',
    days: 14
  });

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<Book[]>>(`/library/books?search=${search}`);
      setBooks(res.data.data);
    } catch {
      toast.error('Failed to load library catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchBooks, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      await axiosInstance.post('/library/issue', {
        bookId: selectedBook.id,
        ...issueData
      });
      toast.success(`Book issued successfully to ${issueData.userId}`);
      setIsIssueModalOpen(false);
      fetchBooks();
    } catch {
      toast.error('Failed to issue book. Check User ID and availability.');
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Infrastructure' }, { label: 'Library' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Library Catalogue</h1>
          <p className="text-slate-500 text-sm">Manage school books, track circulation, and inventory.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<History className="w-4 h-4" />}>Issue History</Button>
          <Button icon={<Plus className="w-4 h-4" />}>Add New Book</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, author, or ISBN..." 
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
          />
        </div>
        <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>Categories</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
           {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-slate-50 rounded-2xl border border-slate-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="p-0 overflow-hidden border-slate-200 hover:shadow-xl transition-all group flex flex-col">
               <div className="bg-slate-50 p-5 border-b border-slate-100 flex-1">
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm">
                        <BookIcon className="w-6 h-6" />
                     </div>
                     <StatusBadge status={book.status} />
                  </div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">by {book.author}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                     <Badge variant="blue" className="text-[10px] uppercase font-bold">{book.category}</Badge>
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-full border border-slate-200">
                        <Hash className="w-3 h-3" /> {book.isbn || 'No ISBN'}
                     </div>
                  </div>
               </div>
               
               <div className="p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Availability</p>
                        <p className={clsx("text-sm font-black", book.availableCopies > 0 ? "text-emerald-600" : "text-red-500")}>
                           {book.availableCopies} / {book.totalCopies} Copies
                        </p>
                     </div>
                     <div className="text-right space-y-0.5">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Shelf</p>
                        <p className="text-sm font-bold text-slate-700 flex items-center justify-end gap-1">
                           <MapPin className="w-3.5 h-3.5 text-slate-300" /> {book.shelfLocation || 'Main'}
                        </p>
                     </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 font-bold text-[11px]"
                        onClick={() => { setSelectedBook(book); setIsIssueModalOpen(true); }}
                        disabled={book.availableCopies <= 0}
                     >
                        Issue Book
                     </Button>
                     <Button variant="secondary" size="sm" className="px-3">
                        <ArrowRight className="w-4 h-4" />
                     </Button>
                  </div>
               </div>
            </Card>
          ))}
        </div>
      )}

      {/* Issue Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Library Book"
        size="md"
      >
        <form onSubmit={handleIssueBook} className="space-y-5">
           <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                 <p className="text-sm font-bold text-blue-900">{selectedBook?.title}</p>
                 <p className="text-xs text-blue-600">ISBN: {selectedBook?.isbn || 'N/A'}</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Borrower ID" 
                placeholder="e.g. STU-12345"
                value={issueData.userId}
                onChange={e => setIssueData({...issueData, userId: e.target.value})}
                required
              />
              <Input 
                label="User Type" 
                type="select"
                options={[
                  { label: 'Student', value: 'Student' },
                  { label: 'Teacher', value: 'Teacher' },
                  { label: 'Staff', value: 'Staff' },
                ]}
                value={issueData.userType}
                onChange={e => setIssueData({...issueData, userType: e.target.value})}
              />
           </div>

           <Input 
             label="Duration (Days)" 
             type="number"
             value={issueData.days.toString()}
             onChange={e => setIssueData({...issueData, days: parseInt(e.target.value)})}
             required
           />

           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2 text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <p className="text-[11px] font-medium italic">
                Due Date: {format(new Date(Date.now() + issueData.days * 86400000), 'dd MMM yyyy')}
              </p>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
              <Button type="submit">Complete Issuance</Button>
           </div>
        </form>
      </Modal>
    </div>
  );
};
