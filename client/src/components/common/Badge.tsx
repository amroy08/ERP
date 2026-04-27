import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 
  | 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'orange' | 'teal'
  | 'emerald' | 'indigo' | 'pink' | 'cyan' | 'success' | 'warning' | 'danger' | 'info' | 'error' | 'secondary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  error: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  pink: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
  gray: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  secondary: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  teal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
};

const dotColors: Record<BadgeVariant, string> = {
  green: 'bg-emerald-500',
  success: 'bg-emerald-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  danger: 'bg-red-500',
  error: 'bg-red-500',
  yellow: 'bg-amber-500',
  warning: 'bg-amber-500',
  blue: 'bg-blue-500',
  info: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  gray: 'bg-slate-400',
  secondary: 'bg-slate-400',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'sm',
  dot = false,
  className,
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    active: { label: 'Active', variant: 'green' },
    inactive: { label: 'Inactive', variant: 'gray' },
    transferred: { label: 'Transferred', variant: 'blue' },
    alumni: { label: 'Alumni', variant: 'purple' },
    resigned: { label: 'Resigned', variant: 'red' },
    new: { label: 'New', variant: 'blue' },
    under_review: { label: 'Under Review', variant: 'yellow' },
    accepted: { label: 'Accepted', variant: 'green' },
    rejected: { label: 'Rejected', variant: 'red' },
    converted: { label: 'Converted', variant: 'teal' },
    scheduled: { label: 'Scheduled', variant: 'blue' },
    ongoing: { label: 'Ongoing', variant: 'orange' },
    completed: { label: 'Completed', variant: 'green' },
    cancelled: { label: 'Cancelled', variant: 'red' },
    present: { label: 'Present', variant: 'green' },
    absent: { label: 'Absent', variant: 'red' },
    late: { label: 'Late', variant: 'yellow' },
    half_day: { label: 'Half Day', variant: 'orange' },
    leave: { label: 'Leave', variant: 'purple' },
    contacted: { label: 'Contacted', variant: 'blue' },
    follow_up: { label: 'Follow Up', variant: 'yellow' },
    closed: { label: 'Closed', variant: 'gray' },
    low: { label: 'Low', variant: 'gray' },
    medium: { label: 'Medium', variant: 'blue' },
    high: { label: 'High', variant: 'orange' },
    urgent: { label: 'Urgent', variant: 'red' },
  };

  const conf = config[status] || { label: status, variant: 'gray' as BadgeVariant };
  return <Badge variant={conf.variant} dot>{conf.label}</Badge>;
};
