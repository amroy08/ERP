import React, { useState } from 'react';
import { 
  FileBarChart, Download, Calendar, 
  Users, DollarSign, GraduationCap, 
  ArrowRight, FileText, PieChart,
  Filter, CheckCircle, RefreshCw
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const reportTypes = [
  { id: 'attendance', name: 'Attendance Summary', icon: Users, color: 'blue', desc: 'Aggregated attendance per class and section.' },
  { id: 'fees', name: 'Financial Ledger', icon: DollarSign, color: 'emerald', desc: 'Income, pending dues, and collection reports.' },
  { id: 'academic', name: 'Academic Results', icon: GraduationCap, color: 'indigo', desc: 'Exam performance and grading distribution.' },
  { id: 'inventory', name: 'Inventory Audit', icon: FileBarChart, color: 'orange', desc: 'Stock levels, consumption, and purchase history.' },
];

export const ReportsPage: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleDownloadReport = async (type: string, format: 'pdf' | 'csv') => {
    const loadingKey = `${type}-${format}`;
    setIsGenerating(loadingKey);
    try {
      const token = localStorage.getItem('erp_access_token');
      // For file downloads, we can use window.open or a hidden anchor tag with the token in query if needed,
      // but since we want to protect the route, we'll use a direct link if the browser supports it
      // or a blob approach. Simple way for this ERP:
      const downloadUrl = `${axiosInstance.defaults.baseURL}/reports/export?type=${type}&format=${format}&token=${token}`;
      
      // Creating a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${type}_report.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ${format.toUpperCase()} export started!`);
    } catch {
      toast.error('Report generation failed');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Intelligence' }, { label: 'Reports & Analytics' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics & Intelligence</h1>
          <p className="text-slate-500 text-sm">Download official PDF/CSV records and view comparative school statistics.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />}>Refresh Stats</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
         {reportTypes.map((report) => {
           const Icon = report.icon;
           return (
             <Card key={report.id} className="p-0 overflow-hidden border-slate-200 hover:shadow-lg transition-all group">
                <div className="flex">
                   <div className={`w-1 bg-${report.color}-500 group-hover:w-2 transition-all`}></div>
                   <div className="p-6 flex-1 flex flex-col md:flex-row items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl bg-${report.color}-50 flex items-center justify-center text-${report.color}-600 shrink-0`}>
                         <Icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                         <h3 className="text-lg font-black text-slate-800 mb-1">{report.name}</h3>
                         <p className="text-sm text-slate-500 leading-relaxed max-w-sm">{report.desc}</p>
                      </div>
                      <div className="flex flex-col gap-2 w-full md:w-32">
                         <Button 
                            variant="primary" 
                            size="sm" 
                            className="bg-slate-900 hover:bg-black border-none text-[10px] uppercase font-black"
                            isLoading={isGenerating === `${report.id}-pdf`}
                            onClick={() => handleDownloadReport(report.id, 'pdf')}
                         >
                            Export PDF
                         </Button>
                         <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-[10px] uppercase font-black"
                            isLoading={isGenerating === `${report.id}-csv`}
                            onClick={() => handleDownloadReport(report.id, 'csv')}
                          >
                            CSV Data
                          </Button>
                      </div>
                   </div>
                </div>
             </Card>
           );
         })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 border-slate-200">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <PieChart className="w-5 h-5 text-blue-500" /> Statistical Comparison
                  </h3>
                  <p className="text-xs text-slate-400">Quarterly growth analysis vs previous year</p>
               </div>
               <div className="flex gap-2">
                  <Badge variant="blue" className="px-3">Current Quarter</Badge>
                  <Badge variant="gray" className="px-3">Target</Badge>
               </div>
            </div>
            
            <div className="space-y-6">
               {[
                 { label: 'Total Student Intake', value: 85, color: 'blue' },
                 { label: 'Revenue Collection Efficiency', value: 92, color: 'emerald' },
                 { label: 'Academic Pass Percentage', value: 78, color: 'indigo' },
                 { label: 'Library Circulation Rate', value: 45, color: 'orange' },
               ].map((stat) => (
                 <div key={stat.label} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                       <span>{stat.label}</span>
                       <span className={`text-${stat.color}-600`}>{stat.value}%</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full border border-slate-200 overflow-hidden">
                       <div 
                          className={`h-full bg-${stat.color}-500 rounded-full transition-all duration-1000`} 
                          style={{ width: `${stat.value}%` }} 
                       />
                    </div>
                 </div>
               ))}
            </div>
         </Card>

         <Card className="bg-slate-900 border-none text-white relative overflow-hidden">
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                     <FileText className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="font-bold text-white">Scheduled Reports</h3>
                     <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Automation Active</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  {[
                    { name: 'Weekly Attendance', next: 'Every Friday, 4PM' },
                    { name: 'Monthly Financials', next: '1st of every Month' },
                    { name: 'Annual Audit', next: '31st March 2024' },
                  ].map((job) => (
                    <div key={job.name} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-300 group-hover:text-white">{job.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                       </div>
                       <p className="text-[10px] text-slate-500">{job.next}</p>
                    </div>
                  ))}
               </div>

               <Button className="w-full bg-white text-slate-900 border-none hover:bg-blue-50 font-black text-[11px] uppercase tracking-wide">
                  Configure Subscriptions
               </Button>
            </div>
            
            {/* Background elements */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
         </Card>
      </div>
    </div>
  );
};
