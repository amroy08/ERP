import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Receipt, TrendingUp, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import axiosInstance from '../../api/axiosInstance';

interface Payment {
  id: string;
  receiptNumber: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  student?: { fullName: string; admissionNumber: string };
}

export const FeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, count: 0 });

  useEffect(() => {
    axiosInstance.get('/fees/recent').then(res => {
      const payments: Payment[] = res.data.data || [];
      setRecentPayments(payments);
      const total = payments.reduce((s, p) => s + p.amountPaid, 0);
      const now = new Date();
      const monthPayments = payments.filter(p => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const thisMonth = monthPayments.reduce((s, p) => s + p.amountPaid, 0);
      setStats({ total, thisMonth, count: payments.length });
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const MODE_ICONS: Record<string, string> = { cash: '💵', upi: '📱', online: '🌐', cheque: '📄', card: '💳' };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Fee Management' }]} />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fee Management</h1>
          <p className="text-slate-500 text-sm">Overview of all fee structures, collections, and payment history.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={<BookOpen className="w-4 h-4" />} onClick={() => navigate('/fees/structures')}>Fee Structures</Button>
          <Button icon={<Receipt className="w-4 h-4" />} onClick={() => navigate('/fees/collect')}>Collect Fee</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Collected" value={`₹${stats.total.toLocaleString('en-IN')}`} icon={<DollarSign className="w-6 h-6 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard title="This Month" value={`₹${stats.thisMonth.toLocaleString('en-IN')}`} icon={<TrendingUp className="w-6 h-6 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard title="Total Transactions" value={stats.count} icon={<Receipt className="w-6 h-6 text-purple-600" />} iconBg="bg-purple-50" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card hoverable className="cursor-pointer group" onClick={() => navigate('/fees/collect')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Collect Fee</h3>
                <p className="text-sm text-slate-400">Search student and record payment</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </Card>
        <Card hoverable className="cursor-pointer group" onClick={() => navigate('/fees/structures')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Fee Structures</h3>
                <p className="text-sm text-slate-400">Manage class-wise fee components</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Recent Payments</h3>
          <Button variant="secondary" size="sm" onClick={() => navigate('/fees/payments')}>View All</Button>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : recentPayments.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold">No payments recorded yet</p>
            <p className="text-sm mt-1">Use "Collect Fee" to record the first payment</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentPayments.slice(0, 10).map(p => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{MODE_ICONS[p.paymentMode] || '💰'}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.student?.fullName || '—'}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.receiptNumber} · {new Date(p.paymentDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <p className="text-base font-black text-emerald-600">₹{p.amountPaid.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
