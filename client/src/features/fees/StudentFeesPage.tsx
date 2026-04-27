import React, { useEffect, useState } from 'react';
import { IndianRupee, Receipt, CreditCard, Calendar, CheckCircle, AlertCircle, Clock, ArrowRight, Wallet, History, Printer } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { ApiResponse } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FeeReceiptModal } from './components/FeeReceiptModal';

interface LedgerData {
  totalFee: number;
  paidAmount: number;
  balanceDue: number;
  payments: any[];
}

export const StudentFeesPage: React.FC = () => {
  const { user } = useAuth();
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Student ID from the enriched user object
  const studentId = (user as any)?.student?.id;

  const fetchLedger = async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<LedgerData>>(`/fees/status/${studentId}`);
      setLedger(res.data.data);
    } catch (err) {
      toast.error('Failed to load fee information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [studentId]);

  const handlePaySimulated = async () => {
    if (!ledger || ledger.balanceDue <= 0) return;
    
    setIsPaying(true);
    try {
      // Simulate an online payment
      await axiosInstance.post('/fees/collect', {
        studentId,
        amountPaid: ledger.balanceDue,
        paymentMode: 'online',
        transactionId: `TXN-${Date.now()}`,
        remarks: 'Payment via student portal'
      });
      
      toast.success('Payment successful!');
      fetchLedger(); // Refresh
    } catch (err) {
      toast.error('Payment processing failed');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading fees...</div>;
  if (!ledger) return <div className="p-8 text-center text-slate-400">No fee data found.</div>;

  const paidPercentage = (ledger.paidAmount / ledger.totalFee) * 100;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: 'My Financials' }, { label: 'Fees' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Fee Ledger</h1>
          <p className="text-slate-500 text-sm">View your personalized fee structures, dues, and payment history.</p>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant={ledger.balanceDue === 0 ? 'success' : 'warning'} className="px-4 py-1.5 text-xs">
                {ledger.balanceDue === 0 ? '✨ Fully Paid' : `⚠️ Due: ₹${ledger.balanceDue.toLocaleString()}`}
            </Badge>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 text-white border-0 shadow-2xl">
          <div className="relative z-10 p-8 space-y-8">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-blue-200 text-xs font-black uppercase tracking-widest">Total Academic Fee</p>
                <p className="text-4xl font-black">₹{ledger.totalFee.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Wallet className="w-6 h-6 text-blue-200" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-blue-300">Payment Progress</span>
                <span className="text-white">{paidPercentage.toFixed(0)}%</span>
              </div>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden p-0.5 backdrop-blur-sm border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-1000" 
                  style={{ width: `${paidPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
               <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-black text-blue-300 uppercase leading-none mb-1.5">Paid Amount</p>
                  <p className="text-xl font-black text-emerald-400">₹{ledger.paidAmount.toLocaleString()}</p>
               </div>
               <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-black text-blue-300 uppercase leading-none mb-1.5">Balance Due</p>
                  <p className="text-xl font-black text-orange-400">₹{ledger.balanceDue.toLocaleString()}</p>
               </div>
            </div>
          </div>
          
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-24 -mb-24" />
        </Card>

        <Card className="flex flex-col justify-between p-8 border-slate-200 shadow-xl overflow-hidden group">
          <div className="space-y-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Pay Online
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Clear your pending dues instantly using UPI, Credit Cards, or Net Banking.
            </p>
          </div>

          <div className="mt-8 space-y-3">
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Pending Amount</p>
                <p className="text-2xl font-black text-slate-800">₹{ledger.balanceDue.toLocaleString()}</p>
             </div>
             
             <Button 
                size="lg" 
                className="w-full h-14 text-base shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
                disabled={ledger.balanceDue <= 0}
                isLoading={isPaying}
                onClick={handlePaySimulated}
             >
                {ledger.balanceDue <= 0 ? 'No Dues Pending' : 'Pay Now'}
                <ArrowRight className="ml-2 w-5 h-5" />
             </Button>
          </div>
        </Card>
      </div>

      {/* History & Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Payment History */}
        <div className="space-y-4">
           <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4" /> Recent Transactions
           </h2>
           <Card className="p-0 overflow-hidden border-slate-200">
              {ledger.payments && ledger.payments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                   {ledger.payments.map((p, idx) => (
                      <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                               <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-800">₹{p.amountPaid.toLocaleString()}</p>
                               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                  <span>{p.receiptNumber}</span>
                                  <span>•</span>
                                  <span>{format(new Date(p.paymentDate), 'dd MMM yyyy')}</span>
                               </div>
                            </div>
                         </div>
                         <Button 
                            variant="secondary" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 h-8 text-[10px]" 
                            icon={<Printer className="w-3.5 h-3.5" />}
                            onClick={() => {
                                setSelectedReceipt({...p, student: { fullName: user?.name, admissionNumber: (user as any)?.student?.admissionNumber, class: (user as any)?.student?.class }});
                                setIsReceiptModalOpen(true);
                            }}
                         >
                            Receipt
                         </Button>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-300">
                   <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                   <p className="text-sm font-bold">No payments found yet.</p>
                </div>
              )}
           </Card>
        </div>

        {/* Informational Alerts */}
        <div className="space-y-4">
           <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Important Notices
           </h2>
           <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4">
                 <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                 <div>
                    <h5 className="font-black text-amber-900 text-sm">Upcoming Term Fees</h5>
                    <p className="text-xs text-amber-700 leading-relaxed mt-0.5">Please ensure all dues are cleared before the term examination to avoid login suspension.</p>
                 </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-4">
                 <Clock className="w-6 h-6 text-blue-500 shrink-0" />
                 <div>
                    <h5 className="font-black text-blue-900 text-sm">Receipt Verification</h5>
                    <p className="text-xs text-blue-700 leading-relaxed mt-0.5">Online payments are reflected instantly. For offline/cheque payments, please allow 2-3 working days for processing.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <FeeReceiptModal 
        isOpen={isReceiptModalOpen} 
        onClose={() => setIsReceiptModalOpen(false)} 
        receipt={selectedReceipt}
      />
    </div>
  );
};
