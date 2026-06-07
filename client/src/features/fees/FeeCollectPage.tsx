import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Receipt, CheckCircle, Clock, 
  AlertTriangle, DollarSign, User, CreditCard,
  Printer, Download, X, IndianRupee, History, Filter,
  ArrowRight, ShieldCheck, Landmark
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import axiosInstance from '../../api/axiosInstance';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { FeeReceiptModal } from './components/FeeReceiptModal';

interface StudentSummary {
  id: string;
  fullName: string;
  admissionNumber: string;
  class?: { name: string };
  section?: { name: string };
}

interface FeesledgerData {
  totalFee: number;
  paidAmount: number;
  balanceDue: number;
  structures: any[];
  payments: { id: string; receiptNumber: string; amountPaid: number; paymentDate: string; paymentMode: string; remarks?: string }[];
}

const PAYMENT_MODES = ['cash', 'upi', 'online', 'cheque', 'card'];
const MODE_ICONS: Record<string, string> = { cash: '💵', upi: '📱', online: '🌐', cheque: '📄', card: '💳' };

export const FeeCollectPage: React.FC = () => {
  const { isRole } = usePermissions();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [ledger, setLedger] = useState<FeesledgerData | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [filters, setFilters] = useState({ classId: '', sectionId: '' });
  
  // States
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form & Receipt States
  const [paymentForm, setPaymentForm] = useState({ amount: '', mode: 'cash', remarks: '' });
  const [latestReceipt, setLatestReceipt] = useState<any>(null);

  interface AllocationInput {
    studentFeeId: string;
    componentName: string;
    category: string;
    amount: number;
    paid: number;
    outstanding: number;
    amountToPay: string;
  }
  const [allocations, setAllocations] = useState<AllocationInput[]>([]);

  const [searchParams] = useSearchParams();
  const studentIdFromUrl = searchParams.get('studentId');
  const receiptRef = useRef<HTMLDivElement>(null);

  const canCollect = isRole(['super_admin', 'admin', 'clerk']);

  useEffect(() => {
    fetchClasses();
    if (studentIdFromUrl) {
      axiosInstance.get(`/students/${studentIdFromUrl}`)
        .then(res => selectStudent(res.data.data))
        .catch(() => {});
    }
  }, [studentIdFromUrl]);

  useEffect(() => {
    if (isPayModalOpen && ledger) {
      const list: AllocationInput[] = [];
      ledger.structures.forEach(s => {
        const studentFeeId = s._studentFeeId;
        if (!studentFeeId) return;
        if (s.components && Array.isArray(s.components)) {
          s.components.forEach((c: any) => {
            list.push({
              studentFeeId,
              componentName: c.name,
              category: c.category || 'miscellaneous',
              amount: c.amount || 0,
              paid: c.paid || 0,
              outstanding: c.outstanding || 0,
              amountToPay: ''
            });
          });
        }
      });
      setAllocations(list);
      setPaymentForm({ amount: '', mode: 'cash', remarks: '' });
    }
  }, [isPayModalOpen, ledger]);

  const fetchClasses = async () => {
    try {
      const res = await axiosInstance.get('/classes');
      setClasses(res.data.data);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      let url = `/students?limit=20`;
      if (search.trim()) url += `&search=${encodeURIComponent(search)}`;
      if (filters.classId) url += `&classId=${filters.classId}`;
      if (filters.sectionId) url += `&sectionId=${filters.sectionId}`;
      
      const res = await axiosInstance.get(url);
      setStudents(res.data.data || []);
      if (res.data.data.length === 0) {
        toast.error('No students found matching your criteria');
      }
    } catch { toast.error('Search failed'); }
    finally { setIsSearching(false); }
  };

  const selectStudent = async (student: StudentSummary) => {
    setSelectedStudent(student);
    setStudents([]);
    setSearch(student.fullName);
    setIsLoadingLedger(true);
    try {
      const res = await axiosInstance.get(`/fees/status/${student.id}`);
      setLedger(res.data.data);
    } catch { toast.error('Could not load fee status'); }
    finally { setIsLoadingLedger(false); }
  };

  const handleAutoFill = () => {
    const total = parseFloat(paymentForm.amount);
    if (isNaN(total) || total <= 0) {
      toast.error('Please enter a valid amount to auto-allocate.');
      return;
    }
    
    let remaining = total;
    const updated = allocations.map(a => {
      if (remaining <= 0) {
        return { ...a, amountToPay: '' };
      }
      const alloc = Math.min(remaining, a.outstanding);
      remaining -= alloc;
      return { ...a, amountToPay: alloc > 0 ? alloc.toFixed(2) : '' };
    });

    if (remaining > 0.01) {
      toast.error(`Entered amount exceeds total outstanding balance of ₹${ledger?.balanceDue?.toLocaleString('en-IN')}`);
    }
    setAllocations(updated);
  };

  const handleAllocationChange = (index: number, val: string) => {
    const updated = [...allocations];
    updated[index].amountToPay = val;
    setAllocations(updated);

    // Update total amount field dynamically
    const totalPaid = updated.reduce((sum, a) => {
      const parsed = parseFloat(a.amountToPay);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);
    setPaymentForm(f => ({ ...f, amount: totalPaid > 0 ? totalPaid.toFixed(2) : '' }));
  };

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('A student must be selected to record payment.');
      return;
    }
    if (!ledger) {
      toast.error('Student fee status has not been loaded.');
      return;
    }
    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Amount paid must be greater than 0');
      return;
    }
    if (!paymentForm.mode) {
      toast.error('Payment mode is required');
      return;
    }

    const nonZeroAllocations = allocations
      .map(a => ({
        studentFeeId: a.studentFeeId,
        componentName: a.componentName,
        amount: parseFloat(a.amountToPay) || 0
      }))
      .filter(a => a.amount > 0);

    const allocationSum = nonZeroAllocations.reduce((sum, a) => sum + a.amount, 0);
    
    if (nonZeroAllocations.length > 0 && Math.abs(allocationSum - amount) > 0.01) {
      toast.error(`The sum of individual allocations (₹${allocationSum.toLocaleString('en-IN')}) must match the total amount to collect (₹${amount.toLocaleString('en-IN')}).`);
      return;
    }

    // Ensure no individual allocation exceeds outstanding
    for (const alloc of nonZeroAllocations) {
      const comp = allocations.find(a => a.studentFeeId === alloc.studentFeeId && a.componentName === alloc.componentName);
      if (comp && alloc.amount > comp.outstanding + 0.01) {
        toast.error(`Allocation for "${alloc.componentName}" (₹${alloc.amount.toLocaleString()}) exceeds its outstanding balance of ₹${comp.outstanding.toLocaleString()}.`);
        return;
      }
    }
    
    setIsSaving(true);
    try {
       const res = await axiosInstance.post('/fees/collect', {
        studentId: selectedStudent.id,
        amountPaid: amount,
        paymentMode: paymentForm.mode,
        remarks: paymentForm.remarks,
        allocations: nonZeroAllocations
      });
      
      const receiptData = res.data.data;
      setLatestReceipt(receiptData);
      
      toast.success(`₹${amount.toLocaleString('en-IN')} collected successfully!`);
      setIsPayModalOpen(false);
      setIsReceiptModalOpen(true);
      setPaymentForm({ amount: '', mode: 'cash', remarks: '' });
      
      // Refresh balance
      const ledgerRes = await axiosInstance.get(`/fees/status/${selectedStudent.id}`);
      setLedger(ledgerRes.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Payment failed');
    } finally { setIsSaving(false); }
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Re-initialize app
  };

  const paidPercent = ledger ? Math.min(100, Math.round((ledger.paidAmount / ledger.totalFee) * 100)) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: 'Fee Management' }, { label: 'Collect Fee' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Fee Administration</h1>
          <p className="text-slate-500 text-sm font-medium italic">Record office payments, update balances and generate audit-ready receipts.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" icon={<History className="w-4 h-4" />} onClick={() => navigate('/fees/payments')}>Recent Collections</Button>
        </div>
      </div>

      {/* Student Search */}
      <Card className={clsx("p-5 border-slate-200 transition-all shadow-xl shadow-slate-100/50", selectedStudent ? "bg-slate-50 border-dashed" : "bg-white")}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); if (!e.target.value && !filters.classId) { setSelectedStudent(null); setLedger(null); setStudents([]); } }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-11 pr-4 py-3 text-sm border border-slate-100 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
              placeholder="Enter Student Name or Admission ID..."
            />
          </div>
          
          <div className="flex gap-3 flex-wrap">
             <div className="relative min-w-[140px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select 
                  className="w-full pl-10 pr-4 py-3 text-[11px] font-black uppercase tracking-widest border border-slate-100 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none text-slate-600"
                  value={filters.classId}
                  onChange={e => setFilters({ ...filters, classId: e.target.value, sectionId: '' })}
                >
                  <option value="">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
             </div>

             <div className="relative min-w-[140px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select 
                  className="w-full pl-10 pr-4 py-3 text-[11px] font-black uppercase tracking-widest border border-slate-100 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none text-slate-600 disabled:opacity-50"
                  value={filters.sectionId}
                  onChange={e => setFilters({ ...filters, sectionId: e.target.value })}
                  disabled={!filters.classId}
                >
                  <option value="">All Divisions</option>
                  {classes.find(c => c.id === filters.classId)?.sections?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
             </div>

             <Button onClick={handleSearch} isLoading={isSearching} className="rounded-2xl px-8 h-12 bg-slate-900 shadow-xl shadow-slate-200">Search</Button>
          </div>
        </div>

        {/* Search Results */}
        {students.length > 0 && (
          <div className="mt-3 bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-2xl shadow-blue-500/10 animate-in slide-in-from-top-4 duration-300">
            {students.map(s => (
              <button key={s.id} onClick={() => selectStudent(s)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-blue-50 text-left transition-all border-b border-slate-50 last:border-0 group">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                  {s.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-base font-black text-slate-800">{s.fullName}</p>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{s.admissionNumber} · {s.class?.name || '---'} {s.section?.name || ''}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-200 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Main Ledger Dashboard */}
      {selectedStudent && ledger && !isLoadingLedger && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-slate-200">
                    {selectedStudent.fullName.charAt(0)}
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedStudent.fullName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black tracking-widest text-[9px] border-none">{selectedStudent.admissionNumber}</Badge>
                       <Badge variant="secondary" className="bg-blue-50 text-blue-600 font-black tracking-widest text-[9px] border-none">{selectedStudent.class?.name} — {selectedStudent.section?.name}</Badge>
                    </div>
                 </div>
              </div>
              {canCollect && ledger.balanceDue > 0 && (
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl px-8 shadow-xl shadow-blue-200 transform hover:scale-105 transition-all"
                  icon={<CreditCard className="w-5 h-5" />} 
                  onClick={() => setIsPayModalOpen(true)}
                >
                   Collect Payment
                </Button>
              )}
           </div>

           {/* Stats Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Total Annual Fee" value={`₹${ledger.totalFee.toLocaleString('en-IN')}`} icon={<Landmark className="w-6 h-6" />} color="slate" />
              <StatCard label="Amount Collected" value={`₹${ledger.paidAmount.toLocaleString('en-IN')}`} icon={<ShieldCheck className="w-6 h-6" />} color="emerald" />
              <StatCard 
                label="Current Balance Due" 
                value={`₹${ledger.balanceDue.toLocaleString('en-IN')}`} 
                icon={<AlertTriangle className="w-6 h-6" />} 
                color={ledger.balanceDue > 0 ? "red" : "emerald"}
                highlight={ledger.balanceDue > 0}
              />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                 {/* Itemized Structures */}
                 <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <LayoutGrid className="w-4 h-4" /> Assigned Fee Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {ledger.structures.map((s, idx) => (
                           <div key={idx} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between hover:bg-white hover:shadow-lg transition-all space-y-3">
                              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                                 <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fee Structure</p>
                                    <h4 className="text-sm font-bold text-slate-800">{s.name}</h4>
                                 </div>
                                 <Badge className="bg-blue-50 text-blue-600 font-bold border-none">
                                    Total: ₹{(s.effectiveAmount ?? s.totalAmount ?? 0).toLocaleString('en-IN')}
                                 </Badge>
                              </div>
                              <div className="space-y-3">
                                 {s.components && s.components.map((c: any, cIdx: number) => {
                                    const percent = c.amount > 0 ? Math.min(100, Math.round((c.paid / c.amount) * 100)) : 0;
                                    return (
                                       <div key={cIdx} className="space-y-1 text-xs">
                                          <div className="flex justify-between font-bold text-slate-700">
                                             <div>
                                                <span>{c.name}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{c.category}</span>
                                             </div>
                                             <div className="text-right">
                                                <span>₹{c.paid.toLocaleString('en-IN')} / ₹{c.amount.toLocaleString('en-IN')}</span>
                                                <span className="text-[9px] text-slate-400 font-bold block">{c.outstanding > 0 ? `₹${c.outstanding.toLocaleString('en-IN')} due` : 'Paid'}</span>
                                             </div>
                                          </div>
                                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                             <div 
                                                className={clsx(
                                                   "h-full rounded-full transition-all duration-500",
                                                   percent === 100 ? "bg-emerald-500" : percent > 0 ? "bg-blue-500" : "bg-slate-300"
                                                )}
                                                style={{ width: `${percent}%` }}
                                             />
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>
                        ))}
                     </div>
                 </div>

                 {/* Historical Audit Trail */}
                 <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <History className="w-4 h-4 text-blue-500" /> Collection Audit Trail
                    </h3>
                    {ledger.payments.length === 0 ? (
                       <div className="py-12 text-center opacity-30">
                          <Receipt className="w-12 h-12 mx-auto mb-3" />
                          <p className="text-sm font-bold uppercase tracking-widest">No previous payments found</p>
                       </div>
                    ) : (
                      <div className="space-y-3">
                         {ledger.payments.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-sm group-hover:bg-blue-50 transition-colors">
                                     {MODE_ICONS[p.paymentMode] || '💰'}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-slate-800 font-mono tracking-tighter">{p.receiptNumber}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(p.paymentDate), 'dd MMM yyyy')} · {p.paymentMode}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-base font-black text-emerald-600">+₹{p.amountPaid.toLocaleString('en-IN')}</p>
                                  <p className="text-[9px] font-bold text-slate-300 italic truncate max-w-[150px]">{p.remarks || 'No remarks recorded'}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                    )}
                 </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                 {/* Progress circle/metric */}
                 <Card className="p-8 text-center bg-slate-900 text-white rounded-[40px] border-none shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-6">Payment Progress</h3>
                    <div className="relative w-32 h-32 mx-auto mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * paidPercent) / 100} className="text-blue-500 transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                           <span className="text-3xl font-black">{paidPercent}%</span>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-blue-300">₹{(ledger.totalFee - ledger.paidAmount).toLocaleString('en-IN')} remaining due</p>
                 </Card>

                 {/* Quick reminders */}
                 <div className="p-6 bg-amber-50 border border-amber-100 rounded-[32px] space-y-3">
                    <div className="flex items-center gap-2 text-amber-600">
                       <AlertTriangle className="w-5 h-5" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Late Payment Policy</span>
                    </div>
                    <p className="text-[11px] font-medium text-amber-800 leading-relaxed opacity-80">
                       According to school policy #411, late fees are automatically calculated after the 10th of every month. 
                       Collect & Generate Receipt is an audit-locked action.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Payment Entry Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Record Fee Payment" size="xl">
         <form onSubmit={handleCollect} className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-200">
                  {selectedStudent?.fullName.charAt(0)}
               </div>
               <div>
                  <p className="text-sm font-black text-slate-800">{selectedStudent?.fullName}</p>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    {selectedStudent?.admissionNumber}
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Left Side: Payment Details */}
               <div className="space-y-5">
                  {/* Amount Payable (Outstanding) */}
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                     <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Outstanding Balance</span>
                     <p className="text-2xl font-black text-rose-700">₹{ledger?.balanceDue?.toLocaleString('en-IN')}</p>
                  </div>

                  {/* Amount Paid */}
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                        Amount to Collect <span className="text-red-500">*</span>
                     </label>
                     <div className="flex gap-2">
                        <div className="relative flex-1">
                           <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="number" 
                              step="0.01"
                              value={paymentForm.amount} 
                              onChange={e => {
                                 const val = e.target.value;
                                 setPaymentForm(f => ({ ...f, amount: val }));
                              }}
                              className="w-full pl-11 pr-4 py-3 font-black text-xl border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-700 transition-all" 
                              placeholder="0.00"
                              required 
                           />
                        </div>
                        <Button 
                           type="button" 
                           variant="secondary" 
                           onClick={handleAutoFill}
                           className="rounded-2xl px-4 h-12 text-xs font-black uppercase tracking-widest whitespace-nowrap bg-slate-100 border-none hover:bg-slate-200 text-slate-700"
                        >
                           Auto-Fill (FIFO)
                        </Button>
                     </div>
                  </div>

                  {/* Payment Mode */}
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                        Transaction Mode <span className="text-red-500">*</span>
                     </label>
                     <div className="grid grid-cols-5 gap-2">
                       {PAYMENT_MODES.map(m => (
                         <button key={m} type="button" onClick={() => setPaymentForm(f => ({ ...f, mode: m }))}
                           className={clsx(
                             "flex flex-col items-center gap-1 py-2 rounded-xl border text-[9px] font-black uppercase transition-all",
                             paymentForm.mode === m 
                               ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200" 
                               : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                           )}>
                           <span className="text-lg">{MODE_ICONS[m]}</span>
                           <span>{m}</span>
                         </button>
                       ))}
                     </div>
                  </div>

                  {/* Remarks */}
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Reference Notes / Remarks</label>
                     <input 
                       value={paymentForm.remarks} 
                       onChange={e => setPaymentForm(f => ({ ...f, remarks: e.target.value }))}
                       className="w-full px-4 py-3 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-700 transition-all" 
                       placeholder="e.g. Cash paid by mother" 
                     />
                  </div>
               </div>

               {/* Right Side: Allocation Table */}
               <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Component Allocations</h4>
                  {allocations.length === 0 ? (
                     <p className="text-xs text-slate-400 italic">No assigned fee components found.</p>
                  ) : (
                     <div className="space-y-3">
                        {allocations.map((a, idx) => (
                           <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                 <span className="text-xs font-bold text-slate-800 block truncate">{a.componentName}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                    {a.category} · Due: ₹{a.outstanding.toLocaleString()}
                                 </span>
                              </div>
                              <div className="w-32">
                                 <input 
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={a.amountToPay}
                                    max={a.outstanding}
                                    onChange={e => handleAllocationChange(idx, e.target.value)}
                                    className={clsx(
                                       "w-full px-3 py-2 text-sm font-black text-right border rounded-xl outline-none transition-all",
                                       parseFloat(a.amountToPay) > a.outstanding
                                          ? "border-red-500 bg-red-50 text-red-600 focus:ring-red-500/10"
                                          : "border-slate-200 bg-white text-slate-800 focus:ring-blue-500/10 focus:border-blue-500"
                                    )}
                                 />
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
                  <p className="text-[10px] font-medium text-slate-400 italic leading-snug">
                     💡 If component allocations are left blank, the system will automatically distribute the amount using First-In, First-Out (FIFO) logic on submission.
                  </p>
               </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
               <Button type="button" variant="secondary" className="flex-1 rounded-2xl h-12 text-xs font-black uppercase tracking-widest" onClick={() => setIsPayModalOpen(false)}>Discard</Button>
               <Button type="submit" isLoading={isSaving} className="flex-1 rounded-2xl h-12 bg-blue-600 shadow-xl shadow-blue-200 text-xs font-black uppercase tracking-widest" icon={<CreditCard className="w-4 h-4" />}>Collect & Receipt</Button>
            </div>
         </form>
      </Modal>

      <FeeReceiptModal 
        isOpen={isReceiptModalOpen} 
        onClose={() => setIsReceiptModalOpen(false)} 
        receipt={latestReceipt}
        studentInfo={selectedStudent}
      />
    </div>
  );
};

// Helper Components
const StatCard = ({ label, value, icon, color, highlight = false }: any) => {
   const colors: any = {
      slate: 'bg-white border-slate-100 text-slate-900',
      emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      red: 'bg-rose-50 border-rose-100 text-rose-700',
   };
   return (
      <Card className={clsx("p-6 border transition-all hover:scale-[1.02]", colors[color])}>
         <div className="flex items-center gap-4">
            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", highlight ? "bg-white shadow-lg" : "bg-white/50")}>
               <span className={clsx(color === 'slate' ? 'text-slate-500' : color === 'emerald' ? 'text-emerald-500' : 'text-rose-500')}>
                  {icon}
               </span>
            </div>
            <div>
               <p className={clsx("text-[10px] font-black uppercase tracking-widest opacity-60 mb-1")}>{label}</p>
               <p className="text-2xl font-black tracking-tight">{value}</p>
            </div>
         </div>
      </Card>
   );
};

const LayoutGrid = ({ className }: any) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
);
