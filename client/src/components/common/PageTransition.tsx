import React from 'react';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
      {children}
    </div>
  );
};
