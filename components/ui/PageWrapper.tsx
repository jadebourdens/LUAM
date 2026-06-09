// /Users/laylaphung/Documents/luam-marketplace/components/ui/PageWrapper.tsx

import React from 'react';

export default function PageWrapper({ 
  title, 
  children 
}: { 
  title: string, 
  children: React.ReactNode 
}) {
  return (
    <div className="min-h-[60vh]">
      <div className="container mx-auto px-8 max-w-4xl pt-6 pb-2">
        <h1 className="text-4xl font-bold text-stone-900 mb-3 pb-3 border-b border-stone-200">
          {title}
        </h1>
      </div>
      <div className="text-stone-600 leading-relaxed">
        {children}
      </div>
    </div>
  );
}