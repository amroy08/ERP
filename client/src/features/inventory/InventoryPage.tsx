import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Filter, 
  ArrowUpRight, ArrowDownLeft, AlertTriangle, 
  Box, Truck, ClipboardList, Zap, Settings, ArrowRight,
  TrendingUp, Activity
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import axiosInstance from '../../api/axiosInstance';
import { ApiResponse } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  status: string;
  unitPrice: number;
}

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Transaction Modal
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [txData, setTxData] = useState({
    type: 'purchase',
    quantity: 0,
    remarks: '',
    referenceNumber: ''
  });

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get<ApiResponse<InventoryItem[]>>(`/inventory/items?search=${search}`);
      setItems(res.data.data);
    } catch {
      toast.error('Failed to load inventory stock');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchInventory, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await axiosInstance.post('/inventory/transaction', {
        itemId: selectedItem.id,
        ...txData
      });
      toast.success(`Inventory updated: ${txData.type.toUpperCase()}`);
      setIsTxModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    }
  };

  const lowStockItems = items.filter(i => i.currentStock <= i.reorderLevel);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Infrastructure' }, { label: 'Inventory' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Stock & Asset Control</h1>
          <p className="text-slate-500 text-sm">Monitor equipment, consumables, and procurement cycles.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Activity className="w-4 h-4" />}>Audit Log</Button>
          <Button icon={<Plus className="w-4 h-4" />}>Add Item</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard title="Total Skus" value={items.length.toString()} icon={<Box className="w-6 h-6" />} iconBg="bg-blue-50" />
         <StatCard title="Low Stock Assets" value={lowStockItems.length.toString()} icon={<AlertTriangle className="w-6 h-6" />} iconBg="bg-orange-50" trend={lowStockItems.length > 0 ? { value: lowStockItems.length, label: "Needs Attention", positive: false } : undefined} />
         <StatCard title="Inventory Value" value={`$${items.reduce((acc, i) => acc + (i.currentStock * i.unitPrice), 0).toLocaleString()}`} icon={<Zap className="w-6 h-6" />} iconBg="bg-indigo-50" />
         <StatCard title="Active Vendors" value="12" icon={<Truck className="w-6 h-6" />} iconBg="bg-emerald-50" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items by name or SKU code..." 
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
          />
        </div>
        <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>Filter Category</Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-50 rounded" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">No inventory items found</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                             <Package className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-700">{item.name}</p>
                             <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <Badge variant="blue" className="text-[10px] uppercase font-bold">{item.category}</Badge>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className={clsx("text-sm font-black", item.currentStock <= item.reorderLevel ? "text-orange-600" : "text-slate-700")}>
                             {item.currentStock} {item.unit}
                          </span>
                          <span className="text-[10px] text-slate-400">Reorder at {item.reorderLevel}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="text-[10px] font-black uppercase"
                            onClick={() => { setSelectedItem(item); setTxData({...txData, type: 'purchase'}); setIsTxModalOpen(true); }}
                          >
                             Restock
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="text-[10px] font-black uppercase"
                            onClick={() => { setSelectedItem(item); setTxData({...txData, type: 'issue'}); setIsTxModalOpen(true); }}
                            disabled={item.currentStock <= 0}
                          >
                             Issue
                          </Button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title={txData.type === 'purchase' ? 'Restock / Purchase Entry' : 'Inventory Issuance'}
        size="md"
      >
         <form onSubmit={handleTransaction} className="space-y-5">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Item</p>
               <h3 className="font-bold text-slate-800">{selectedItem?.name}</h3>
               <p className="text-xs text-slate-500">Current Stock: {selectedItem?.currentStock} {selectedItem?.unit}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Input 
                 label="Quantity" 
                 type="number"
                 placeholder="0"
                 value={txData.quantity.toString()}
                 onChange={e => setTxData({...txData, quantity: parseInt(e.target.value)})}
                 required
               />
               <Input 
                 label="Reference #" 
                 placeholder="Bill / Gate Pass No."
                 value={txData.referenceNumber}
                 onChange={e => setTxData({...txData, referenceNumber: e.target.value})}
               />
            </div>

            <Input 
              label="Remarks / Description" 
              multiline
              placeholder="Reason for stock movement..."
              value={txData.remarks}
              onChange={e => setTxData({...txData, remarks: e.target.value})}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
               <Button variant="secondary" onClick={() => setIsTxModalOpen(false)}>Discard</Button>
               <Button type="submit" variant={txData.type === 'purchase' ? 'primary' : 'secondary'}>
                  {txData.type === 'purchase' ? 'Confirm Purchase' : 'Confirm Issuance'}
               </Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};
