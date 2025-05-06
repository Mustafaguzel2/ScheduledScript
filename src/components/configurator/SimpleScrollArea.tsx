'use client';

import React from 'react';

interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
}

export function ScrollArea({ className = '', children }: ScrollAreaProps) {
  return (
    <div 
      className={`overflow-auto ${className}`}
      style={{ 
        scrollbarWidth: 'thin',
        scrollbarColor: '#e2e8f0 #f8fafc'
      }}
    >
      {children}
    </div>
  );
} 