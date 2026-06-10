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
      <div className="text-stone-600 leading-relaxed">
        {children}
      </div>
    </div>
  );
}