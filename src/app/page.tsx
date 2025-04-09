// Remove 'use client' if no longer needed here
import React, { Suspense } from 'react';
// Remove unused hooks/imports
// import { useEffect } from 'react';
// import { useSearchParams } from 'next/navigation';
// import useConfiguratorStore from '@/store/configurator';
// import { toast } from '@/components/ui/use-toast';

// Import the new loader component
import ConfiguratorLoader from '@/components/ConfiguratorLoader';
import { LoadingIndicator } from '@/components/3d/LoadingIndicator';

export default function Home() {
  // Remove all logic related to searchParams and useEffect

  return (
    <Suspense fallback={<LoadingIndicator />}>
      {/* Render the component that uses searchParams */}
      <ConfiguratorLoader />
    </Suspense>
  );
}
