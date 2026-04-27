import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
  options?: { label: string; value: string | number }[]; // For select
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, InputProps>(
  ({ label, error, className, containerClassName, icon, multiline, options, type, ...props }, ref) => {
    const inputClasses = clsx(
      'w-full px-4 py-2.5 text-sm border bg-white rounded-lg transition-all outline-none',
      icon ? 'pl-11' : 'pl-4',
      error 
        ? 'border-red-300 text-red-900 focus:ring-4 focus:ring-red-500/10 focus:border-red-500' 
        : 'border-slate-200 text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600',
      'placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500',
      className
    );

    const renderInput = () => {
      if (type === 'select' && options) {
        return (
          <select 
            ref={ref as any} 
            className={inputClasses} 
            {...(props as any)}
          >
            <option value="">Select option</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      }
      
      if (multiline) {
        return (
          <textarea
            ref={ref as any}
            className={clsx(inputClasses, 'min-h-[100px] resize-none')}
            {...(props as any)}
          />
        );
      }

      return (
        <input
          ref={ref as any}
          type={type}
          className={inputClasses}
          {...(props as any)}
        />
      );
    };

    return (
      <div className={clsx('space-y-1.5', containerClassName)}>
        {label && (
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
            {label}
            {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
              {icon}
            </div>
          )}
          {renderInput()}
        </div>
        {error && <p className="text-xs font-medium text-red-600 flex items-center gap-1 px-1">⚠️ {error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
