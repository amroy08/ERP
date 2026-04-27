import React, { useRef } from 'react';
import { 
  X, CheckCircle, Printer, Download, 
  Landmark 
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { format } from 'date-fns';

interface ReceiptData {
  receiptNumber: string;
  amountPaid: number;
  paymentMode: string;
  paymentDate: string;
  remarks?: string;
  student?: {
    fullName: string;
    admissionNumber: string;
    class?: { name: string };
    section?: { name: string };
  };
}

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
  studentInfo?: any; // Fallback if receipt doesn't include student
}

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({ 
  isOpen, 
  onClose, 
  receipt,
  studentInfo 
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); 
  };

  const student = receipt.student || studentInfo;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fee Receipt" size="lg">
      <div className="p-1 space-y-6">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4 text-emerald-800">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Transaction Confirmed</p>
            <p className="text-xs opacity-70">Official school receipt has been generated for your records.</p>
          </div>
        </div>

        {/* Printable Receipt Area */}
        <div ref={receiptRef} className="bg-white border-2 border-slate-100 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-slate-100/50 text-slate-900">
          <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-50 border-dashed">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">V</div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter">VANTAGE ERP</h2>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Payment Voucher</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-800">{receipt.receiptNumber}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {format(new Date(receipt.paymentDate), 'dd MMMM yyyy')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10 text-left">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Received From</p>
                <p className="text-lg font-black text-slate-800">{student?.fullName || student?.name}</p>
                <p className="text-xs font-bold text-slate-500">Reg: {student?.admissionNumber}</p>
                <p className="text-xs font-bold text-slate-500">
                  Class: {student?.class?.name || student?.className} {student?.section?.name || student?.sectionName || ''}
                </p>
              </div>
            </div>
            <div className="text-right space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Receipt Summary</p>
                <div className="inline-block p-1 bg-slate-900 rounded-xl">
                  <div className="px-6 py-4 border border-white/10 rounded-lg text-center">
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Total Paid</p>
                    <p className="text-2xl font-black text-white">₹{receipt.amountPaid.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl mb-10 border border-slate-100 text-left">
            <div className="flex justify-between items-center text-sm font-bold text-slate-600 mb-2">
              <span>Payment Mode</span>
              <span className="uppercase tracking-widest text-slate-400 text-[10px]">{receipt.paymentMode}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-600 mb-2">
              <span>Particulars</span>
              <span className="text-slate-800">Academic Fee Collection {new Date(receipt.paymentDate).getFullYear()}</span>
            </div>
            {receipt.remarks && (
              <div className="flex justify-between items-center text-sm font-bold text-slate-600 mb-2">
                <span>Remarks</span>
                <span className="text-slate-800">{receipt.remarks}</span>
              </div>
            )}
            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-lg font-black text-slate-800">Final Total</span>
              <span className="text-2xl font-black text-blue-600">₹{receipt.amountPaid.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex justify-between items-end gap-10">
            <div className="flex-1 text-left">
              <p className="text-[9px] font-bold text-slate-400 italic leading-relaxed">
                This is a computer generated receipt. Signature not required. Registered for Vantage Public School ERP system.
              </p>
            </div>
            <div className="text-center w-40">
              <div className="h-0.5 w-full bg-slate-200 mb-2" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Office Signature</p>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900" />
        </div>

        <div className="flex gap-3 pt-2 no-print">
          <Button variant="secondary" className="flex-1 h-12 rounded-xl font-bold" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>Print Hard Copy</Button>
          <Button className="flex-1 h-12 rounded-xl font-bold bg-slate-900 shadow-xl shadow-slate-200 text-white" icon={<Download className="w-4 h-4" />}>Download PDF</Button>
        </div>
      </div>
    </Modal>
  );
};
