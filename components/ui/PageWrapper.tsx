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
    <div className="container mx-auto p-8 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-bold text-stone-900 mb-8 pb-4 border-b border-stone-200">
        {title}
      </h1>
      <div className="text-stone-600 leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  );
}