import React, { useEffect, useState } from 'react';
import { School } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

interface SchoolOption {
  id: string;
  name: string;
}

interface SchoolFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const SchoolFilter: React.FC<SchoolFilterProps> = ({ value, onChange }) => {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get('/admin/schools');
        if (response.data.success) {
          setSchools(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch schools for filter', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  return (
    <div className="relative flex items-center gap-2">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <School className="w-4 h-4" />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none bg-white font-medium text-slate-600 min-w-[180px]"
      >
        <option value="">All Schools</option>
        {schools.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l border-slate-200 pl-2">
        <div className="border-t-4 border-t-slate-400 border-x-4 border-x-transparent" />
      </div>
    </div>
  );
};
