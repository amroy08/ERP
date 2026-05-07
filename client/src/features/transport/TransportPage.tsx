import React, { useEffect, useState } from 'react';
import { Bus, MapPin, User, Phone, Navigation, MoreVertical, Plus, Search, ShieldCheck, AlertCircle } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { EmptyState } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

export const TransportPage: React.FC = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransportData = async () => {
      try {
        const res = await axiosInstance.get('/transport/routes');
        setRoutes(res.data.data);
      } catch (error) {
        toast.error('Failed to load transport data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransportData();
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Infrastructure' }, { label: 'Transport' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Transport Management</h1>
          <p className="text-slate-500 text-sm">Monitor school bus routes, vehicle status, and driver details.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Navigation className="w-4 h-4" />}>Live Tracking</Button>
          <Button icon={<Plus className="w-4 h-4" />}>Add Route</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search by route or driver..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)
        ) : routes.length > 0 ? (
          routes.map((route) => (
            <Card key={route.id} className="p-0 overflow-hidden border-slate-200 hover:shadow-md transition-all group">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                       <Bus className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-800 text-sm">{route.routeName}</h3>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{route.vehicle?.vehicleNumber || 'No Vehicle Assigned'}</span>
                    </div>
                 </div>
                 <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><User className="w-4 h-4" /> Driver</span>
                    <span className="font-bold text-slate-700">{route.vehicle?.driverName || '—'}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><Phone className="w-4 h-4" /> Contact</span>
                    <span className="font-bold text-slate-700">{route.vehicle?.driverPhone || '—'}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> Description</span>
                    <span className="font-bold text-slate-700 truncate max-w-[150px]">{route.description || '—'}</span>
                 </div>
                 
                 <div className="pt-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                       <span>Occupancy</span>
                       <span>{route.vehicle?.capacity || 0} Seats</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-600 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                 </div>
              </div>
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                 <Button variant="secondary" size="sm" className="flex-1 text-[10px] font-bold uppercase py-2">View Route</Button>
                 <Button variant="secondary" size="sm" className="flex-1 text-[10px] font-bold uppercase py-2">Passengers</Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState 
              title="No Transport Routes"
              description="Configure school bus routes and assign vehicles to start managing transportation."
              icon={<Bus className="w-12 h-12" />}
              action={{
                label: "Add First Route",
                onClick: () => {},
                icon: <Plus className="w-4 h-4" />
              }}
            />
          </div>
        )}
      </div>

      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 text-emerald-800">
         <ShieldCheck className="w-5 h-5 shrink-0" />
         <p className="text-xs leading-relaxed">
           <strong>Safety First:</strong> All vehicles are equipped with GPS tracking and speed governors. Driver backgrounds and commercial licenses are periodically verified through the transport authority portal.
         </p>
      </div>
    </div>
  );
};

