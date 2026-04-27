import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link to="/dashboard" className="text-slate-400 hover:text-blue-600 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          {item.href && idx < items.length - 1 ? (
            <Link to={item.href} className="text-slate-400 hover:text-blue-600 transition-colors">
              {item.label}
            </Link>
          ) : item.onClick ? (
            <button 
              onClick={item.onClick}
              className="text-slate-400 hover:text-blue-600 transition-colors hover:underline"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-600 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
