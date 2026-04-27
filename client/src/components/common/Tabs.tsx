import React from 'react';
import { clsx } from 'clsx';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pills' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className, variant = 'underline' }) => {
  return (
    <div className={clsx('flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-200', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap',
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              {tab.icon && <span className={clsx('w-4 h-4', isActive ? 'text-white' : 'text-slate-400')}>{tab.icon}</span>}
              {tab.label}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap -mb-px',
              isActive 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            {tab.icon && <span className={clsx('w-4 h-4', isActive ? 'text-blue-600' : 'text-slate-400')}>{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
