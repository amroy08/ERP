import React from 'react';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  } | React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action, className }) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-20 px-4 text-center space-y-5', className)}>
      <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shadow-inner">
        {icon || <Search className="w-10 h-10" />}
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        {description && <p className="text-sm text-slate-500 leading-relaxed">{description}</p>}
      </div>
      {action && (
        <React.Fragment>
          {React.isValidElement(action) ? (
            action
          ) : (
            <Button onClick={(action as any).onClick} icon={(action as any).icon} className="mt-2">
              {(action as any).label}
            </Button>
          )}
        </React.Fragment>
      )}
    </div>
  );
};
