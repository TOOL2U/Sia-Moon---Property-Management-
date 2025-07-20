'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import FullCalendar with no SSR
const EnhancedFullCalendar = dynamic(
  () => import('./EnhancedFullCalendar'),
  { 
    ssr: false,
    loading: () => (
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
        <div className="text-center text-gray-500 mt-4">
          Loading Enhanced Calendar...
        </div>
      </div>
    )
  }
);

const ClientOnlyCalendar: React.FC = () => {
  return <EnhancedFullCalendar />;
};

export default ClientOnlyCalendar;
