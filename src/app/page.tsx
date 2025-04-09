// Remove 'use client' if no longer needed here
import React, { Suspense } from 'react';
// Remove unused hooks/imports
// import { useEffect } from 'react';
// import { useSearchParams } from 'next/navigation';
// import useConfiguratorStore from '@/store/configurator';
// import { toast } from '@/components/ui/use-toast';

// Import the new loader component
import ConfiguratorLoader from '@/components/ConfiguratorLoader';
// Remove the R3F LoadingIndicator import
// import { LoadingIndicator } from '@/components/3d/LoadingIndicator';

// Simple text or Tailwind-based loading component
const SimpleLoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-gray-100">
    <div className="text-center">
      {/* Optional: Add a spinner */}
      <svg className="animate-spin h-8 w-8 text-gray-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-gray-600 font-medium">Loading Configurator...</p>
    </div>
  </div>
);

export default function Home() {
  // Remove all logic related to searchParams and useEffect

  return (
    <Suspense fallback={<SimpleLoadingFallback />}>
      {/* Render the component that uses searchParams */}
      <ConfiguratorLoader />
    </Suspense>
  );
}
