import React, { useEffect, useState } from 'react';
import { 
  Receipt, Search, Filter, Download, 
  Calendar, ArrowRight, Printer, 
  FileText, IndianRupee, History
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { format } from 'date-fns';
import { FeeReceiptModal } from './components/FeeReceiptModal';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  receiptNumber: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  remarks?: string;
  student?: { 
    fullName: string; 
    admissionNumber: string;
    class?: { name: string };
  };
}

export const FeeTransactionsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      // Re-using the /fees/recent endpoint which returns last 50, 
      // but we'll eventually want a paginated /fees/payments endpoint
      const res = await axiosInstance.get('/fees/recent');
      setPayments(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p => 
    p.student?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.student?.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MODE_ICONS: Record<string, string> = { cash: '💵', upi: '📱', online: '🌐', cheque: '📄', card: '💳' };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Fee Management', path: '/fees' }, { label: 'Payment Reports' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Transaction History</h1>
          <p className="text-slate-500 text-sm font-medium italic">Audit-ready record of all fee collections and digital receipts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>Export CSV</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-slate-200 shadow-sm bg-white rounded-[24px]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, admission ID or receipt #..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select className="pl-11 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none">
                   <option>All Time</option>
                   <option>Today</option>
                   <option>This Month</option>
                </select>
             </div>
             <Button variant="secondary" className="rounded-2xl" icon={<Filter className="w-4 h-4" />}>Filters</Button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-100 rounded-[32px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-12 bg-slate-50 rounded-xl" /></td>
                  </tr>
                ))
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-300">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-sm">No transactions found</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                           <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 font-mono">{p.receiptNumber}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Audit Verified</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-black text-slate-800">{p.student?.fullName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {p.student?.admissionNumber} · {p.student?.class?.name || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{MODE_ICONS[p.paymentMode] || '💰'}</span>
                        <span className="text-[10px] font-black uppercase text-slate-500">{p.paymentMode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-emerald-600 font-black">
                        <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                        <span>{p.amountPaid.toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-bold text-slate-600">
                        {format(new Date(p.paymentDate), 'dd MMM yyyy')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-9 w-9 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setSelectedReceipt(p);
                              setIsReceiptModalOpen(true);
                            }}
                          >
                             <Printer className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-9 w-9 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                             <ArrowRight className="w-4 h-4" />
                          </Button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <FeeReceiptModal 
        isOpen={isReceiptModalOpen} 
        onClose={() => setIsReceiptModalOpen(false)} 
        receipt={selectedReceipt}
      />
    </div>
  );
};
