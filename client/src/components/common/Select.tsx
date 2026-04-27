import React from 'react';
import { clsx } from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  error, 
  options, 
  className, 
  id, 
  ...props 
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label 
          htmlFor={id} 
          className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          "w-full h-11 px-4 bg-slate-50 border rounded-xl text-sm font-bold text-slate-700",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
          "transition-all duration-200 appearance-none",
          error ? "border-rose-500" : "border-slate-200",
          className
        )}
        {...props}
      >
        <option value="" disabled>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-tight">
          {error}
        </p>
      )}
    </div>
  );
};
